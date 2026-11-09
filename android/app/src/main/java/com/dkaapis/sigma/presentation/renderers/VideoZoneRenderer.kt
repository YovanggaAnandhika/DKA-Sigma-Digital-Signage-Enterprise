package com.dkaapis.sigma.presentation.renderers

import android.animation.ValueAnimator
import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.dkaapis.sigma.data.analytics.AssetStatsData
import com.dkaapis.sigma.presentation.renderers.model.VideoPlaylistItem
import com.dkaapis.sigma.presentation.util.DeviceCapabilityHelper
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
    private var duckAnimator: ValueAnimator? = null

    var onPlaybackCompleted: ((mediaId: String, durationSeconds: Int) -> Unit)? = null
    private var lastTrackIndex: Int = -1
    private var currentTrackStartTimeMs: Long = 0L
    private var currentTrackElapsedMs: Long = 0L
    private var lastCheckedRenderedFrames: Int = -1
    private var stallTickCount: Int = 0

    fun createView(parent: ViewGroup, videoFile: File, isMuted: Boolean = false, volumeLevel: Int = 100): PlayerView {
        return createPlaylistView(parent, listOf(VideoPlaylistItem(videoFile, 0, isMuted, volumeLevel = volumeLevel)))
    }

    fun createPlaylistView(
        parent: ViewGroup,
        playlist: List<VideoPlaylistItem>,
        startWhenReady: Boolean = true
    ): PlayerView {
        this.playlistItems = playlist

        // Adaptive load control: dynamic buffer based on device capability (low-spec vs high-end)
        val isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
        val bufConfig = DeviceCapabilityHelper.getVideoBufferConfig(context)
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                bufConfig.minBufferMs,
                bufConfig.maxBufferMs,
                bufConfig.bufferForPlaybackMs,
                bufConfig.bufferForPlaybackAfterRebufferMs
            )
            .setTargetBufferBytes(bufConfig.targetBufferBytes)
            .setPrioritizeTimeOverSizeThresholds(true)
            .build()

        val renderersFactory = DefaultRenderersFactory(context).apply {
            setEnableDecoderFallback(true)
            // On low-spec devices (1GB RAM), disable software extension renderers to enforce pure hardware decoding
            setExtensionRendererMode(
                if (isLowSpec) DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF
                else DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON
            )
        }

        val player = ExoPlayer.Builder(context, renderersFactory)
            .setLoadControl(loadControl)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()
            .apply {
            repeatMode = Player.REPEAT_MODE_ALL
            videoScalingMode = C.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING

            for (item in playlist) {
                val itemUri = Uri.fromFile(item.file)
                val mediaItemBuilder = MediaItem.Builder()
                    .setUri(itemUri)

                if (item.file.name.endsWith(".mp4", ignoreCase = true)) {
                    mediaItemBuilder.setMimeType(androidx.media3.common.MimeTypes.VIDEO_MP4)
                }

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
            lastTrackIndex = if (startWhenReady) 0 else -1
            currentTrackStartTimeMs = if (startWhenReady) System.currentTimeMillis() else 0L

            addListener(object : Player.Listener {
                override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                    val prevIdx = lastTrackIndex
                    val now = System.currentTimeMillis()
                    if (prevIdx in playlist.indices) {
                        val prevItem = playlist[prevIdx]
                        val elapsedMs = currentTrackElapsedMs +
                            if (currentTrackStartTimeMs > 0L) now - currentTrackStartTimeMs else 0L
                        val playedSec = (elapsedMs / 1000).toInt()
                        if (playedSec >= 1 && prevItem.mediaId.isNotBlank()) {
                            onPlaybackCompleted?.invoke(prevItem.mediaId, playedSec)
                        }
                    }

                    val idx = currentMediaItemIndex
                    lastTrackIndex = idx
                    currentTrackElapsedMs = 0L
                    currentTrackStartTimeMs = now.takeIf { isPlaying } ?: 0L

                    if (idx in playlist.indices) {
                        val current = playlist[idx]
                        currentItemMuted = current.isMuted
                        val itemBaseVol = current.volumeLevel.coerceIn(0, 100) / 100f
                        volume = if (current.isMuted) 0f else (if (isDucked) 0f else itemBaseVol)
                        android.util.Log.i("VideoZoneRenderer", "Track transitioned to item $idx: ${current.file.name}, isMuted=${current.isMuted}, volumeLevel=${current.volumeLevel}")
                    }
                }

                override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                    android.util.Log.e("VideoZoneRenderer", "Playback error in playlist item $currentMediaItemIndex (${error.errorCodeName}): ${error.message}, cause: ${error.cause?.message}", error)
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
            playWhenReady = startWhenReady
        }
        exoPlayer = player

        val inflater = android.view.LayoutInflater.from(context)
        val view = (inflater.inflate(com.dkaapis.sigma.R.layout.item_video_player, parent, false) as PlayerView).apply {
            this.player = player
            keepScreenOn = true
        }
        playerView = view
        return view
    }

    /**
     * Memeriksa apakah decoder video mengalami macet (freeze) saat status READY/PLAYING.
     * Dipanggil berkala dari heartbeat/analitik setiap 15 detik.
     */
    fun checkAndRecoverFromStall() {
        val player = exoPlayer ?: return
        if (!player.playWhenReady) return

        val state = player.playbackState
        if (state == Player.STATE_IDLE || state == Player.STATE_ENDED) {
            android.util.Log.w("VideoZoneRenderer", "Player di zona '$zoneName' berhenti (state=$state), memulihkan playback...")
            runCatching {
                player.prepare()
                player.play()
            }
            return
        }

        val rendered = player.videoDecoderCounters?.renderedOutputBufferCount ?: 0
        if (state == Player.STATE_READY && player.isPlaying) {
            if (rendered > 0 && rendered == lastCheckedRenderedFrames) {
                stallTickCount++
                if (stallTickCount >= 2) {
                    android.util.Log.w("VideoZoneRenderer", "Decoder video beku terdeteksi di '$zoneName' (rendered=$rendered tidak bergerak selama 30s). Reset pipeline...")
                    stallTickCount = 0
                    runCatching {
                        val pos = player.currentPosition
                        player.stop()
                        player.seekTo(player.currentMediaItemIndex, pos)
                        player.prepare()
                        player.play()
                    }
                }
            } else {
                stallTickCount = 0
            }
        }
        lastCheckedRenderedFrames = rendered
    }

    fun getCurrentPlaybackStats(): AssetStatsData? {
        checkAndRecoverFromStall()
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
        val player = exoPlayer ?: return
        val current = playlistItems.getOrNull(player.currentMediaItemIndex)
        if (current?.isMuted == true || currentItemMuted) {
            player.volume = 0f
            return
        }
        val targetVol = if (duck) 0f else ((current?.volumeLevel ?: 100).coerceIn(0, 100) / 100f)
        val startVol = player.volume

        duckAnimator?.cancel()
        // Smooth linear ramp: 60ms down to mute, 180ms up to restore, eliminates harsh click/pop
        duckAnimator = ValueAnimator.ofFloat(startVol, targetVol).apply {
            duration = if (duck) 60L else 180L
            addUpdateListener { anim ->
                player.volume = anim.animatedValue as Float
            }
            start()
        }
    }

    fun pause() {
        runCatching {
            playerView?.keepScreenOn = false
            if (currentTrackStartTimeMs > 0L) {
                currentTrackElapsedMs += System.currentTimeMillis() - currentTrackStartTimeMs
                currentTrackStartTimeMs = 0L
            }
            exoPlayer?.pause()
        }
    }

    fun resume() {
        runCatching {
            playerView?.keepScreenOn = true
            exoPlayer?.let { player ->
                if (player.playbackState == Player.STATE_IDLE || player.playbackState == Player.STATE_ENDED) {
                    player.prepare()
                }
                if (currentTrackStartTimeMs == 0L) {
                    if (lastTrackIndex !in playlistItems.indices) {
                        lastTrackIndex = player.currentMediaItemIndex
                    }
                    currentTrackStartTimeMs = System.currentTimeMillis()
                }
                player.play()
            }
        }
    }

    fun release() {
        if (lastTrackIndex in playlistItems.indices) {
            val item = playlistItems[lastTrackIndex]
            val elapsedMs = currentTrackElapsedMs +
                if (currentTrackStartTimeMs > 0L) System.currentTimeMillis() - currentTrackStartTimeMs else 0L
            val playedSec = (elapsedMs / 1000).toInt()
            if (playedSec >= 1 && item.mediaId.isNotBlank()) {
                onPlaybackCompleted?.invoke(item.mediaId, playedSec)
            }
        }
        duckAnimator?.cancel()
        duckAnimator = null
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
    }
}
