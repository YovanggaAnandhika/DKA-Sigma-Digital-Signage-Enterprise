package com.dkaapis.sigma.presentation.player.telemetry

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.local.MediaDiskCache

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
            Log.i(TAG, "Menerima perintah RebootPlayer. Memuat ulang aplikasi...")
            val intent = activity.packageManager.getLaunchIntentForPackage(activity.packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (intent != null) {
                activity.startActivity(intent)
                activity.finish()
                Runtime.getRuntime().exit(0)
            }
        }.onFailure { err ->
            Log.e(TAG, "Gagal restart: ${err.message}")
        }
    }

    companion object {
        private const val TAG = "PlayerDeviceCommandHandler"
    }
}
