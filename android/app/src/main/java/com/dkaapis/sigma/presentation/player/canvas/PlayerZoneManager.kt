package com.dkaapis.sigma.presentation.player.canvas

import android.util.Log
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import com.dkaapis.sigma.presentation.player.canvas.model.ZoneRenderContextPayload
import com.dkaapis.sigma.presentation.renderers.ClockZoneRenderer
import com.dkaapis.sigma.presentation.renderers.AlbumZoneRenderer
import com.dkaapis.sigma.presentation.renderers.ImageZoneRenderer
import com.dkaapis.sigma.presentation.renderers.LiveStreamZoneRenderer
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
    private val videoRenderersByZone = mutableMapOf<String, VideoZoneRenderer>()
    private val activeVideoZoneIds = mutableSetOf<String>()
    private val clockRenderers = mutableListOf<ClockZoneRenderer>()
    private val albumRenderers = mutableListOf<AlbumZoneRenderer>()
    private val liveStreamRenderers = mutableListOf<LiveStreamZoneRenderer>()
    private var timelineJob: Job? = null
    private var playbackPaused = false

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
                    onAlbumCreated = { albumRenderers.add(it) },
                    onLiveStreamCreated = { liveStreamRenderers.add(it) },
                    albumSlides = if (widgetBlock.widgetType == ZoneWidgetType.ALBUM) {
                        mediaResolver.resolveAlbum(widgetBlock, payload.storageRepo)
                    } else {
                        emptyList()
                    },
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
                    videoRenderersByZone[zone.id] = renderer
                    val view = renderer.createPlaylistView(zoneView, videoItems, startWhenReady = false)
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

        timelineJob = timelineCoordinator.startTimeline(scope, layoutDuration, zoneViewPairs) { zoneId, isActive ->
            val renderer = videoRenderersByZone[zoneId] ?: return@startTimeline
            if (isActive) activeVideoZoneIds.add(zoneId) else activeVideoZoneIds.remove(zoneId)
            if (isActive && !playbackPaused) renderer.resume() else renderer.pause()
        }
    }

    fun setDuckedVolume(isDucked: Boolean) {
        videoRenderers.forEach { it.setDuckedVolume(isDucked) }
        liveStreamRenderers.forEach { it.setDuckedVolume(isDucked) }
    }

    fun pausePlayback() {
        playbackPaused = true
        videoRenderers.forEach { it.pause() }
        albumRenderers.forEach { it.pause() }
        liveStreamRenderers.forEach { it.pause() }
    }

    fun resumePlayback() {
        playbackPaused = false
        activeVideoZoneIds.forEach { zoneId -> videoRenderersByZone[zoneId]?.resume() }
        albumRenderers.forEach { it.resume() }
        liveStreamRenderers.forEach { it.resume() }
    }

    fun getVideoRenderers(): List<VideoZoneRenderer> = videoRenderers

    fun release() {
        timelineJob?.cancel()
        timelineJob = null
        videoRenderers.forEach { it.release() }
        videoRenderers.clear()
        videoRenderersByZone.clear()
        activeVideoZoneIds.clear()
        playbackPaused = false
        clockRenderers.forEach { it.release() }
        clockRenderers.clear()
        albumRenderers.forEach { it.release() }
        albumRenderers.clear()
        liveStreamRenderers.forEach { it.release() }
        liveStreamRenderers.clear()
    }

    companion object {
        private const val TAG = "PlayerZoneManager"
    }
}
