package com.dkaapis.sigma.presentation.player.audio

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.util.Log
import java.io.File

/**
 * Pemutar berkas audio custom (MP3/WAV) menggunakan MediaPlayer
 * dengan AudioAttributes sonification.
 */
class MediaPlayerChimePlayer {

    private var activePlayer: MediaPlayer? = null

    fun play(
        file: File,
        volume: Float,
        isCancelled: () -> Boolean,
        onDone: () -> Unit,
        onErrorFallback: () -> Unit
    ) {
        if (isCancelled()) return

        runCatching {
            MediaPlayer().apply {
                setDataSource(file.absolutePath)
                setAudioAttributes(
                    AudioAttributes.Builder().apply {
                        setUsage(AudioAttributes.USAGE_MEDIA)
                        setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    }.build()
                )
                setVolume(volume, volume)
                setOnCompletionListener { player ->
                    player.release()
                    if (activePlayer === player) activePlayer = null
                    if (!isCancelled()) onDone()
                }
                setOnErrorListener { player, what, extra ->
                    Log.w(TAG, "MediaPlayer error ($what, $extra), fallback ke DingDong")
                    player.release()
                    if (activePlayer === player) activePlayer = null
                    onErrorFallback()
                    true
                }
                prepare()
                start()
            }.also { activePlayer = it }
        }.onFailure { err ->
            Log.e(TAG, "Failed to start custom chime MediaPlayer: ${err.message}")
            onErrorFallback()
        }
    }

    fun stop() {
        activePlayer?.runCatching {
            stop()
            release()
        }
        activePlayer = null
    }

    companion object {
        private const val TAG = "MediaPlayerChimePlayer"
    }
}
