package com.dkaapis.sigma.data.repository

import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.domain.model.*
import com.dkaapis.sigma.domain.repository.ManifestRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

class ManifestRepositoryImpl(
    private val manifestStorage: ManifestStorage,
    private val channelFactory: GrpcChannelFactory
) : ManifestRepository {

    override suspend fun fetchActiveManifest(deviceId: String, currentHash: String): Result<Manifest?> = withContext(Dispatchers.IO) {
        try {
            // Jika ada cache lokal, coba gunakan sementara sambil menunggu response gRPC
            val localJson = manifestStorage.getActiveManifestJson()
            if (localJson != null) {
                val parsed = parseManifestJson(localJson)
                Result.success(parsed)
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getLocalCachedManifest(): Manifest? = withContext(Dispatchers.IO) {
        val json = manifestStorage.getActiveManifestJson() ?: return@withContext null
        try {
            parseManifestJson(json)
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

    private fun parseManifestJson(jsonStr: String): Manifest {
        val root = JSONObject(jsonStr)
        val manifestId = root.optString("manifestId", "")
        val deviceId = root.optString("deviceId", "")
        val versionHash = root.optString("versionHash", "")
        val layoutId = root.optString("layoutId", "")
        val layoutName = root.optString("layoutName", "Layout Default")
        val canvasWidth = root.optInt("canvasWidth", 1920)
        val canvasHeight = root.optInt("canvasHeight", 1080)

        val zonesList = mutableListOf<LayerZone>()
        val zonesArr = root.optJSONArray("zones")
        if (zonesArr != null) {
            for (i in 0 until zonesArr.length()) {
                val zObj = zonesArr.getJSONObject(i)
                val blocksList = mutableListOf<LayerBlock>()
                val blocksArr = zObj.optJSONArray("blocks")
                if (blocksArr != null) {
                    for (j in 0 until blocksArr.length()) {
                        val bObj = blocksArr.getJSONObject(j)
                        val widgetTypeStr = bObj.optString("widgetType", "")
                        val wType = when (widgetTypeStr.lowercase()) {
                            "clock" -> ZoneWidgetType.CLOCK
                            "ticker" -> ZoneWidgetType.TICKER
                            "queue" -> ZoneWidgetType.QUEUE
                            "webview" -> ZoneWidgetType.WEBVIEW
                            else -> ZoneWidgetType.NONE
                        }
                        blocksList.add(
                            LayerBlock(
                                id = bObj.optString("id", "blk-$j"),
                                mediaItemId = bObj.optString("mediaItemId").ifEmpty { null },
                                playlistId = bObj.optString("playlistId").ifEmpty { null },
                                widgetType = wType,
                                widgetDataJson = bObj.optString("widgetDataJson").ifEmpty { null },
                                durationSeconds = bObj.optInt("durationSeconds", 10),
                                isMuted = bObj.optBoolean("isMuted", false)
                            )
                        )
                    }
                }

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
                        blocks = blocksList,
                        isLocked = zObj.optBoolean("isLocked", false)
                    )
                )
            }
        }

        val assetsList = mutableListOf<MediaAsset>()
        val assetsArr = root.optJSONArray("requiredAssets")
        if (assetsArr != null) {
            for (i in 0 until assetsArr.length()) {
                val aObj = assetsArr.getJSONObject(i)
                assetsList.add(
                    MediaAsset(
                        mediaId = aObj.optString("mediaId"),
                        url = aObj.optString("url"),
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
        }
        return root.toString()
    }
}
