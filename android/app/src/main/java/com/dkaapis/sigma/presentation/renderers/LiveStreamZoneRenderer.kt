package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload

/**
 * Pure MediaMTX Single-URL Live Stream Zone Renderer for Android Player
 */
class LiveStreamZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var released = false

    @SuppressLint("UnsafeOptInUsageError")
    fun createView(parent: ViewGroup, payload: LiveStreamConfigPayload): View {
        var targetUrl = payload.effectivePlaybackUrl.ifBlank { payload.sourceUrl }
        if (targetUrl.startsWith("/")) {
            val scheme = if (ServerConfig.isTls(context)) "https" else "http"
            val host = ServerConfig.getHost(context)
            targetUrl = "$scheme://$host$targetUrl"
        }

        val player = ExoPlayer.Builder(context)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()
            .apply {
                val mediaBuilder = MediaItem.Builder().setUri(Uri.parse(targetUrl))
                if (payload.lowLatencyMode) {
                    mediaBuilder.setLiveConfiguration(
                        MediaItem.LiveConfiguration.Builder()
                            .setTargetOffsetMs(2_000L)
                            .setMaxPlaybackSpeed(1.04f)
                            .build()
                    )
                }
                setMediaItem(mediaBuilder.build())
                volume = if (payload.isMuted) 0f else 1f
                playWhenReady = true

                if (payload.autoReconnect) {
                    addListener(object : Player.Listener {
                        override fun onPlayerError(error: PlaybackException) {
                            if (released) return
                            mainHandler.postDelayed({
                                if (!released) {
                                    prepare()
                                    play()
                                }
                            }, 4_000L)
                        }
                    })
                }
                prepare()
            }

        exoPlayer = player

        return PlayerView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            useController = false
            resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            this.player = player
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
    }
}
