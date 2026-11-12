package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.content.Context
import signage.distribution.v1.stream.StreamCommon
import android.graphics.Color
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultLivePlaybackSpeedControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.rtsp.RtspMediaSource
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil.load
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.presentation.renderers.glass.LiveStreamGlassOverlay
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload
import com.dkaapis.sigma.presentation.util.DeviceCapabilityHelper

/**
 * Modern High-Performance Live Stream Zone Renderer for Android Player.
 * - Server-Hosted Streams: raw RTSP (TCP interleaved) from MediaMTX via ExoPlayer RtspMediaSource.
 * - External Streams: Plays RTSP/HLS URL directly via ExoPlayer.
 * - Full Anti-Flapping State Machine & Zero-Copy Hardware Overlay rendering.
 */
class LiveStreamZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var posterView: ImageView? = null
    private var glassOverlay: LiveStreamGlassOverlay? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var reconnectRunnable: Runnable? = null
    private var bufferingDebounceRunnable: Runnable? = null
    private var qualityMonitorRunnable: Runnable? = null
    @Volatile private var released = false
    @Volatile private var useRtpTcp = false
    private var isDucked = false
    private var isMuted = true
    private var playbackPaused = false
    @Volatile private var isStreamOffline = true
    @Volatile private var hasRenderedFirstFrame = false
    private var activePlaybackUrl: String = ""
    private var streamId: String = ""
    private var streamName: String = ""
    private var activePayload: LiveStreamConfigPayload? = null
    private var isAdaptiveServerStream = false
    private var currentQualityProfile = LiveStreamProfile.SOURCE
    private var maximumQualityProfile = LiveStreamProfile.SOURCE
    private var lastDroppedFrameCount = -1
    private var lastRenderedFrameCount = -1
    private var poorQualityWindows = 0
    private var stableQualityWindows = 0
    private var bufferingEvents = 0
    @Volatile private var lastError: String = ""

    /** Status untuk panel realtime CMS (dibaca dari thread lain; semua field @Volatile/immutable). */
    @SuppressLint("UnsafeOptInUsageError")
    fun diagnostics(): StreamCommon.ZoneDiagnostics {
        val format = exoPlayer?.videoFormat
        val state = when {
            released -> "IDLE"
            isStreamOffline -> if (lastError.isNotEmpty()) "ERROR" else "OFFLINE"
            exoPlayer?.isPlaying == true -> "PLAYING"
            else -> "BUFFERING"
        }
        val playbackState = when (exoPlayer?.playbackState) {
            Player.STATE_IDLE -> "IDLE"
            Player.STATE_BUFFERING -> "BUFFERING"
            Player.STATE_READY -> if (exoPlayer?.isPlaying == true) "PLAYING" else "READY"
            Player.STATE_ENDED -> "ENDED"
            else -> "UNKNOWN"
        }
        return StreamCommon.ZoneDiagnostics.newBuilder()
            .setZoneId(streamId).setMediaId(streamId).setKind("LIVE").setMediaName(streamName)
            .setState(state).setTransport(
                if (activePlaybackUrl.startsWith("rtsp")) {
                    if (useRtpTcp) "RTSP/TCP" else "RTSP/UDP"
                } else {
                    "HLS"
                }
            )
            .setCodec(format?.sampleMimeType.orEmpty())
            .setResolution(if (format != null && format.width > 0) "${format.width}x${format.height}" else "")
            .setBitrateKbps(if (format != null && format.bitrate > 0) format.bitrate / 1000 else 0)
            .setDroppedFrames(exoPlayer?.videoDecoderCounters?.droppedBufferCount ?: 0)
            .setLastError(lastError)
            .setBufferedDurationMs(exoPlayer?.totalBufferedDuration?.coerceAtLeast(0L) ?: 0L)
            .setPlaybackState(playbackState)
            .build()
    }

    @SuppressLint("UnsafeOptInUsageError")
    fun createView(parent: ViewGroup, payload: LiveStreamConfigPayload): View {
        this.isMuted = payload.isMuted
        this.streamId = payload.streamId
        this.streamName = payload.name
        this.activePayload = payload
        this.useRtpTcp = false
        val container = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.TRANSPARENT)
        }

        val resolvedPosterUrl = resolveUrl(payload.posterImageUrl)
        val poster = ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.CENTER_CROP
            if (resolvedPosterUrl.isNotBlank()) {
                load(resolvedPosterUrl) {
                    crossfade(300)
                }
            }
        }
        posterView = poster
        container.addView(poster)

        val rawTarget = payload.effectivePlaybackUrl.ifBlank { payload.sourceUrl }
        val targetUrl = resolveUrl(rawTarget)

        val overlay = LiveStreamGlassOverlay(context)
        glassOverlay = overlay

        if (!payload.isRelayActive) {
            overlay.setIdle(payload.name)
            container.addView(overlay)
            Log.i(TAG, "Live stream relay is inactive (stream=${payload.streamId})")
            return container
        }

        overlay.setBuffering(payload.name)

        val isServerHosted = payload.streamMode == "SERVER_HOSTED_HLS" ||
            payload.streamId.isNotBlank() ||
            rawTarget.startsWith("/streams/")

        // Invariant:
        // Hardware adaptation matrix:
        // - Low-spec devices (Xiaomi TV, Polytron TV, 1GB RAM) with 720p displays:
        //   Use `hd/live/<streamId>` (30 fps, scaled <= 720p, Constrained Baseline H.264, 0 B-frames, separate AAC audio).
        // - High-end devices (Poco X5, Android Smartboard):
        //   Use direct raw `live/<streamId>` (native 1080p, ultra-low latency).
        val isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
        val initialProfile = if (isLowSpec) LiveStreamProfile.HD else LiveStreamProfile.SOURCE
        isAdaptiveServerStream = isServerHosted && payload.streamId.isNotBlank()
        currentQualityProfile = initialProfile
        maximumQualityProfile = initialProfile
        val playbackUrl = if (isAdaptiveServerStream) {
            serverPlaybackUrl(initialProfile)
        } else {
            targetUrl
        }

        if (playbackUrl.isNotBlank()) {
            startPlayback(container, playbackUrl, payload)
        } else {
            overlay.setOffline(payload.name, "URL siaran tidak tersedia")
            Log.w(TAG, "Live stream has no playback URL (stream=${payload.streamId})")
        }

        container.addView(overlay)
        return container
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startPlayback(
        container: FrameLayout,
        targetUrl: String,
        payload: LiveStreamConfigPayload
    ) {
        if (targetUrl.isBlank()) {
            Log.w(TAG, "No HLS/RTSP playback URL for stream=${payload.streamId}")
            return
        }
        this.activePlaybackUrl = targetUrl
        try {
            val targetUri = Uri.parse(targetUrl)
            val isRtsp = targetUri.scheme.equals("rtsp", ignoreCase = true)
            val isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
            val targetBufferBytes = if (isLowSpec) 6 * 1024 * 1024 else 24 * 1024 * 1024
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    /* minBufferMs = */ if (isRtsp) (if (isLowSpec) 750 else 800) else 1_500,
                    /* maxBufferMs = */ if (isRtsp) (if (isLowSpec) 2_000 else 2_500) else 4_000,
                    /* bufferForPlaybackMs = */ if (isRtsp) (if (isLowSpec) 350 else 200) else 300,
                    /* bufferForPlaybackAfterRebufferMs = */ if (isRtsp) (if (isLowSpec) 500 else 350) else 600
                )
                .setTargetBufferBytes(targetBufferBytes)
                .setBackBuffer(0, false)
                .setPrioritizeTimeOverSizeThresholds(true)
                .build()

            val renderersFactory = DefaultRenderersFactory(context).apply {
                setEnableDecoderFallback(true)
                setExtensionRendererMode(
                    if (isLowSpec) DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF
                    else DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON
                )
            }

            val player = ExoPlayer.Builder(context, renderersFactory)
                .setLoadControl(loadControl)
                .setLivePlaybackSpeedControl(
                    DefaultLivePlaybackSpeedControl.Builder()
                        .setFallbackMinPlaybackSpeed(0.97f)
                        .setFallbackMaxPlaybackSpeed(1.03f)
                        .build()
                )
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    videoScalingMode = C.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING
                    val mediaItem = MediaItem.Builder()
                        .setUri(targetUri)
                        .setLiveConfiguration(liveConfiguration(isRtsp, isLowSpec))
                        .build()

                    if (isRtsp) {
                        // Prefer UDP media; playback errors retry with TCP interleaved.
                        setMediaSource(createRtspMediaSource(mediaItem))
                    } else {
                        setMediaItem(mediaItem)
                    }
                    volume = currentAudioVolume()
                    playWhenReady = !playbackPaused

                    addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() {
                            if (!released) {
                                hasRenderedFirstFrame = true
                                lastError = ""
                                isStreamOffline = false
                                startQualityMonitoring()
                                reconnectRunnable?.let(mainHandler::removeCallbacks)
                                bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                                glassOverlay?.setLive(isLowLatency = false)
                            }
                        }

                        override fun onPlaybackStateChanged(playbackState: Int) {
                            if (released) return
                            when (playbackState) {
                                Player.STATE_BUFFERING -> {
                                    if (!isStreamOffline) {
                                        if (!hasRenderedFirstFrame) {
                                            glassOverlay?.setBuffering(payload.name)
                                        } else {
                                            if (isAdaptiveServerStream) bufferingEvents++
                                            // Anti-flicker debouncing: ignore transient segment fetches < 1200ms
                                            bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                            val debounceTask = Runnable {
                                                if (!released && !isStreamOffline) {
                                                    glassOverlay?.setBuffering(payload.name)
                                                }
                                            }
                                            bufferingDebounceRunnable = debounceTask
                                            mainHandler.postDelayed(debounceTask, 1_200L)
                                        }
                                    }
                                }
                                Player.STATE_READY -> {
                                    bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                    if (isPlaying) {
                                        isStreamOffline = false
                                        reconnectRunnable?.let(mainHandler::removeCallbacks)
                                        glassOverlay?.setLive(isLowLatency = false)
                                    }
                                }
                                Player.STATE_ENDED, Player.STATE_IDLE -> {
                                    bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                    isStreamOffline = true
                                    glassOverlay?.setOffline(payload.name)
                                    scheduleReconnect(payload, delayMs = 2_000L)
                                }
                            }
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            Log.w(TAG, "HLS/RTSP playback error stream=${payload.streamId}: ${error.message} (code: ${error.errorCode})")
                            lastError = "${error.errorCodeName} (${error.errorCode})"
                            if (!released) {
                                bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                hasRenderedFirstFrame = false
                                isStreamOffline = true
                                if (activePlaybackUrl.startsWith("rtsp://") && !useRtpTcp) {
                                    useRtpTcp = true
                                    Log.i(TAG, "UDP playback failed; retrying over RTSP/TCP for stream=${payload.streamId}")
                                } else if (isAdaptiveServerStream) {
                                    currentQualityProfile.lowerQuality()?.let(::selectQualityProfile)
                                } else if (activePlaybackUrl.contains("/live/") && !activePlaybackUrl.contains("/hd/live/")) {
                                    activePlaybackUrl = activePlaybackUrl.replace("/live/", "/hd/live/")
                                } else if (activePlaybackUrl.contains("/hd/live/")) {
                                    activePlaybackUrl = activePlaybackUrl.replace("/hd/live/", "/live/")
                                }
                                posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()
                                glassOverlay?.setOffline(payload.name, "Menunggu siaran dimulai dari OBS Studio / encoder.")
                                scheduleReconnect(payload, delayMs = 2_000L)
                            }
                        }
                    })

                    prepare()
                }
            exoPlayer = player

            playerView = (android.view.LayoutInflater.from(context)
                .inflate(com.dkaapis.sigma.R.layout.item_video_player, container, false) as PlayerView).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FILL
                (videoSurfaceView as? android.view.SurfaceView)?.setZOrderMediaOverlay(true)
                this.player = player
            }
            container.addView(playerView)
            glassOverlay?.bringToFront()
        } catch (error: Exception) {
            Log.e(TAG, "Failed to initialize ExoPlayer for stream=${payload.streamId}: ${error.message}", error)
        }
    }

    private fun scheduleReconnect(payload: LiveStreamConfigPayload, delayMs: Long = 3_000L) {
        if (released || !payload.autoReconnect) return
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        val runnable = Runnable {
            if (!released && exoPlayer != null && isStreamOffline) {
                Log.i(TAG, "Attempting reconnect for stream=${payload.streamId} on $activePlaybackUrl")
                try {
                    val targetUri = Uri.parse(activePlaybackUrl)
                    val isRtsp = targetUri.scheme.equals("rtsp", ignoreCase = true)
                    val isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
                    val mediaItem = MediaItem.Builder()
                        .setUri(targetUri)
                        .setLiveConfiguration(liveConfiguration(isRtsp, isLowSpec))
                        .build()
                    if (isRtsp) {
                        // Re-create RtspMediaSource with clean socket state
                        exoPlayer?.setMediaSource(createRtspMediaSource(mediaItem))
                    } else {
                        exoPlayer?.seekToDefaultPosition()
                    }
                    exoPlayer?.prepare()
                    exoPlayer?.play()
                } catch (e: Exception) {
                    Log.w(TAG, "Reconnect attempt error: ${e.message}")
                }
                // Keep polling every 3.5s until stream is back online
                scheduleReconnect(payload, delayMs = 3_500L)
            }
        }
        reconnectRunnable = runnable
        mainHandler.postDelayed(runnable, delayMs)
    }

    private fun serverPlaybackUrl(profile: LiveStreamProfile): String =
        "rtsp://${ServerConfig.getHost(context)}:$RTSP_PORT/${profile.path}/$streamId"

    private fun selectQualityProfile(profile: LiveStreamProfile) {
        currentQualityProfile = profile
        activePlaybackUrl = serverPlaybackUrl(profile)
        resetQualityWindow()
    }

    private fun switchQualityProfile(profile: LiveStreamProfile, payload: LiveStreamConfigPayload) {
        selectQualityProfile(profile)
        val player = exoPlayer ?: return
        val targetUri = Uri.parse(activePlaybackUrl)
        val mediaItem = MediaItem.Builder()
            .setUri(targetUri)
            .setLiveConfiguration(
                liveConfiguration(
                    isRtsp = true,
                    isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
                )
            )
            .build()

        Log.i(TAG, "Adaptive quality changed to ${profile.name} for stream=$streamId")
        isStreamOffline = false
        hasRenderedFirstFrame = false
        glassOverlay?.setBuffering(payload.name)
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        try {
            player.setMediaSource(createRtspMediaSource(mediaItem))
            player.prepare()
            if (!playbackPaused) player.play()
        } catch (error: Exception) {
            Log.w(TAG, "Unable to switch stream quality: ${error.message}", error)
            lastError = error.message.orEmpty()
            isStreamOffline = true
            scheduleReconnect(payload, delayMs = 2_000L)
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startQualityMonitoring() {
        if (!isAdaptiveServerStream) return
        samplePlaybackQuality()
        if (qualityMonitorRunnable != null) return
        val task = object : Runnable {
            override fun run() {
                if (released || !isAdaptiveServerStream) {
                    qualityMonitorRunnable = null
                    return
                }
                samplePlaybackQuality()
                mainHandler.postDelayed(this, QUALITY_SAMPLE_INTERVAL_MS)
            }
        }
        qualityMonitorRunnable = task
        mainHandler.postDelayed(task, QUALITY_SAMPLE_INTERVAL_MS)
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun samplePlaybackQuality() {
        val player = exoPlayer ?: return
        if (playbackPaused || isStreamOffline || !hasRenderedFirstFrame) {
            resetQualityWindow()
            return
        }
        val counters = player.videoDecoderCounters ?: return
        counters.ensureUpdated()
        val dropped = counters.droppedBufferCount
        val rendered = counters.renderedOutputBufferCount
        if (lastDroppedFrameCount < 0 || lastRenderedFrameCount < 0) {
            lastDroppedFrameCount = dropped
            lastRenderedFrameCount = rendered
            bufferingEvents = 0
            return
        }

        val window = LiveStreamQualityWindow(
            droppedFrames = (dropped - lastDroppedFrameCount).coerceAtLeast(0),
            renderedFrames = (rendered - lastRenderedFrameCount).coerceAtLeast(0),
            bufferingEvents = bufferingEvents
        )
        lastDroppedFrameCount = dropped
        lastRenderedFrameCount = rendered
        bufferingEvents = 0

        if (window.isPoor()) {
            poorQualityWindows++
            stableQualityWindows = 0
            val nextProfile = currentQualityProfile.lowerQuality()
            if (nextProfile != null && (window.isSevere() || poorQualityWindows >= POOR_WINDOWS_BEFORE_DOWNGRADE)) {
                poorQualityWindows = 0
                switchQualityProfile(nextProfile, activePayload ?: return)
            }
        } else if (window.isStable()) {
            stableQualityWindows++
            poorQualityWindows = 0
            val nextProfile = currentQualityProfile.higherQuality(maximumQualityProfile)
            if (nextProfile != null && stableQualityWindows >= STABLE_WINDOWS_BEFORE_UPGRADE) {
                stableQualityWindows = 0
                switchQualityProfile(nextProfile, activePayload ?: return)
            }
        } else {
            resetQualityWindow()
        }
    }

    private fun resetQualityWindow() {
        lastDroppedFrameCount = -1
        lastRenderedFrameCount = -1
        poorQualityWindows = 0
        stableQualityWindows = 0
        bufferingEvents = 0
    }

    private fun createRtspMediaSource(mediaItem: MediaItem) =
        RtspMediaSource.Factory()
            .setForceUseRtpTcp(useRtpTcp)
            .setTimeoutMs(8_000L)
            .createMediaSource(mediaItem)

    private fun liveConfiguration(isRtsp: Boolean, isLowSpec: Boolean) =
        MediaItem.LiveConfiguration.Builder()
            .setTargetOffsetMs(if (isRtsp) (if (isLowSpec) 500L else 50L) else 1_500L)
            .setMinPlaybackSpeed(if (isRtsp && isLowSpec) 0.97f else 1.0f)
            .setMaxPlaybackSpeed(if (isRtsp && isLowSpec) 1.03f else if (isRtsp) 1.25f else 1.15f)
            .build()

    private fun currentAudioVolume(): Float =
        if (isMuted) 0f else if (isDucked) 0.15f else 1f

    private fun resolveUrl(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isBlank()) return ""
        if (trimmed.startsWith("/")) {
            val scheme = if (ServerConfig.isTls(context)) "https" else "http"
            val host = ServerConfig.getHost(context)
            return "$scheme://$host$trimmed"
        }
        return trimmed
    }

    fun setDuckedVolume(ducked: Boolean) {
        this.isDucked = ducked
        exoPlayer?.volume = currentAudioVolume()
    }

    fun pause() {
        playbackPaused = true
        exoPlayer?.pause()
    }

    fun resume() {
        playbackPaused = false
        exoPlayer?.play()
    }

    fun release() {
        released = true
        bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
        bufferingDebounceRunnable = null
        qualityMonitorRunnable?.let(mainHandler::removeCallbacks)
        qualityMonitorRunnable = null
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        reconnectRunnable = null
        mainHandler.removeCallbacksAndMessages(null)
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
        posterView = null
        glassOverlay?.hideAll()
        glassOverlay = null
        activePayload = null
    }

    companion object {
        private const val TAG = "LiveStreamZoneRenderer"
        private const val RTSP_PORT = 8554
        private const val QUALITY_SAMPLE_INTERVAL_MS = 10_000L
        private const val POOR_WINDOWS_BEFORE_DOWNGRADE = 2
        private const val STABLE_WINDOWS_BEFORE_UPGRADE = 6
    }
}
