package com.dkaapis.sigma.presentation.player.audio

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

/**
 * Pembungkus engine lokal Android TextToSpeech.
 */
class LocalTtsEngine(
    private val context: Context,
    private val onSpeechStarted: (utteranceId: String?) -> Unit,
    private val onSpeechDone: (utteranceId: String?) -> Unit,
    private val onSpeechError: (utteranceId: String?) -> Unit
) {
    private var textToSpeech: TextToSpeech? = null
    var isReady: Boolean = false
        private set

    fun initialize() {
        runCatching {
            textToSpeech = TextToSpeech(context) { status ->
                if (status != TextToSpeech.SUCCESS) {
                    isReady = false
                    Log.w(TAG, "Inisialisasi TextToSpeech gagal, status: $status")
                    return@TextToSpeech
                }

                runCatching {
                    val tts = textToSpeech ?: return@TextToSpeech
                    val idLocale = Locale("id", "ID")
                    val isIdSupported = tts.isLanguageAvailable(idLocale).let {
                        it != TextToSpeech.LANG_MISSING_DATA && it != TextToSpeech.LANG_NOT_SUPPORTED
                    }

                    val chosenLocale = when {
                        isIdSupported -> idLocale
                        else -> Locale.getDefault().takeIf { loc ->
                            val avail = tts.isLanguageAvailable(loc)
                            avail != TextToSpeech.LANG_MISSING_DATA && avail != TextToSpeech.LANG_NOT_SUPPORTED
                        }
                    }

                    if (chosenLocale != null) {
                        tts.language = chosenLocale
                        isReady = true
                    } else {
                        isReady = false
                        Log.w(TAG, "Engine TTS lokal tidak mendukung Bahasa Indonesia atau Locale default")
                    }

                    tts.apply {
                        setSpeechRate(1.15f)
                        setPitch(1.0f)
                        setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                            override fun onStart(utteranceId: String?) {
                                onSpeechStarted(utteranceId)
                            }

                            override fun onDone(utteranceId: String?) {
                                onSpeechDone(utteranceId)
                            }

                            override fun onError(utteranceId: String?) {
                                onSpeechError(utteranceId)
                            }
                        })
                    }
                    Log.i(TAG, "Android TextToSpeech engine siap: isReady=$isReady")
                }.onFailure { t ->
                    isReady = false
                    Log.w(TAG, "Gagal inisialisasi TextToSpeech callback: ${t.message}")
                }
            }
        }.onFailure { err ->
            isReady = false
            Log.e(TAG, "Gagal inisialisasi TTS: ${err.message}")
        }
    }

    fun speak(utteranceText: String, utteranceId: String): Boolean {
        val tts = textToSpeech?.takeIf { isReady } ?: return false
        val params = Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
        }
        return tts.speak(utteranceText, TextToSpeech.QUEUE_FLUSH, params, utteranceId) == TextToSpeech.SUCCESS
    }

    fun stop() {
        textToSpeech?.runCatching { stop() }
    }

    fun release() {
        textToSpeech?.runCatching {
            stop()
            shutdown()
        }
        textToSpeech = null
        isReady = false
    }

    companion object {
        private const val TAG = "LocalTtsEngine"
    }
}
