package com.dkaapis.sigma.presentation.renderers.queue.parser

import com.dkaapis.sigma.presentation.renderers.queue.model.QueueItemMeta
import com.dkaapis.sigma.presentation.renderers.queue.model.QueueLayoutConfig
import org.json.JSONArray
import org.json.JSONObject

/**
 * Parser fungsional untuk mengonversi widgetDataJson antrean menjadi QueueLayoutConfig
 */
object QueueLayoutParser {

    fun parse(widgetDataJson: String?): QueueLayoutConfig {
        if (widgetDataJson.isNullOrBlank()) return QueueLayoutConfig()

        return runCatching {
            val json = JSONObject(widgetDataJson)
            val w = json.optInt("canvasWidth", 1920).takeIf { it > 0 } ?: 1920
            val h = json.optInt("canvasHeight", 1080).takeIf { it > 0 } ?: 1080
            val pfx = json.optString("prefix", "A").ifBlank { "A" }
            val name = json.optString("name", "Layar Antrian")
            val counterLbl = json.optString("counterLabel", json.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()
            val latestNum = json.optString("latestCalledNumber", "$pfx-001")
            val bgCol = json.optString("backgroundColor", "transparent").ifBlank { "transparent" }
            val bgImg = json.optString("backgroundImageUrl", "").ifBlank { json.optString("background_image_url", "") }
            val canvasOp = json.optDouble("opacity", 1.0).toFloat()
            val overlayCol = json.optString("overlayColor", "").ifEmpty { json.optString("overlay_color", "") }
            val overlayOp = json.optDouble("overlayOpacity", json.optDouble("overlay_opacity", 0.0)).toFloat()

            val counters = parseCounters(json.optJSONArray("countersList") ?: json.optJSONArray("counters"))
            val counterNm = json.optString("currentCounterName", "").ifBlank { counters.firstOrNull()?.first ?: "LOKET 01" }

            val rawStatus = json.optString("status", json.optString("counterStatus", counters.firstOrNull()?.second ?: "ACTIVE"))
            val status = when {
                rawStatus.equals("BREAK", ignoreCase = true) || rawStatus.equals("LOCKED", ignoreCase = true) -> rawStatus.uppercase()
                else -> counters.find { it.first == counterNm }?.second ?: "ACTIVE"
            }

            val items = mutableListOf<QueueItemMeta>()
            if (overlayOp > 0f && overlayCol.isNotBlank() && !overlayCol.equals("transparent", ignoreCase = true)) {
                items.add(
                    QueueItemMeta(
                        id = "queue-overlay-scrim",
                        itemType = "overlay_scrim",
                        x = 0, y = 0, width = w, height = h, zIndex = 0,
                        backgroundColor = overlayCol,
                        textColor = "transparent", fontSize = 0f,
                        fontWeight = "normal", textAlign = "left", templateContent = "",
                        opacity = overlayOp
                    )
                )
            }

            items.addAll(parseItems(json.optJSONArray("itemsList") ?: json.optJSONArray("items")))

            QueueLayoutConfig(
                canvasW = w,
                canvasH = h,
                prefix = pfx,
                name = name,
                counterLabel = counterLbl,
                latestNumber = latestNum,
                counterName = counterNm,
                status = status,
                bgColor = bgCol,
                bgImageUrl = bgImg,
                canvasOpacity = canvasOp,
                counters = counters,
                items = items
            )
        }.getOrDefault(QueueLayoutConfig())
    }

    private fun parseCounters(arr: JSONArray?): List<Pair<String, String>> {
        if (arr == null || arr.length() == 0) {
            return listOf("LOKET 01" to "ACTIVE", "LOKET 02" to "ACTIVE", "LOKET 03" to "ACTIVE")
        }
        return (0 until arr.length()).mapNotNull { i ->
            arr.optJSONObject(i)?.let { obj ->
                val name = obj.optString("counterName", "LOKET ${i + 1}")
                val status = obj.optString("status", "ACTIVE").uppercase()
                name to status
            }
        }
    }

    private fun parseItems(arr: JSONArray?): List<QueueItemMeta> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val obj = arr.optJSONObject(i) ?: return@mapNotNull null
            if (!obj.optBoolean("isVisible", true)) return@mapNotNull null

            var itemOpacity = obj.optDouble("opacity", 1.0).toFloat()
            var br = obj.optDouble("borderRadius", obj.optDouble("border_radius", 0.0)).toFloat()
            var bw = obj.optInt("borderWidth", obj.optInt("border_width", 0))
            var bc = obj.optString("borderColor", obj.optString("border_color", "transparent"))
            var spd = "normal"

            val cfgStr = obj.optString("configJson", "")
            if (cfgStr.isNotBlank()) {
                runCatching {
                    val cfg = JSONObject(cfgStr)
                    if (!obj.has("borderRadius") && !obj.has("border_radius")) br = cfg.optDouble("borderRadius", 0.0).toFloat()
                    if (!obj.has("borderWidth") && !obj.has("border_width")) bw = cfg.optInt("borderWidth", 0)
                    if (!obj.has("borderColor") && !obj.has("border_color")) bc = cfg.optString("borderColor", "transparent")
                    if (!obj.has("opacity")) itemOpacity = cfg.optDouble("opacity", 1.0).toFloat()
                    spd = cfg.optString("speed", "normal")
                }
            }

            QueueItemMeta(
                id = obj.optString("id", "item-$i"),
                itemType = obj.optString("itemType", obj.optString("item_type", "text")),
                x = obj.optInt("x", 0),
                y = obj.optInt("y", 0),
                width = obj.optInt("width", 200).coerceAtLeast(1),
                height = obj.optInt("height", 100).coerceAtLeast(1),
                zIndex = obj.optInt("zIndex", obj.optInt("z_index", i)),
                backgroundColor = obj.optString("backgroundColor", obj.optString("background_color", "transparent")),
                textColor = obj.optString("textColor", obj.optString("text_color", "#ffffff")),
                fontSize = obj.optDouble("fontSize", obj.optDouble("font_size", 24.0)).toFloat(),
                fontWeight = obj.optString("fontWeight", obj.optString("font_weight", "bold")),
                textAlign = obj.optString("textAlign", obj.optString("text_align", "center")),
                templateContent = obj.optString("templateContent", obj.optString("template_content", "")),
                borderRadius = br,
                borderWidth = bw,
                borderColor = bc,
                speed = spd,
                opacity = itemOpacity
            )
        }
    }
}
