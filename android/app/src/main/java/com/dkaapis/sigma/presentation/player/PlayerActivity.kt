package com.dkaapis.sigma.presentation.player

import android.content.ComponentCallbacks2
import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import android.view.KeyEvent
import android.view.MotionEvent
import com.dkaapis.sigma.data.local.AnalyticsLocalBuffer
import com.dkaapis.sigma.data.analytics.AnalyticsSyncManager
import com.dkaapis.sigma.data.analytics.DeviceHardwareProfiler
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.local.MediaDiskCache
import com.dkaapis.sigma.data.local.PlayerSettingsStorage
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.data.repository.ManifestRepositoryImpl
import com.dkaapis.sigma.data.repository.MediaStorageRepositoryImpl
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.usecase.DownloadAndVerifyMediaUseCase
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.domain.usecase.SyncManifestUseCase
import com.dkaapis.sigma.presentation.pairing.PairingActivity
import com.dkaapis.sigma.presentation.player.audio.PlayerAudioManager
import com.dkaapis.sigma.presentation.player.audio.model.AudioConfigPayload
import com.dkaapis.sigma.presentation.player.audio.model.CounterStatusPayload
import com.dkaapis.sigma.presentation.player.audio.model.QueueSpeechPayload
import com.dkaapis.sigma.presentation.player.canvas.PlayerZoneManager
import com.dkaapis.sigma.presentation.player.canvas.SignageCanvasLayout
import com.dkaapis.sigma.presentation.player.canvas.model.ZoneRenderContextPayload
import com.dkaapis.sigma.presentation.player.gesture.TwoFingerSwipeDetector
import com.dkaapis.sigma.presentation.player.settings.PlayerSettingsDialog
import com.dkaapis.sigma.presentation.player.settings.model.PlayerSettingsPayload
import com.dkaapis.sigma.presentation.player.stream.DeviceSseEventParser
import com.dkaapis.sigma.presentation.player.stream.OnDeviceEventListener
import com.dkaapis.sigma.presentation.player.stream.PlayerStreamManager
import com.dkaapis.sigma.presentation.player.stream.model.ChunkProgressModel
import com.dkaapis.sigma.presentation.player.stream.model.QueueCallEventModel
import com.dkaapis.sigma.presentation.player.telemetry.PlayerTelemetryManager
import com.dkaapis.sigma.presentation.player.telemetry.model.WatchdogCallbackPayload
import com.dkaapis.sigma.presentation.renderers.QueueZoneRenderer
import com.dkaapis.sigma.service.PlayerForegroundService
import com.dkaapis.sigma.service.WatchdogService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Aktivitas Utama Pemutar Signage DKASigma:
 * Mengorkestrasikan siklus hidup aplikasi, canvas rendering, telemetri,
 * aliran data realtime SSE, dan audio TTS.
 */
class PlayerActivity : AppCompatActivity(), OnDeviceEventListener {

    private lateinit var viewModel: PlayerViewModel
    private lateinit var tokenStorage: TokenStorage
    private lateinit var playerSettingsStorage: PlayerSettingsStorage
    private lateinit var deviceRepo: DeviceRepositoryImpl
    private lateinit var storageRepo: MediaStorageRepositoryImpl

    private lateinit var audioManager: PlayerAudioManager
    private lateinit var telemetryManager: PlayerTelemetryManager
    private lateinit var streamManager: PlayerStreamManager
    private lateinit var zoneManager: PlayerZoneManager
    private lateinit var swipeDetector: TwoFingerSwipeDetector
    private lateinit var settingsDialog: PlayerSettingsDialog

    private lateinit var canvasLayout: SignageCanvasLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var badgeText: TextView
    private lateinit var loadingText: TextView
    private lateinit var subDetailText: TextView
    private lateinit var progressBar: ProgressBar

    private var activeQueueRenderer: QueueZoneRenderer? = null
    private var activeQueueDisplayId: String = ""
    private var activeQueueDataJson: String? = null
    private var lastDownloadProgressReportTime: Long = 0L
    private var hasActivePlayback: Boolean = false
    private var screenWakeLock: PowerManager.WakeLock? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupWindowEnvironment()
        initDependencies()
        setupViews()
        observeState()
        startBackgroundServices()

        viewModel.initializePlayer()
        startRealtimeStreams()
    }

    private fun setupWindowEnvironment() {
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        acquireScreenWakeLock()
        runCatching {
            @Suppress("DEPRECATION")
            window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN)
        }
        runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                window.attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
            WindowCompat.setDecorFitsSystemWindows(window, false)
            window.decorView.keepScreenOn = true
            WindowCompat.getInsetsController(window, window.decorView).apply {
                hide(WindowInsetsCompat.Type.systemBars())
                systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun acquireScreenWakeLock() {
        runCatching {
            if (screenWakeLock?.isHeld == true) return
            val pm = getSystemService(POWER_SERVICE) as? PowerManager ?: return
            // shortcut: SCREEN_BRIGHT_WAKE_LOCK deprecated in API 13, tapi tetap dibutuhkan pada firmware TV (Polytron/MediaTek/Realtek) yang mengabaikan FLAG_KEEP_SCREEN_ON saat idle lama
            screenWakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "DKASigma:SignageScreenWakeLock"
            ).apply {
                setReferenceCounted(false)
                acquire()
            }
        }
    }

    private fun releaseScreenWakeLock() {
        runCatching {
            if (screenWakeLock?.isHeld == true) {
                screenWakeLock?.release()
            }
            screenWakeLock = null
        }
    }

    private fun initDependencies() {
        tokenStorage = TokenStorage(this)
        playerSettingsStorage = PlayerSettingsStorage(this).apply {
            applyKioskComponentsState()
        }
        settingsDialog = PlayerSettingsDialog(this)
        swipeDetector = TwoFingerSwipeDetector(this) {
            openSettingsBottomSheet()
        }

        val channelFactory = GrpcChannelFactory(this)
        deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        storageRepo = MediaStorageRepositoryImpl(MediaDiskCache(this), channelFactory)

        val manifestRepo = ManifestRepositoryImpl(this, ManifestStorage(this), channelFactory, tokenStorage)
        val analyticsSyncManager = AnalyticsSyncManager(this, tokenStorage, AnalyticsLocalBuffer(this), channelFactory)
        val hardwareProfiler = DeviceHardwareProfiler(this)

        viewModel = PlayerViewModel(
            registerAndPairUseCase = RegisterAndPairUseCase(deviceRepo),
            syncManifestUseCase = SyncManifestUseCase(deviceRepo, manifestRepo),
            downloadUseCase = DownloadAndVerifyMediaUseCase(storageRepo)
        )

        zoneManager = PlayerZoneManager()

        audioManager = PlayerAudioManager(
            context = this,
            scope = lifecycleScope,
            config = AudioConfigPayload(
                onDuckingChanged = { zoneManager.setDuckedVolume(it) },
                onStopCallEffect = { activeQueueRenderer?.stopCallEffect() },
                getActiveQueueDataJson = { activeQueueDataJson },
                getLocalFileForAsset = { storageRepo.getLocalFileForAsset(it) }
            )
        ).apply { initTextToSpeech() }

        telemetryManager = PlayerTelemetryManager(
            activity = this,
            scope = lifecycleScope,
            deviceRepo = deviceRepo,
            hardwareProfiler = hardwareProfiler,
            analyticsSyncManager = analyticsSyncManager,
            channelFactory = channelFactory,
            callbacks = WatchdogCallbackPayload(
                getActiveManifestHash = { viewModel.getActiveManifestHash() },
                isDevicePaired = { deviceRepo.isPaired() },
                onDeviceUnpaired = { viewModel.onDeviceUnpaired() },
                onNeedsManifestSync = {
                    val s = viewModel.uiState.value
                    if (s !is PlayerUiState.DownloadingAssets && s !is PlayerUiState.SyncingManifest) {
                        viewModel.syncManifest()
                    }
                },
                onPendingCommand = { cmd -> dispatchRemoteCommand(cmd) },
                collectAssetStats = {
                    zoneManager.getVideoRenderers().mapNotNull { it.getCurrentPlaybackStats() }
                }
            )
        )

        streamManager = PlayerStreamManager(
            scope = lifecycleScope,
            channelFactory = channelFactory,
            tokenStorage = tokenStorage,
            listener = this
        )
    }

    private fun setupViews() {
        canvasLayout = SignageCanvasLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        badgeText = TextView(this).apply {
            text = "● SINKRONISASI KONTEN REALTIME"
            setTextColor(Color.parseColor("#10B981"))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }
        loadingText = TextView(this).apply {
            text = "Memulai DKASigma Player..."
            setTextColor(Color.WHITE)
            textSize = 24f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
            progress = 0
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 24).apply {
                setMargins(120, 0, 120, 24)
                gravity = Gravity.CENTER_HORIZONTAL
            }
        }
        subDetailText = TextView(this).apply {
            text = ""
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 14f
            gravity = Gravity.CENTER
            setLineSpacing(8f, 1f)
        }
        loadingOverlay = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#E60B0F19"))
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            addView(LinearLayout(this@PlayerActivity).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                    gravity = Gravity.CENTER
                    setMargins(64, 0, 64, 0)
                }
                addView(badgeText)
                addView(loadingText)
                addView(progressBar)
                addView(subDetailText)
            })
        }
        setContentView(FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            addView(canvasLayout)
            addView(loadingOverlay)
        })
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
                        if (!hasActivePlayback || loadingOverlay.visibility == View.VISIBLE) {
                            WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                            loadingOverlay.visibility = View.VISIBLE
                            badgeText.text = "● SINKRONISASI JADWAL"
                            badgeText.setTextColor(Color.parseColor("#38BDF8"))
                            loadingText.setTextColor(Color.WHITE)
                            loadingText.text = state.message
                            subDetailText.text = "Mengecek pembaruan jadwal dan integritas manifest..."
                            progressBar.isIndeterminate = true
                        }
                    }
                    is PlayerUiState.DownloadingAssets -> {
                        if (!hasActivePlayback || loadingOverlay.visibility == View.VISIBLE) {
                            WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                            loadingOverlay.visibility = View.VISIBLE
                            badgeText.text = "● MENGUNDUH ASET MEDIA"
                            badgeText.setTextColor(Color.parseColor("#10B981"))
                            loadingText.setTextColor(Color.WHITE)
                            progressBar.isIndeterminate = false
                            progressBar.progress = state.progressPercent

                            val downloadedMb = String.format(Locale.US, "%.1f", state.downloadedBytes / (1024.0 * 1024.0))
                            val totalMb = String.format(Locale.US, "%.1f", state.totalBytes / (1024.0 * 1024.0))
                            loadingText.text = "Mengunduh Aset Media (${state.assetIndex}/${state.total}) • ${state.progressPercent}%"
                            subDetailText.text = "${state.currentFileName}\n[ $downloadedMb MB / $totalMb MB ]"
                        }

                        val devId = deviceRepo.getSavedDeviceId()
                        val now = System.currentTimeMillis()
                        val canReportProgress = playerSettingsStorage.isProgressUploadEnabled()
                        if (canReportProgress && !devId.isNullOrEmpty() && (now - lastDownloadProgressReportTime >= 1000L || state.progressPercent == 100)) {
                            lastDownloadProgressReportTime = now
                            streamManager.broadcastDownloadProgress(
                                devId, state.assetIndex, state.total, state.progressPercent, state.downloadedBytes, state.totalBytes, state.currentFileName
                            )
                        }
                    }
                    is PlayerUiState.Playing -> {
                        hasActivePlayback = true
                        WatchdogService.setPlaybackActive(this@PlayerActivity, true)
                        loadingOverlay.visibility = View.GONE
                        renderManifest(state.manifest)

                        val devId = deviceRepo.getSavedDeviceId()
                        if (!devId.isNullOrEmpty()) {
                            streamManager.broadcastDownloadComplete(devId)
                        }
                    }
                    is PlayerUiState.Error -> {
                        loadingOverlay.visibility = View.VISIBLE
                        badgeText.text = "KENDALA"
                        badgeText.setTextColor(Color.parseColor("#EF4444"))
                        loadingText.setTextColor(Color.parseColor("#EF4444"))
                        val cleanMessage = if (state.message.contains("404")) {
                            "Berkas media tidak ditemukan di server (HTTP 404)"
                        } else {
                            state.message
                        }
                        loadingText.text = "Kendala: $cleanMessage"
                        subDetailText.text = "Menunggu perintah sinkronisasi dari server CMS..."
                        progressBar.isIndeterminate = false
                        progressBar.progress = 0
                    }
                    else -> Unit
                }
            }
        }
    }

    private fun renderManifest(manifest: Manifest) {
        activeQueueRenderer = null
        activeQueueDisplayId = ""
        activeQueueDataJson = null

        val payload = ZoneRenderContextPayload(
            activity = this,
            canvasLayout = canvasLayout,
            manifest = manifest,
            storageRepo = storageRepo,
            onQueueReady = { renderer, qId, widgetData ->
                activeQueueRenderer = renderer
                activeQueueDisplayId = qId
                activeQueueDataJson = widgetData
                reconcileQueueState()
            },
            onDuckingChanged = { isDucked -> zoneManager.setDuckedVolume(isDucked) },
            onQueueTapNext = { ticketNum, counterNm ->
                audioManager.speakQueueTicket(QueueSpeechPayload(ticketNumber = ticketNum, counterName = counterNm))
                deviceRepo.getSavedDeviceId()?.let { devId ->
                    streamManager.broadcastTouch(devId, activeQueueDisplayId, ticketNum, counterNm)
                }
            }
        )
        zoneManager.renderManifest(lifecycleScope, payload)
    }

    private fun reconcileQueueState() {
        val qId = activeQueueDisplayId.takeIf { it.isNotBlank() } ?: return
        lifecycleScope.launch(Dispatchers.IO) {
            val currentCounter = activeQueueRenderer?.getCurrentCounter() ?: ""
            val syncRes = streamManager.syncQueueOnReconnect(qId, currentCounter, activeQueueDataJson)
            if (syncRes != null) {
                activeQueueDataJson = syncRes.updatedJson
                runOnUiThread {
                    activeQueueRenderer?.apply {
                        if (syncRes.latestNumber.isNotBlank()) syncTicketDisplay(syncRes.latestNumber, syncRes.counterName)
                        setCounterStatus(syncRes.counterName, syncRes.counterStatus)
                    }
                }
            }
        }
    }

    private fun dispatchRemoteCommand(command: String) {
        when {
            command.contains("ClearCache", ignoreCase = true) -> onClearCache()
            command.contains("CaptureScreenshot", ignoreCase = true) || command.contains("Screenshot", ignoreCase = true) -> onCaptureScreenshot()
            command.contains("Reboot", ignoreCase = true) -> onReboot()
            command.contains("Unpair", ignoreCase = true) || command.contains("Decommission", ignoreCase = true) -> onUnpair()
        }
    }

    private fun startBackgroundServices() {
        runCatching {
            val intent = Intent(this, PlayerForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
        }
        runCatching {
            startService(Intent(this, WatchdogService::class.java))
            telemetryManager.start()
        }
    }

    private fun startRealtimeStreams() {
        val devId = deviceRepo.getSavedDeviceId() ?: return
        streamManager.startStream(devId) {
            reconcileQueueState()
        }
    }

    // --- OnDeviceEventListener Callbacks ---

    override fun onChunkProgress(progress: ChunkProgressModel) {
        runOnUiThread {
            loadingOverlay.visibility = View.VISIBLE
            badgeText.text = "● SINKRONISASI KONTEN REALTIME"
            badgeText.setTextColor(Color.parseColor("#10B981"))
            progressBar.isIndeterminate = false
            progressBar.progress = progress.percent

            val upMb = String.format(Locale.US, "%.1f", progress.uploadedBytes / (1024.0 * 1024.0))
            val totMb = String.format(Locale.US, "%.1f", progress.totalBytes / (1024.0 * 1024.0))
            loadingText.text = "Menerima Transmisi Chunk (${progress.completedChunks}/${progress.totalChunks}) • ${progress.percent}%"
            subDetailText.text = "${progress.fileName}\n[ $upMb MB / $totMb MB ]"
        }
    }

    override fun onChunkComplete(fileName: String, totalChunks: Int) {
        runOnUiThread {
            progressBar.progress = 100
            badgeText.text = "✓ TERVERIFIKASI"
            badgeText.setTextColor(Color.parseColor("#10B981"))
            loadingText.text = "Transmisi Seluruh Chunk Selesai (SHA-256 Valid)"
            subDetailText.text = "$fileName\nSeluruh $totalChunks chunk berhasil diterima & terverifikasi."
            loadingOverlay.postDelayed({
                if (viewModel.uiState.value is PlayerUiState.Playing) loadingOverlay.visibility = View.GONE
            }, 2000)
        }
    }

    override fun onChunkCancelled(fileName: String) {
        runOnUiThread {
            loadingOverlay.visibility = View.VISIBLE
            badgeText.text = "✖ DIBATALKAN"
            badgeText.setTextColor(Color.parseColor("#EF4444"))
            loadingText.text = "Transmisi Chunk Dibatalkan"
            loadingText.setTextColor(Color.parseColor("#EF4444"))
            subDetailText.text = fileName.ifBlank { "Pengunggahan dibatalkan oleh pengguna dari CMS." }
            loadingOverlay.postDelayed({
                if (viewModel.uiState.value is PlayerUiState.Playing) loadingOverlay.visibility = View.GONE
            }, 2500)
        }
    }

    override fun onReloadManifest() {
        runOnUiThread { viewModel.syncManifest(force = true) }
    }

    override fun onClearCache() {
        runOnUiThread {
            hasActivePlayback = false
            zoneManager.release()
            canvasLayout.removeAllViews()
            viewModel.resetActiveManifest()
            WatchdogService.setPlaybackActive(this@PlayerActivity, false)

            telemetryManager.handleClearCache(
                onShowUiProgress = {
                    loadingOverlay.visibility = View.VISIBLE
                    progressBar.isIndeterminate = true
                    badgeText.text = "BERSIHKAN CACHE"
                    badgeText.setTextColor(Color.parseColor("#F59E0B"))
                    loadingText.setTextColor(Color.WHITE)
                    loadingText.text = "Membersihkan Cache Media Lokal..."
                    subDetailText.text = "Menghapus cache media dan manifest lokal..."
                },
                onSyncRequested = {
                    loadingOverlay.postDelayed({ viewModel.syncManifest(force = true) }, 1000)
                }
            )
        }
    }

    override fun onCaptureScreenshot() {
        telemetryManager.handleCaptureScreenshot(window)
    }

    override fun onReboot() {
        runOnUiThread {
            loadingOverlay.visibility = View.VISIBLE
            progressBar.isIndeterminate = true
            badgeText.text = "● MEMUAT ULANG"
            badgeText.setTextColor(Color.parseColor("#3B82F6"))
            loadingText.text = "Memuat Ulang Player..."
            subDetailText.text = "Mengeksekusi perintah reboot/restart dari CMS..."

            loadingOverlay.postDelayed({
                telemetryManager.handleReboot()
            }, 600)
        }
    }

    override fun onUnpair() {
        runOnUiThread {
            deviceRepo.clearCredentials()
            viewModel.onDeviceUnpaired()
        }
    }

    override fun onQueueCall(event: QueueCallEventModel) {
        runOnUiThread {
            val currentDevId = deviceRepo.getSavedDeviceId() ?: ""
            if (event.source == "player_touch" && event.sourceDeviceId.isNotBlank() && event.sourceDeviceId == currentDevId) {
                return@runOnUiThread
            }
            if (activeQueueDisplayId.isBlank()) {
                return@runOnUiThread
            }
            if (event.targetQueueId.isNotBlank() && event.targetQueueId != activeQueueDisplayId) {
                return@runOnUiThread
            }

            activeQueueRenderer?.updateCall(event.ticketNumber, event.counterName)
            audioManager.speakQueueTicket(
                QueueSpeechPayload(
                    ticketNumber = event.ticketNumber,
                    counterName = event.counterName,
                    isRecall = event.isRecall,
                    ticketLabelOverride = event.ticketLabel,
                    counterLabelOverride = event.counterLabel,
                    ttsTemplateCallOverride = event.ttsTemplateCall,
                    ttsTemplateRecallOverride = event.ttsTemplateRecall
                )
            )
        }
    }

    override fun onQueueReset(targetQueueId: String, resetToNumber: String) {
        runOnUiThread {
            if (activeQueueDisplayId.isBlank()) return@runOnUiThread
            if (targetQueueId.isNotBlank() && targetQueueId != activeQueueDisplayId) return@runOnUiThread
            activeQueueRenderer?.resetQueue(resetToNumber)
        }
    }

    override fun onCounterStatusChanged(targetQueueId: String, counterName: String, status: String) {
        runOnUiThread {
            if (activeQueueDisplayId.isBlank()) return@runOnUiThread
            if (targetQueueId.isNotBlank() && targetQueueId != activeQueueDisplayId) return@runOnUiThread
            activeQueueRenderer?.setCounterStatus(counterName, status)
            audioManager.speakCounterStatus(CounterStatusPayload(counterName = counterName, status = status))
        }
    }

    override fun onResume() {
        super.onResume()
        acquireScreenWakeLock()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            acquireScreenWakeLock()
            runCatching {
                WindowCompat.getInsetsController(window, window.decorView).hide(WindowInsetsCompat.Type.systemBars())
            }
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        when (level) {
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL, ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW -> {
                runCatching { coil.Coil.imageLoader(this).memoryCache?.clear() }
                System.gc()
            }
            ComponentCallbacks2.TRIM_MEMORY_BACKGROUND, ComponentCallbacks2.TRIM_MEMORY_MODERATE, ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                runCatching { coil.Coil.imageLoader(this).memoryCache?.clear() }
            }
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        runCatching { coil.Coil.imageLoader(this).memoryCache?.clear() }
        System.gc()
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        swipeDetector.onTouchEvent(ev)
        return super.dispatchTouchEvent(ev)
    }

    private var lastBackPressTimestamp = 0L

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // 1. Tombol langsung pada remote: Menu, Settings, Info, Guide
        if (keyCode == KeyEvent.KEYCODE_MENU ||
            keyCode == KeyEvent.KEYCODE_SETTINGS ||
            keyCode == KeyEvent.KEYCODE_INFO ||
            keyCode == KeyEvent.KEYCODE_GUIDE ||
            keyCode == KeyEvent.KEYCODE_PROG_RED) {
            openSettingsBottomSheet()
            return true
        }

        // 2. Mulai tracking long-press untuk tombol DPAD Center (OK), Enter, dan Back
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
            keyCode == KeyEvent.KEYCODE_ENTER ||
            keyCode == KeyEvent.KEYCODE_BACK) {
            event?.startTracking()
            return true
        }

        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
        // Tahan tombol OK / Center atau tombol Back selama 1.5 - 2 detik untuk membuka pengaturan
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
            keyCode == KeyEvent.KEYCODE_ENTER ||
            keyCode == KeyEvent.KEYCODE_BACK) {
            openSettingsBottomSheet()
            return true
        }
        return super.onKeyLongPress(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (event?.isCanceled == true) {
            return true
        }

        // Tekan tombol Back 2x cepat (dalam 1.5 detik) untuk membuka pengaturan
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (settingsDialog.isShowing()) {
                return super.onKeyUp(keyCode, event)
            }
            val now = System.currentTimeMillis()
            if (now - lastBackPressTimestamp < 1500L) {
                lastBackPressTimestamp = 0L
                openSettingsBottomSheet()
                return true
            } else {
                lastBackPressTimestamp = now
                Toast.makeText(this, "Tekan Back sekali lagi untuk buka Pengaturan", Toast.LENGTH_SHORT).show()
                return true
            }
        }

        return super.onKeyUp(keyCode, event)
    }

    private fun openSettingsBottomSheet() {
        settingsDialog.show(
            PlayerSettingsPayload(
                deviceId = deviceRepo.getSavedDeviceId().orEmpty(),
                serverHost = ServerConfig.getHost(this),
                serverGrpcPort = ServerConfig.getGrpcPort(this),
                isProgressUploadEnabled = playerSettingsStorage.isProgressUploadEnabled(),
                onProgressUploadToggled = { enabled ->
                    playerSettingsStorage.setProgressUploadEnabled(enabled)
                },
                isKioskModeEnabled = playerSettingsStorage.isKioskModeEnabled(),
                onKioskModeToggled = { enabled ->
                    playerSettingsStorage.setKioskModeEnabled(enabled)
                },
                onUnbindRequested = {
                    unbindDeviceAndExit()
                }
            )
        )
    }

    private fun unbindDeviceAndExit() {
        hasActivePlayback = false
        tokenStorage.clear()
        WatchdogService.setPlaybackActive(this, false)
        runCatching { stopService(Intent(this, PlayerForegroundService::class.java)) }
        startActivity(Intent(this, PairingActivity::class.java))
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseScreenWakeLock()
        audioManager.release()
        streamManager.stopStream()
        telemetryManager.stop()
        zoneManager.release()
    }
}
