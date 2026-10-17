package com.dkaapis.sigma.service

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.Process
import android.util.Log
import com.dkaapis.sigma.presentation.player.PlayerActivity

class WatchdogService : Service() {

    private val checkHandler = Handler(Looper.getMainLooper())
    private val checkRunnable = object : Runnable {
        override fun run() {
            checkPlayerLiveness()
            checkHandler.postDelayed(this, CHECK_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "WatchdogService aktif di proses terisolasi :watchdog (PID: ${Process.myPid()})")
        lastHeartbeatTimestamp = System.currentTimeMillis()
        checkHandler.postDelayed(checkRunnable, CHECK_INTERVAL_MS)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val pid = intent?.getIntExtra(EXTRA_PLAYER_PID, -1) ?: -1
        if (pid > 0) {
            mainPlayerPid = pid
            lastHeartbeatTimestamp = System.currentTimeMillis()
        }

        if (intent?.hasExtra(EXTRA_PLAYBACK_ACTIVE) == true) {
            isPlaybackActive = intent.getBooleanExtra(EXTRA_PLAYBACK_ACTIVE, false)
            Log.d(TAG, "Status playback watchdog diperbarui: isPlaybackActive=$isPlaybackActive")
        }

        return START_STICKY
    }

    private fun checkPlayerLiveness() {
        // Hanya awasi freeze jika proses player terdeteksi DAN sedang dalam mode tayang aktif
        if (!isPlaybackActive || mainPlayerPid <= 0) {
            return
        }

        val now = System.currentTimeMillis()
        val elapsed = now - lastHeartbeatTimestamp

        if (elapsed > HEARTBEAT_TIMEOUT_MS) {
            Log.e(TAG, "ANR / Freeze terdeteksi pada proses utama saat tayang (PID: $mainPlayerPid, idle: ${elapsed}ms)! Me-restart secara otomatis...")

            // 1. Matikan paksa proses yang hang/freeze
            try {
                Process.killProcess(mainPlayerPid)
            } catch (e: Exception) {
                Log.e(TAG, "Gagal killProcess: ${e.message}")
            }

            // 2. Jadwalkan kebangkitan kembali PlayerActivity via AlarmManager dalam 1.000 ms
            val restartIntent = Intent(applicationContext, PlayerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            val pendingIntent = PendingIntent.getActivity(
                applicationContext,
                1001,
                restartIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
            try {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    System.currentTimeMillis() + 1000,
                    pendingIntent
                )
            } catch (e: Exception) {
                Log.w(TAG, "Gagal set alarm: ${e.message}")
            }

            // Reset timestamp agar tidak loop kill
            lastHeartbeatTimestamp = System.currentTimeMillis()
            mainPlayerPid = -1
            isPlaybackActive = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        checkHandler.removeCallbacks(checkRunnable)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "DKAWatchdog"
        private const val CHECK_INTERVAL_MS = 10_000L
        private const val HEARTBEAT_TIMEOUT_MS = 60_000L
        const val EXTRA_PLAYER_PID = "extra_player_pid"
        const val EXTRA_PLAYBACK_ACTIVE = "extra_playback_active"

        @Volatile
        private var lastHeartbeatTimestamp = 0L

        @Volatile
        private var mainPlayerPid = -1

        @Volatile
        private var isPlaybackActive = false

        fun pingFromPlayer(context: Context) {
            val intent = Intent(context, WatchdogService::class.java).apply {
                putExtra(EXTRA_PLAYER_PID, Process.myPid())
            }
            context.startService(intent)
        }

        fun setPlaybackActive(context: Context, active: Boolean) {
            val intent = Intent(context, WatchdogService::class.java).apply {
                putExtra(EXTRA_PLAYER_PID, Process.myPid())
                putExtra(EXTRA_PLAYBACK_ACTIVE, active)
            }
            context.startService(intent)
        }
    }
}
