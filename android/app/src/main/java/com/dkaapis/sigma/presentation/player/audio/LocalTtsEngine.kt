package com.dkaapis.sigma.presentation.player.audio

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log

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
                    val indonesianVoices = tts.voices.orEmpty().filter {
                        it.locale.language.equals("id", ignoreCase = true)
                    }
                    val chosenVoice = indonesianVoices.firstOrNull {
                        it.locale.country.equals("ID", ignoreCase = true) && !it.isNetworkConnectionRequired
                    } ?: indonesianVoices.firstOrNull {
                        !it.isNetworkConnectionRequired
                    } ?: indonesianVoices.firstOrNull {
                        it.locale.country.equals("ID", ignoreCase = true)
                    } ?: indonesianVoices.firstOrNull()

                    if (chosenVoice == null) {
                        isReady = false
                        Log.w(TAG, "Voice Bahasa Indonesia tidak tersedia; pasang data voice Indonesia di engine TTS perangkat")
                        return@runCatching
                    }

                    isReady = tts.setVoice(chosenVoice) >= TextToSpeech.LANG_AVAILABLE
                    if (!isReady) {
                        Log.w(TAG, "Engine TTS gagal mengaktifkan voice Bahasa Indonesia offline: ${chosenVoice.name}")
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

                            override fun onError(utteranceId: String?, errorCode: Int) {
                                Log.e(TAG, "TTS gagal memutar utterance: error=$errorCode, voice=${chosenVoice.name}")
                                onSpeechError(utteranceId)
                            }

                            override fun onError(utteranceId: String?) {
                                Log.e(TAG, "TTS gagal memutar utterance, voice=${chosenVoice.name}")
                                onSpeechError(utteranceId)
                            }
                        })
                    }
                    Log.i(
                        TAG,
                        "Android TextToSpeech engine siap: isReady=$isReady, voice=${chosenVoice.name}, " +
                            "networkRequired=${chosenVoice.isNetworkConnectionRequired}"
                    )
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
        val tts = textToSpeech?.takeIf { isReady } ?: run {
            Log.w(TAG, "Ucapan dilewati: engine TTS belum siap")
            return false
        }
        val params = Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
        }
        val result = tts.speak(utteranceText, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
        if (result != TextToSpeech.SUCCESS) {
            Log.e(TAG, "Engine TTS menolak ucapan: result=$result")
        }
        return result == TextToSpeech.SUCCESS
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
