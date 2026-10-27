package com.dkaapis.sigma.data.repository.mapper

import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.LayerPlaylistItem
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.model.MediaType
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import org.json.JSONArray
import org.json.JSONObject

/**
 * Deserializer berkas JSON manifest lokal ke Entity Domain Manifest.
 * Ditulis secara deklaratif dan ringkas tanpa variabel lokal redundan.
 */
class ManifestJsonDeserializer {

    fun parse(root: JSONObject, baseUrl: String = ""): Manifest = with(root) {
        val layout = optJSONObject("layout") ?: JSONObject()
        val canvasW = layout.optInt("canvasWidth", optInt("canvasWidth", 1920))
        val canvasH = layout.optInt("canvasHeight", optInt("canvasHeight", 1080))

        Manifest(
            manifestId = optString("manifestId"),
            deviceId = optString("deviceId"),
            versionHash = optString("versionHash"),
            layoutId = layout.optString("id", optString("layoutId")),
            layoutName = layout.optString("name", optString("layoutName", "Layout Default")),
            canvasWidth = canvasW,
            canvasHeight = canvasH,
            zones = parseZones(layout.optJSONArray("layersList") ?: layout.optJSONArray("layers") ?: optJSONArray("zones"), canvasW, canvasH),
            requiredAssets = parseAssets(optJSONArray("requiredAssetsList") ?: optJSONArray("requiredAssets"), baseUrl),
            totalDownloadSizeBytes = optLong("totalDownloadSizeBytes", 0L),
            generatedAt = optString("generatedAt")
        )
    }

    private fun parseZones(arr: JSONArray?, canvasW: Int, canvasH: Int): List<LayerZone> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).map { i ->
            val z = arr.getJSONObject(i)
            LayerZone(
                id = z.optString("id", "zone-$i"),
                name = z.optString("name", "Layer $i"),
                x = z.optInt("x", 0),
                y = z.optInt("y", 0),
                width = z.optInt("width", canvasW),
                height = z.optInt("height", canvasH),
                zIndex = z.optInt("zIndex", i + 1),
                backgroundColor = z.optString("backgroundColor").ifBlank { null },
                opacity = (if (z.has("opacity")) z.optDouble("opacity", 1.0) else 1.0).toFloat(),
                overlayColor = z.optString("overlayColor").ifBlank { z.optString("overlay_color").ifBlank { null } },
                overlayOpacity = (if (z.has("overlayOpacity")) z.optDouble("overlayOpacity", 0.0) else z.optDouble("overlay_opacity", 0.0)).toFloat(),
                borderRadius = if (z.has("borderRadius")) z.optInt("borderRadius", 0) else z.optInt("border_radius", 0),
                borderColor = z.optString("borderColor").ifBlank { z.optString("border_color").ifBlank { null } },
                borderWidth = if (z.has("borderWidth")) z.optInt("borderWidth", 0) else z.optInt("border_width", 0),
                blocks = parseBlocks(z.optJSONArray("blocksList") ?: z.optJSONArray("blocks")),
                isLocked = z.optBoolean("isLocked", false)
            )
        }
    }

    private fun parseBlocks(arr: JSONArray?): List<LayerBlock> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).map { j ->
            val b = arr.getJSONObject(j)
            val typeStr = b.optString("widgetType", "")
            val wType = when {
                b.hasWidgetId("queue") || typeStr.equals("queue", true) -> ZoneWidgetType.QUEUE
                b.hasWidgetId("clock") || typeStr.equals("clock", true) -> ZoneWidgetType.CLOCK
                b.hasWidgetId("ticker") || typeStr.equals("ticker", true) -> ZoneWidgetType.TICKER
                b.hasWidgetId("webview") || typeStr.equals("webview", true) -> ZoneWidgetType.WEBVIEW
                else -> ZoneWidgetType.NONE
            }
            val blockVol = if (b.has("volumeLevel")) b.optInt("volumeLevel", 100) else b.optInt("volume_level", 100)
            LayerBlock(
                id = b.optString("id", "blk-$j"),
                mediaItemId = b.optString("mediaItemId").ifBlank { null },
                playlistId = b.optString("playlistId").ifBlank { null },
                widgetType = wType,
                widgetDataJson = b.optString("widgetDataJson").ifBlank { b.optJSONObject("widgetData")?.toString() },
                startTimeSeconds = b.optInt("startTimeSeconds", 0),
                durationSeconds = b.optInt("durationSeconds", 10),
                isMuted = b.optBoolean("isMuted", false),
                volumeLevel = blockVol,
                playlistItems = parsePlaylistItems(b, blockVol)
            )
        }
    }

    private fun parsePlaylistItems(b: JSONObject, blockVol: Int): List<LayerPlaylistItem> {
        val plObj = b.optJSONObject("playlist")
        val itemsArr = plObj?.optJSONArray("itemsList") ?: plObj?.optJSONArray("items") ?: b.optJSONArray("playlistItems") ?: return emptyList()
        val overrideMap = parseOverrides(b.optJSONArray("itemOverridesList") ?: b.optJSONArray("item_overrides"))

        return (0 until itemsArr.length()).mapNotNull { k ->
            val itm = itemsArr.getJSONObject(k)
            val mId = itm.optString("mediaItemId").ifEmpty { itm.optString("media_item_id") }
            if (mId.isEmpty()) return@mapNotNull null
            val itemId = itm.optString("id", "pl-item-$k")
            val ov = overrideMap[itemId]
            LayerPlaylistItem(
                id = itemId,
                mediaItemId = mId,
                position = itm.optInt("position", k),
                durationSeconds = itm.optInt("durationSeconds", itm.optInt("duration_seconds", 0)),
                isMuted = ov?.first ?: itm.optBoolean("isMuted", itm.optBoolean("is_muted", false)),
                volumeLevel = ov?.second ?: (if (itm.has("volumeLevel")) itm.optInt("volumeLevel") else itm.optInt("volume_level", blockVol))
            )
        }
    }

    private fun parseOverrides(overridesArr: JSONArray?): Map<String, Pair<Boolean?, Int?>> {
        if (overridesArr == null) return emptyMap()
        return (0 until overridesArr.length()).mapNotNull { oIdx ->
            val oObj = overridesArr.getJSONObject(oIdx)
            val pItemId = oObj.optString("playlistItemId").ifEmpty { oObj.optString("playlist_item_id") }
            if (pItemId.isEmpty()) return@mapNotNull null
            val ovMuted = when {
                oObj.has("isMuted") -> oObj.optBoolean("isMuted")
                oObj.has("is_muted") -> oObj.optBoolean("is_muted")
                else -> null
            }
            val ovVol = when {
                oObj.has("volumeLevel") -> oObj.optInt("volumeLevel")
                oObj.has("volume_level") -> oObj.optInt("volume_level")
                else -> null
            }
            pItemId to Pair(ovMuted, ovVol)
        }.toMap()
    }

    private fun parseAssets(arr: JSONArray?, baseUrl: String = ""): List<MediaAsset> {
        if (arr == null) return emptyList()
        val trimmedBase = baseUrl.trimEnd('/')
        return (0 until arr.length()).map { i ->
            val a = arr.getJSONObject(i)
            val rawUrl = a.optString("url", "")
            val resolvedUrl = if (trimmedBase.isNotEmpty() && rawUrl.startsWith("/")) "$trimmedBase$rawUrl" else rawUrl
            MediaAsset(
                mediaId = a.optString("mediaId"),
                url = resolvedUrl,
                sha256Hash = a.optString("sha256Hash"),
                fileSizeBytes = a.optLong("fileSizeBytes", 0L),
                localFilename = a.optString("localFilename", "media_$i"),
                mediaType = MediaType.fromInt(a.optInt("mediaType", 1)),
                durationSeconds = a.optInt("durationSeconds", 10)
            )
        }
    }

    private fun JSONObject.hasWidgetId(prefix: String): Boolean =
        !optString("${prefix}Id").isNullOrEmpty() || !optString("${prefix}_id").isNullOrEmpty()
}
