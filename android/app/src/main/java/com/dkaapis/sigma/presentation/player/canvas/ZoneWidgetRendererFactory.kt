package com.dkaapis.sigma.presentation.player.canvas

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import com.dkaapis.sigma.presentation.renderers.ClockZoneRenderer
import com.dkaapis.sigma.presentation.renderers.QueueZoneRenderer
import com.dkaapis.sigma.presentation.renderers.TickerZoneRenderer
import com.dkaapis.sigma.presentation.renderers.WebviewZoneRenderer
import org.json.JSONObject

/**
 * Pabrik instansiasi renderer widget dinamis (Jam, Ticker, Queue, Webview)
 */
class ZoneWidgetRendererFactory {

    fun createWidgetView(
        activity: Activity,
        parent: ViewGroup,
        block: LayerBlock,
        onClockCreated: (ClockZoneRenderer) -> Unit,
        onQueueCreated: (QueueZoneRenderer, queueId: String, widgetDataJson: String?) -> Unit,
        onDuckingChanged: (isDucked: Boolean) -> Unit,
        onQueueTapNext: (ticketNum: String, counterNm: String) -> Unit
    ): View? {
        val jsonStr = block.widgetDataJson ?: "{}"
        return when (block.widgetType) {
            ZoneWidgetType.CLOCK -> {
                val renderer = ClockZoneRenderer(activity)
                onClockCreated(renderer)
                val json = runCatching { JSONObject(jsonStr) }.getOrDefault(JSONObject())
                renderer.createView(
                    parent = parent,
                    city = json.optString("city", "Makassar"),
                    showSeconds = json.optBoolean("showSeconds", true),
                    backgroundColorHex = json.optString("backgroundColor", "transparent").ifBlank { "transparent" },
                    textColorHex = json.optString("textColor", "#ffffff").ifBlank { "#ffffff" },
                    subtitleColorHex = json.optString("subtitleColor", "#94a3b8").ifBlank { "#94a3b8" },
                    borderColorHex = json.optString("borderColor", "transparent").ifBlank { "transparent" },
                    borderRadiusDp = json.optInt("borderRadius", 0),
                    timeFontSizeSp = json.optDouble("timeFontSize", 52.0).toFloat(),
                    dateFontSizeSp = json.optDouble("dateFontSize", 14.0).toFloat()
                )
            }
            ZoneWidgetType.TICKER -> {
                val renderer = TickerZoneRenderer(activity)
                val json = runCatching { JSONObject(jsonStr) }.getOrDefault(JSONObject())
                val msgArr = json.optJSONArray("messagesList") ?: json.optJSONArray("messages")
                val msgs = mutableListOf<String>()
                if (msgArr != null) {
                    for (m in 0 until msgArr.length()) {
                        val s = msgArr.optString(m)
                        if (s.isNotBlank()) msgs.add(s)
                    }
                }
                val textMessage = if (msgs.isNotEmpty()) msgs.joinToString("  ✦  ") else json.optString("name", "DKASigma Teks Berjalan")

                renderer.createView(
                    parent = parent,
                    textMessage = textMessage,
                    badgeText = json.optString("badge", ""),
                    fontSize = json.optDouble("fontSize", 16.0).toFloat(),
                    backgroundColorHex = json.optString("backgroundColor", "transparent").ifBlank { "transparent" },
                    textColorHex = json.optString("textColor", "#ffffff").ifBlank { "#ffffff" },
                    badgeBackgroundColorHex = json.optString("badgeBackgroundColor", "transparent").ifBlank { "transparent" },
                    badgeTextColorHex = json.optString("badgeTextColor", "#ffffff").ifBlank { "#ffffff" },
                    borderColorHex = json.optString("borderColor", "transparent").ifBlank { "transparent" },
                    borderRadiusDp = json.optInt("borderRadius", 0),
                    speed = json.optString("speed", "normal")
                )
            }
            ZoneWidgetType.QUEUE -> {
                val renderer = QueueZoneRenderer(
                    context = activity,
                    onCallAudioStarted = { onDuckingChanged(true) },
                    onCallAudioFinished = { onDuckingChanged(false) },
                    onUserTapNext = onQueueTapNext
                )
                val queueId = runCatching {
                    val qObj = JSONObject(block.widgetDataJson ?: "{}")
                    qObj.optString("id", qObj.optString("queueDisplayId", ""))
                }.getOrDefault("")
                onQueueCreated(renderer, queueId, block.widgetDataJson)
                renderer.createView(parent, block.widgetDataJson)
            }
            ZoneWidgetType.WEBVIEW -> {
                val renderer = WebviewZoneRenderer(activity)
                val json = runCatching { JSONObject(jsonStr) }.getOrDefault(JSONObject())
                renderer.createView(
                    parent = parent,
                    url = json.optString("url", "https://google.com"),
                    zoomPercent = json.optInt("zoomPercent", 100)
                )
            }
            else -> null
        }
    }
}
