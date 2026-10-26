package com.dkaapis.sigma.presentation.player.telemetry

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.local.MediaDiskCache

import android.content.Context
import android.os.Build
import android.os.PowerManager
import com.dkaapis.sigma.presentation.restart.RestartActivity
import java.util.concurrent.TimeUnit

/**
 * Eksekutor perintah perangkat keras dari CMS (Reboot & ClearCache)
 */
class PlayerDeviceCommandHandler {

    fun handleClearCache(
        activity: Activity,
        onShowUiProgress: () -> Unit,
        onSyncRequested: () -> Unit
    ) {
        runCatching {
            Log.i(TAG, "Menerima perintah ClearCache. Membersihkan penyimpanan lokal...")
            MediaDiskCache(activity).clearAllCache()
            ManifestStorage(activity).clear()
            onShowUiProgress()
            onSyncRequested()
        }.onFailure { err ->
            Log.e(TAG, "Gagal membersihkan cache: ${err.message}")
        }
    }

    fun handleReboot(activity: Activity) {
        runCatching {
            Log.i(TAG, "Menerima perintah RebootPlayer...")

            // 1. Coba reboot hardware jika perangkat memiliki akses root atau izin sistem (STB / Android TV box)
            if (tryHardwareReboot(activity)) {
                Log.i(TAG, "Perintah reboot hardware sistem berhasil dieksekusi.")
                return
            }

            // 2. Jika bukan root/sistem, restart aplikasi secara bersih via isolated process trampoline
            Log.i(TAG, "Hardware reboot tidak tersedia/bukan root. Me-restart aplikasi player...")
            RestartActivity.restart(activity)
        }.onFailure { err ->
            Log.e(TAG, "Gagal mengeksekusi reboot/restart: ${err.message}", err)
        }
    }

    private fun tryHardwareReboot(context: Context): Boolean {
        // Coba PowerManager (hanya jika system-app / Device Owner berkonsol firmware)
        try {
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            pm?.reboot(null)
            return true
        } catch (_: Throwable) {}

        // Coba root command 'su -c reboot' (umum pada STB / Android TV box digital signage)
        try {
            val proc = Runtime.getRuntime().exec(arrayOf("su", "-c", "reboot"))
            val exited = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                proc.waitFor(1, TimeUnit.SECONDS)
            } else {
                false
            }
            if (exited && proc.exitValue() == 0) {
                return true
            }
        } catch (_: Throwable) {}

        return false
    }

    companion object {
        private const val TAG = "PlayerDeviceCommandHandler"
    }
}
