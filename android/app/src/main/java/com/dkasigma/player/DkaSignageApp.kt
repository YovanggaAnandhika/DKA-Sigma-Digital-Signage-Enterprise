package com.dkasigma.player

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log

class DkaSignageApp : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "DKASigma Signage Player Initialized (PID: ${android.os.Process.myPid()})")
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "DKASigma Stream Daemon",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Menjaga koneksi gRPC DisplayStream tetap terhubung"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val TAG = "DKASigma"
        const val CHANNEL_ID = "dkasigma_stream_channel"
        lateinit var instance: DkaSignageApp
            private set
    }
}
