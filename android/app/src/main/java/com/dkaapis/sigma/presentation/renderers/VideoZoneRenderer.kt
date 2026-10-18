package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.dkaapis.sigma.data.analytics.AssetStatsData
import java.io.File

data class VideoPlaylistItem(
    val file: File,
    val durationSeconds: Int = 0,
    val isMuted: Boolean = false,
    val mediaId: String = "",
    val mediaName: String = ""
)

class VideoZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var isDucked: Boolean = false
    private var currentItemMuted: Boolean = false
    private var playlistItems: List<VideoPlaylistItem> = emptyList()

    fun createView(parent: ViewGroup, videoFile: File, isMuted: Boolean = false): PlayerView {
        return createPlaylistView(parent, listOf(VideoPlaylistItem(videoFile, 0, isMuted)))
    }

    fun createPlaylistView(parent: ViewGroup, playlist: List<VideoPlaylistItem>): PlayerView {
        this.playlistItems = playlist
        val player = ExoPlayer.Builder(context).build().apply {
            repeatMode = Player.REPEAT_MODE_ALL

            for (item in playlist) {
                val itemUri = Uri.fromFile(item.file)
                val mediaItemBuilder = MediaItem.Builder()
                    .setUri(itemUri)
                    .setMimeType(androidx.media3.common.MimeTypes.VIDEO_MP4)

                if (item.durationSeconds > 0) {
                    mediaItemBuilder.setClippingConfiguration(
                        MediaItem.ClippingConfiguration.Builder()
                            .setEndPositionMs(item.durationSeconds * 1000L)
                            .build()
                    )
                }
                addMediaItem(mediaItemBuilder.build())
            }

            val firstMuted = playlist.firstOrNull()?.isMuted ?: false
            currentItemMuted = firstMuted
            volume = if (firstMuted) 0f else (if (isDucked) 0.15f else 1.0f)

            addListener(object : Player.Listener {
                override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                    val idx = currentMediaItemIndex
                    if (idx in playlist.indices) {
                        val current = playlist[idx]
                        currentItemMuted = current.isMuted
                        volume = if (current.isMuted) 0f else (if (isDucked) 0.15f else 1.0f)
                        android.util.Log.i("VideoZoneRenderer", "Track transitioned to item $idx: ${current.file.name}, isMuted=${current.isMuted}")
                    }
                }

                override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                    android.util.Log.e("VideoZoneRenderer", "Playback error in playlist: ${error.message}", error)
                }

                override fun onPlaybackStateChanged(playbackState: Int) {
                    android.util.Log.i("VideoZoneRenderer", "Playback state: $playbackState (READY=3, ENDED=4)")
                }
            })

            prepare()
            playWhenReady = true
        }
        exoPlayer = player

        val inflater = android.view.LayoutInflater.from(context)
        val view = (inflater.inflate(com.dkaapis.sigma.R.layout.item_video_player, parent, false) as PlayerView).apply {
            this.player = player
        }
        playerView = view
        return view
    }

    fun getCurrentPlaybackStats(): AssetStatsData? {
        val player = exoPlayer ?: return null
        val idx = player.currentMediaItemIndex
        val item = playlistItems.getOrNull(idx)
        val format = player.videoFormat
        val decoderCounters = player.videoDecoderCounters
        val dropped = decoderCounters?.droppedBufferCount ?: 0
        val rendered = decoderCounters?.renderedOutputBufferCount ?: 0
        val total = dropped + rendered

        val codecStr = format?.sampleMimeType ?: "video/mp4"
        val resStr = if (format != null && format.width > 0 && format.height > 0) "${format.width}x${format.height}" else "1920x1080"
        val bitrate = if (format != null && format.bitrate > 0) format.bitrate / 1000 else 4500

        val dropRatePercent = if (total > 0) (dropped.toFloat() / total.toFloat()) * 100f else 0f
        val flag = if (dropped > 25 || dropRatePercent > 2.0f) "BOTTLENECK_DETECTED" else "OPTIMAL"
        val note = if (dropped > 25 || dropRatePercent > 2.0f) {
            "Terdeteksi $dropped frame drop (${String.format(java.util.Locale.US, "%.1f", dropRatePercent)}%). Bitrate atau resolusi video membebani decoder."
        } else {
            "Pemutaran optimal ($resStr, $codecStr). Dropped frame aman."
        }

        return AssetStatsData(
            mediaId = item?.mediaId.takeIf { !it.isNullOrBlank() } ?: item?.file?.name ?: "",
            mediaName = item?.mediaName.takeIf { !it.isNullOrBlank() } ?: item?.file?.name ?: "Video Media",
            mimeType = codecStr,
            codec = format?.codecs ?: codecStr,
            resolution = resStr,
            bitrateKbps = bitrate,
            decoderName = "Hardware MediaCodec",
            isHardwareAccelerated = true,
            droppedFrames = dropped,
            totalFrames = total,
            droppedFrameRatePercent = String.format(java.util.Locale.US, "%.2f", dropRatePercent).toFloat(),
            playbackStatus = if (player.isPlaying) "PLAYING" else "BUFFERING",
            diagnosticFlag = flag,
            diagnosticNote = note
        )
    }

    fun setDuckedVolume(duck: Boolean) {
        isDucked = duck
        if (currentItemMuted) {
            exoPlayer?.volume = 0f
        } else {
            exoPlayer?.volume = if (duck) 0.15f else 1.0f
        }
    }

    fun release() {
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
    }
}
