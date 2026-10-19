package com.dkaapis.sigma.data.repository

import android.content.Context
import com.dkaapis.sigma.R
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.domain.model.*
import com.dkaapis.sigma.domain.repository.ManifestRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class ManifestRepositoryImpl(
    private val context: Context,
    private val manifestStorage: ManifestStorage,
    private val channelFactory: GrpcChannelFactory
) : ManifestRepository {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    override suspend fun fetchActiveManifest(deviceId: String, currentHash: String): Result<Manifest?> = withContext(Dispatchers.IO) {
        try {
            val stub = signage.distribution.v1.manifest.ManifestServiceGrpcKt.ManifestServiceCoroutineStub(channelFactory.getChannel())
            val request = signage.distribution.v1.manifest.ManifestCommon.GetActiveManifestRequest.newBuilder()
                .setDeviceId(deviceId)
                .setClientCurrentHash(currentHash)
                .build()

            val response = stub.getActiveManifest(request)

            if (response.isUpToDate) {
                val cached = getLocalCachedManifest()
                return@withContext Result.success(cached)
            }

            if (response.hasManifest()) {
                val protoManifest = response.manifest
                val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(context)
                val parsed = parseProtoManifest(protoManifest, baseUrl)
                val json = serializeManifestToJson(parsed)
                manifestStorage.saveManifest(json)
                Result.success(parsed)
            } else {
                val cached = getLocalCachedManifest()
                Result.success(cached)
            }
        } catch (e: Exception) {
            android.util.Log.w("ManifestRepository", "gRPC GetActiveManifest error: ${e.message}, falling back to cache")
            val cached = getLocalCachedManifest()
            if (cached != null) {
                Result.success(cached)
            } else {
                Result.failure(e)
            }
        }
    }

    private fun parseProtoManifest(proto: signage.distribution.v1.manifest.ManifestCommon.CompiledManifest, baseUrl: String): Manifest {
        val layout = proto.layout
        val zonesList = mutableListOf<LayerZone>()

        for ((i, layer) in layout.layersList.withIndex()) {
            val blocksList = mutableListOf<LayerBlock>()
            for ((j, block) in layer.blocksList.withIndex()) {
                val hasQueue = block.hasQueueId() && block.queueId.isNotBlank()
                val hasClock = block.hasClockId() && block.clockId.isNotBlank()
                val hasTicker = block.hasTickerId() && block.tickerId.isNotBlank()
                val hasWebview = block.hasWebviewId() && block.webviewId.isNotBlank()

                val wType = when {
                    hasQueue -> ZoneWidgetType.QUEUE
                    hasClock -> ZoneWidgetType.CLOCK
                    hasTicker -> ZoneWidgetType.TICKER
                    hasWebview -> ZoneWidgetType.WEBVIEW
                    else -> ZoneWidgetType.NONE
                }

                val playlistItems = mutableListOf<LayerPlaylistItem>()
                if (block.hasPlaylist()) {
                    val pl = block.playlist
                    for ((k, item) in pl.itemsList.withIndex()) {
                        playlistItems.add(
                            LayerPlaylistItem(
                                id = item.id.ifEmpty { "pl-item-$k" },
                                mediaItemId = item.mediaItemId,
                                position = item.position,
                                durationSeconds = item.durationSeconds,
                                isMuted = item.isMuted,
                                volumeLevel = 100
                            )
                        )
                    }
                }

                blocksList.add(
                    LayerBlock(
                        id = block.id.ifEmpty { "blk-$j" },
                        mediaItemId = block.mediaItemId.takeIf { it.isNotBlank() },
                        playlistId = block.playlistId.takeIf { it.isNotBlank() },
                        widgetType = wType,
                        widgetDataJson = null,
                        startTimeSeconds = block.startTimeSeconds,
                        durationSeconds = block.durationSeconds,
                        isMuted = block.isMuted,
                        volumeLevel = block.volumeLevel,
                        playlistItems = playlistItems
                    )
                )
            }

            zonesList.add(
                LayerZone(
                    id = layer.id.ifEmpty { "zone-$i" },
                    name = layer.name.ifEmpty { "Layer $i" },
                    x = layer.x,
                    y = layer.y,
                    width = layer.width,
                    height = layer.height,
                    zIndex = layer.zIndex,
                    backgroundColor = layer.backgroundColor.takeIf { it.isNotBlank() },
                    opacity = layer.opacity,
                    overlayColor = layer.overlayColor.takeIf { it.isNotBlank() },
                    overlayOpacity = layer.overlayOpacity,
                    borderRadius = layer.borderRadius,
                    borderColor = layer.borderColor.takeIf { it.isNotBlank() },
                    borderWidth = layer.borderWidth,
                    blocks = blocksList,
                    isLocked = false
                )
            )
        }

        val assetsList = mutableListOf<MediaAsset>()
        for ((i, asset) in proto.requiredAssetsList.withIndex()) {
            var rawUrl = asset.url
            if (rawUrl.startsWith("/")) {
                val trimmedBase = baseUrl.trimEnd('/')
                rawUrl = "$trimmedBase$rawUrl"
            }

            assetsList.add(
                MediaAsset(
                    mediaId = asset.mediaId,
                    url = rawUrl,
                    sha256Hash = asset.sha256Hash,
                    fileSizeBytes = asset.fileSizeBytes,
                    localFilename = asset.localFilename.ifEmpty { "media_$i" },
                    mediaType = MediaType.fromInt(asset.mediaTypeValue),
                    durationSeconds = 10
                )
            )
        }

        return Manifest(
            manifestId = proto.manifestId,
            deviceId = proto.deviceId,
            versionHash = proto.versionHash,
            layoutId = layout.id,
            layoutName = layout.name.ifEmpty { "Layout Default" },
            canvasWidth = layout.canvasWidth,
            canvasHeight = layout.canvasHeight,
            zones = zonesList,
            requiredAssets = assetsList,
            totalDownloadSizeBytes = proto.totalDownloadSizeBytes,
            generatedAt = proto.generatedAt
        )
    }

    override suspend fun getLocalCachedManifest(): Manifest? = withContext(Dispatchers.IO) {
        val json = manifestStorage.getActiveManifestJson() ?: return@withContext null
        try {
            val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(context)
            parseManifestJson(JSONObject(json), baseUrl)
        } catch (_: Exception) {
            null
        }
    }

    override suspend fun saveManifestLocally(manifest: Manifest): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val json = serializeManifestToJson(manifest)
            val success = manifestStorage.saveManifest(json)
            if (success) Result.success(Unit) else Result.failure(Exception("Gagal menulis manifest"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun clearManifestCache(): Result<Unit> = withContext(Dispatchers.IO) {
        manifestStorage.clear()
        Result.success(Unit)
    }

    private fun parseManifestJson(root: JSONObject, baseUrl: String): Manifest {
        val manifestId = root.optString("manifestId", "")
        val deviceId = root.optString("deviceId", "")
        val versionHash = root.optString("versionHash", "")

        val layoutObj = root.optJSONObject("layout")
        val layoutId = layoutObj?.optString("id") ?: root.optString("layoutId", "")
        val layoutName = layoutObj?.optString("name") ?: root.optString("layoutName", "Layout Default")
        val canvasWidth = layoutObj?.optInt("canvasWidth") ?: root.optInt("canvasWidth", 1920)
        val canvasHeight = layoutObj?.optInt("canvasHeight") ?: root.optInt("canvasHeight", 1080)

        val zonesList = mutableListOf<LayerZone>()
        val layersArr = layoutObj?.optJSONArray("layersList")
            ?: layoutObj?.optJSONArray("layers")
            ?: root.optJSONArray("zones")

        if (layersArr != null) {
            for (i in 0 until layersArr.length()) {
                val zObj = layersArr.getJSONObject(i)
                val blocksList = mutableListOf<LayerBlock>()
                val blocksArr = zObj.optJSONArray("blocksList") ?: zObj.optJSONArray("blocks")
                if (blocksArr != null) {
                    for (j in 0 until blocksArr.length()) {
                        val bObj = blocksArr.getJSONObject(j)
                        val widgetTypeStr = bObj.optString("widgetType", "")
                        val hasQueue = !bObj.optString("queueId").isNullOrEmpty() || !bObj.optString("queue_id").isNullOrEmpty() || widgetTypeStr.equals("queue", true)
                        val hasClock = !bObj.optString("clockId").isNullOrEmpty() || !bObj.optString("clock_id").isNullOrEmpty() || widgetTypeStr.equals("clock", true)
                        val hasTicker = !bObj.optString("tickerId").isNullOrEmpty() || !bObj.optString("ticker_id").isNullOrEmpty() || widgetTypeStr.equals("ticker", true)
                        val hasWebview = !bObj.optString("webviewId").isNullOrEmpty() || !bObj.optString("webview_id").isNullOrEmpty() || widgetTypeStr.equals("webview", true)

                        val wType = when {
                            hasQueue -> ZoneWidgetType.QUEUE
                            hasClock -> ZoneWidgetType.CLOCK
                            hasTicker -> ZoneWidgetType.TICKER
                            hasWebview -> ZoneWidgetType.WEBVIEW
                            else -> ZoneWidgetType.NONE
                        }
                        val blockVol = if (bObj.has("volumeLevel")) bObj.optInt("volumeLevel", 100) else bObj.optInt("volume_level", 100)
                        val playlistItems = mutableListOf<LayerPlaylistItem>()
                        val plObj = bObj.optJSONObject("playlist")
                        val itemsArr = plObj?.optJSONArray("itemsList")
                            ?: plObj?.optJSONArray("items")
                            ?: bObj.optJSONArray("playlistItems")

                        val overrideMap = mutableMapOf<String, Pair<Boolean?, Int?>>()
                        val overridesArr = bObj.optJSONArray("itemOverridesList")
                            ?: bObj.optJSONArray("item_overrides")
                        if (overridesArr != null) {
                            for (oIdx in 0 until overridesArr.length()) {
                                val oObj = overridesArr.getJSONObject(oIdx)
                                val pItemId = oObj.optString("playlistItemId").ifEmpty { oObj.optString("playlist_item_id") }
                                if (pItemId.isNotEmpty()) {
                                    val ovMuted = if (oObj.has("isMuted")) oObj.optBoolean("isMuted")
                                        else if (oObj.has("is_muted")) oObj.optBoolean("is_muted")
                                        else null
                                    val ovVol = if (oObj.has("volumeLevel")) oObj.optInt("volumeLevel")
                                        else if (oObj.has("volume_level")) oObj.optInt("volume_level")
                                        else null
                                    overrideMap[pItemId] = Pair(ovMuted, ovVol)
                                }
                            }
                        }

                        if (itemsArr != null) {
                            for (k in 0 until itemsArr.length()) {
                                val itm = itemsArr.getJSONObject(k)
                                val mId = itm.optString("mediaItemId").ifEmpty { itm.optString("media_item_id") }
                                if (mId.isNotEmpty()) {
                                    val itemId = itm.optString("id", "pl-item-$k")
                                    val ov = overrideMap[itemId]
                                    val itmMuted = ov?.first ?: itm.optBoolean("isMuted", itm.optBoolean("is_muted", false))
                                    val itmVol = ov?.second ?: (if (itm.has("volumeLevel")) itm.optInt("volumeLevel") else itm.optInt("volume_level", blockVol))
                                    playlistItems.add(
                                        LayerPlaylistItem(
                                            id = itemId,
                                            mediaItemId = mId,
                                            position = itm.optInt("position", k),
                                            durationSeconds = itm.optInt("durationSeconds", itm.optInt("duration_seconds", 0)),
                                            isMuted = itmMuted,
                                            volumeLevel = itmVol
                                        )
                                    )
                                }
                            }
                        }

                        blocksList.add(
                            LayerBlock(
                                id = bObj.optString("id", "blk-$j"),
                                mediaItemId = bObj.optString("mediaItemId").ifEmpty { null },
                                playlistId = bObj.optString("playlistId").ifEmpty { null },
                                widgetType = wType,
                                widgetDataJson = bObj.optString("widgetDataJson").ifEmpty {
                                    bObj.optJSONObject("widgetData")?.toString()
                                },
                                startTimeSeconds = bObj.optInt("startTimeSeconds", 0),
                                durationSeconds = bObj.optInt("durationSeconds", 10),
                                isMuted = bObj.optBoolean("isMuted", false),
                                volumeLevel = blockVol,
                                playlistItems = playlistItems
                            )
                        )
                    }
                }

                val zOpacity = (if (zObj.has("opacity")) zObj.optDouble("opacity", 1.0) else 1.0).toFloat()
                val zOverlayColor = zObj.optString("overlayColor").ifEmpty {
                    zObj.optString("overlay_color").ifEmpty { null }
                }
                val zOverlayOpacity = (if (zObj.has("overlayOpacity")) zObj.optDouble("overlayOpacity", 0.0) else zObj.optDouble("overlay_opacity", 0.0)).toFloat()
                val zBorderRadius = if (zObj.has("borderRadius")) zObj.optInt("borderRadius", 0) else zObj.optInt("border_radius", 0)
                val zBorderColor = zObj.optString("borderColor").ifEmpty {
                    zObj.optString("border_color").ifEmpty { null }
                }
                val zBorderWidth = if (zObj.has("borderWidth")) zObj.optInt("borderWidth", 0) else zObj.optInt("border_width", 0)

                zonesList.add(
                    LayerZone(
                        id = zObj.optString("id", "zone-$i"),
                        name = zObj.optString("name", "Layer $i"),
                        x = zObj.optInt("x", 0),
                        y = zObj.optInt("y", 0),
                        width = zObj.optInt("width", canvasWidth),
                        height = zObj.optInt("height", canvasHeight),
                        zIndex = zObj.optInt("zIndex", i + 1),
                        backgroundColor = zObj.optString("backgroundColor").ifEmpty { null },
                        opacity = zOpacity,
                        overlayColor = zOverlayColor,
                        overlayOpacity = zOverlayOpacity,
                        borderRadius = zBorderRadius,
                        borderColor = zBorderColor,
                        borderWidth = zBorderWidth,
                        blocks = blocksList,
                        isLocked = zObj.optBoolean("isLocked", false)
                    )
                )
            }
        }

        val assetsList = mutableListOf<MediaAsset>()
        val assetsArr = root.optJSONArray("requiredAssetsList") ?: root.optJSONArray("requiredAssets")
        if (assetsArr != null) {
            for (i in 0 until assetsArr.length()) {
                val aObj = assetsArr.getJSONObject(i)
                var rawUrl = aObj.optString("url", "")
                if (rawUrl.startsWith("/")) {
                    val trimmedBase = baseUrl.trimEnd('/')
                    rawUrl = "$trimmedBase$rawUrl"
                }

                assetsList.add(
                    MediaAsset(
                        mediaId = aObj.optString("mediaId"),
                        url = rawUrl,
                        sha256Hash = aObj.optString("sha256Hash"),
                        fileSizeBytes = aObj.optLong("fileSizeBytes", 0L),
                        localFilename = aObj.optString("localFilename", "media_$i"),
                        mediaType = MediaType.fromInt(aObj.optInt("mediaType", 1)),
                        durationSeconds = aObj.optInt("durationSeconds", 10)
                    )
                )
            }
        }

        return Manifest(
            manifestId = manifestId,
            deviceId = deviceId,
            versionHash = versionHash,
            layoutId = layoutId,
            layoutName = layoutName,
            canvasWidth = canvasWidth,
            canvasHeight = canvasHeight,
            zones = zonesList,
            requiredAssets = assetsList,
            totalDownloadSizeBytes = root.optLong("totalDownloadSizeBytes", 0L),
            generatedAt = root.optString("generatedAt", "")
        )
    }

    private fun serializeManifestToJson(manifest: Manifest): String {
        val root = JSONObject().apply {
            put("manifestId", manifest.manifestId)
            put("deviceId", manifest.deviceId)
            put("versionHash", manifest.versionHash)
            put("layoutId", manifest.layoutId)
            put("layoutName", manifest.layoutName)
            put("canvasWidth", manifest.canvasWidth)
            put("canvasHeight", manifest.canvasHeight)
            put("totalDownloadSizeBytes", manifest.totalDownloadSizeBytes)
            put("generatedAt", manifest.generatedAt)

            val layoutObj = JSONObject().apply {
                put("id", manifest.layoutId)
                put("name", manifest.layoutName)
                put("canvasWidth", manifest.canvasWidth)
                put("canvasHeight", manifest.canvasHeight)

                val layersArr = JSONArray()
                for (zone in manifest.zones) {
                    val zObj = JSONObject().apply {
                        put("id", zone.id)
                        put("name", zone.name)
                        put("x", zone.x)
                        put("y", zone.y)
                        put("width", zone.width)
                        put("height", zone.height)
                        put("zIndex", zone.zIndex)
                        if (zone.backgroundColor != null) put("backgroundColor", zone.backgroundColor)
                        put("opacity", zone.opacity)
                        if (zone.overlayColor != null) put("overlayColor", zone.overlayColor)
                        put("overlayOpacity", zone.overlayOpacity)
                        put("borderRadius", zone.borderRadius)
                        if (zone.borderColor != null) put("borderColor", zone.borderColor)
                        put("borderWidth", zone.borderWidth)

                        val blocksArr = JSONArray()
                        for (block in zone.blocks) {
                            val bObj = JSONObject().apply {
                                put("id", block.id)
                                if (block.mediaItemId != null) put("mediaItemId", block.mediaItemId)
                                if (block.playlistId != null) put("playlistId", block.playlistId)
                                put("widgetType", block.widgetType.name)
                                if (block.widgetDataJson != null) put("widgetDataJson", block.widgetDataJson)
                                put("durationSeconds", block.durationSeconds)
                                put("isMuted", block.isMuted)
                                if (block.playlistItems.isNotEmpty()) {
                                    val plItemsArr = JSONArray()
                                    for (pItem in block.playlistItems) {
                                        val pObj = JSONObject().apply {
                                            put("id", pItem.id)
                                            put("mediaItemId", pItem.mediaItemId)
                                            put("position", pItem.position)
                                            put("durationSeconds", pItem.durationSeconds)
                                            put("isMuted", pItem.isMuted)
                                        }
                                        plItemsArr.put(pObj)
                                    }
                                    put("playlistItems", plItemsArr)
                                }
                            }
                            blocksArr.put(bObj)
                        }
                        put("blocksList", blocksArr)
                    }
                    layersArr.put(zObj)
                }
                put("layersList", layersArr)
            }
            put("layout", layoutObj)

            val assetsArr = JSONArray()
            for (asset in manifest.requiredAssets) {
                val aObj = JSONObject().apply {
                    put("mediaId", asset.mediaId)
                    put("url", asset.url)
                    put("sha256Hash", asset.sha256Hash)
                    put("fileSizeBytes", asset.fileSizeBytes)
                    put("localFilename", asset.localFilename)
                    put("mediaType", asset.mediaType.rawValue)
                    put("durationSeconds", asset.durationSeconds)
                }
                assetsArr.put(aObj)
            }
            put("requiredAssetsList", assetsArr)
        }
        return root.toString()
    }
}
