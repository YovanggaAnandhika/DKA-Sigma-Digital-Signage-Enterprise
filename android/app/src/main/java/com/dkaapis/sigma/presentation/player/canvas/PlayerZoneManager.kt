package com.dkaapis.sigma.presentation.player.canvas

import android.util.Log
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import com.dkaapis.sigma.presentation.player.canvas.model.ZoneRenderContextPayload
import com.dkaapis.sigma.presentation.renderers.ClockZoneRenderer
import com.dkaapis.sigma.presentation.renderers.ImageZoneRenderer
import com.dkaapis.sigma.presentation.renderers.VideoZoneRenderer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job

/**
 * Orkestrator Zona & Canvas Layout untuk Signage Player:
 * Mengkoordinasikan pembuatan view per zona, rendering media/widget,
 * linimasa playback, dan rilis sumber daya grafis.
 */
class PlayerZoneManager {

    private val mediaResolver = ZoneMediaResolver()
    private val widgetFactory = ZoneWidgetRendererFactory()
    private val timelineCoordinator = SignageTimelineCoordinator()

    private val videoRenderers = mutableListOf<VideoZoneRenderer>()
    private val clockRenderers = mutableListOf<ClockZoneRenderer>()
    private var timelineJob: Job? = null

    fun renderManifest(
        scope: CoroutineScope,
        payload: ZoneRenderContextPayload
    ) {
        val manifest = payload.manifest
        val canvasLayout = payload.canvasLayout
        val activity = payload.activity

        Log.i(TAG, "renderManifest: layout=${manifest.layoutName}, zones=${manifest.zones.size}, assets=${manifest.requiredAssets.size}")
        release()
        canvasLayout.removeAllViews()

        canvasLayout.virtualWidth = manifest.canvasWidth
        canvasLayout.virtualHeight = manifest.canvasHeight

        val zoneViewPairs = mutableListOf<Pair<LayerZone, ZoneContainerView>>()
        val initialScaleX = canvasLayout.virtualWidth.takeIf { it > 0 }?.let {
            activity.resources.displayMetrics.widthPixels.toFloat() / it
        } ?: 1.0f
        val initialScaleY = canvasLayout.virtualHeight.takeIf { it > 0 }?.let {
            activity.resources.displayMetrics.heightPixels.toFloat() / it
        } ?: 1.0f

        for (zone in manifest.zones) {
            val zoneView = ZoneContainerView(activity).apply {
                this.scaleFactorX = initialScaleX
                this.scaleFactorY = initialScaleY
                bindZone(zone)
            }
            zoneViewPairs.add(Pair(zone, zoneView))

            val widgetBlock = zone.blocks.find { it.widgetType != ZoneWidgetType.NONE }
            if (widgetBlock != null) {
                val widgetView = widgetFactory.createWidgetView(
                    activity = activity,
                    parent = zoneView,
                    block = widgetBlock,
                    onClockCreated = { clockRenderers.add(it) },
                    onQueueCreated = payload.onQueueReady,
                    onDuckingChanged = payload.onDuckingChanged,
                    onQueueTapNext = payload.onQueueTapNext
                )
                widgetView?.let { zoneView.addView(it) }
            } else {
                val (videoItems, firstImageFile) = mediaResolver.resolveMedia(zone, manifest, payload.storageRepo)
                if (videoItems.isNotEmpty()) {
                    val renderer = VideoZoneRenderer(activity, zone.name.ifEmpty { "Zone ${videoRenderers.size + 1}" })
                    videoRenderers.add(renderer)
                    val view = renderer.createPlaylistView(zoneView, videoItems)
                    zoneView.addView(view)
                } else if (firstImageFile != null) {
                    val renderer = ImageZoneRenderer(activity)
                    val view = renderer.createView(zoneView, firstImageFile)
                    zoneView.addView(view)
                }
            }

            canvasLayout.addView(zoneView)
        }

        val layoutDuration = manifest.zones.flatMap { it.blocks }.maxOfOrNull {
            it.startTimeSeconds + it.durationSeconds
        }?.coerceAtLeast(1) ?: 10

        timelineJob = timelineCoordinator.startTimeline(scope, layoutDuration, zoneViewPairs)
    }

    fun setDuckedVolume(isDucked: Boolean) {
        videoRenderers.forEach { it.setDuckedVolume(isDucked) }
    }

    fun getVideoRenderers(): List<VideoZoneRenderer> = videoRenderers

    fun release() {
        timelineJob?.cancel()
        timelineJob = null
        videoRenderers.forEach { it.release() }
        videoRenderers.clear()
        clockRenderers.forEach { it.release() }
        clockRenderers.clear()
    }

    companion object {
        private const val TAG = "PlayerZoneManager"
    }
}
