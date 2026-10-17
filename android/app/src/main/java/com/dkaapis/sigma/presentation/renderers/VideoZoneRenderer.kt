package com.dkasigma.player.presentation.renderers

import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import java.io.File

class VideoZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null

    fun createView(parent: ViewGroup, videoFile: File, isMuted: Boolean = false): PlayerView {
        val player = ExoPlayer.Builder(context).build().apply {
            repeatMode = Player.REPEAT_MODE_ALL
            volume = if (isMuted) 0f else 1.0f
            val item = MediaItem.fromUri(Uri.fromFile(videoFile))
            setMediaItem(item)
            prepare()
            playWhenReady = true
        }
        exoPlayer = player

        val view = PlayerView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            useController = false
            this.player = player
        }
        playerView = view
        return view
    }

    fun setDuckedVolume(duck: Boolean) {
        exoPlayer?.volume = if (duck) 0.15f else 1.0f
    }

    fun release() {
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
    }
}
