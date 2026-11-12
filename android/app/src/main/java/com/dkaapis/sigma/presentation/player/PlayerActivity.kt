package com.dkaapis.sigma.presentation.player

import android.content.ComponentCallbacks2
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
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
import com.dkaapis.sigma.data.repository.AppUpdateRepositoryImpl
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.data.repository.ManifestRepositoryImpl
import com.dkaapis.sigma.data.repository.MediaStorageRepositoryImpl
import com.dkaapis.sigma.domain.model.AppUpdate
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
import com.dkaapis.sigma.presentation.player.coordinator.PlayerKeyCoordinator
import com.dkaapis.sigma.presentation.player.coordinator.PlayerOverlayCoordinator
import com.dkaapis.sigma.presentation.player.coordinator.PlayerSleepCoordinator
import com.dkaapis.sigma.presentation.player.diagnostics.DiagnosticsCollector
import com.dkaapis.sigma.presentation.player.gesture.TwoFingerSwipeDetector
import com.dkaapis.sigma.presentation.player.settings.PlayerSettingsDialog
import com.dkaapis.sigma.presentation.player.settings.model.PlayerSettingsPayload
import com.dkaapis.sigma.presentation.player.stream.OnDeviceEventListener
import com.dkaapis.sigma.presentation.player.stream.PlayerStreamManager
import com.dkaapis.sigma.presentation.player.stream.model.ChunkProgressModel
import com.dkaapis.sigma.presentation.player.stream.model.QueueCallEventModel
import com.dkaapis.sigma.presentation.player.telemetry.PlayerTelemetryManager
import com.dkaapis.sigma.presentation.player.telemetry.model.WatchdogCallbackPayload
import com.dkaapis.sigma.presentation.renderers.QueueZoneRenderer
import com.dkaapis.sigma.service.AppUpdateInstaller
import com.dkaapis.sigma.service.PlayerForegroundService
import com.dkaapis.sigma.service.WatchdogService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Aktivitas Utama Pemutar Signage HNDSigma:
 * Mengorkestrasikan siklus hidup aplikasi, canvas rendering, telemetri,
 * aliran data realtime SSE, dan audio TTS.
 */
class PlayerActivity : AppCompatActivity(), OnDeviceEventListener {

    private lateinit var viewModel: PlayerViewModel
    private lateinit var tokenStorage: TokenStorage
    private lateinit var playerSettingsStorage: PlayerSettingsStorage
    private lateinit var deviceRepo: DeviceRepositoryImpl
    private lateinit var storageRepo: MediaStorageRepositoryImpl
    private lateinit var appUpdateRepository: AppUpdateRepositoryImpl
    private lateinit var appUpdateInstaller: AppUpdateInstaller

    private lateinit var audioManager: PlayerAudioManager
    private lateinit var telemetryManager: PlayerTelemetryManager
    private lateinit var streamManager: PlayerStreamManager
    private lateinit var zoneManager: PlayerZoneManager
    private lateinit var swipeDetector: TwoFingerSwipeDetector
    private lateinit var settingsDialog: PlayerSettingsDialog

    private lateinit var canvasLayout: SignageCanvasLayout
    private lateinit var statusOverlay: PlayerOverlayCoordinator
    private lateinit var sleep: PlayerSleepCoordinator
    private val keys by lazy {
        PlayerKeyCoordinator(
            isSleeping = { sleep.isSleeping },
            wake = { sleep.setSleep(false, manual = true) },
            openSettings = ::openSettingsBottomSheet,
            exitApp = ::exitApplicationCompletely,
            isSettingsShowing = { settingsDialog.isShowing() },
            dismissSettings = { settingsDialog.dismiss() },
            toast = { Toast.makeText(this, it, Toast.LENGTH_SHORT).show() }
        )
    }

    private var activeQueueRenderer: QueueZoneRenderer? = null
    private var activeQueueDisplayId: String = ""
    private var activeQueueDataJson: String? = null
    private var lastDownloadProgressReportTime: Long = 0L
    private var hasActivePlayback: Boolean = false
    private var isQueueCallInProgress: Boolean = false
    private var isAppUpdateInProgress: Boolean = false
    private var appUpdateCheckJob: Job? = null
    private var activeAppUpdateId: String? = null
    private var lastOfferedAppUpdateId: String? = null
    private var availableAppUpdate: AppUpdate? = null
    private var optionalAppUpdateDialog: AlertDialog? = null
    private var pendingInstallPermissionUpdate: AppUpdate? = null

    private companion object {
        const val TAG = "PlayerActivity"
        const val APP_UPDATE_CHECK_INTERVAL_MS = 60 * 1000L
        const val OPTIONAL_APP_UPDATE_DIALOG_TIMEOUT_MS = 5_000L
        const val SKY = 0x38BDF8
        const val GREEN = 0x10B981
        const val RED = 0xEF4444
        const val AMBER = 0xF59E0B
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupWindowEnvironment()
        initDependencies()
        setupViews()
        observeState()
        startBackgroundServices()
        sleep.acquireScreenLock()
        sleep.startMonitor()

        viewModel.initializePlayer()
        startRealtimeStreams()
        startAppUpdateChecks()
    }

    private fun setupWindowEnvironment() {
        // Zero-Overdraw optimization: Remove default window background to save 1 GPU fill pass
        window.setBackgroundDrawable(null)
        runCatching {
            android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_DISPLAY)
        }

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
        appUpdateRepository = AppUpdateRepositoryImpl(this, channelFactory)
        appUpdateInstaller = AppUpdateInstaller(this)
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
            channelFactory = channelFactory,
            tokenStorage = tokenStorage,
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
                        requestAppUpdateCheck(forcePrompt = true)
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
        val collector = DiagnosticsCollector(this, zoneManager)
        streamManager.diagnosticsProvider = collector::snapshot
    }

    private fun setupViews() {
        canvasLayout = SignageCanvasLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        statusOverlay = PlayerOverlayCoordinator(this, canvasLayout)
        sleep = PlayerSleepCoordinator(this, canvasLayout, audioManager, zoneManager, telemetryManager) { hasActivePlayback }
        setContentView(FrameLayout(this).apply {
            setBackgroundColor(Color.WHITE) // Default background color in Android Signage is clean WHITE
            addView(canvasLayout)
            addView(statusOverlay.root)
            addView(sleep.blackout)
        })
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                if (isAppUpdateInProgress && state !is PlayerUiState.Playing) return@collectLatest
                when (state) {
                    is PlayerUiState.NotPaired -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        startActivity(Intent(this@PlayerActivity, PairingActivity::class.java))
                        finish()
                    }
                    is PlayerUiState.SyncingManifest -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        statusOverlay.show(
                            "● SINKRONISASI JADWAL", SKY, state.message,
                            "Mengecek pembaruan jadwal dan integritas manifest..."
                        )
                    }
                    is PlayerUiState.DownloadingAssets -> {
                        WatchdogService.setPlaybackActive(this@PlayerActivity, false)
                        val downloadedMb = String.format(Locale.US, "%.1f", state.downloadedBytes / (1024.0 * 1024.0))
                        val totalMb = String.format(Locale.US, "%.1f", state.totalBytes / (1024.0 * 1024.0))
                        statusOverlay.show(
                            "● MENGUNDUH ASET MEDIA", GREEN,
                            "Mengunduh Aset Media (${state.assetIndex}/${state.total}) • ${state.progressPercent}%",
                            "${state.currentFileName}\n[ $downloadedMb MB / $totalMb MB ]",
                            state.progressPercent, badgeTextRgb = 0x34D399
                        )

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

                        if (!isAppUpdateInProgress) statusOverlay.hide()
                        renderManifest(state.manifest)

                        val devId = deviceRepo.getSavedDeviceId()
                        if (!devId.isNullOrEmpty()) {
                            streamManager.broadcastDownloadComplete(devId)
                        }
                    }
                    is PlayerUiState.Error -> {
                        val isManifestEmpty = state.message.contains("Manifest kosong", ignoreCase = true) ||
                                state.message.contains("kosong", ignoreCase = true)

                        if (isManifestEmpty) {
                            // Layar standby intro / belum ada playlist tayang (bukan kendala error)
                            statusOverlay.show(
                                "● STANDBY", SKY, "HNDSigma Digital Signage",
                                "Menunggu alokasi jadwal tayang dari Web CMS...",
                                progress = null, badgeTextRgb = 0x38BDF8
                            )
                        } else {
                            val cleanMessage = if (state.message.contains("404")) {
                                "Berkas media tidak ditemukan di server (HTTP 404)"
                            } else {
                                state.message
                            }
                            statusOverlay.show(
                                "● SINKRONISASI", SKY, cleanMessage,
                                "Mencoba menghubungkan kembali ke server CMS...",
                                progress = null, badgeTextRgb = 0x38BDF8
                            )
                        }
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
        sleep.setSchedule(manifest.powerSchedule)

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
            onQueueTapNext = { counterNm ->
                if (!isQueueCallInProgress) {
                    isQueueCallInProgress = true
                    lifecycleScope.launch {
                        try {
                            val queueId = activeQueueDisplayId
                            check(queueId.isNotBlank()) { "Layar antrean belum tersinkron dengan backend" }
                            val (ticketNumber, counterName) = streamManager.callNextTicket(queueId, counterNm)
                            activeQueueRenderer?.updateCall(ticketNumber, counterName)
                            audioManager.speakQueueTicket(
                                QueueSpeechPayload(ticketNumber = ticketNumber, counterName = counterName)
                            )
                            deviceRepo.getSavedDeviceId()?.let { deviceId ->
                                streamManager.broadcastTouch(deviceId, queueId, ticketNumber, counterName)
                            }
                        } catch (error: CancellationException) {
                            throw error
                        } catch (error: Exception) {
                            Log.w(TAG, "Panggilan antrean ditolak backend: ${error.message}")
                            Toast.makeText(
                                this@PlayerActivity,
                                "Panggilan gagal: ${error.message ?: "tidak dapat menghubungi backend"}",
                                Toast.LENGTH_LONG
                            ).show()
                            reconcileQueueState()
                        } finally {
                            isQueueCallInProgress = false
                        }
                    }
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
            command.contains("SCREEN_SLEEP", ignoreCase = true) || command.contains("Sleep", ignoreCase = true) || command.contains("Standby", ignoreCase = true) -> onScreenSleep()
            command.contains("SCREEN_WAKE", ignoreCase = true) || command.contains("Wake", ignoreCase = true) -> onScreenWake()
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

    private fun startAppUpdateChecks() {
        lifecycleScope.launch {
            while (isActive) {
                requestAppUpdateCheck()
                delay(APP_UPDATE_CHECK_INTERVAL_MS)
            }
        }
    }

    private fun requestAppUpdateCheck(forcePrompt: Boolean = false) {
        if (appUpdateCheckJob?.isActive == true) {
            if (!forcePrompt) return
            appUpdateCheckJob?.cancel()
        }

        appUpdateCheckJob = lifecycleScope.launch {
            try {
                if (!deviceRepo.isPaired()) return@launch
                val deviceId = deviceRepo.getSavedDeviceId().orEmpty()
                val update = appUpdateRepository.checkForUpdate(deviceId)
                availableAppUpdate = update
                settingsDialog.updateAvailableAppUpdate(update)
                if (
                    update != null &&
                    (update.isForceUpdate ||
                        forcePrompt ||
                        update.id != playerSettingsStorage.getDismissedAppUpdateId())
                ) {
                    offerAppUpdate(update, forcePrompt)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                Log.w(TAG, "Gagal memeriksa pembaruan aplikasi: ${error.message}")
            }
        }
    }

    private fun offerAppUpdate(update: AppUpdate, forcePrompt: Boolean = false) {
        if (update.isForceUpdate) {
            if (update.id == lastOfferedAppUpdateId) return
            lastOfferedAppUpdateId = update.id
            requestAppUpdate(update)
            return
        }

        if (isAppUpdateInProgress || optionalAppUpdateDialog?.isShowing == true) return
        if (!forcePrompt && update.id == playerSettingsStorage.getDismissedAppUpdateId()) return
        if (!forcePrompt && update.id == lastOfferedAppUpdateId) return
        lastOfferedAppUpdateId = update.id

        val dialog = AlertDialog.Builder(this)
            .setTitle("Pembaruan tersedia: v${update.versionName}")
            .setMessage(update.releaseNotes.ifBlank { "Versi baru aplikasi player tersedia." })
            .setPositiveButton("Perbarui sekarang") { _, _ -> requestAppUpdate(update) }
            .setNegativeButton("Nanti", null)
            .create()
        optionalAppUpdateDialog = dialog
        dialog.setOnDismissListener {
            playerSettingsStorage.setDismissedAppUpdateId(update.id)
            if (optionalAppUpdateDialog === dialog) optionalAppUpdateDialog = null
        }
        dialog.setOnShowListener {
            dialog.window?.decorView?.postDelayed({
                if (dialog.isShowing) dialog.dismiss()
            }, OPTIONAL_APP_UPDATE_DIALOG_TIMEOUT_MS)
        }
        dialog.show()
    }

    private fun requestAppUpdate(update: AppUpdate) {
        if (!canInstallAppUpdate()) {
            pendingInstallPermissionUpdate = update
            val dialog = AlertDialog.Builder(this)
                .setTitle("Izinkan pemasangan aplikasi")
                .setMessage("Android perlu mengizinkan HNDSigma memasang pembaruan dari server.")
                .setPositiveButton("Buka pengaturan") { _, _ ->
                    startActivity(
                        Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                            .setData(Uri.parse("package:$packageName"))
                    )
                }
            if (!update.isForceUpdate) {
                dialog.setNegativeButton("Nanti") { _, _ ->
                    pendingInstallPermissionUpdate = null
                }
            }
            dialog.setCancelable(!update.isForceUpdate).show()
            return
        }

        downloadAndInstallAppUpdate(update)
    }

    private fun canInstallAppUpdate(): Boolean {
        return appUpdateInstaller.isDeviceOwner() ||
            Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            packageManager.canRequestPackageInstalls()
    }

    private fun downloadAndInstallAppUpdate(update: AppUpdate) {
        if (activeAppUpdateId == update.id) return
        activeAppUpdateId = update.id
        isAppUpdateInProgress = true
        statusOverlay.show(
            "● PEMBARUAN APLIKASI",
            SKY,
            "Menyiapkan pembaruan v${update.versionName}",
            "Memverifikasi rilis dan mengunduh APK..."
        )

        lifecycleScope.launch {
            try {
                val apk = appUpdateRepository.downloadAndVerify(update) { downloaded, total ->
                    val progress = ((downloaded * 100) / total).toInt().coerceIn(0, 100)
                    runOnUiThread {
                        statusOverlay.show(
                            "● PEMBARUAN APLIKASI",
                            SKY,
                            "Mengunduh pembaruan v${update.versionName} • $progress%",
                            "${formatUpdateBytes(downloaded)} / ${formatUpdateBytes(total)}",
                            progress
                        )
                    }
                }

                statusOverlay.show(
                    "✓ APK TERVERIFIKASI",
                    GREEN,
                    "Memasang pembaruan v${update.versionName}",
                    "Hash dan versi aplikasi valid.",
                    100
                )
                appUpdateInstaller.install(apk)
                Log.i(TAG, "PackageInstaller menerima pembaruan v${update.versionName}")
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                Log.e(TAG, "Pembaruan aplikasi v${update.versionName} gagal", error)
                if (update.isForceUpdate && !isFinishing) {
                    AlertDialog.Builder(this@PlayerActivity)
                        .setTitle("Pembaruan wajib gagal")
                        .setMessage(error.message ?: "Periksa koneksi server lalu coba lagi.")
                        .setPositiveButton("Coba lagi") { _, _ -> retryLatestAppUpdate() }
                        .setCancelable(false)
                        .show()
                } else {
                    Toast.makeText(
                        this@PlayerActivity,
                        "Pembaruan gagal: ${error.message ?: "kesalahan tidak diketahui"}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } finally {
                isAppUpdateInProgress = false
                activeAppUpdateId = null
                statusOverlay.hide()
            }
        }
    }

    private fun retryLatestAppUpdate() {
        appUpdateCheckJob?.cancel()
        appUpdateCheckJob = lifecycleScope.launch {
            try {
                statusOverlay.show(
                    "● PEMBARUAN APLIKASI",
                    SKY,
                    "Memeriksa rilis terbaru",
                    "Menghubungi server..."
                )
                check(deviceRepo.isPaired()) { "Perangkat belum terhubung ke server." }
                val deviceId = deviceRepo.getSavedDeviceId().orEmpty()
                val latestUpdate = appUpdateRepository.checkForUpdate(deviceId)
                availableAppUpdate = latestUpdate
                settingsDialog.updateAvailableAppUpdate(latestUpdate)
                statusOverlay.hide()

                if (latestUpdate == null) {
                    showLatestAppUpdateRetryDialog(
                        "Tidak ada rilis lebih baru yang tersedia di server. Pastikan rilis terbaru sudah diterbitkan."
                    )
                    return@launch
                }

                lastOfferedAppUpdateId = null
                if (latestUpdate.isForceUpdate) {
                    requestAppUpdate(latestUpdate)
                } else {
                    offerAppUpdate(latestUpdate, forcePrompt = true)
                }
            } catch (error: CancellationException) {
                statusOverlay.hide()
                throw error
            } catch (error: Exception) {
                statusOverlay.hide()
                Log.w(TAG, "Gagal memeriksa ulang pembaruan aplikasi: ${error.message}", error)
                showLatestAppUpdateRetryDialog(
                    error.message ?: "Gagal memeriksa server. Periksa koneksi lalu coba lagi."
                )
            }
        }
    }

    private fun showLatestAppUpdateRetryDialog(message: String) {
        if (isFinishing || isDestroyed) return
        AlertDialog.Builder(this)
            .setTitle("Pembaruan wajib gagal")
            .setMessage(message)
            .setPositiveButton("Periksa lagi") { _, _ -> retryLatestAppUpdate() }
            .setCancelable(false)
            .show()
    }

    private fun formatUpdateBytes(bytes: Long): String =
        String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024.0))

    // --- OnDeviceEventListener Callbacks ---

    override fun onChunkProgress(progress: ChunkProgressModel) {
        runOnUiThread {
            val upMb = String.format(Locale.US, "%.1f", progress.uploadedBytes / (1024.0 * 1024.0))
            val totMb = String.format(Locale.US, "%.1f", progress.totalBytes / (1024.0 * 1024.0))
            statusOverlay.show(
                "● SINKRONISASI KONTEN REALTIME", GREEN,
                "Menerima Transmisi Chunk (${progress.completedChunks}/${progress.totalChunks}) • ${progress.percent}%",
                "${progress.fileName}\n[ $upMb MB / $totMb MB ]", progress.percent
            )
        }
    }

    override fun onChunkComplete(fileName: String, totalChunks: Int) {
        runOnUiThread {
            statusOverlay.show(
                "✓ TERVERIFIKASI", GREEN, "Transmisi Seluruh Chunk Selesai (SHA-256 Valid)",
                "$fileName\nSeluruh $totalChunks chunk berhasil diterima & terverifikasi.", 100
            )
            hideOverlayWhenPlaying(2000)
        }
    }

    override fun onChunkCancelled(fileName: String) {
        runOnUiThread {
            statusOverlay.show(
                "✖ DIBATALKAN", RED, "Transmisi Chunk Dibatalkan",
                fileName.ifBlank { "Pengunggahan dibatalkan oleh pengguna dari CMS." },
                titleColor = Color.parseColor("#EF4444")
            )
            hideOverlayWhenPlaying(2500)
        }
    }

    private fun hideOverlayWhenPlaying(delayMs: Long) {
        statusOverlay.postDelayed(delayMs) {
            if (viewModel.uiState.value is PlayerUiState.Playing) statusOverlay.hide()
        }
    }

    override fun onReloadManifest() {
        runOnUiThread {
            viewModel.syncManifest(force = true)
            requestAppUpdateCheck(forcePrompt = true)
        }
    }

    override fun onClearCache() {
        runOnUiThread {
            WatchdogService.setPlaybackActive(this@PlayerActivity, false)
            statusOverlay.show(
                "● BERSIHKAN CACHE", AMBER, "Membersihkan Cache Media Lokal...",
                "Menghapus cache media dan manifest lokal...", badgeTextRgb = 0xF59E0B
            )

            telemetryManager.handleClearCache(
                onShowUiProgress = {
                    // Biarkan konten terakhir tetap tampil di canvas di balik blur kaca saat membersihkan cache.
                    // Manifest aktif di-reset agar tidak memicu transisi sebelum sync baru masuk.
                    viewModel.resetActiveManifest()
                },
                onSyncRequested = {
                    statusOverlay.postDelayed(1000) {
                        viewModel.syncManifest(force = true)
                        requestAppUpdateCheck(forcePrompt = true)
                    }
                }
            )
        }
    }

    override fun onCaptureScreenshot() {
        telemetryManager.handleCaptureScreenshot(window)
    }

    override fun onReboot() {
        runOnUiThread {
            statusOverlay.show(
                "● MEMUAT ULANG", SKY, "Memuat Ulang Player...",
                "Mengeksekusi perintah reboot/restart dari CMS...", badgeTextRgb = 0x3B82F6
            )
            statusOverlay.postDelayed(600) { telemetryManager.handleReboot() }
        }
    }

    override fun onUnpair() {
        runOnUiThread {
            deviceRepo.clearCredentials()
            viewModel.onDeviceUnpaired()
        }
    }

    override fun onScreenSleep() = sleep.setSleep(true, manual = true)

    override fun onScreenWake() = sleep.setSleep(false, manual = true)

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

            reconcileQueueState()
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
            reconcileQueueState()
        }
    }

    override fun onCounterStatusChanged(targetQueueId: String, counterName: String, status: String) {
        runOnUiThread {
            if (activeQueueDisplayId.isBlank()) return@runOnUiThread
            if (targetQueueId.isNotBlank() && targetQueueId != activeQueueDisplayId) return@runOnUiThread
            reconcileQueueState()
            audioManager.speakCounterStatus(CounterStatusPayload(counterName = counterName, status = status))
        }
    }

    override fun onResume() {
        super.onResume()
        pendingInstallPermissionUpdate?.let { update ->
            pendingInstallPermissionUpdate = null
            if (canInstallAppUpdate()) {
                requestAppUpdate(update)
            } else {
                lastOfferedAppUpdateId = null
            }
        }
        if (!sleep.isSleeping) {
            sleep.acquireScreenLock()
            if (hasActivePlayback) {
                zoneManager.resumePlayback()
                WatchdogService.setPlaybackActive(this, true)
            }
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Saat tombol HOME ditekan di remote TV (dan Mode Kiosk OFF), tutup aplikasi sepenuhnya termasuk suara
        if (!playerSettingsStorage.isKioskModeEnabled()) {
            exitApplicationCompletely()
        }
    }

    override fun onStop() {
        super.onStop()
        // Pastikan suara video & TTS langsung berhenti saat Activity tidak lagi di layar depan
        audioManager.stopCurrentVoice()
        zoneManager.pausePlayback()
        WatchdogService.setPlaybackActive(this, false)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            if (!sleep.isSleeping) sleep.acquireScreenLock()
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

    override fun onKeyDown(keyCode: Int, event: KeyEvent?) =
        keys.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event)

    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?) =
        keys.onKeyLongPress(keyCode) || super.onKeyLongPress(keyCode, event)

    override fun onKeyUp(keyCode: Int, event: KeyEvent?) =
        keys.onKeyUp(keyCode, event) || super.onKeyUp(keyCode, event)

    private fun exitApplicationCompletely() {
        keys.cancelPending()
        hasActivePlayback = false
        WatchdogService.setPlaybackActive(this, false)
        sleep.releaseLocks()
        audioManager.release()
        zoneManager.release()
        streamManager.stopStream()
        telemetryManager.stop()
        runCatching { stopService(Intent(this, PlayerForegroundService::class.java)) }
        runCatching { stopService(Intent(this, WatchdogService::class.java)) }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            finishAndRemoveTask()
        } else {
            finish()
        }
    }

    private fun openSettingsBottomSheet() {
        settingsDialog.show(
            PlayerSettingsPayload(
                deviceId = deviceRepo.getSavedDeviceId().orEmpty(),
                serverHost = ServerConfig.getHost(this),
                serverGrpcPort = ServerConfig.getGrpcPort(this),
                availableAppUpdate = availableAppUpdate,
                onAppUpdateRequested = ::requestAppUpdate,
                isProgressUploadEnabled = playerSettingsStorage.isProgressUploadEnabled(),
                onProgressUploadToggled = { enabled ->
                    playerSettingsStorage.setProgressUploadEnabled(enabled)
                },
                isKioskModeEnabled = playerSettingsStorage.isKioskModeEnabled(),
                onKioskModeToggled = { enabled ->
                    playerSettingsStorage.setKioskModeEnabled(enabled)
                },
                onScreenSleepRequested = {
                    sleep.setSleep(true, manual = true)
                },
                onExitAppRequested = {
                    exitApplicationCompletely()
                },
                onUnbindRequested = {
                    unbindDeviceAndExit()
                }
            )
        )
        requestAppUpdateCheck()
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
        keys.cancelPending()
        sleep.releaseLocks()
        audioManager.release()
        streamManager.stopStream()
        telemetryManager.stop()
        zoneManager.release()
    }
}
