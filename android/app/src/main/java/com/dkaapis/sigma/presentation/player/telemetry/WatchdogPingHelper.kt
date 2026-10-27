package com.dkaapis.sigma.presentation.player.telemetry

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.dkaapis.sigma.data.analytics.AnalyticsSnapshotData
import com.dkaapis.sigma.data.analytics.AnalyticsSyncManager
import com.dkaapis.sigma.data.analytics.AssetStatsData
import com.dkaapis.sigma.data.analytics.DeviceHardwareProfiler
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.presentation.player.telemetry.model.WatchdogCallbackPayload
import com.dkaapis.sigma.service.WatchdogService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/**
 * Pengelola detak jantung (heartbeat) pemain signage:
 * - Ping berkala ke WatchdogService setiap 3.000 ms
 * - Pengiriman heartbeat gRPC ke server beserta manifest hash aktif
 * - Pengambilan metrik profil perangkat keras & sinkronisasi analitik
 */
class WatchdogPingHelper(
    private val activity: Activity,
    private val scope: CoroutineScope,
    private val deviceRepo: DeviceRepositoryImpl,
    private val hardwareProfiler: DeviceHardwareProfiler,
    private val analyticsSyncManager: AnalyticsSyncManager,
    private val callbacks: WatchdogCallbackPayload
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var lastAnalyticsSyncTimeMs = 0L

    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            WatchdogService.pingFromPlayer(activity)
            val now = System.currentTimeMillis()
            val shouldSyncAnalytics = (now - lastAnalyticsSyncTimeMs >= 15000L)
            val allAssetStats = if (shouldSyncAnalytics) {
                lastAnalyticsSyncTimeMs = now
                callbacks.collectAssetStats()
            } else emptyList()

            scope.launch {
                runCatching {
                    processHeartbeat()
                    if (shouldSyncAnalytics) {
                        syncAnalyticsMetrics(allAssetStats)
                    }
                }.onFailure { err ->
                    Log.w(TAG, "Watchdog tick failure: ${err.message}")
                }
            }
            if (isRunning) {
                mainHandler.postDelayed(this, 3000)
            }
        }
    }

    private suspend fun processHeartbeat() {
        val currentHash = callbacks.getActiveManifestHash()
        val res = deviceRepo.sendHeartbeat(manifestHash = currentHash)

        if (res.isFailure) {
            if (!callbacks.isDevicePaired()) {
                callbacks.onDeviceUnpaired()
            } else {
                Log.w(TAG, "Heartbeat sementara gagal: ${res.exceptionOrNull()?.message}")
            }
            return
        }

        val hb = res.getOrNull() ?: return
        val cmd = hb.pendingCommand
        if (!cmd.isNullOrBlank()) {
            Log.i(TAG, "Menerima pending command via Heartbeat: $cmd")
            callbacks.onPendingCommand(cmd)
        }

        if (hb.needsManifestSync) {
            callbacks.onNeedsManifestSync()
        }
    }

    private suspend fun syncAnalyticsMetrics(allAssetStats: List<AssetStatsData>) {
        runCatching {
            val hwMetrics = hardwareProfiler.sampleMetrics()
            val assetsArray = JSONArray().apply {
                if (allAssetStats.isNotEmpty()) {
                    for (stat in allAssetStats) {
                        put(JSONObject(stat.toJson()))
                    }
                } else {
                    put(
                        JSONObject(
                            AssetStatsData(
                                zoneName = "Standby Zone",
                                mediaName = "Standby / Static Content",
                                playbackStatus = "IDLE",
                                diagnosticFlag = "OPTIMAL"
                            ).toJson()
                        )
                    )
                }
            }

            val snap = AnalyticsSnapshotData(
                inputOutputJson = hwMetrics.toJson(),
                assetsStatsJson = assetsArray.toString()
            )
            analyticsSyncManager.recordAndSync(snap)
        }
    }

    fun start() {
        if (isRunning) return
        isRunning = true
        mainHandler.post(heartbeatRunnable)
    }

    fun stop() {
        isRunning = false
        mainHandler.removeCallbacks(heartbeatRunnable)
    }

    companion object {
        private const val TAG = "WatchdogPingHelper"
    }
}
