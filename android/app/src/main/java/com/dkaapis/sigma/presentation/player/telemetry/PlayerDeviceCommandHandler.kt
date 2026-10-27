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
     * Mencoba mematikan/menyalakan panel fisik layar (backlight) melalui:
     * 1. SurfaceControl.setDisplayPowerMode(POWER_MODE_OFF = 0 / POWER_MODE_NORMAL = 2)
     * 2. PowerManager.goToSleep() / wakeUp()
     * 3. Sysfs backlight bl_power (jika diizinkan oleh kernel TV)
     * 4. HDMI-CEC Standby / One Touch Play (HdmiControlManager)
     */
    fun trySetDisplayPowerByCec(context: Context, turnOn: Boolean): Boolean {
        var handled = false

        // 1. Coba matikan/nyalakan panel fisik via SurfaceControl (POWER_MODE_OFF = 0, POWER_MODE_NORMAL = 2)
        runCatching {
            val scClass = Class.forName("android.view.SurfaceControl")
            val tokenMethod = scClass.methods.firstOrNull {
                it.name == "getInternalDisplayToken" || it.name == "getBuiltInDisplay"
            }
            val displayToken = if (tokenMethod != null) {
                if (tokenMethod.parameterTypes.isEmpty()) tokenMethod.invoke(null)
                else tokenMethod.invoke(null, 0)
            } else null

            if (displayToken != null) {
                val powerMethod = scClass.methods.firstOrNull {
                    it.name == "setDisplayPowerMode" && it.parameterTypes.size == 2
                }
                if (powerMethod != null) {
                    val mode = if (turnOn) 2 else 0 // 2 = POWER_MODE_NORMAL, 0 = POWER_MODE_OFF
                    powerMethod.invoke(null, displayToken, mode)
                    handled = true
                }
            }
        }

        // 2. Coba PowerManager goToSleep / wakeUp jika diizinkan sistem
        runCatching {
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (pm != null) {
                val now = android.os.SystemClock.uptimeMillis()
                if (turnOn) {
                    val wakeMethod = pm.javaClass.methods.firstOrNull { it.name == "wakeUp" && it.parameterTypes.size == 1 }
                    wakeMethod?.invoke(pm, now)
                } else {
                    val sleepMethod = pm.javaClass.methods.firstOrNull { it.name == "goToSleep" && it.parameterTypes.size == 1 }
                    sleepMethod?.invoke(pm, now)
                }
            }
        }

        // 3. Coba sysfs backlight bl_power pada board TV (0 = ON, 4 = FB_BLANK_POWERDOWN)
        runCatching {
            val blDir = java.io.File("/sys/class/backlight")
            if (blDir.exists() && blDir.isDirectory) {
                blDir.listFiles()?.forEach { devDir ->
                    val blPower = java.io.File(devDir, "bl_power")
                    if (blPower.exists() && blPower.canWrite()) {
                        blPower.writeText(if (turnOn) "0" else "4")
                        handled = true
                    }
                }
            }
        }

        // 4. Coba HDMI-CEC Standby / One Touch Play (HdmiControlManager)
        runCatching {
            val hdmiService = context.getSystemService("hdmi_control") ?: return@runCatching
            val clazz = hdmiService.javaClass
            if (turnOn) {
                val clientMethod = clazz.methods.firstOrNull { it.name == "getPlaybackClient" }
                val client = clientMethod?.invoke(hdmiService)
                val touchPlay = client?.javaClass?.methods?.firstOrNull { it.name == "oneTouchPlay" && it.parameterTypes.size == 1 }
                touchPlay?.invoke(client, null)
                handled = true
            } else {
                val tvClientMethod = clazz.methods.firstOrNull { it.name == "getTvClient" }
                val pbClientMethod = clazz.methods.firstOrNull { it.name == "getPlaybackClient" }
                val standbyMethod = clazz.methods.firstOrNull { it.name == "sendStandby" && it.parameterTypes.size == 2 }
                if (standbyMethod != null) {
                    if (tvClientMethod?.invoke(hdmiService) != null) {
                        standbyMethod.invoke(hdmiService, 0, 0) // DEVICE_TV (0) -> ADDR_TV (0)
                    }
                    if (pbClientMethod?.invoke(hdmiService) != null) {
                        standbyMethod.invoke(hdmiService, 4, 0) // DEVICE_PLAYBACK (4) -> ADDR_TV (0)
                    }
                    handled = true
                }
            }
        }

        return handled
    }

    companion object {
        private const val TAG = "PlayerDeviceCommandHandler"
    }
}
