package com.dkaapis.sigma.service

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.dkaapis.sigma.DkaSignageApp

class PlayerForegroundService : Service() {

    override fun onCreate() {
        super.onCreate()
        Log.i("PlayerService", "PlayerForegroundService dimulai")
        startForegroundNotification()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    private fun startForegroundNotification() {
        val notification: Notification = NotificationCompat.Builder(this, DkaSignageApp.CHANNEL_ID)
            .setContentTitle("DKASigma Digital Signage")
            .setContentText("Koneksi display streaming aktif")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(101, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(101, notification)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
