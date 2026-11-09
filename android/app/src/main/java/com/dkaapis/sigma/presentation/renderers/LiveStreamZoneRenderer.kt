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
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil.load
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload

/**
 * Pure MediaMTX Single-URL Live Stream Zone Renderer for Android Player.
 * Mendukung HLS (.m3u8), RTSP, dan fallback poster gambar saat siaran nonaktif/buffering.
 */
class LiveStreamZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var posterView: ImageView? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var released = false
    private var isDucked = false
    private var isMuted = true

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

        // Jika siaran dinonaktifkan di CMS atau URL target kosong, tampilkan poster saja
        if (!payload.isRelayActive || targetUrl.isBlank()) {
            Log.i(TAG, "LiveStream inactive or empty targetUrl (active=${payload.isRelayActive}, url='$targetUrl')")
            return container
        }

        try {
            val targetUri = Uri.parse(targetUrl)
            val player = ExoPlayer.Builder(context)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    val mediaBuilder = MediaItem.Builder().setUri(targetUri)
                    if (payload.lowLatencyMode) {
                        mediaBuilder.setLiveConfiguration(
                            MediaItem.LiveConfiguration.Builder()
                                .setTargetOffsetMs(2_000L)
                                .setMaxPlaybackSpeed(1.04f)
                                .build()
                        )
                    }
                    setMediaItem(mediaBuilder.build())
                    volume = if (isMuted) 0f else if (isDucked) 0.15f else 1f
                    playWhenReady = true

                    addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() {
                            if (!released) {
                                posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                            }
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            Log.w(TAG, "LiveStream playback error: ${error.message} (code: ${error.errorCode})")
                            if (released) return
                            posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()

                            if (payload.autoReconnect) {
                                mainHandler.removeCallbacksAndMessages(null)
                                mainHandler.postDelayed({
                                    if (!released && exoPlayer != null) {
                                        Log.i(TAG, "Reconnecting live stream: $targetUrl")
                                        exoPlayer?.prepare()
                                        exoPlayer?.play()
                                    }
                                }, 4_000L)
                            }
                        }
                    })

                    prepare()
                }

            exoPlayer = player

            val pv = PlayerView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                this.player = player
            }
            playerView = pv
            container.addView(pv)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize ExoPlayer for live stream: ${e.message}", e)
        }

        return container
    }

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
        exoPlayer?.let { p ->
            p.volume = if (isMuted) 0f else if (isDucked) 0.15f else 1f
        }
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun resume() {
        exoPlayer?.play()
    }

    fun release() {
        released = true
        mainHandler.removeCallbacksAndMessages(null)
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
        posterView = null
    }

    companion object {
        private const val TAG = "LiveStreamZoneRenderer"
    }
}
