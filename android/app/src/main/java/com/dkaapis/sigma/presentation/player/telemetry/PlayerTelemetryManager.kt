package com.dkaapis.sigma.presentation.player.telemetry

import android.app.Activity
import android.util.Log
import android.view.Window
import com.dkaapis.sigma.data.analytics.AnalyticsSyncManager
import com.dkaapis.sigma.data.analytics.DeviceHardwareProfiler
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.presentation.player.telemetry.model.WatchdogCallbackPayload
import kotlinx.coroutines.CoroutineScope

/**
 * Orkestrator Telemetri & Perintah Perangkat untuk Signage Player:
 * Mengkoordinasikan heartbeat, watchdog companion, screenshot capture,
 * dan eksekusi perintah ClearCache/Reboot.
 */
class PlayerTelemetryManager(
    private val activity: Activity,
    private val scope: CoroutineScope,
    private val deviceRepo: DeviceRepositoryImpl,
    private val hardwareProfiler: DeviceHardwareProfiler,
    private val analyticsSyncManager: AnalyticsSyncManager,
    private val channelFactory: GrpcChannelFactory,
    private val callbacks: WatchdogCallbackPayload
) {
    private val watchdogPingHelper = WatchdogPingHelper(
        activity = activity,
        scope = scope,
        deviceRepo = deviceRepo,
        hardwareProfiler = hardwareProfiler,
        analyticsSyncManager = analyticsSyncManager,
        callbacks = callbacks
    )

    private val screenshotHelper = PlayerScreenshotHelper()
    private val commandHandler = PlayerDeviceCommandHandler()
    private var isCapturingScreenshot = false

    fun start() {
        watchdogPingHelper.start()
    }

    fun stop() {
        watchdogPingHelper.stop()
    }

    fun handleClearCache(onShowUiProgress: () -> Unit, onSyncRequested: () -> Unit) {
        commandHandler.handleClearCache(activity, onShowUiProgress, onSyncRequested)
    }

    fun handleReboot() {
        commandHandler.handleReboot(activity)
    }

    fun handleDisplayPowerCec(turnOn: Boolean): Boolean {
        return commandHandler.trySetDisplayPowerByCec(activity, turnOn)
    }

    fun handleCaptureScreenshot(window: Window) {
        if (isCapturingScreenshot) return
        isCapturingScreenshot = true
        Log.i(TAG, "Menerima perintah CaptureScreenshot. Mengambil screenshot tampilan layar...")

        screenshotHelper.captureScreen(window) { imageBytes ->
            val devId = deviceRepo.getSavedDeviceId()
            if (imageBytes != null && imageBytes.isNotEmpty() && !devId.isNullOrEmpty()) {
                screenshotHelper.uploadScreenshot(
                    scope = scope,
                    channelFactory = channelFactory,
                    deviceId = devId,
                    imageBytes = imageBytes,
                    onComplete = { isCapturingScreenshot = false }
                )
            } else {
                isCapturingScreenshot = false
                Log.e(TAG, "Gagal menghasilkan byte screenshot atau deviceId kosong")
            }
        }
    }

    companion object {
        private const val TAG = "PlayerTelemetryManager"
    }
}
