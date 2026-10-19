package com.dkaapis.sigma.presentation.player

import android.content.ComponentCallbacks2
import android.content.Intent
import android.content.pm.ActivityInfo
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.MediaPlayer
import android.media.ToneGenerator
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.view.PixelCopy
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.dkaapis.sigma.R
import com.dkaapis.sigma.data.analytics.AnalyticsSnapshotData
import com.dkaapis.sigma.data.analytics.AnalyticsSyncManager
import com.dkaapis.sigma.data.analytics.AssetStatsData
import com.dkaapis.sigma.data.analytics.DeviceHardwareProfiler
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.AnalyticsLocalBuffer
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.local.MediaDiskCache
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.data.repository.ManifestRepositoryImpl
import com.dkaapis.sigma.data.repository.MediaStorageRepositoryImpl
import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaType
import com.dkaapis.sigma.domain.model.QueueDisplayData
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import com.dkaapis.sigma.domain.usecase.DownloadAndVerifyMediaUseCase
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.domain.usecase.SyncManifestUseCase
import com.dkaapis.sigma.presentation.pairing.PairingActivity
import com.dkaapis.sigma.presentation.player.canvas.SignageCanvasLayout
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.dkaapis.sigma.presentation.renderers.*
import com.dkaapis.sigma.service.PlayerForegroundService
import com.dkaapis.sigma.service.WatchdogService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit

class PlayerActivity : AppCompatActivity() {

    private lateinit var viewModel: PlayerViewModel
    private lateinit var deviceRepo: DeviceRepositoryImpl
    private lateinit var storageRepo: MediaStorageRepositoryImpl
    private lateinit var canvasLayout: SignageCanvasLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var badgeText: TextView
    private lateinit var loadingText: TextView
    private lateinit var subDetailText: TextView
    private lateinit var progressBar: ProgressBar

    private lateinit var hardwareProfiler: DeviceHardwareProfiler
    private lateinit var analyticsSyncManager: AnalyticsSyncManager

    private var realtimeStreamJob: Job? = null
    private val streamingHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val videoRenderers = mutableListOf<VideoZoneRenderer>()
    private val clockRenderers = mutableListOf<ClockZoneRenderer>()
    private var activeQueueRenderer: QueueZoneRenderer? = null
    private var activeQueueDisplayId: String = ""
    private var activeQueueDataJson: String? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false
    private var timelineJob: Job? = null

    // Tracking untuk memotong / menghentikan audio & TTS sebelumnya saat dipanggil berturut-turut
    private var activeChimeThread: Thread? = null
    private var activeAudioTrack: AudioTrack? = null
    private var activeChimePlayer: MediaPlayer? = null
    private var activeTtsPlayer: MediaPlayer? = null
    private var currentSpeechGeneration: Long = 0L
    private var currentUtteranceId: String? = null
    private var speechTimeoutRunnable: Runnable? = null

    private val watchdogHandler = Handler(Looper.getMainLooper())
    private val watchdogHeartbeatRunnable = object : Runnable {
        override fun run() {
            // Beri sinyal ke WatchdogService bahwa UI thread aktif dan sehat
            WatchdogService.pingFromPlayer(this@PlayerActivity)
            lifecycleScope.launch {
                try {
                    if (::deviceRepo.isInitialized && ::viewModel.isInitialized) {
                        val currentHash = viewModel.getActiveManifestHash()
                        val res = deviceRepo.sendHeartbeat(manifestHash = currentHash)
                        if (res.isFailure) {
                            if (!deviceRepo.isPaired()) {
                                viewModel.onDeviceUnpaired()
                            } else {
                                android.util.Log.w("PlayerActivity", "Heartbeat sementara gagal: ${res.exceptionOrNull()?.message}")
                            }
                        } else {
                            val hb = res.getOrNull()
                            val cmd = hb?.pendingCommand
                            if (!cmd.isNullOrBlank()) {
                                android.util.Log.i("PlayerActivity", "Menerima pending command via Heartbeat: $cmd")
                                when {
                                    cmd.contains("ClearCache", ignoreCase = true) -> {
                                        handleClearCacheCommand()
                                    }
                                    cmd.contains("CaptureScreenshot", ignoreCase = true) || cmd.contains("Screenshot", ignoreCase = true) -> {
                                        handleCaptureScreenshotCommand()
                                    }
                                    cmd.contains("Reboot", ignoreCase = true) -> {
                                        handleRebootCommand()
                                    }
                                    cmd.contains("Unpair", ignoreCase = true) || cmd.contains("Decommission", ignoreCase = true) -> {
                                        deviceRepo.clearCredentials()
                                        viewModel.onDeviceUnpaired()
                                    }
                                }
                            }
                            if (hb?.needsManifestSync == true) {
                                val currentState = viewModel.uiState.value
                                if (currentState !is PlayerUiState.DownloadingAssets && currentState !is PlayerUiState.SyncingManifest) {
                                    viewModel.syncManifest()
                                }
                            }
                        }

                        // Kirim data hardware & asset analytics realtime (Hybrid Offline-First)
                        if (::hardwareProfiler.isInitialized && ::analyticsSyncManager.isInitialized) {
                            val hwMetrics = hardwareProfiler.sampleMetrics()
                            val allAssetStats = videoRenderers.mapNotNull { it.getCurrentPlaybackStats() }
                            val assetsArray = org.json.JSONArray()
                            if (allAssetStats.isNotEmpty()) {
                                for (stat in allAssetStats) {
                                    assetsArray.put(org.json.JSONObject(stat.toJson()))
                                }
                            } else {
                                val idleStat = AssetStatsData(
                                    zoneName = "Standby Zone",
                                    mediaName = "Standby / Static Content",
                                    playbackStatus = "IDLE",
                                    diagnosticFlag = "OPTIMAL"
                                )
                                assetsArray.put(org.json.JSONObject(idleStat.toJson()))
                            }

                            val snap = AnalyticsSnapshotData(
                                inputOutputJson = hwMetrics.toJson(),
                                assetsStatsJson = assetsArray.toString()
                            )
                            analyticsSyncManager.recordAndSync(snap)
                        }
                    }
                } catch (_: Exception) {}
            }
            watchdogHandler.postDelayed(this, 3000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        } catch (_: Throwable) {}
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        try {
            window.setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            )
        } catch (_: Throwable) {}

        // Aktifkan mode layar penuh (Immersive Fullscreen) & gunakan area cutout kamera/notch
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                window.attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
            val insetsController = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            insetsController.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
            insetsController.systemBarsBehavior =
                androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } catch (t: Throwable) {
            android.util.Log.w("PlayerActivity", "Gagal mengatur immersive fullscreen insets: ${t.message}")
        }

        initDependencies()
        initTextToSpeech()
        setupViews()
        observeState()

        // Start background stream daemon
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(Intent(this, PlayerForegroundService::class.java))
            } else {
                startService(Intent(this, PlayerForegroundService::class.java))
            }
        } catch (e: Exception) {
            android.util.Log.w("PlayerActivity", "Gagal start PlayerForegroundService: ${e.message}")
        }

        // Start companion watchdog
        try {
            startService(Intent(this, WatchdogService::class.java))
            watchdogHandler.post(watchdogHeartbeatRunnable)
        } catch (e: Exception) {
            android.util.Log.w("PlayerActivity", "Gagal start WatchdogService: ${e.message}")
        }

        viewModel.initializePlayer()
        startRealtimeDeviceStream()
    }

    private fun initDependencies() {
        val tokenStorage = TokenStorage(this)
        val channelFactory = GrpcChannelFactory(this)
        val manifestStorage = ManifestStorage(this)
        val diskCache = MediaDiskCache(this)

        deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        val manifestRepo = ManifestRepositoryImpl(this, manifestStorage, channelFactory)
        storageRepo = MediaStorageRepositoryImpl(diskCache)

        val hardwareProfiler = DeviceHardwareProfiler(this)
        val analyticsBuffer = AnalyticsLocalBuffer(this)
        this.hardwareProfiler = hardwareProfiler
        this.analyticsSyncManager = AnalyticsSyncManager(this, tokenStorage, analyticsBuffer)

        val registerUseCase = RegisterAndPairUseCase(deviceRepo)
        val syncUseCase = SyncManifestUseCase(deviceRepo, manifestRepo)
        val downloadUseCase = DownloadAndVerifyMediaUseCase(storageRepo)

        viewModel = PlayerViewModel(registerUseCase, syncUseCase, downloadUseCase)
    }

    private fun initTextToSpeech() {
        try {
            textToSpeech = TextToSpeech(this) { status ->
                try {
                    if (status == TextToSpeech.SUCCESS) {
                        val idLocale = Locale("id", "ID")
                        val available = textToSpeech?.isLanguageAvailable(idLocale)
                        if (available != TextToSpeech.LANG_MISSING_DATA && available != TextToSpeech.LANG_NOT_SUPPORTED) {
                            textToSpeech?.language = idLocale
                            isTtsReady = true
                        } else {
                            val defaultLoc = Locale.getDefault()
                            val defAvailable = textToSpeech?.isLanguageAvailable(defaultLoc)
                            if (defAvailable != TextToSpeech.LANG_MISSING_DATA && defAvailable != TextToSpeech.LANG_NOT_SUPPORTED) {
                                textToSpeech?.language = defaultLoc
                                isTtsReady = true
                            } else {
                                isTtsReady = false
                                android.util.Log.w("PlayerActivity", "Engine TTS lokal tidak mendukung Bahasa Indonesia atau Locale default")
                            }
                        }
                        textToSpeech?.setSpeechRate(1.15f)
                        textToSpeech?.setPitch(1.0f)

                        textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                            override fun onStart(utteranceId: String?) {
                                runOnUiThread {
                                    if (utteranceId != null && utteranceId == currentUtteranceId) {
                                        val audioManager = getSystemService(android.content.Context.AUDIO_SERVICE) as? android.media.AudioManager
                                        audioManager?.requestAudioFocus(null, android.media.AudioManager.STREAM_MUSIC, android.media.AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                                        videoRenderers.forEach { it.setDuckedVolume(true) }
                                    }
                                }
                            }

                            override fun onDone(utteranceId: String?) {
                                runOnUiThread {
                                    if (utteranceId != null && utteranceId == currentUtteranceId) {
                                        finishSpeech(currentSpeechGeneration)
                                    }
                                }
                            }

                            override fun onError(utteranceId: String?) {
                                runOnUiThread {
                                    if (utteranceId != null && utteranceId == currentUtteranceId) {
                                        finishSpeech(currentSpeechGeneration)
                                    }
                                }
                            }
                        })
                        android.util.Log.i("PlayerActivity", "Android TextToSpeech engine siap: isTtsReady=$isTtsReady")
                    } else {
                        isTtsReady = false
                        android.util.Log.w("PlayerActivity", "Inisialisasi TextToSpeech gagal, status: $status")
                    }
                } catch (t: Throwable) {
                    isTtsReady = false
                    android.util.Log.w("PlayerActivity", "Gagal inisialisasi TextToSpeech callback: ${t.message}")
                }
            }
        } catch (e: Throwable) {
            isTtsReady = false
            android.util.Log.e("PlayerActivity", "Gagal inisialisasi TTS: ${e.message}")
        }
    }

    /**
     * Hentikan seketika seluruh audio chime tone maupun suara TTS yang sedang berlangsung
     * agar saat user menekan 'Selanjutnya' berturut-turut tidak terjadi audio glitch / tumpang tindih.
     */
    fun stopCurrentVoice() {
        currentSpeechGeneration++
        currentUtteranceId = null

        speechTimeoutRunnable?.let { watchdogHandler.removeCallbacks(it) }
        speechTimeoutRunnable = null

        try {
            activeChimePlayer?.stop()
            activeChimePlayer?.release()
        } catch (_: Exception) {}
        activeChimePlayer = null

        try {
            activeTtsPlayer?.stop()
            activeTtsPlayer?.release()
        } catch (_: Exception) {}
        activeTtsPlayer = null

        try {
            activeChimeThread?.interrupt()
        } catch (_: Exception) {}
        activeChimeThread = null

        try {
            activeAudioTrack?.pause()
            activeAudioTrack?.flush()
            activeAudioTrack?.stop()
            activeAudioTrack?.release()
        } catch (_: Exception) {}
        activeAudioTrack = null

        try {
            textToSpeech?.stop()
        } catch (_: Exception) {}
    }

    private fun finishSpeech(expectedGen: Long) {
        if (currentSpeechGeneration == expectedGen) {
            speechTimeoutRunnable?.let { watchdogHandler.removeCallbacks(it) }
            speechTimeoutRunnable = null
            videoRenderers.forEach { it.setDuckedVolume(false) }
            val audioManager = getSystemService(android.content.Context.AUDIO_SERVICE) as? AudioManager
            audioManager?.abandonAudioFocus(null)
            activeQueueRenderer?.stopCallEffect()
        }
    }

    private fun playChimeTone(expectedGen: Long, onChimeDone: () -> Unit) {
        var customAudioFile: File? = null
        var customAudioVolume = 1.0f

        val queueJsonStr = activeQueueDataJson
        if (!queueJsonStr.isNullOrBlank()) {
            try {
                val qObj = JSONObject(queueJsonStr)
                val audiosArr = qObj.optJSONArray("audiosList") ?: qObj.optJSONArray("audios")
                if (audiosArr != null && audiosArr.length() > 0) {
                    for (i in 0 until audiosArr.length()) {
                        val aObj = audiosArr.getJSONObject(i)
                        val isActive = if (aObj.has("isActive")) aObj.optBoolean("isActive", true) else aObj.optBoolean("is_active", true)
                        val audioType = aObj.optString("audioType", aObj.optString("audio_type", "preset"))
                        val mediaItemId = aObj.optString("mediaItemId", aObj.optString("media_item_id", ""))
                        val vol = aObj.optInt("volumePercent", aObj.optInt("volume_percent", 100))

                        if (isActive && audioType.equals("media_item", ignoreCase = true) && mediaItemId.isNotBlank()) {
                            val file = storageRepo.getLocalFileForAsset(mediaItemId)
                            if (file != null && file.exists()) {
                                customAudioFile = file
                                customAudioVolume = (vol / 100f).coerceIn(0.1f, 1.0f)
                                break
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.w("PlayerActivity", "Error parsing custom queue audio: ${e.message}")
            }
        }

        if (customAudioFile != null) {
            android.util.Log.i("PlayerActivity", "Memutar custom chime MP3: ${customAudioFile.name} (volume=$customAudioVolume)")
            playCustomChimeAudio(customAudioFile, customAudioVolume, expectedGen, onChimeDone)
        } else {
            playSynthesizedDingDong(expectedGen, onChimeDone)
        }
    }

    private fun playCustomChimeAudio(file: File, volume: Float, expectedGen: Long, onChimeDone: () -> Unit) {
        runOnUiThread {
            if (currentSpeechGeneration != expectedGen) return@runOnUiThread
            try {
                val mp = MediaPlayer().apply {
                    setDataSource(file.absolutePath)
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setVolume(volume, volume)
                    setOnCompletionListener { player ->
                        player.release()
                        if (activeChimePlayer === player) {
                            activeChimePlayer = null
                        }
                        if (currentSpeechGeneration == expectedGen) {
                            onChimeDone()
                        }
                    }
                    setOnErrorListener { player, what, extra ->
                        android.util.Log.w("PlayerActivity", "Custom chime MediaPlayer error ($what, $extra), fallback ke DingDong")
                        player.release()
                        if (activeChimePlayer === player) {
                            activeChimePlayer = null
                        }
                        playSynthesizedDingDong(expectedGen, onChimeDone)
                        true
                    }
                    prepare()
                    start()
                }
                activeChimePlayer = mp
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Failed to start custom chime MediaPlayer: ${e.message}")
                playSynthesizedDingDong(expectedGen, onChimeDone)
            }
        }
    }

    private fun playSynthesizedDingDong(expectedGen: Long, onChimeDone: () -> Unit) {
        val chimeThread = Thread {
            var track: AudioTrack? = null
            var playedSuccessfully = false
            try {
                if (currentSpeechGeneration != expectedGen || Thread.currentThread().isInterrupted) return@Thread

                val sampleRate = 44100
                val dur1 = 0.28 // Ding (880 Hz / A5)
                val dur2 = 0.42 // Dong (587.33 Hz / D5)
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

                if (currentSpeechGeneration != expectedGen || Thread.currentThread().isInterrupted) return@Thread

                track = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    AudioTrack.Builder()
                        .setAudioAttributes(
                            AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_MEDIA)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        )
                        .setAudioFormat(
                            AudioFormat.Builder()
                                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                                .setSampleRate(sampleRate)
                                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                                .build()
                        )
                        .setBufferSizeInBytes(bufferSize)
                        .setTransferMode(AudioTrack.MODE_STREAM)
                        .build()
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

                activeAudioTrack = track
                track.play()
                track.write(samples, 0, samples.size)
                playedSuccessfully = true
                Thread.sleep(((dur1 + dur2) * 1000).toLong() + 60)
            } catch (e: InterruptedException) {
                return@Thread
            } catch (e: Exception) {
                android.util.Log.w("PlayerActivity", "AudioTrack DingDong error: ${e.message}, fallback ke ToneGenerator...")
            } finally {
                try {
                    track?.stop()
                    track?.release()
                } catch (_: Exception) {}
                if (activeAudioTrack === track) {
                    activeAudioTrack = null
                }

                if (!playedSuccessfully && !Thread.currentThread().isInterrupted && currentSpeechGeneration == expectedGen) {
                    try {
                        val toneGen = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
                        toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 500)
                        Thread.sleep(550)
                        toneGen.release()
                    } catch (_: Exception) {}
                }

                if (!Thread.currentThread().isInterrupted && currentSpeechGeneration == expectedGen) {
                    runOnUiThread {
                        if (currentSpeechGeneration == expectedGen) {
                            onChimeDone()
                        }
                    }
                }
            }
        }
        activeChimeThread = chimeThread
        chimeThread.start()
    }

    fun speakQueueTicket(
        ticketNumber: String,
        counterName: String,
        isRecall: Boolean = false,
        ticketLabelOverride: String? = null,
        counterLabelOverride: String? = null,
        ttsTemplateCallOverride: String? = null,
        ttsTemplateRecallOverride: String? = null
    ) {
        runOnUiThread {
            try {
                // 1. HENTIKAN SUARA SEBELUMNYA SEKETIKA (Ding-dong chime maupun TTS)
                stopCurrentVoice()

                val thisGen = currentSpeechGeneration

                // Mute / duck seluruh audio pemutar video & minta audio focus sistem seketika
                val audioManager = getSystemService(android.content.Context.AUDIO_SERVICE) as? AudioManager
                audioManager?.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                videoRenderers.forEach { it.setDuckedVolume(true) }

                val prefix = ticketNumber.substringBefore("-", "").trim()
                val digits = ticketNumber.substringAfter("-", "").trim()

                val spokenDigits = digits.map { ch ->
                    when (ch) {
                        '0' -> "kosong"
                        '1' -> "satu"
                        '2' -> "dua"
                        '3' -> "tiga"
                        '4' -> "empat"
                        '5' -> "lima"
                        '6' -> "enam"
                        '7' -> "tujuh"
                        '8' -> "delapan"
                        '9' -> "sembilan"
                        else -> ch.toString()
                    }
                }.joinToString(" ")

                val counterSpoken = counterName
                    .replace(Regex("(?i)LOKET\\s*0+(\\d+)"), "Loket $1")
                    .replace(Regex("(?i)LOKET\\s*(\\d+)"), "Loket $1")
                    .replace(Regex("(?i)LOKET"), "Loket")

                val qObj = try { JSONObject(activeQueueDataJson ?: "{}") } catch (_: Exception) { JSONObject() }
                val ticketLabel = ticketLabelOverride?.ifBlank { null }
                    ?: qObj.optString("ticketLabel", qObj.optString("ticket_label", "Nomor Antrian")).ifBlank { "Nomor Antrian" }
                val counterLabel = counterLabelOverride?.ifBlank { null }
                    ?: qObj.optString("counterLabel", qObj.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()

                val defaultCallTemplate = "{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}"
                val defaultRecallTemplate = "Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}"

                val rawTemplate = if (isRecall) {
                    ttsTemplateRecallOverride?.ifBlank { null }
                        ?: qObj.optString("ttsTemplateRecall", qObj.optString("tts_template_recall", defaultRecallTemplate)).ifBlank { defaultRecallTemplate }
                } else {
                    ttsTemplateCallOverride?.ifBlank { null }
                        ?: qObj.optString("ttsTemplateCall", qObj.optString("tts_template_call", defaultCallTemplate)).ifBlank { defaultCallTemplate }
                }

                // Ekstrak nomor/nama spesifik pos tanpa kata awalan (misal: "LOKET 01" -> "1", "POLI 02" -> "2", "Poli Gigi" -> "Gigi")
                val labelRegex = Regex("^(?:${Regex.escape(counterLabel)}|loket|poli|teller|kasir|meja|counter)\\s*", RegexOption.IGNORE_CASE)
                var cleanCounterName = counterName.replace(labelRegex, "").trim()
                if (cleanCounterName.matches(Regex("^0+\\d+$"))) {
                    cleanCounterName = cleanCounterName.replace(Regex("^0+"), "")
                }
                if (cleanCounterName.isBlank()) {
                    cleanCounterName = counterName.filter { it.isDigit() }.ifEmpty { "1" }
                }
                val counterNumOnly = counterName.filter { it.isDigit() }.ifEmpty { cleanCounterName }

                var operatorName = ""
                val countersArr = qObj.optJSONArray("counters")
                if (countersArr != null) {
                    for (i in 0 until countersArr.length()) {
                        val c = countersArr.optJSONObject(i)
                        val cName = c?.optString("counterName", c.optString("counter_name", ""))
                        if (cName.equals(counterName, ignoreCase = true)) {
                            operatorName = c?.optString("operatorName", c.optString("operator_name", "")) ?: ""
                            break
                        }
                    }
                }

                val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
                val timeGreeting = if (hour in 4..10) "selamat pagi" else if (hour in 11..14) "selamat siang" else if (hour in 15..17) "selamat sore" else "selamat malam"
                val timePeriod = if (hour in 4..10) "pagi" else if (hour in 11..14) "siang" else if (hour in 15..17) "sore" else "malam"
                val queueName = qObj.optString("name", "")
                val waitingCount = qObj.optInt("waitingTicketsCount", qObj.optInt("waiting_tickets_count", 0))

                val formattedTicket = if (prefix.isNotBlank()) "$prefix, $spokenDigits" else spokenDigits

                // Jika template mengandung {counter_label}, {counter_name} adalah nomor/nama spesifik pos
                val counterNameForTemplate = if (rawTemplate.contains("{counter_label}")) cleanCounterName else "$counterLabel $cleanCounterName".trim()

                val utteranceText = rawTemplate
                    .replace("{ticket_label}", ticketLabel)
                    .replace("{counter_label}", counterLabel)
                    .replace("{ticket_number}", formattedTicket)
                    .replace("{ticket_prefix}", prefix)
                    .replace("{ticket_digits}", spokenDigits)
                    .replace("{counter_name}", counterNameForTemplate)
                    .replace("{counter_number}", counterNumOnly)
                    .replace("{operator_name}", operatorName)
                    .replace("{petugas}", operatorName)
                    .replace("{queue_name}", queueName)
                    .replace("{nama_antrian}", queueName)
                    .replace("{salam}", timeGreeting)
                    .replace("{waktu}", timePeriod)
                    .replace("{waiting_count}", waitingCount.toString())
                    .replace("{sisa_antrian}", waitingCount.toString())
                    .replace(Regex("\\s+"), " ")
                    .trim()

                android.util.Log.i("PlayerActivity", "Chime & TTS [gen=$thisGen]: $utteranceText (isRecall=$isRecall)")

                // Putar Bell Chime Ding-Dong dulu, lalu lanjutkan pengucapan suara TTS
                playChimeTone(thisGen) {
                    if (currentSpeechGeneration != thisGen) return@playChimeTone

                    playTtsVoice(utteranceText, thisGen)
                }
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Error speakQueueTicket: ${e.message}")
                videoRenderers.forEach { it.setDuckedVolume(false) }
                val audioManager = getSystemService(android.content.Context.AUDIO_SERVICE) as? AudioManager
                audioManager?.abandonAudioFocus(null)
            }
        }
    }

    fun speakCounterStatus(counterName: String, status: String) {
        runOnUiThread {
            try {
                stopCurrentVoice()
                val thisGen = currentSpeechGeneration
                val audioManager = getSystemService(android.content.Context.AUDIO_SERVICE) as? AudioManager
                audioManager?.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                videoRenderers.forEach { it.setDuckedVolume(true) }

                val qObj = try { JSONObject(activeQueueDataJson ?: "{}") } catch (_: Exception) { JSONObject() }
                val counterLabel = qObj.optString("counterLabel", qObj.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()

                // Ekstrak nomor/nama spesifik pos tanpa kata awalan (misal: "LOKET 01" -> "1", "POLI 02" -> "2", "Poli Gigi" -> "Gigi")
                val labelRegex = Regex("^(?:${Regex.escape(counterLabel)}|loket|poli|teller|kasir|meja|counter)\\s*", RegexOption.IGNORE_CASE)
                var cleanCounterName = counterName.replace(labelRegex, "").trim()
                if (cleanCounterName.matches(Regex("^0+\\d+$"))) {
                    cleanCounterName = cleanCounterName.replace(Regex("^0+"), "")
                }
                if (cleanCounterName.isBlank()) {
                    cleanCounterName = counterName.filter { it.isDigit() }.ifEmpty { "1" }
                }
                val counterNumOnly = counterName.filter { it.isDigit() }.ifEmpty { cleanCounterName }

                var opName = ""
                val cArr = qObj.optJSONArray("counters")
                if (cArr != null) {
                    for (i in 0 until cArr.length()) {
                        val c = cArr.optJSONObject(i)
                        val cName = c?.optString("counterName", c.optString("counter_name", ""))
                        if (cName.equals(counterName, ignoreCase = true)) {
                            opName = c?.optString("operatorName", c.optString("operator_name", "")) ?: ""
                            break
                        }
                    }
                }

                // Template baku yang mengacu pada {counter_label} dan {counter_name}
                val defaultBreakTemplate = "{counter_label} {counter_name} sedang istirahat"
                val rawTemplate = when (status.uppercase()) {
                    "BREAK" -> qObj.optString("ttsTemplateBreak", qObj.optString("tts_template_break", defaultBreakTemplate)).ifBlank { defaultBreakTemplate }
                    "LOCKED" -> "{counter_label} {counter_name} telah ditutup"
                    else -> "{counter_label} {counter_name} siap melayani"
                }

                val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
                val timeGreeting = if (hour in 4..10) "selamat pagi" else if (hour in 11..14) "selamat siang" else if (hour in 15..17) "selamat sore" else "selamat malam"
                val timePeriod = if (hour in 4..10) "pagi" else if (hour in 11..14) "siang" else if (hour in 15..17) "sore" else "malam"
                val queueName = qObj.optString("name", "")

                val counterNameForTemplate = if (rawTemplate.contains("{counter_label}")) cleanCounterName else "$counterLabel $cleanCounterName".trim()

                val utteranceText = rawTemplate
                    .replace("{counter_label}", counterLabel)
                    .replace("{counter_name}", counterNameForTemplate)
                    .replace("{counter_number}", counterNumOnly)
                    .replace("{operator_name}", opName)
                    .replace("{petugas}", opName)
                    .replace("{queue_name}", queueName)
                    .replace("{nama_antrian}", queueName)
                    .replace("{salam}", timeGreeting)
                    .replace("{waktu}", timePeriod)
                    .replace(Regex("\\s+"), " ")
                    .trim()

                playChimeTone(thisGen) {
                    if (currentSpeechGeneration != thisGen) return@playChimeTone
                    playTtsVoice(utteranceText, thisGen)
                }
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Error speakCounterStatus: ${e.message}")
                videoRenderers.forEach { it.setDuckedVolume(false) }
            }
        }
    }

    private fun playTtsVoice(utteranceText: String, expectedGen: Long) {
        lifecycleScope.launch(Dispatchers.IO) {
            if (currentSpeechGeneration != expectedGen) return@launch

            var playedViaServerTts = false
            try {
                val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(this@PlayerActivity)
                val encodedText = java.net.URLEncoder.encode(utteranceText, "UTF-8")
                val ttsUrl = "$baseUrl/api/tts?text=$encodedText"

                val ttsCacheDir = java.io.File(cacheDir, "tts_cache").apply { if (!exists()) mkdirs() }
                val cacheFileName = "tts_" + utteranceText.hashCode().toUInt().toString(16) + ".mp3"
                val cachedFile = java.io.File(ttsCacheDir, cacheFileName)

                if (!cachedFile.exists() || cachedFile.length() == 0L) {
                    val request = Request.Builder()
                        .url(ttsUrl)
                        .header("User-Agent", "DKASigma-Signage-Android")
                        .build()
                    val response = streamingHttpClient.newCall(request).execute()
                    if (response.isSuccessful && response.body != null) {
                        val tempFile = java.io.File(ttsCacheDir, "$cacheFileName.tmp")
                        response.body!!.byteStream().use { input ->
                            java.io.FileOutputStream(tempFile).use { output ->
                                input.copyTo(output)
                            }
                        }
                        if (tempFile.length() > 0L) {
                            tempFile.renameTo(cachedFile)
                        } else {
                            tempFile.delete()
                        }
                    }
                }

                if (cachedFile.exists() && cachedFile.length() > 0L) {
                    withContext(Dispatchers.Main) {
                        if (currentSpeechGeneration == expectedGen) {
                            playTtsAudioFile(cachedFile, expectedGen)
                            playedViaServerTts = true
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.w("PlayerActivity", "Server TTS gagal: ${e.message}, fallback ke engine lokal...")
            }

            if (!playedViaServerTts) {
                withContext(Dispatchers.Main) {
                    if (currentSpeechGeneration == expectedGen) {
                        playLocalTtsOrFallback(utteranceText, expectedGen)
                    }
                }
            }
        }
    }

    private fun playTtsAudioFile(file: java.io.File, expectedGen: Long) {
        if (currentSpeechGeneration != expectedGen) return
        try {
            val mp = MediaPlayer().apply {
                setDataSource(file.absolutePath)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                setVolume(1.0f, 1.0f)
                setOnCompletionListener { player ->
                    player.release()
                    if (activeTtsPlayer === player) {
                        activeTtsPlayer = null
                    }
                    if (currentSpeechGeneration == expectedGen) {
                        finishSpeech(expectedGen)
                    }
                }
                setOnErrorListener { player, what, extra ->
                    android.util.Log.w("PlayerActivity", "TTS MediaPlayer error ($what, $extra), fallback ke local TTS")
                    player.release()
                    if (activeTtsPlayer === player) {
                        activeTtsPlayer = null
                    }
                    if (currentSpeechGeneration == expectedGen) {
                        finishSpeech(expectedGen)
                    }
                    true
                }
                prepare()
                try {
                    playbackParams = playbackParams.setSpeed(1.15f)
                } catch (_: Exception) {}
                start()
            }
            activeTtsPlayer = mp
        } catch (e: Exception) {
            android.util.Log.e("PlayerActivity", "Failed to start TTS MediaPlayer: ${e.message}")
            finishSpeech(expectedGen)
        }
    }

    private fun playLocalTtsOrFallback(utteranceText: String, expectedGen: Long) {
        if (currentSpeechGeneration != expectedGen) return

        if (textToSpeech != null && isTtsReady) {
            val utteranceId = "queue_${expectedGen}_${System.currentTimeMillis()}"
            currentUtteranceId = utteranceId
            val params = Bundle().apply {
                putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            }
            val result = textToSpeech?.speak(utteranceText, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            if (result == TextToSpeech.SUCCESS) {
                val timeoutRunnable = Runnable {
                    if (currentSpeechGeneration == expectedGen) {
                        finishSpeech(expectedGen)
                    }
                }
                speechTimeoutRunnable = timeoutRunnable
                watchdogHandler.postDelayed(timeoutRunnable, 8000)
                return
            }
        }

        // Jika local TTS tidak ada/gagal, tunggu efek kedip antrian selesai lalu bersihkan audio focus
        val fallbackTimeout = Runnable {
            if (currentSpeechGeneration == expectedGen) {
                finishSpeech(expectedGen)
            }
        }
        speechTimeoutRunnable = fallbackTimeout
        watchdogHandler.postDelayed(fallbackTimeout, 3500)
    }

    private fun setupViews() {
        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
        }

        canvasLayout = SignageCanvasLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(canvasLayout)

        loadingOverlay = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#E60B0F19"))
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val overlayContent = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER
                setMargins(64, 0, 64, 0)
            }
        }

        badgeText = TextView(this).apply {
            text = "● SINKRONISASI KONTEN REALTIME"
            setTextColor(Color.parseColor("#10B981"))
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }
        overlayContent.addView(badgeText)

        loadingText = TextView(this).apply {
            text = "Memulai DKASigma Player..."
            setTextColor(Color.WHITE)
            textSize = 24f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }
        overlayContent.addView(loadingText)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
            progress = 0
            val lp = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                24
            ).apply {
                setMargins(120, 0, 120, 24)
                gravity = android.view.Gravity.CENTER_HORIZONTAL
            }
            layoutParams = lp
        }
        overlayContent.addView(progressBar)

        subDetailText = TextView(this).apply {
            text = ""
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 14f
            gravity = android.view.Gravity.CENTER
            setLineSpacing(8f, 1f)
            setPadding(0, 0, 0, 0)
        }
        overlayContent.addView(subDetailText)

        loadingOverlay.addView(overlayContent)
        root.addView(loadingOverlay)

        setContentView(root)
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                when (state) {
                    is PlayerUiState.NotPaired -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        startActivity(Intent(this@PlayerActivity, PairingActivity::class.java))
                        finish()
                    }
                    is PlayerUiState.SyncingManifest -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        loadingOverlay.visibility = View.VISIBLE
                        badgeText.text = "● SINKRONISASI JADWAL"
                        badgeText.setTextColor(Color.parseColor("#38BDF8"))
                        loadingText.setTextColor(Color.WHITE)
                        subDetailText.setTextColor(Color.parseColor("#94A3B8"))
                        progressBar.isIndeterminate = true
                        loadingText.text = state.message
                        subDetailText.text = "Mengecek pembaruan jadwal dan integritas manifest..."
                    }
                    is PlayerUiState.DownloadingAssets -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        loadingOverlay.visibility = View.VISIBLE
                        badgeText.text = "● MENGUNDUH ASET MEDIA"
                        badgeText.setTextColor(Color.parseColor("#10B981"))
                        loadingText.setTextColor(Color.WHITE)
                        subDetailText.setTextColor(Color.parseColor("#94A3B8"))
                        progressBar.isIndeterminate = false
                        progressBar.progress = state.progressPercent

                        val downloadedMb = String.format(java.util.Locale.US, "%.1f", state.downloadedBytes / (1024.0 * 1024.0))
                        val totalMb = String.format(java.util.Locale.US, "%.1f", state.totalBytes / (1024.0 * 1024.0))

                        loadingText.text = "Mengunduh Aset Media (${state.assetIndex}/${state.total}) • ${state.progressPercent}%"
                        subDetailText.text = "${state.currentFileName}\n[ ${downloadedMb} MB / ${totalMb} MB ]\nLokasi: /storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/"

                        // Broadcast realtime download progress to CMS (Rollout page monitor)
                        val devId = deviceRepo.getSavedDeviceId()
                        if (!devId.isNullOrEmpty()) {
                            lifecycleScope.launch(Dispatchers.IO) {
                                try {
                                    val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(this@PlayerActivity)
                                    val payload = JSONObject().apply {
                                        put("deviceId", devId)
                                        put("type", "ASSET_DOWNLOAD_PROGRESS")
                                        put("assetIndex", state.assetIndex)
                                        put("totalAssets", state.total)
                                        put("progressPercent", state.progressPercent)
                                        put("downloadedBytes", state.downloadedBytes)
                                        put("totalBytes", state.totalBytes)
                                        put("fileName", state.currentFileName)
                                    }
                                    val mediaType = "application/json; charset=utf-8".toMediaType()
                                    val body = payload.toString().toRequestBody(mediaType)
                                    val postReq = Request.Builder()
                                        .url("$baseUrl/api/stream/device")
                                        .post(body)
                                        .build()
                                    streamingHttpClient.newCall(postReq).enqueue(object : okhttp3.Callback {
                                        override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {}
                                        override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                                            response.close()
                                        }
                                    })
                                } catch (_: Exception) {}
                            }
                        }
                    }
                    is PlayerUiState.Playing -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, true)
                        loadingOverlay.visibility = View.GONE
                        renderManifest(state.manifest)

                        // Broadcast 100% complete playback sync to CMS
                        val devId = deviceRepo.getSavedDeviceId()
                        if (!devId.isNullOrEmpty()) {
                            lifecycleScope.launch(Dispatchers.IO) {
                                try {
                                    val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(this@PlayerActivity)
                                    val payload = JSONObject().apply {
                                        put("deviceId", devId)
                                        put("type", "ASSET_DOWNLOAD_COMPLETE")
                                        put("progressPercent", 100)
                                        put("isSync", true)
                                    }
                                    val mediaType = "application/json; charset=utf-8".toMediaType()
                                    val body = payload.toString().toRequestBody(mediaType)
                                    val postReq = Request.Builder()
                                        .url("$baseUrl/api/stream/device")
                                        .post(body)
                                        .build()
                                    streamingHttpClient.newCall(postReq).enqueue(object : okhttp3.Callback {
                                        override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {}
                                        override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                                            response.close()
                                        }
                                    })
                                } catch (_: Exception) {}
                            }
                        }
                    }
                    is PlayerUiState.Error -> {
                        loadingOverlay.visibility = View.VISIBLE
                        badgeText.text = "⚠ KENDALA"
                        badgeText.setTextColor(Color.parseColor("#EF4444"))
                        loadingText.setTextColor(Color.parseColor("#EF4444"))
                        subDetailText.setTextColor(Color.parseColor("#FCA5A5"))
                        progressBar.isIndeterminate = false
                        progressBar.progress = 0
                        loadingText.text = "Kendala: ${state.message}"
                        subDetailText.text = "Menunggu perintah sinkronisasi dari server CMS..."
                    }
                    else -> Unit
                }
            }
        }
    }

    private fun renderManifest(manifest: Manifest) {
        android.util.Log.i("PlayerActivity", "renderManifest: layout=${manifest.layoutName}, zones=${manifest.zones.size}, assets=${manifest.requiredAssets.size}")
        releaseRenderers()
        canvasLayout.removeAllViews()

        canvasLayout.virtualWidth = manifest.canvasWidth
        canvasLayout.virtualHeight = manifest.canvasHeight

        val zoneViewPairs = mutableListOf<Pair<LayerZone, ZoneContainerView>>()

        val initialScaleX = canvasLayout.virtualWidth.takeIf { it > 0 }?.let { resources.displayMetrics.widthPixels.toFloat() / it } ?: 1.0f
        val initialScaleY = canvasLayout.virtualHeight.takeIf { it > 0 }?.let { resources.displayMetrics.heightPixels.toFloat() / it } ?: 1.0f

        for (zone in manifest.zones) {
            val zoneView = ZoneContainerView(this).apply {
                this.scaleFactorX = initialScaleX
                this.scaleFactorY = initialScaleY
                bindZone(zone)
            }
            zoneViewPairs.add(Pair(zone, zoneView))

            val widgetBlock = zone.blocks.find { it.widgetType != ZoneWidgetType.NONE }
            if (widgetBlock != null) {
                when (widgetBlock.widgetType) {
                    ZoneWidgetType.CLOCK -> {
                        val renderer = ClockZoneRenderer(this)
                        clockRenderers.add(renderer)
                        var city = "Makassar"
                        var showSeconds = true
                        var bgColor = "transparent"
                        var textColor = "#ffffff"
                        var subtitleColor = "#94a3b8"
                        var borderColor = "transparent"
                        var borderRadius = 0
                        var timeFontSize = 52f
                        var dateFontSize = 14f
                        if (!widgetBlock.widgetDataJson.isNullOrBlank()) {
                            try {
                                val json = org.json.JSONObject(widgetBlock.widgetDataJson)
                                city = json.optString("city", "Makassar")
                                showSeconds = json.optBoolean("showSeconds", true)
                                bgColor = json.optString("backgroundColor", "transparent").ifBlank { "transparent" }
                                textColor = json.optString("textColor", "#ffffff").ifBlank { "#ffffff" }
                                subtitleColor = json.optString("subtitleColor", "#94a3b8").ifBlank { "#94a3b8" }
                                borderColor = json.optString("borderColor", "transparent").ifBlank { "transparent" }
                                borderRadius = json.optInt("borderRadius", 0)
                                timeFontSize = json.optDouble("timeFontSize", 52.0).toFloat()
                                dateFontSize = json.optDouble("dateFontSize", 14.0).toFloat()
                            } catch (_: Exception) {}
                        }
                        val view = renderer.createView(
                            parent = zoneView,
                            city = city,
                            showSeconds = showSeconds,
                            backgroundColorHex = bgColor,
                            textColorHex = textColor,
                            subtitleColorHex = subtitleColor,
                            borderColorHex = borderColor,
                            borderRadiusDp = borderRadius,
                            timeFontSizeSp = timeFontSize,
                            dateFontSizeSp = dateFontSize
                        )
                        zoneView.addView(view)
                    }
                    ZoneWidgetType.TICKER -> {
                        val renderer = TickerZoneRenderer(this)
                        var textMessage = ""
                        var badgeText = ""
                        var fontSize = 16f
                        var speed = "normal"
                        var bgColor = "transparent"
                        var textColor = "#ffffff"
                        var badgeBgColor = "transparent"
                        var badgeTextColor = "#ffffff"
                        var borderColor = "transparent"
                        var borderRadius = 0
                        if (!widgetBlock.widgetDataJson.isNullOrBlank()) {
                            try {
                                val json = org.json.JSONObject(widgetBlock.widgetDataJson)
                                badgeText = json.optString("badge", "")
                                fontSize = json.optDouble("fontSize", 16.0).toFloat()
                                speed = json.optString("speed", "normal")
                                bgColor = json.optString("backgroundColor", "transparent").ifBlank { "transparent" }
                                textColor = json.optString("textColor", "#ffffff").ifBlank { "#ffffff" }
                                badgeBgColor = json.optString("badgeBackgroundColor", "transparent").ifBlank { "transparent" }
                                badgeTextColor = json.optString("badgeTextColor", "#ffffff").ifBlank { "#ffffff" }
                                borderColor = json.optString("borderColor", "transparent").ifBlank { "transparent" }
                                borderRadius = json.optInt("borderRadius", 0)

                                val msgArr = json.optJSONArray("messagesList") ?: json.optJSONArray("messages")
                                val msgs = mutableListOf<String>()
                                if (msgArr != null) {
                                    for (m in 0 until msgArr.length()) {
                                        val s = msgArr.optString(m)
                                        if (s.isNotBlank()) msgs.add(s)
                                    }
                                }
                                textMessage = if (msgs.isNotEmpty()) {
                                    msgs.joinToString("  ✦  ")
                                } else {
                                    json.optString("name", "DKASigma Teks Berjalan")
                                }
                            } catch (_: Exception) {}
                        }
                        val view = renderer.createView(
                            parent = zoneView,
                            textMessage = textMessage,
                            badgeText = badgeText,
                            fontSize = fontSize,
                            backgroundColorHex = bgColor,
                            textColorHex = textColor,
                            badgeBackgroundColorHex = badgeBgColor,
                            badgeTextColorHex = badgeTextColor,
                            borderColorHex = borderColor,
                            borderRadiusDp = borderRadius,
                            speed = speed
                        )
                        zoneView.addView(view)
                    }
                    ZoneWidgetType.QUEUE -> {
                        val renderer = QueueZoneRenderer(
                            context = this,
                            onCallAudioStarted = {
                                videoRenderers.forEach { it.setDuckedVolume(true) }
                            },
                            onCallAudioFinished = {
                                videoRenderers.forEach { it.setDuckedVolume(false) }
                            },
                            onUserTapNext = { ticketNum, counterNm ->
                                android.util.Log.i("PlayerActivity", "Layar player disentuh! Memanggil nomor antrian: $ticketNum di $counterNm")
                                speakQueueTicket(ticketNum, counterNm)

                                // Broadcast ke server via SSE POST agar CMS web dan perangkat lain langsung sinkron
                                try {
                                    val currentDevId = deviceRepo.getSavedDeviceId() ?: ""
                                    val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(this@PlayerActivity)
                                    val payload = JSONObject().apply {
                                        put("deviceId", "all")
                                        put("type", "CALL_QUEUE")
                                        put("queueId", activeQueueDisplayId)
                                        put("queueName", "Layar Antrian")
                                        put("ticketNumber", ticketNum)
                                        put("counterName", counterNm)
                                        put("source", "player_touch")
                                        put("sourceDeviceId", currentDevId)
                                    }
                                    val mediaType = "application/json; charset=utf-8".toMediaType()
                                    val body = payload.toString().toRequestBody(mediaType)
                                    val postReq = Request.Builder()
                                        .url("$baseUrl/api/stream/device")
                                        .post(body)
                                        .build()
                                    streamingHttpClient.newCall(postReq).enqueue(object : okhttp3.Callback {
                                        override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                                            android.util.Log.w("PlayerActivity", "Gagal sync sentuh antrian ke server: ${e.message}")
                                        }
                                        override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                                            response.close()
                                        }
                                    })
                                } catch (e: Exception) {
                                    android.util.Log.w("PlayerActivity", "Gagal kirim broadcast sentuh antrian: ${e.message}")
                                }
                            }
                        )
                        activeQueueRenderer = renderer
                        activeQueueDataJson = widgetBlock.widgetDataJson
                        activeQueueDisplayId = try {
                            val qObj = org.json.JSONObject(widgetBlock.widgetDataJson ?: "{}")
                            qObj.optString("id", qObj.optString("queueDisplayId", ""))
                        } catch (_: Exception) { "" }
                        val view = renderer.createView(zoneView, widgetBlock.widgetDataJson)
                        zoneView.addView(view)
                    }
                    ZoneWidgetType.WEBVIEW -> {
                        val renderer = WebviewZoneRenderer(this)
                        var url = "https://google.com"
                        var zoomPercent = 100
                        if (!widgetBlock.widgetDataJson.isNullOrBlank()) {
                            try {
                                val json = org.json.JSONObject(widgetBlock.widgetDataJson)
                                url = json.optString("url", "https://google.com")
                                zoomPercent = json.optInt("zoomPercent", 100)
                            } catch (_: Exception) {}
                        }
                        val view = renderer.createView(zoneView, url, zoomPercent)
                        zoneView.addView(view)
                    }
                    else -> Unit
                }
            } else {
                // Media Blocks (Videos / Images)
                val videoItems = mutableListOf<VideoPlaylistItem>()
                var firstImageFile: File? = null

                for (block in zone.blocks) {
                    if (block.playlistItems.isNotEmpty()) {
                        for (item in block.playlistItems.sortedBy { it.position }) {
                            val mediaId = item.mediaItemId
                            val file = storageRepo.getLocalFileForAsset(mediaId) ?: continue
                            val asset = manifest.requiredAssets.find { it.mediaId == mediaId }
                            val isVideo = asset?.localFilename?.endsWith(".mp4", ignoreCase = true) == true
                                || asset?.url?.endsWith(".mp4", ignoreCase = true) == true
                                || asset?.mediaType == MediaType.VIDEO
                                || isVideoFile(file)

                            if (isVideo) {
                                videoItems.add(
                                    VideoPlaylistItem(
                                        file = file,
                                        durationSeconds = item.durationSeconds,
                                        isMuted = item.isMuted || block.isMuted,
                                        mediaId = mediaId,
                                        mediaName = asset?.localFilename ?: file.name,
                                        volumeLevel = item.volumeLevel
                                    )
                                )
                            } else if (firstImageFile == null) {
                                firstImageFile = file
                            }
                        }
                    } else {
                        val mediaId = block.mediaItemId ?: continue
                        val file = storageRepo.getLocalFileForAsset(mediaId) ?: continue
                        val asset = manifest.requiredAssets.find { it.mediaId == mediaId }
                        val isVideo = asset?.localFilename?.endsWith(".mp4", ignoreCase = true) == true
                            || asset?.url?.endsWith(".mp4", ignoreCase = true) == true
                            || asset?.mediaType == MediaType.VIDEO
                            || isVideoFile(file)

                        if (isVideo) {
                            videoItems.add(
                                VideoPlaylistItem(
                                    file = file,
                                    durationSeconds = block.durationSeconds,
                                    isMuted = block.isMuted,
                                    mediaId = mediaId,
                                    mediaName = asset?.localFilename ?: file.name,
                                    volumeLevel = block.volumeLevel
                                )
                            )
                        } else if (firstImageFile == null) {
                            firstImageFile = file
                        }
                    }
                }

                if (videoItems.isNotEmpty()) {
                    val renderer = VideoZoneRenderer(this, zone.name.ifEmpty { "Zone ${videoRenderers.size + 1}" })
                    videoRenderers.add(renderer)
                    val view = renderer.createPlaylistView(zoneView, videoItems)
                    zoneView.addView(view)
                } else if (firstImageFile != null) {
                    val renderer = ImageZoneRenderer(this)
                    val view = renderer.createView(zoneView, firstImageFile)
                    zoneView.addView(view)
                }
            }

            canvasLayout.addView(zoneView)
        }

        val layoutDuration = manifest.zones.flatMap { it.blocks }.maxOfOrNull {
            it.startTimeSeconds + it.durationSeconds
        }?.coerceAtLeast(1) ?: 10

        val playStartTime = System.currentTimeMillis()
        timelineJob = lifecycleScope.launch {
            while (isActive) {
                val elapsed = ((System.currentTimeMillis() - playStartTime) / 1000) % layoutDuration
                for ((z, zView) in zoneViewPairs) {
                    val hasActiveBlock = z.blocks.any { b ->
                        elapsed >= b.startTimeSeconds && elapsed < (b.startTimeSeconds + b.durationSeconds)
                    }
                    zView.visibility = if (hasActiveBlock) View.VISIBLE else View.INVISIBLE
                }
                delay(500)
            }
        }
    }

    private fun isVideoFile(file: File): Boolean {
        if (file.name.endsWith(".mp4", ignoreCase = true) || file.extension.equals("video", ignoreCase = true)) return true
        return try {
            if (file.length() > 12) {
                java.io.FileInputStream(file).use { fis ->
                    val header = ByteArray(12)
                    if (fis.read(header) == 12) {
                        val signature = String(header, 4, 4, java.nio.charset.StandardCharsets.ISO_8859_1)
                        signature == "ftyp" || signature == "moov"
                    } else false
                }
            } else false
        } catch (_: Exception) {
            false
        }
    }

    private fun releaseRenderers() {
        timelineJob?.cancel()
        timelineJob = null
        activeQueueRenderer?.stopCallEffect()
        activeQueueRenderer = null
        activeQueueDisplayId = ""
        activeQueueDataJson = null
        videoRenderers.forEach { it.release() }
        videoRenderers.clear()
        clockRenderers.forEach { it.release() }
        clockRenderers.clear()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            try {
                val insetsController = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
                insetsController.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
            } catch (_: Throwable) {}
        }
    }

    private fun startRealtimeDeviceStream() {
        val deviceId = deviceRepo.getSavedDeviceId()
        if (deviceId.isNullOrEmpty()) return

        realtimeStreamJob?.cancel()
        realtimeStreamJob = lifecycleScope.launch(Dispatchers.IO) {
            val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(this@PlayerActivity)

            while (isActive) {
                try {
                    val request = Request.Builder()
                        .url("$baseUrl/api/stream/device?deviceId=$deviceId")
                        .addHeader("Accept", "text/event-stream")
                        .build()

                    val response = streamingHttpClient.newCall(request).execute()
                    if (response.isSuccessful) {
                        // Sinkronisasi otomatis saat terhubung / reconnecting setelah offline
                        syncActiveQueueStateOnReconnect(baseUrl)

                        val inputStream = response.body?.byteStream()
                        if (inputStream != null) {
                            inputStream.bufferedReader().useLines { lines ->
                                for (line in lines) {
                                    if (!isActive) break
                                    if (line.startsWith("data: ")) {
                                        val jsonStr = line.substring(6).trim()
                                        try {
                                            val data = JSONObject(jsonStr)
                                            handleRealtimeEvent(data)
                                        } catch (_: Exception) {}
                                    }
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.w("PlayerActivity", "SSE Stream disconnected: ${e.message}, reconnecting in 3s...")
                }
                delay(3000)
            }
        }
    }

    private fun syncActiveQueueStateOnReconnect(baseUrl: String) {
        val qId = activeQueueDisplayId
        if (qId.isBlank()) return

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val syncUrl = "$baseUrl/api/grpc/studio/queue/GetQueueSyncState?queueDisplayId=$qId"
                val syncReq = Request.Builder()
                    .url(syncUrl)
                    .get()
                    .build()

                val syncResp = streamingHttpClient.newCall(syncReq).execute()
                if (syncResp.isSuccessful) {
                    val respBody = syncResp.body?.string()
                    if (!respBody.isNullOrBlank()) {
                        val syncObj = JSONObject(respBody)
                        val latestNum = syncObj.optString("latestCalledNumber", syncObj.optString("latest_called_number", ""))
                        val counterNm = syncObj.optString("currentCounterName", syncObj.optString("current_counter_name", "LOKET 01"))
                        val tLabel = syncObj.optString("ticketLabel", syncObj.optString("ticket_label", ""))
                        val cLabel = syncObj.optString("counterLabel", syncObj.optString("counter_label", ""))
                        val ttsCall = syncObj.optString("ttsTemplateCall", syncObj.optString("tts_template_call", ""))
                        val ttsRecall = syncObj.optString("ttsTemplateRecall", syncObj.optString("tts_template_recall", ""))
                        val ttsBreak = syncObj.optString("ttsTemplateBreak", syncObj.optString("tts_template_break", ""))

                        try {
                            val curJson = JSONObject(activeQueueDataJson ?: "{}")
                            if (tLabel.isNotBlank()) curJson.put("ticketLabel", tLabel)
                            if (cLabel.isNotBlank()) curJson.put("counterLabel", cLabel)
                            if (ttsCall.isNotBlank()) curJson.put("ttsTemplateCall", ttsCall)
                            if (ttsRecall.isNotBlank()) curJson.put("ttsTemplateRecall", ttsRecall)
                            if (ttsBreak.isNotBlank()) curJson.put("ttsTemplateBreak", ttsBreak)
                            if (latestNum.isNotBlank()) curJson.put("latestCalledNumber", latestNum)
                            activeQueueDataJson = curJson.toString()
                        } catch (_: Exception) {}

                        runOnUiThread {
                            val renderer = activeQueueRenderer
                            if (renderer != null && latestNum.isNotBlank()) {
                                renderer.updateCall(latestNum, counterNm)
                                android.util.Log.i("PlayerActivity", "Rekonsiliasi antrian selesai setelah online: $latestNum di $counterNm")
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.w("PlayerActivity", "Gagal rekonsiliasi antrian saat rekoneksi: ${e.message}")
            }
        }
    }

    private fun handleRealtimeEvent(data: JSONObject) {
        val type = data.optString("type", "")
        runOnUiThread {
            when (type) {
                "CHUNK_PROGRESS" -> {
                    val chunkIndex = data.optInt("chunkIndex", 0)
                    val completedChunks = data.optInt("completedChunks", chunkIndex + 1)
                    val totalChunks = data.optInt("totalChunks", 1)
                    val percent = data.optInt("percent", 0)
                    val uploadedBytes = data.optLong("uploadedBytes", 0L)
                    val totalBytes = data.optLong("totalBytes", 0L)
                    val fileName = data.optString("fileName", "Media Asset")

                    loadingOverlay.visibility = View.VISIBLE
                    badgeText.text = "● SINKRONISASI KONTEN REALTIME"
                    badgeText.setTextColor(Color.parseColor("#10B981"))
                    loadingText.setTextColor(Color.WHITE)
                    subDetailText.setTextColor(Color.parseColor("#94A3B8"))

                    progressBar.isIndeterminate = false
                    progressBar.progress = percent

                    val uploadedMb = String.format(java.util.Locale.US, "%.1f", uploadedBytes / (1024.0 * 1024.0))
                    val totalMb = String.format(java.util.Locale.US, "%.1f", totalBytes / (1024.0 * 1024.0))

                    loadingText.text = "Menerima Transmisi Chunk (${completedChunks}/${totalChunks}) • ${percent}%"
                    subDetailText.text = "${fileName}\n[ ${uploadedMb} MB / ${totalMb} MB ]\nLokasi: /storage/emulated/0/Android/data/com.dkaapis/sigma/files/assets/"
                }
                "COMPLETE" -> {
                    val totalChunks = data.optInt("totalChunks", 1)
                    val fileName = data.optString("fileName", "Media")
                    progressBar.isIndeterminate = false
                    progressBar.progress = 100

                    badgeText.text = "✓ TERVERIFIKASI"
                    badgeText.setTextColor(Color.parseColor("#10B981"))
                    loadingText.setTextColor(Color.WHITE)
                    subDetailText.setTextColor(Color.parseColor("#94A3B8"))

                    loadingText.text = "Transmisi Seluruh Chunk Selesai (SHA-256 Valid)"
                    subDetailText.text = "${fileName}\nSeluruh ${totalChunks} chunk berhasil diterima & terverifikasi."

                    watchdogHandler.postDelayed({
                        if (viewModel.uiState.value is PlayerUiState.Playing) {
                            loadingOverlay.visibility = View.GONE
                        }
                    }, 2000)
                }
                "CANCELLED" -> {
                    val fileName = data.optString("fileName", "")
                    loadingOverlay.visibility = View.VISIBLE
                    progressBar.isIndeterminate = false
                    progressBar.progress = 0

                    // Warna merah menyala untuk status dibatalkan
                    badgeText.text = "✖ DIBATALKAN"
                    badgeText.setTextColor(Color.parseColor("#EF4444"))

                    loadingText.text = "Transmisi Chunk Dibatalkan"
                    loadingText.setTextColor(Color.parseColor("#EF4444"))

                    subDetailText.text = if (fileName.isNotBlank()) {
                        "${fileName}\nPengunggahan berkas dibatalkan oleh pengguna dari CMS."
                    } else {
                        "Pengunggahan berkas dibatalkan oleh pengguna dari CMS."
                    }
                    subDetailText.setTextColor(Color.parseColor("#FCA5A5"))

                    watchdogHandler.postDelayed({
                        if (viewModel.uiState.value is PlayerUiState.Playing) {
                            loadingOverlay.visibility = View.GONE
                        }
                    }, 2500)
                }
                "RELOAD" -> {
                    viewModel.syncManifest(force = true)
                }
                "CLEAR_CACHE" -> {
                    handleClearCacheCommand()
                }
                "SCREENSHOT" -> {
                    handleCaptureScreenshotCommand()
                }
                "REBOOT" -> {
                    handleRebootCommand()
                }
                "UNPAIR", "DECOMMISSION" -> {
                    deviceRepo.clearCredentials()
                    viewModel.onDeviceUnpaired()
                }
                "CALL_QUEUE", "QUEUE_CALL" -> {
                    val targetQueueId = data.optString("queueId", data.optString("queue_id", ""))
                    val ticketNumber = data.optString("ticketNumber", data.optString("ticket_number", ""))
                    val counterName = data.optString("counterName", data.optString("counter_name", "LOKET 01"))
                    val callType = data.optString("callType", data.optString("call_type", "next"))
                    val isRecall = callType.equals("recall", ignoreCase = true) || callType.equals("repeat", ignoreCase = true)
                    val source = data.optString("source", "")
                    val sourceDeviceId = data.optString("sourceDeviceId", "")
                    val currentDevId = deviceRepo.getSavedDeviceId() ?: ""

                    // Bila event berasal dari sentuhan layar player ini sendiri, abaikan echo
                    if (source == "player_touch" && sourceDeviceId.isNotBlank() && sourceDeviceId == currentDevId) {
                        return@runOnUiThread
                    }

                    val queueRenderer = activeQueueRenderer ?: run {
                        android.util.Log.i("PlayerActivity", "Panggilan diabaikan: player saat ini tidak sedang memutar antrian.")
                        return@runOnUiThread
                    }

                    if (targetQueueId.isNotBlank() && activeQueueDisplayId.isNotBlank() && targetQueueId != activeQueueDisplayId) {
                        android.util.Log.i("PlayerActivity", "Panggilan diabaikan: target queue $targetQueueId tidak cocok dengan antrian aktif $activeQueueDisplayId.")
                        return@runOnUiThread
                    }

                    if (ticketNumber.isNotBlank()) {
                        queueRenderer.updateCall(ticketNumber, counterName)
                        val tLabel = data.optString("ticketLabel", data.optString("ticket_label", ""))
                        val cLabel = data.optString("counterLabel", data.optString("counter_label", ""))
                        val ttsCall = data.optString("ttsTemplateCall", data.optString("tts_template_call", ""))
                        val ttsRecall = data.optString("ttsTemplateRecall", data.optString("tts_template_recall", ""))
                        speakQueueTicket(ticketNumber, counterName, isRecall, tLabel, cLabel, ttsCall, ttsRecall)
                    }
                }
                "RESET_QUEUE" -> {
                    val targetQueueId = data.optString("queueId", data.optString("queue_id", ""))
                    val resetToNumber = data.optString("resetToNumber", data.optString("reset_to_number", ""))
                    val queueRenderer = activeQueueRenderer ?: return@runOnUiThread
                    if (targetQueueId.isNotBlank() && activeQueueDisplayId.isNotBlank() && targetQueueId != activeQueueDisplayId) {
                        return@runOnUiThread
                    }
                    queueRenderer.resetQueue(resetToNumber)
                }
                "COUNTER_STATUS_CHANGED" -> {
                    val targetQueueId = data.optString("queueId", data.optString("queue_id", ""))
                    val counterName = data.optString("counterName", data.optString("counter_name", "LOKET 01"))
                    val status = data.optString("status", "ACTIVE")
                    val queueRenderer = activeQueueRenderer ?: return@runOnUiThread
                    if (targetQueueId.isNotBlank() && activeQueueDisplayId.isNotBlank() && targetQueueId != activeQueueDisplayId) {
                        return@runOnUiThread
                    }
                    queueRenderer.setCounterStatus(counterName, status)
                    speakCounterStatus(counterName, status)
                }
            }
        }
    }

    private var isCapturingScreenshot = false

    private fun handleClearCacheCommand() {
        runOnUiThread {
            try {
                android.util.Log.i("PlayerActivity", "Menerima perintah ClearCache. Membersihkan penyimpanan lokal...")
                val diskCache = MediaDiskCache(this)
                diskCache.clearAllCache()

                val manifestStorage = ManifestStorage(this)
                manifestStorage.clear()

                loadingOverlay.visibility = View.VISIBLE
                progressBar.isIndeterminate = true
                badgeText.text = "● BERSIHKAN CACHE"
                badgeText.setTextColor(Color.parseColor("#F59E0B"))
                loadingText.text = "Membersihkan Cache Media Lokal..."
                loadingText.setTextColor(Color.WHITE)
                subDetailText.text = "Seluruh cache berkas media dihapus. Mengunduh ulang manifest dan konten..."
                subDetailText.setTextColor(Color.parseColor("#94A3B8"))

                watchdogHandler.postDelayed({
                    viewModel.syncManifest(force = true)
                }, 1000)
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Gagal membersihkan cache: ${e.message}")
            }
        }
    }

    private fun handleCaptureScreenshotCommand() {
        if (isCapturingScreenshot) return
        isCapturingScreenshot = true
        android.util.Log.i("PlayerActivity", "Menerima perintah CaptureScreenshot. Mengambil screenshot tampilan layar...")

        captureScreen { imageBytes ->
            if (imageBytes != null && imageBytes.isNotEmpty()) {
                uploadScreenshot(imageBytes)
            } else {
                isCapturingScreenshot = false
                android.util.Log.e("PlayerActivity", "Gagal menghasilkan byte screenshot")
            }
        }
    }

    private fun captureScreen(onCaptured: (ByteArray?) -> Unit) {
        try {
            val decorView = window.decorView
            val width = decorView.width.coerceAtLeast(1)
            val height = decorView.height.coerceAtLeast(1)

            val maxDim = 1280f
            val currentMax = maxOf(width, height).toFloat()
            val scale = if (currentMax > maxDim) maxDim / currentMax else 1.0f
            val targetW = (width * scale).toInt().coerceAtLeast(1)
            val targetH = (height * scale).toInt().coerceAtLeast(1)

            val bitmap = Bitmap.createBitmap(targetW, targetH, Bitmap.Config.ARGB_8888)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PixelCopy.request(
                    window,
                    bitmap,
                    { copyResult ->
                        if (copyResult == PixelCopy.SUCCESS) {
                            val stream = ByteArrayOutputStream()
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
                            onCaptured(stream.toByteArray())
                        } else {
                            captureWithCanvas(decorView, targetW, targetH, onCaptured)
                        }
                    },
                    Handler(Looper.getMainLooper())
                )
            } else {
                captureWithCanvas(decorView, targetW, targetH, onCaptured)
            }
        } catch (e: Exception) {
            android.util.Log.e("PlayerActivity", "Gagal captureScreen: ${e.message}")
            onCaptured(null)
        }
    }

    private fun captureWithCanvas(view: View, targetW: Int, targetH: Int, onCaptured: (ByteArray?) -> Unit) {
        try {
            val srcW = view.width.coerceAtLeast(1)
            val srcH = view.height.coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(srcW, srcH, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            view.draw(canvas)
            val scaled = if (srcW != targetW || srcH != targetH) {
                Bitmap.createScaledBitmap(bitmap, targetW, targetH, true)
            } else {
                bitmap
            }
            val stream = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 80, stream)
            onCaptured(stream.toByteArray())
        } catch (e: Exception) {
            android.util.Log.e("PlayerActivity", "Canvas capture failed: ${e.message}")
            onCaptured(null)
        }
    }

    private fun uploadScreenshot(imageBytes: ByteArray) {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val deviceId = deviceRepo.getSavedDeviceId() ?: return@launch
                val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(this@PlayerActivity)

                val base64Image = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
                val jsonBody = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("imageData", base64Image)
                    put("mimeType", "image/jpeg")
                }.toString()

                val request = Request.Builder()
                    .url("$baseUrl/api/grpc/distribution/stream/UploadScreenshot")
                    .post(jsonBody.toRequestBody("application/json".toMediaType()))
                    .build()

                val client = OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(20, TimeUnit.SECONDS)
                    .build()

                val response = client.newCall(request).execute()
                android.util.Log.i("PlayerActivity", "Upload screenshot selesai: HTTP ${response.code}")
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Gagal upload screenshot: ${e.message}")
            } finally {
                isCapturingScreenshot = false
            }
        }
    }

    private fun handleRebootCommand() {
        runOnUiThread {
            try {
                android.util.Log.i("PlayerActivity", "Menerima perintah RebootPlayer. Memuat ulang aplikasi...")
                val intent = packageManager.getLaunchIntentForPackage(packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(intent)
                    finish()
                    Runtime.getRuntime().exit(0)
                }
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Gagal restart: ${e.message}")
            }
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        when (level) {
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL,
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW -> {
                android.util.Log.w("PlayerActivity", "Alokasi memori mendekati batas kritis (level $level). Membebaskan cache sekunder...")
                try {
                    coil.Coil.imageLoader(this).memoryCache?.clear()
                } catch (_: Exception) {}
                System.gc()
            }
            ComponentCallbacks2.TRIM_MEMORY_BACKGROUND,
            ComponentCallbacks2.TRIM_MEMORY_MODERATE,
            ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                try {
                    coil.Coil.imageLoader(this).memoryCache?.clear()
                } catch (_: Exception) {}
            }
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        android.util.Log.w("PlayerActivity", "onLowMemory diterima dari sistem OS Android! Membebaskan seluruh cache sekunder...")
        try {
            coil.Coil.imageLoader(this).memoryCache?.clear()
        } catch (_: Exception) {}
        System.gc()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopCurrentVoice()
        realtimeStreamJob?.cancel()
        watchdogHandler.removeCallbacks(watchdogHeartbeatRunnable)
        releaseRenderers()
        try {
            textToSpeech?.stop()
            textToSpeech?.shutdown()
            textToSpeech = null
        } catch (_: Exception) {}
    }
}
