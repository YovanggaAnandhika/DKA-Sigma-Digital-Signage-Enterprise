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

import com.dkaapis.sigma.presentation.renderers.model.ClockConfigPayload
import com.dkaapis.sigma.presentation.renderers.model.TickerConfigPayload
import com.dkaapis.sigma.presentation.renderers.model.WebviewConfigPayload

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
                renderer.createView(parent, ClockConfigPayload.fromJson(json))
            }
            ZoneWidgetType.TICKER -> {
                val json = runCatching { JSONObject(jsonStr) }.getOrDefault(JSONObject())
                TickerZoneRenderer(activity).createView(parent, TickerConfigPayload.fromJson(json))
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
                val json = runCatching { JSONObject(jsonStr) }.getOrDefault(JSONObject())
                WebviewZoneRenderer(activity).createView(parent, WebviewConfigPayload.fromJson(json))
            }
            else -> null
        }
    }
}
