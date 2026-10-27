package com.dkaapis.sigma.data.repository.mapper

import com.dkaapis.sigma.domain.model.Manifest
import org.json.JSONArray
import org.json.JSONObject

/**
 * Serializer Entity Domain Manifest ke string format JSON untuk disk cache persistence
 */
class ManifestJsonSerializer {

    fun serialize(manifest: Manifest): String {
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
            manifest.powerSchedule?.let { ps ->
                put("powerSchedule", JSONObject().apply {
                    put("enabled", ps.enabled)
                    put("sleepTime", ps.sleepTime)
                    put("wakeTime", ps.wakeTime)
                })
            }

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
