package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.dkaapis.sigma.data.analytics.AssetStatsData
import com.dkaapis.sigma.presentation.renderers.model.VideoPlaylistItem
import java.io.File

class VideoZoneRenderer(
    private val context: Context,
    val zoneName: String = ""
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var isDucked: Boolean = false
    private var currentItemMuted: Boolean = false
    private var playlistItems: List<VideoPlaylistItem> = emptyList()

    var onPlaybackCompleted: ((mediaId: String, durationSeconds: Int) -> Unit)? = null
    private var lastTrackIndex: Int = -1
    private var currentTrackStartTimeMs: Long = 0L

    fun createView(parent: ViewGroup, videoFile: File, isMuted: Boolean = false, volumeLevel: Int = 100): PlayerView {
        return createPlaylistView(parent, listOf(VideoPlaylistItem(videoFile, 0, isMuted, volumeLevel = volumeLevel)))
    }

    fun createPlaylistView(parent: ViewGroup, playlist: List<VideoPlaylistItem>): PlayerView {
        this.playlistItems = playlist

        // Optimized load control: 2.5s min buffer, 6s max buffer (local offline files don't need 50s RAM buffer)
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                /* minBufferMs = */ 2_500,
                /* maxBufferMs = */ 6_000,
                /* bufferForPlaybackMs = */ 500,
                /* bufferForPlaybackAfterRebufferMs = */ 1_000
            )
            .setPrioritizeTimeOverSizeThresholds(true)
            .build()

        val player = ExoPlayer.Builder(context)
            .setLoadControl(loadControl)
            .build()
            .apply {
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

            val firstItem = playlist.firstOrNull()
            val firstMuted = firstItem?.isMuted ?: false
            val firstBaseVol = (firstItem?.volumeLevel ?: 100).coerceIn(0, 100) / 100f
            currentItemMuted = firstMuted
            volume = if (firstMuted) 0f else (if (isDucked) 0f else firstBaseVol)
            lastTrackIndex = 0
            currentTrackStartTimeMs = System.currentTimeMillis()

            addListener(object : Player.Listener {
                override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                    val prevIdx = lastTrackIndex
                    val now = System.currentTimeMillis()
                    if (prevIdx in playlist.indices && currentTrackStartTimeMs > 0L) {
                        val prevItem = playlist[prevIdx]
                        val playedSec = ((now - currentTrackStartTimeMs) / 1000).toInt()
                        if (playedSec >= 1 && prevItem.mediaId.isNotBlank()) {
                            onPlaybackCompleted?.invoke(prevItem.mediaId, playedSec)
                        }
                    }

                    val idx = currentMediaItemIndex
                    lastTrackIndex = idx
                    currentTrackStartTimeMs = now

                    if (idx in playlist.indices) {
                        val current = playlist[idx]
                        currentItemMuted = current.isMuted
                        val itemBaseVol = current.volumeLevel.coerceIn(0, 100) / 100f
                        volume = if (current.isMuted) 0f else (if (isDucked) 0f else itemBaseVol)
                        android.util.Log.i("VideoZoneRenderer", "Track transitioned to item $idx: ${current.file.name}, isMuted=${current.isMuted}, volumeLevel=${current.volumeLevel}")
                    }
                }

                override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                    android.util.Log.e("VideoZoneRenderer", "Playback error in playlist item $currentMediaItemIndex: ${error.message}", error)
                    // Auto-fallback: lewati video korup otomatis agar layar tidak hang/layar hitam
                    try {
                        if (playlist.size > 1) {
                            seekToNextMediaItem()
                            prepare()
                            play()
                        } else {
                            prepare()
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("VideoZoneRenderer", "Gagal auto-recover: ${e.message}")
                    }
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

        val rawName = item?.mediaName.takeIf { !it.isNullOrBlank() } ?: item?.file?.name ?: "Video Media"
        val cleanName = rawName.replace(Regex("^[0-9a-fA-F-]{36}_"), "")

        return AssetStatsData(
            zoneName = zoneName.ifEmpty { "Zone Video" },
            mediaId = item?.mediaId.takeIf { !it.isNullOrBlank() } ?: item?.file?.name ?: "",
            mediaName = cleanName,
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
        val current = playlistItems.getOrNull(exoPlayer?.currentMediaItemIndex ?: 0)
        if (current?.isMuted == true || currentItemMuted) {
            exoPlayer?.volume = 0f
        } else {
            val baseVol = (current?.volumeLevel ?: 100).coerceIn(0, 100) / 100f
            // Mute total (0f) saat speech panggilan antrian aktif, lalu pulihkan baseVol saat selesai
            exoPlayer?.volume = if (duck) 0f else baseVol
        }
    }

    fun release() {
        if (lastTrackIndex in playlistItems.indices && currentTrackStartTimeMs > 0L) {
            val item = playlistItems[lastTrackIndex]
            val playedSec = ((System.currentTimeMillis() - currentTrackStartTimeMs) / 1000).toInt()
            if (playedSec >= 1 && item.mediaId.isNotBlank()) {
                onPlaybackCompleted?.invoke(item.mediaId, playedSec)
            }
        }
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
    }
}
