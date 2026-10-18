package com.dkaapis.sigma.presentation.player

import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
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
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

class PlayerActivity : AppCompatActivity() {

    private lateinit var viewModel: PlayerViewModel
    private lateinit var deviceRepo: DeviceRepositoryImpl
    private lateinit var storageRepo: MediaStorageRepositoryImpl
    private lateinit var canvasLayout: SignageCanvasLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingText: TextView
    private lateinit var subDetailText: TextView
    private lateinit var progressBar: ProgressBar

    private var realtimeStreamJob: Job? = null
    private val streamingHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val videoRenderers = mutableListOf<VideoZoneRenderer>()
    private val clockRenderers = mutableListOf<ClockZoneRenderer>()
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
                        } else if (res.getOrDefault(false)) {
                            viewModel.syncManifest()
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

        val registerUseCase = RegisterAndPairUseCase(deviceRepo)
        val syncUseCase = SyncManifestUseCase(deviceRepo, manifestRepo)
        val downloadUseCase = DownloadAndVerifyMediaUseCase(storageRepo)

        viewModel = PlayerViewModel(registerUseCase, syncUseCase, downloadUseCase)
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
            setBackgroundColor(Color.parseColor("#B3050B14"))
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val cardContainer = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            val bgDrawable = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#141E33"))
                cornerRadius = 24f
                setStroke(2, Color.parseColor("#2563EB"))
            }
            background = bgDrawable
            setPadding(48, 36, 48, 36)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER
            }
        }

        val badgeText = TextView(this).apply {
            text = "● SINKRONISASI KONTEN REALTIME"
            setTextColor(Color.parseColor("#10B981"))
            textSize = 12f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, 0, 0, 12)
        }
        cardContainer.addView(badgeText)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
            progress = 0
            val lp = android.widget.LinearLayout.LayoutParams(600, 16)
            lp.setMargins(0, 8, 0, 16)
            layoutParams = lp
        }
        cardContainer.addView(progressBar)

        loadingText = TextView(this).apply {
            text = "Memulai DKASigma Player..."
            setTextColor(Color.WHITE)
            textSize = 15f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
        }
        cardContainer.addView(loadingText)

        subDetailText = TextView(this).apply {
            text = ""
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 12f
            gravity = android.view.Gravity.CENTER
            setPadding(0, 6, 0, 0)
        }
        cardContainer.addView(subDetailText)

        loadingOverlay.addView(cardContainer)
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
                        progressBar.isIndeterminate = true
                        loadingText.text = state.message
                        subDetailText.text = "Mengecek pembaruan jadwal dan integritas manifest..."
                    }
                    is PlayerUiState.DownloadingAssets -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        loadingOverlay.visibility = View.VISIBLE
                        progressBar.isIndeterminate = false
                        progressBar.progress = state.progressPercent

                        val downloadedMb = String.format(java.util.Locale.US, "%.1f", state.downloadedBytes / (1024.0 * 1024.0))
                        val totalMb = String.format(java.util.Locale.US, "%.1f", state.totalBytes / (1024.0 * 1024.0))

                        loadingText.text = "Mengunduh Chunk Media (${state.assetIndex}/${state.total}) • ${state.progressPercent}%"
                        subDetailText.text = "${state.currentFileName}\n[ ${downloadedMb} MB / ${totalMb} MB ]\nLokasi: /storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/"
                    }
                    is PlayerUiState.Playing -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, true)
                        loadingOverlay.visibility = View.GONE
                        renderManifest(state.manifest)
                    }
                    is PlayerUiState.Error -> {
                        loadingOverlay.visibility = View.VISIBLE
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
                            this,
                            onCallAudioStarted = {
                                videoRenderers.forEach { it.setDuckedVolume(true) }
                            },
                            onCallAudioFinished = {
                                videoRenderers.forEach { it.setDuckedVolume(false) }
                            }
                        )
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
                                isMuted = block.isMuted
                            )
                        )
                    } else if (firstImageFile == null) {
                        firstImageFile = file
                    }
                }

                if (videoItems.isNotEmpty()) {
                    val renderer = VideoZoneRenderer(this)
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
                    loadingText.text = "✓ Transmisi Seluruh Chunk Selesai (SHA-256 Valid)"
                    subDetailText.text = "${fileName}\nSeluruh ${totalChunks} chunk berhasil diterima & terverifikasi."

                    watchdogHandler.postDelayed({
                        if (viewModel.uiState.value is PlayerUiState.Playing) {
                            loadingOverlay.visibility = View.GONE
                        }
                    }, 2000)
                }
                "CANCELLED" -> {
                    if (viewModel.uiState.value is PlayerUiState.Playing) {
                        loadingOverlay.visibility = View.GONE
                    }
                }
                "RELOAD" -> {
                    viewModel.syncManifest()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        realtimeStreamJob?.cancel()
        watchdogHandler.removeCallbacks(watchdogHeartbeatRunnable)
        releaseRenderers()
    }
}
