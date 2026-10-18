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
            val baseUrl = try {
                context.getString(R.string.server_http_base_url)
            } catch (_: Exception) {
                "http://192.168.1.46:80"
            }

            val jsonBody = JSONObject().apply {
                put("deviceId", deviceId)
                put("clientCurrentHash", currentHash)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/api/grpc/distribution/manifest/GetActiveManifest")
                .post(jsonBody.toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val bodyStr = response.body?.string() ?: ""
                val root = JSONObject(bodyStr)

                val isUpToDate = root.optBoolean("isUpToDate", false)
                if (isUpToDate) {
                    val cached = getLocalCachedManifest()
                    return@withContext Result.success(cached)
                }

                val manifestObj = root.optJSONObject("manifest")
                if (manifestObj != null) {
                    val parsed = parseManifestJson(manifestObj, baseUrl)
                    manifestStorage.saveManifest(manifestObj.toString())
                    Result.success(parsed)
                } else {
                    // Coba fallback ke lokal jika server belum menyediakan manifest baru
                    val cached = getLocalCachedManifest()
                    Result.success(cached)
                }
            } else if (response.code == 404 || response.code == 401) {
                manifestStorage.clear()
                Result.failure(IllegalStateException("HTTP error ${response.code}: Perangkat telah dihapus dari CMS"))
            } else {
                val cached = getLocalCachedManifest()
                if (cached != null) {
                    Result.success(cached)
                } else {
                    Result.failure(Exception("HTTP error ${response.code} saat mengambil manifest"))
                }
            }
        } catch (e: Exception) {
            val cached = getLocalCachedManifest()
            if (cached != null) {
                Result.success(cached)
            } else {
                Result.failure(e)
            }
        }
    }

    override suspend fun getLocalCachedManifest(): Manifest? = withContext(Dispatchers.IO) {
        val json = manifestStorage.getActiveManifestJson() ?: return@withContext null
        try {
            val baseUrl = try {
                context.getString(R.string.server_http_base_url)
            } catch (_: Exception) {
                "http://192.168.1.46:80"
            }
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
                        val playlistItems = mutableListOf<LayerPlaylistItem>()
                        val plObj = bObj.optJSONObject("playlist")
                        val itemsArr = plObj?.optJSONArray("itemsList")
                            ?: plObj?.optJSONArray("items")
                            ?: bObj.optJSONArray("playlistItems")
                        if (itemsArr != null) {
                            for (k in 0 until itemsArr.length()) {
                                val itm = itemsArr.getJSONObject(k)
                                val mId = itm.optString("mediaItemId").ifEmpty { itm.optString("media_item_id") }
                                if (mId.isNotEmpty()) {
                                    playlistItems.add(
                                        LayerPlaylistItem(
                                            id = itm.optString("id", "pl-item-$k"),
                                            mediaItemId = mId,
                                            position = itm.optInt("position", k),
                                            durationSeconds = itm.optInt("durationSeconds", itm.optInt("duration_seconds", 0)),
                                            isMuted = itm.optBoolean("isMuted", itm.optBoolean("is_muted", false))
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
