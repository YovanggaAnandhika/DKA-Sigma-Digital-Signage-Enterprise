package com.dkaapis.sigma.presentation.player.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.ToneGenerator
import android.os.Build
import android.util.Log

/**
 * Mensintesis nada Web Audio Ding-Dong secara presisi
 * menggunakan PCM 16-bit 44.1 kHz langsung ke AudioTrack.
 */
class PcmChimeSynthesizer {

    private var activeTrack: AudioTrack? = null

    fun playSynthesizedDingDong(
        isCancelled: () -> Boolean,
        onDone: () -> Unit
    ): Thread = Thread {
        if (isCancelled() || Thread.currentThread().isInterrupted) return@Thread

        val sampleRate = 44100
        val dur1 = 0.28
        val dur2 = 0.42
        val totalSamples = ((dur1 + dur2) * sampleRate).toInt()
        val samples = ShortArray(totalSamples)

        val dingLen = (dur1 * sampleRate).toInt()
        for (i in 0 until dingLen) {
            val t = i.toDouble() / sampleRate
            val decay = Math.exp(-4.2 * (t / dur1))
            val wave = Math.sin(2.0 * Math.PI * 880.0 * t)
            samples[i] = (wave * decay * 32767 * 0.90).toInt().toShort()
        }

        for (i in 0 until (totalSamples - dingLen)) {
            val t = i.toDouble() / sampleRate
            val decay = Math.exp(-3.5 * (t / dur2))
            val wave = Math.sin(2.0 * Math.PI * 587.33 * t)
            samples[dingLen + i] = (wave * decay * 32767 * 0.95).toInt().toShort()
        }

        val minBuf = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        val bufferSize = maxOf(minBuf * 2, 8192)

        if (isCancelled() || Thread.currentThread().isInterrupted) return@Thread

        var track: AudioTrack? = null
        val playedSuccessfully = runCatching {
            track = createAudioTrack(sampleRate, bufferSize).apply {
                play()
                write(samples, 0, samples.size)
            }
            activeTrack = track
            Thread.sleep(((dur1 + dur2) * 1000).toLong() + 60)
            true
        }.onFailure { err ->
            if (err !is InterruptedException) {
                Log.w(TAG, "AudioTrack DingDong error: ${err.message}, fallback ke ToneGenerator...")
            }
        }.getOrDefault(false)

        track?.runCatching {
            stop()
            release()
        }
        if (activeTrack === track) {
            activeTrack = null
        }

        if (!playedSuccessfully && !isCancelled() && !Thread.currentThread().isInterrupted) {
            runCatching {
                ToneGenerator(AudioManager.STREAM_MUSIC, 100).apply {
                    startTone(ToneGenerator.TONE_PROP_BEEP2, 500)
                    Thread.sleep(550)
                    release()
                }
            }
        }

        if (!isCancelled() && !Thread.currentThread().isInterrupted) {
            onDone()
        }
    }.apply {
        start()
    }

    private fun createAudioTrack(sampleRate: Int, bufferSize: Int): AudioTrack {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            AudioTrack.Builder().apply {
                setAudioAttributes(
                    AudioAttributes.Builder().apply {
                        setUsage(AudioAttributes.USAGE_MEDIA)
                        setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    }.build()
                )
                setAudioFormat(
                    AudioFormat.Builder().apply {
                        setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        setSampleRate(sampleRate)
                        setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    }.build()
                )
                setBufferSizeInBytes(bufferSize)
                setTransferMode(AudioTrack.MODE_STREAM)
            }.build()
        } else {
            @Suppress("DEPRECATION")
            AudioTrack(
                AudioManager.STREAM_MUSIC,
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize,
                AudioTrack.MODE_STREAM
            )
        }
    }

    fun stop() {
        activeTrack?.runCatching {
            pause()
            flush()
            stop()
            release()
        }
        activeTrack = null
    }

    companion object {
        private const val TAG = "PcmChimeSynthesizer"
    }
}
