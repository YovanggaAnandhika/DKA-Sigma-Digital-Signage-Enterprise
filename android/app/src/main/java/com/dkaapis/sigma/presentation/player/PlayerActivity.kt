package com.dkaapis.sigma.presentation.player

import android.content.ComponentCallbacks2
import android.content.Intent
import android.content.pm.ActivityInfo
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
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false
    private var timelineJob: Job? = null

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
                            val ex = res.exceptionOrNull()
                            if (!deviceRepo.isPaired() || ex is IllegalStateException) {
                                viewModel.onDeviceUnpaired()
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
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Aktifkan mode layar penuh (Immersive Fullscreen) & gunakan area cutout kamera/notch
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
        val insetsController = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
        insetsController.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
        insetsController.systemBarsBehavior =
            androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

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
                if (status == TextToSpeech.SUCCESS) {
                    val idLocale = Locale("id", "ID")
                    val available = textToSpeech?.isLanguageAvailable(idLocale)
                    if (available != TextToSpeech.LANG_MISSING_DATA && available != TextToSpeech.LANG_NOT_SUPPORTED) {
                        textToSpeech?.language = idLocale
                    } else {
                        textToSpeech?.language = Locale.getDefault()
                    }
                    textToSpeech?.setSpeechRate(0.92f)
                    textToSpeech?.setPitch(1.0f)
                    isTtsReady = true

                    textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                        override fun onStart(utteranceId: String?) {
                            runOnUiThread {
                                videoRenderers.forEach { it.setDuckedVolume(true) }
                            }
                        }

                        override fun onDone(utteranceId: String?) {
                            runOnUiThread {
                                videoRenderers.forEach { it.setDuckedVolume(false) }
                            }
                        }

                        override fun onError(utteranceId: String?) {
                            runOnUiThread {
                                videoRenderers.forEach { it.setDuckedVolume(false) }
                            }
                        }
                    })
                    android.util.Log.i("PlayerActivity", "Android TextToSpeech engine siap (Bahasa Indonesia)")
                } else {
                    android.util.Log.w("PlayerActivity", "Inisialisasi TextToSpeech gagal, status: $status")
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("PlayerActivity", "Gagal inisialisasi TTS: ${e.message}")
        }
    }

    fun speakQueueTicket(ticketNumber: String, counterName: String) {
        runOnUiThread {
            try {
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
                    .replace("LOKET 0", "Loket ")
                    .replace("LOKET ", "Loket ")

                val utteranceText = "Nomor antrian... $prefix... $spokenDigits... Silakan menuju... $counterSpoken"
                android.util.Log.i("PlayerActivity", "TTS Mengucapkan: $utteranceText")

                if (textToSpeech != null && isTtsReady) {
                    val params = Bundle().apply {
                        putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "queue_${System.currentTimeMillis()}")
                    }
                    textToSpeech?.speak(utteranceText, TextToSpeech.QUEUE_FLUSH, params, "queue_${System.currentTimeMillis()}")
                } else {
                    watchdogHandler.postDelayed({
                        videoRenderers.forEach { it.setDuckedVolume(false) }
                    }, 3500)
                }
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Error speakQueueTicket: ${e.message}")
                videoRenderers.forEach { it.setDuckedVolume(false) }
            }
        }
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
                maxWidth = 1000
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
                    }
                    is PlayerUiState.Playing -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, true)
                        loadingOverlay.visibility = View.GONE
                        renderManifest(state.manifest)
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

        for (zone in manifest.zones) {
            val zoneView = ZoneContainerView(this).apply {
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
                            borderRadiusDp = borderRadius
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
                            }
                        )
                        activeQueueRenderer = renderer
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
                                mediaName = asset?.localFilename ?: file.name
                            )
                        )
                    } else if (firstImageFile == null) {
                        firstImageFile = file
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
        videoRenderers.forEach { it.release() }
        videoRenderers.clear()
        clockRenderers.forEach { it.release() }
        clockRenderers.clear()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            val insetsController = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            insetsController.hide(androidx.core.view.WindowInsetsCompat.Type.systemBars())
        }
    }

    private fun startRealtimeDeviceStream() {
        val deviceId = deviceRepo.getSavedDeviceId()
        if (deviceId.isNullOrEmpty()) return

        realtimeStreamJob?.cancel()
        realtimeStreamJob = lifecycleScope.launch(Dispatchers.IO) {
            val baseUrl = try {
                getString(com.dkaapis.sigma.R.string.server_http_base_url)
            } catch (_: Exception) {
                "http://100.99.242.84:80"
            }

            while (isActive) {
                try {
                    val request = Request.Builder()
                        .url("$baseUrl/api/stream/device?deviceId=$deviceId")
                        .addHeader("Accept", "text/event-stream")
                        .build()

                    val response = streamingHttpClient.newCall(request).execute()
                    if (response.isSuccessful) {
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
                    subDetailText.text = "${fileName}\n[ ${uploadedMb} MB / ${totalMb} MB ]\nLokasi: /storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/"
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
                val baseUrl = try {
                    getString(R.string.server_http_base_url)
                } catch (_: Exception) {
                    "http://192.168.1.46:80"
                }

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
        realtimeStreamJob?.cancel()
        watchdogHandler.removeCallbacks(watchdogHeartbeatRunnable)
        releaseRenderers()
    }
}
