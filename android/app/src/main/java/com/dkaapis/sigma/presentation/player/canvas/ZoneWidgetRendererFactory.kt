package com.dkaapis.sigma.presentation.player.canvas

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import com.dkaapis.sigma.presentation.renderers.ClockZoneRenderer
import com.dkaapis.sigma.presentation.renderers.AlbumZoneRenderer
import com.dkaapis.sigma.presentation.renderers.LiveStreamZoneRenderer
import com.dkaapis.sigma.presentation.renderers.QueueZoneRenderer
import com.dkaapis.sigma.presentation.renderers.TickerZoneRenderer
import com.dkaapis.sigma.presentation.renderers.WebviewZoneRenderer
import com.dkaapis.sigma.presentation.renderers.model.AlbumSlidePayload
import org.json.JSONObject

import com.dkaapis.sigma.presentation.renderers.model.ClockConfigPayload
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload
import com.dkaapis.sigma.presentation.renderers.model.TickerConfigPayload
import com.dkaapis.sigma.presentation.renderers.model.WebviewConfigPayload

/**
 * Pabrik instansiasi renderer widget dinamis (Jam, Ticker, Queue, Webview, LiveStream)
 */
class ZoneWidgetRendererFactory {

    fun createWidgetView(
        activity: Activity,
        parent: ViewGroup,
        block: LayerBlock,
        onClockCreated: (ClockZoneRenderer) -> Unit,
        onAlbumCreated: (AlbumZoneRenderer) -> Unit,
        onLiveStreamCreated: (LiveStreamZoneRenderer) -> Unit,
        albumSlides: List<AlbumSlidePayload>,
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
            ZoneWidgetType.ALBUM -> {
                if (albumSlides.isEmpty()) return null
                val renderer = AlbumZoneRenderer(activity)
                onAlbumCreated(renderer)
                val transition = runCatching { JSONObject(jsonStr).optString("transitionEffect", "fade") }
                    .getOrDefault("fade")
                renderer.createView(parent, albumSlides, transition)
            }
            ZoneWidgetType.LIVESTREAM -> {
                val json = runCatching { JSONObject(jsonStr) }.getOrDefault(JSONObject())
                val effectiveStreamId = json.optString("id").ifBlank { block.liveStreamId.orEmpty() }
                if (effectiveStreamId.isNotBlank() && !json.has("id")) {
                    json.put("id", effectiveStreamId)
                }
                val renderer = LiveStreamZoneRenderer(activity)
                onLiveStreamCreated(renderer)
                renderer.createView(parent, LiveStreamConfigPayload.fromJson(json))
            }
            else -> null
        }
    }
}
