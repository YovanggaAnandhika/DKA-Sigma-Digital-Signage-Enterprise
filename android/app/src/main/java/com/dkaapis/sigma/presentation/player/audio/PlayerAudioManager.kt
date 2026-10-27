package com.dkaapis.sigma.presentation.player.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.dkaapis.sigma.presentation.player.audio.model.AudioConfigPayload
import com.dkaapis.sigma.presentation.player.audio.model.CounterStatusPayload
import com.dkaapis.sigma.presentation.player.audio.model.QueueSpeechPayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File

/**
 * Orkestrator Audio & TextToSpeech untuk Signage Player:
 * Mengkoordinasikan chime synthesizer, custom audio player, TTS interpolator,
 * dan pengendalian audio ducking konten video.
 */
class PlayerAudioManager(
    private val context: Context,
    private val scope: CoroutineScope,
    private val config: AudioConfigPayload
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val pcmSynthesizer = PcmChimeSynthesizer()
    private val mediaPlayerChime = MediaPlayerChimePlayer()
    private val speechInterpolator = QueueSpeechInterpolator()

    private var activeTtsPlayer: MediaPlayer? = null
    private var activeChimeThread: Thread? = null
    private var currentSpeechGeneration: Long = 0L
    private var currentUtteranceId: String? = null
    private var speechTimeoutRunnable: Runnable? = null

    private val localTtsEngine = LocalTtsEngine(
        context = context,
        onSpeechStarted = { utteranceId ->
            mainHandler.post {
                if (utteranceId != null && utteranceId == currentUtteranceId) {
                    requestSystemAudioFocus()
                    config.onDuckingChanged(true)
                }
            }
        },
        onSpeechDone = { utteranceId ->
            mainHandler.post {
                if (utteranceId != null && utteranceId == currentUtteranceId) {
                    finishSpeech(currentSpeechGeneration)
                }
            }
        },
        onSpeechError = { utteranceId ->
            mainHandler.post {
                if (utteranceId != null && utteranceId == currentUtteranceId) {
                    finishSpeech(currentSpeechGeneration)
                }
            }
        }
    )

    val isTtsReady: Boolean
        get() = localTtsEngine.isReady

    fun initTextToSpeech() {
        localTtsEngine.initialize()
    }

    fun stopCurrentVoice() {
        currentSpeechGeneration++
        currentUtteranceId = null

        speechTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        speechTimeoutRunnable = null

        mediaPlayerChime.stop()
        pcmSynthesizer.stop()
        localTtsEngine.stop()

        activeTtsPlayer?.runCatching {
            stop()
            release()
        }
        activeTtsPlayer = null

        activeChimeThread?.runCatching { interrupt() }
        activeChimeThread = null
    }

    fun finishSpeech(expectedGen: Long) {
        if (currentSpeechGeneration != expectedGen) return

        speechTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        speechTimeoutRunnable = null
        config.onDuckingChanged(false)
        abandonSystemAudioFocus()
        config.onStopCallEffect()
    }

    private fun requestSystemAudioFocus() {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        @Suppress("DEPRECATION")
        audioManager?.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
    }

    private fun abandonSystemAudioFocus() {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        @Suppress("DEPRECATION")
        audioManager?.abandonAudioFocus(null)
    }

    fun speakQueueTicket(payload: QueueSpeechPayload) {
        mainHandler.post {
            stopCurrentVoice()
            val thisGen = currentSpeechGeneration

            requestSystemAudioFocus()
            config.onDuckingChanged(true)

            val utteranceText = speechInterpolator.interpolateTicket(payload, config.getActiveQueueDataJson())
            Log.i(TAG, "Chime & TTS [gen=$thisGen]: $utteranceText (isRecall=${payload.isRecall})")

            playChime(thisGen) {
                if (currentSpeechGeneration == thisGen) {
                    playTtsVoice(utteranceText, thisGen)
                }
            }
        }
    }

    fun speakCounterStatus(payload: CounterStatusPayload) {
        mainHandler.post {
            stopCurrentVoice()
            val thisGen = currentSpeechGeneration

            requestSystemAudioFocus()
            config.onDuckingChanged(true)

            val utteranceText = speechInterpolator.interpolateStatus(payload, config.getActiveQueueDataJson())
            Log.i(TAG, "Counter status speech [gen=$thisGen]: $utteranceText")

            playChime(thisGen) {
                if (currentSpeechGeneration == thisGen) {
                    playTtsVoice(utteranceText, thisGen)
                }
            }
        }
    }

    private fun playChime(expectedGen: Long, onDone: () -> Unit) {
        val customFile = findCustomChimeFile()
        if (customFile != null) {
            mediaPlayerChime.play(
                file = customFile.first,
                volume = customFile.second,
                isCancelled = { currentSpeechGeneration != expectedGen },
                onDone = onDone,
                onErrorFallback = {
                    playSynthesizedDingDong(expectedGen, onDone)
                }
            )
        } else {
            playSynthesizedDingDong(expectedGen, onDone)
        }
    }

    private fun playSynthesizedDingDong(expectedGen: Long, onDone: () -> Unit) {
        activeChimeThread = pcmSynthesizer.playSynthesizedDingDong(
            isCancelled = { currentSpeechGeneration != expectedGen },
            onDone = {
                mainHandler.post {
                    if (currentSpeechGeneration == expectedGen) onDone()
                }
            }
        )
    }

    private fun findCustomChimeFile(): Pair<File, Float>? {
        val jsonStr = config.getActiveQueueDataJson()?.takeIf { it.isNotBlank() } ?: return null
        return runCatching {
            val qObj = JSONObject(jsonStr)
            val audiosArr = qObj.optJSONArray("audiosList") ?: qObj.optJSONArray("audios") ?: return null
            for (i in 0 until audiosArr.length()) {
                val aObj = audiosArr.getJSONObject(i)
                val isActive = if (aObj.has("isActive")) aObj.optBoolean("isActive", true) else aObj.optBoolean("is_active", true)
                val audioType = aObj.optString("audioType", aObj.optString("audio_type", "preset"))
                val mediaItemId = aObj.optString("mediaItemId", aObj.optString("media_item_id", ""))
                val vol = aObj.optInt("volumePercent", aObj.optInt("volume_percent", 100))

                if (isActive && audioType.equals("media_item", ignoreCase = true) && mediaItemId.isNotBlank()) {
                    val file = config.getLocalFileForAsset(mediaItemId)?.takeIf { it.exists() }
                    if (file != null) {
                        return Pair(file, (vol / 100f).coerceIn(0.1f, 1.0f))
                    }
                }
            }
            null
        }.getOrNull()
    }

    private fun playTtsVoice(utteranceText: String, expectedGen: Long) {
        if (currentSpeechGeneration != expectedGen) return
        mainHandler.post {
            if (currentSpeechGeneration == expectedGen) {
                playLocalTtsOrFallback(utteranceText, expectedGen)
            }
        }
    }

    private fun playTtsAudioFile(file: File, expectedGen: Long) {
        if (currentSpeechGeneration != expectedGen) return
        runCatching {
            MediaPlayer().apply {
                setDataSource(file.absolutePath)
                setAudioAttributes(
                    AudioAttributes.Builder().apply {
                        setUsage(AudioAttributes.USAGE_MEDIA)
                        setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    }.build()
                )
                setVolume(1.0f, 1.0f)
                setOnCompletionListener { player ->
                    player.release()
                    if (activeTtsPlayer === player) activeTtsPlayer = null
                    if (currentSpeechGeneration == expectedGen) finishSpeech(expectedGen)
                }
                setOnErrorListener { player, what, extra ->
                    Log.w(TAG, "TTS MediaPlayer error ($what, $extra), fallback ke local TTS")
                    player.release()
                    if (activeTtsPlayer === player) activeTtsPlayer = null
                    if (currentSpeechGeneration == expectedGen) finishSpeech(expectedGen)
                    true
                }
                prepare()
                runCatching { playbackParams = playbackParams.setSpeed(1.15f) }
                start()
            }.also { activeTtsPlayer = it }
        }.onFailure { err ->
            Log.e(TAG, "Failed to start TTS MediaPlayer: ${err.message}")
            finishSpeech(expectedGen)
        }
    }

    private fun playLocalTtsOrFallback(utteranceText: String, expectedGen: Long) {
        if (currentSpeechGeneration != expectedGen) return

        val utteranceId = "queue_${expectedGen}_${System.currentTimeMillis()}"
        currentUtteranceId = utteranceId

        if (localTtsEngine.speak(utteranceText, utteranceId)) {
            val timeoutRunnable = Runnable {
                if (currentSpeechGeneration == expectedGen) finishSpeech(expectedGen)
            }
            speechTimeoutRunnable = timeoutRunnable
            mainHandler.postDelayed(timeoutRunnable, 8000)
            return
        }

        val fallbackTimeout = Runnable {
            if (currentSpeechGeneration == expectedGen) finishSpeech(expectedGen)
        }
        speechTimeoutRunnable = fallbackTimeout
        mainHandler.postDelayed(fallbackTimeout, 3500)
    }

    fun release() {
        stopCurrentVoice()
        localTtsEngine.release()
    }

    companion object {
        private const val TAG = "PlayerAudioManager"
    }
}
