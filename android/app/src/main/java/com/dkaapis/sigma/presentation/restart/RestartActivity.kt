package com.dkaapis.sigma.presentation.restart

import android.app.Activity
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Process
import kotlin.system.exitProcess

/**
 * Aktivitas perantara di proses terisolasi (:restart) untuk me-restart
 * aplikasi secara bersih tanpa terhalang siklus hidup proses lama.
 */
class RestartActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
        if (launchIntent != null) {
            startActivity(launchIntent)
        }
        finish()
        Process.killProcess(Process.myPid())
        exitProcess(0)
    }

    companion object {
        fun restart(context: Context) {
            // Cadangan AlarmManager jika sistem menunda transisi proses
            runCatching {
                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                }
                if (launchIntent != null) {
                    val pendingIntent = PendingIntent.getActivity(
                        context.applicationContext,
                        99999,
                        launchIntent,
                        PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                    alarmManager?.set(
                        AlarmManager.RTC_WAKEUP,
                        System.currentTimeMillis() + 1000,
                        pendingIntent
                    )
                }
            }

            // Transisi ke RestartActivity di proses terisolasi :restart
            val intent = Intent(context, RestartActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)

            if (context is Activity) {
                context.finishAffinity()
            }

            Process.killProcess(Process.myPid())
            exitProcess(0)
        }
    }
}
