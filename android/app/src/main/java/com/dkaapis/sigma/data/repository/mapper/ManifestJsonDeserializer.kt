package com.dkaapis.sigma.data.repository.mapper

import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.LayerPlaylistItem
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.model.MediaType
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import org.json.JSONObject

/**
 * Deserializer berkas JSON manifest lokal ke Entity Domain Manifest
 */
class ManifestJsonDeserializer {

    fun parse(root: JSONObject, baseUrl: String): Manifest {
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
                        val overridesArr = bObj.optJSONArray("itemOverridesList") ?: bObj.optJSONArray("item_overrides")
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

                val zOpacity = jsonOptFloat(zObj, "opacity", 1.0f)
                val zOverlayColor = zObj.optString("overlayColor").ifEmpty { zObj.optString("overlay_color").ifEmpty { null } }
                val zOverlayOpacity = jsonOptFloat(zObj, "overlayOpacity", jsonOptFloat(zObj, "overlay_opacity", 0.0f))
                val zBorderRadius = if (zObj.has("borderRadius")) zObj.optInt("borderRadius", 0) else zObj.optInt("border_radius", 0)
                val zBorderColor = zObj.optString("borderColor").ifEmpty { zObj.optString("border_color").ifEmpty { null } }
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

    private fun jsonOptFloat(json: JSONObject, key: String, fallback: Float): Float {
        return if (json.has(key)) json.optDouble(key, fallback.toDouble()).toFloat() else fallback
    }
}
