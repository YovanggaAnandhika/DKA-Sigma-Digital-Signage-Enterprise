package com.dkaapis.sigma.service

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.dkaapis.sigma.data.local.PlayerSettingsStorage
import com.dkaapis.sigma.presentation.player.PlayerActivity

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (!PlayerSettingsStorage(context).isKioskModeEnabled()) {
            Log.d(TAG, "Autostart boot dilewati karena Mode Kiosk nonaktif.")
            return
        }
        Log.i(TAG, "Menerima broadcast autostart perangkat: $action. Menyiapkan peluncuran DKASigma Player...")

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        } ?: Intent(context, PlayerActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }

        // 1. Coba peluncuran langsung (berhasil jika aplikasi adalah default launcher / kiosk)
        try {
            context.startActivity(launchIntent)
            Log.i(TAG, "startActivity PlayerActivity berhasil dipanggil.")
        } catch (e: Throwable) {
            Log.w(TAG, "startActivity langsung dibatasi oleh sistem Android (${e.message}). Menggunakan fallback AlarmManager...")
        }

        // 2. Jadwalkan kebangkitan via AlarmManager sebagai fallback (bypass pembatasan background activity di Android 10+)
        try {
            val pendingIntent = PendingIntent.getActivity(
                context.applicationContext,
                7777,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            alarmManager?.set(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + 800,
                pendingIntent
            )
        } catch (e: Throwable) {
            Log.w(TAG, "Gagal menjadwalkan alarm startup fallback: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "DKABootReceiver"
    }
}

