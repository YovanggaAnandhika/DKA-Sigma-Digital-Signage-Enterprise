package com.dkaapis.sigma.presentation.player.telemetry

import android.app.Activity
import android.content.Context
import android.os.PowerManager
import android.util.Log
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.local.MediaDiskCache
import com.dkaapis.sigma.presentation.restart.RestartActivity

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

            // 1. Coba reboot hardware jika perangkat memiliki izin sistem (Device Owner / System App)
            if (tryHardwareReboot(activity)) {
                Log.i(TAG, "Perintah reboot hardware sistem berhasil dieksekusi.")
                return
            }

            // 2. Jika bukan system-app, restart aplikasi secara bersih via isolated process trampoline
            Log.i(TAG, "Hardware reboot tidak tersedia. Me-restart aplikasi player...")
            RestartActivity.restart(activity)
        }.onFailure { err ->
            Log.e(TAG, "Gagal mengeksekusi reboot/restart: ${err.message}", err)
        }
    }

    private fun tryHardwareReboot(context: Context): Boolean {
        return try {
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return false
            pm.reboot(null)
            true
        } catch (_: Throwable) {
            false
        }
    }

    /**
     * Mencoba mengirim sinyal HDMI-CEC Standby / One Touch Play pada perangkat STB/TV yang mendukung
     * (jika aplikasi memiliki akses HdmiControlManager atau sysfs CEC).
     */
    fun trySetDisplayPowerByCec(context: Context, turnOn: Boolean): Boolean {
        return runCatching {
            val hdmiService = context.getSystemService("hdmi_control") ?: return false
            val clazz = hdmiService.javaClass
            if (turnOn) {
                val clientMethod = clazz.methods.firstOrNull { it.name == "getPlaybackClient" }
                val client = clientMethod?.invoke(hdmiService) ?: return false
                val touchPlay = client.javaClass.methods.firstOrNull { it.name == "oneTouchPlay" && it.parameterTypes.size == 1 }
                touchPlay?.invoke(client, null)
                true
            } else {
                val standbyMethod = clazz.methods.firstOrNull { it.name == "sendStandby" }
                if (standbyMethod != null && standbyMethod.parameterTypes.size == 2) {
                    standbyMethod.invoke(hdmiService, 4, 0) // DEVICE_PLAYBACK (4) -> ADDR_TV (0)
                    true
                } else false
            }
        }.getOrDefault(false)
    }

    companion object {
        private const val TAG = "PlayerDeviceCommandHandler"
    }
}
