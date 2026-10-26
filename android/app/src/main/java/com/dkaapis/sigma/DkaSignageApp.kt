package com.dkaapis.sigma

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.dkaapis.sigma.presentation.crash.CrashReportActivity
import java.io.File
import java.util.Date

class DkaSignageApp : Application() {

    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && getProcessName().endsWith(":restart")) {
            return
        }
        instance = this
        setupCrashHandler()
        Log.i(TAG, "DKASigma Signage Player Initialized (PID: ${android.os.Process.myPid()})")
        createNotificationChannel()
    }

    private fun setupCrashHandler() {
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e(TAG, "CRITICAL CRASH pada thread [${thread.name}]: ${throwable.message}", throwable)
            try {
                val crashFile = File(filesDir, "last_crash.txt")
                crashFile.writeText(
                    "Crash Time: ${Date()}\n" +
                    "Device: ${Build.MANUFACTURER} ${Build.MODEL} (Android ${Build.VERSION.RELEASE}, API ${Build.VERSION.SDK_INT})\n" +
                    "Thread: ${thread.name}\n" +
                    "Exception: ${throwable.javaClass.name}: ${throwable.message}\n" +
                    "Stacktrace:\n${throwable.stackTraceToString()}"
                )
            } catch (_: Throwable) {}

            try {
                val intent = Intent(this, CrashReportActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    putExtra("error_class", throwable.javaClass.name)
                    putExtra("error_message", throwable.message ?: "Unknown error")
                    putExtra("error_stacktrace", throwable.stackTraceToString())
                    putExtra("error_thread", thread.name)
                }
                startActivity(intent)
            } catch (t: Throwable) {
                Log.e(TAG, "Gagal meluncurkan CrashReportActivity: ${t.message}")
            }

            android.os.Process.killProcess(android.os.Process.myPid())
            System.exit(10)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "DKASigma Stream Daemon",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Menjaga koneksi gRPC DisplayStream tetap terhubung"
                    setShowBadge(false)
                }
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                manager?.createNotificationChannel(channel)
            } catch (t: Throwable) {
                Log.w(TAG, "Gagal membuat NotificationChannel: ${t.message}")
            }
        }
    }

    companion object {
        const val TAG = "DKASigma"
        const val CHANNEL_ID = "dkasigma_stream_channel"
        lateinit var instance: DkaSignageApp
            private set
    }
}
