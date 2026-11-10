package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.content.Context
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
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil.load
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.presentation.renderers.glass.LiveStreamGlassOverlay
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload
import com.dkaapis.sigma.presentation.renderers.player.GrpcStreamDataSourceFactory
import signage.components.v1.live_stream.LiveStreamServiceGrpc

/**
 * Modern High-Performance Live Stream Zone Renderer for Android Player.
 * - Server-Hosted Streams: Streams via pure gRPC Secret Pipe (GetStreamSegment over port 50051).
 *   Eliminates all public HTTP routing, port 80 VPNKit drops, cookie/session issues, and WebRTC ICE drops.
 * - External Streams: Plays RTSP/HLS directly via ExoPlayer.
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
    @Volatile private var released = false
    private var isDucked = false
    private var isMuted = true
    private var playbackPaused = false
    @Volatile private var isStreamOffline = true
    @Volatile private var hasRenderedFirstFrame = false

    @SuppressLint("UnsafeOptInUsageError")
    fun createView(parent: ViewGroup, payload: LiveStreamConfigPayload): View {
        this.isMuted = payload.isMuted
        val container = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(0xFF0F172A.toInt())
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

        overlay.setOffline(payload.name, "Menghubungkan...")

        val isServerHosted = payload.streamMode == "SERVER_HOSTED_HLS" ||
            payload.streamId.isNotBlank() ||
            rawTarget.startsWith("/streams/")

        if (isServerHosted && payload.streamId.isNotBlank()) {
            startGrpcSecretPipePlayback(container, payload)
        } else if (targetUrl.isNotBlank()) {
            startHlsPlayback(container, targetUrl, payload)
        } else {
            overlay.setOffline(payload.name, "URL siaran tidak tersedia")
            Log.w(TAG, "Live stream has no playback URL (stream=${payload.streamId})")
        }

        container.addView(overlay)
        return container
    }

    /**
     * Secret Pipe gRPC Playback:
     * Streams HLS live chunks directly through the persistent, multiplexed
     * gRPC connection on port 50051 (GetStreamSegment).
     */
    @SuppressLint("UnsafeOptInUsageError")
    private fun startGrpcSecretPipePlayback(
        container: FrameLayout,
        payload: LiveStreamConfigPayload
    ) {
        val streamId = payload.streamId
        if (streamId.isBlank()) {
            Log.w(TAG, "No stream ID for gRPC Secret Pipe playback")
            return
        }

        try {
            val grpcChannel = GrpcChannelFactory(context).getChannel()
            val stub = LiveStreamServiceGrpc.newBlockingStub(grpcChannel)
            val grpcFactory = GrpcStreamDataSourceFactory(stub, streamId)
            val secretUri = Uri.parse("sigma-stream://$streamId/live.m3u8")

            // Ultra-smooth low latency buffer: 2.0s - 6.0s buffer window
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    /* minBufferMs = */ 2_000,
                    /* maxBufferMs = */ 6_000,
                    /* bufferForPlaybackMs = */ 500,
                    /* bufferForPlaybackAfterRebufferMs = */ 1_000
                )
                .setPrioritizeTimeOverSizeThresholds(true)
                .build()

            fun buildMediaSource(): HlsMediaSource {
                val mediaItem = MediaItem.Builder()
                    .setUri(secretUri)
                    .setMimeType(MimeTypes.APPLICATION_M3U8)
                    .setLiveConfiguration(
                        MediaItem.LiveConfiguration.Builder()
                            .setTargetOffsetMs(2_000L) // 2.0s target latency behind live edge
                            .setMinPlaybackSpeed(1.0f) // Never slow down into slow motion
                            .setMaxPlaybackSpeed(1.15f) // Gentle catch-up when buffered
                            .setMinOffsetMs(800L)
                            .setMaxOffsetMs(3_500L)
                            .build()
                    )
                    .build()

                return HlsMediaSource.Factory(grpcFactory)
                    .setAllowChunklessPreparation(true)
                    .createMediaSource(mediaItem)
            }

            val player = ExoPlayer.Builder(context)
                .setLoadControl(loadControl)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    setMediaSource(buildMediaSource())
                    volume = currentAudioVolume()
                    playWhenReady = !playbackPaused

                    addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() {
                            if (!released) {
                                hasRenderedFirstFrame = true
                                isStreamOffline = false
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
                                        glassOverlay?.setLive(isLowLatency = false)
                                    }
                                }
                                Player.STATE_ENDED, Player.STATE_IDLE -> {
                                    bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                    isStreamOffline = true
                                    glassOverlay?.setOffline(payload.name)
                                }
                            }
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            Log.w(TAG, "gRPC Secret Pipe error stream=$streamId: ${error.message} (code: ${error.errorCode})")
                            if (!released) {
                                bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                hasRenderedFirstFrame = false
                                isStreamOffline = true
                                posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()
                                glassOverlay?.setOffline(payload.name, "Siaran Offline")

                                if (payload.autoReconnect) {
                                    reconnectRunnable?.let(mainHandler::removeCallbacks)
                                    val runnable = Runnable {
                                        if (!released && exoPlayer != null) {
                                            Log.i(TAG, "Reconnecting gRPC stream=$streamId")
                                            exoPlayer?.setMediaSource(buildMediaSource(), /* resetPosition = */ true)
                                            exoPlayer?.prepare()
                                            exoPlayer?.play()
                                        }
                                    }
                                    reconnectRunnable = runnable
                                    mainHandler.postDelayed(runnable, 4_000L)
                                }
                            }
                        }
                    })

                    prepare()
                }

            exoPlayer = player

            playerView = PlayerView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                (videoSurfaceView as? android.view.SurfaceView)?.setZOrderMediaOverlay(true)
                this.player = player
            }
            container.addView(playerView)
            glassOverlay?.bringToFront()
            Log.i(TAG, "Initialized gRPC Secret Pipe LiveStream player for stream=$streamId")
        } catch (error: Exception) {
            Log.e(TAG, "Failed to initialize gRPC Secret Pipe for stream=$streamId: ${error.message}", error)
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startHlsPlayback(
        container: FrameLayout,
        targetUrl: String,
        payload: LiveStreamConfigPayload
    ) {
        if (targetUrl.isBlank()) {
            Log.w(TAG, "No HLS/RTSP playback URL for stream=${payload.streamId}")
            return
        }
        try {
            val targetUri = Uri.parse(targetUrl)
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(1_500, 8_000, 500, 1_000)
                .build()
            val player = ExoPlayer.Builder(context)
                .setLoadControl(loadControl)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    val mediaBuilder = MediaItem.Builder().setUri(targetUri)
                    val liveConfig = MediaItem.LiveConfiguration.Builder()
                        .setTargetOffsetMs(1_500L)
                        .setMinPlaybackSpeed(1.0f)
                        .setMaxPlaybackSpeed(1.15f)
                        .setMinOffsetMs(500L)
                        .setMaxOffsetMs(4_000L)
                        .build()
                    mediaBuilder.setLiveConfiguration(liveConfig)
                    setMediaItem(mediaBuilder.build())
                    volume = currentAudioVolume()
                    playWhenReady = !playbackPaused

                    addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() {
                            if (!released) {
                                hasRenderedFirstFrame = true
                                isStreamOffline = false
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
                                        glassOverlay?.setLive(isLowLatency = false)
                                    }
                                }
                                Player.STATE_ENDED, Player.STATE_IDLE -> {
                                    bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                    isStreamOffline = true
                                    glassOverlay?.setOffline(payload.name)
                                }
                            }
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            Log.w(TAG, "HLS/RTSP playback error stream=${payload.streamId}: ${error.message} (code: ${error.errorCode})")
                            if (!released) {
                                bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                hasRenderedFirstFrame = false
                                isStreamOffline = true
                                posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()
                                glassOverlay?.setOffline(payload.name, "Siaran Offline")

                                if (payload.autoReconnect) {
                                    reconnectRunnable?.let(mainHandler::removeCallbacks)
                                    val runnable = Runnable {
                                        if (!released && exoPlayer != null) {
                                            Log.i(TAG, "Reconnecting stream=${payload.streamId}")
                                            exoPlayer?.seekToDefaultPosition()
                                            exoPlayer?.prepare()
                                            exoPlayer?.play()
                                        }
                                    }
                                    reconnectRunnable = runnable
                                    mainHandler.postDelayed(runnable, 4_000L)
                                }
                            }
                        }
                    })

                    prepare()
                }
            exoPlayer = player

            playerView = PlayerView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                (videoSurfaceView as? android.view.SurfaceView)?.setZOrderMediaOverlay(true)
                this.player = player
            }
            container.addView(playerView)
            glassOverlay?.bringToFront()
        } catch (error: Exception) {
            Log.e(TAG, "Failed to initialize ExoPlayer for stream=${payload.streamId}: ${error.message}", error)
        }
    }

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
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        mainHandler.removeCallbacksAndMessages(null)
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
        posterView = null
        glassOverlay?.hideAll()
        glassOverlay = null
    }

    companion object {
        private const val TAG = "LiveStreamZoneRenderer"
    }
}
