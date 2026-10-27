package com.dkaapis.sigma.data.local

import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import com.dkaapis.sigma.service.BootReceiver
import com.dkaapis.sigma.service.KioskAccessibilityService

/**
 * Penyimpanan preferensi operasional player (toggle upload progres unduhan & mode Kiosk/Autostart opsional).
 */
class PlayerSettingsStorage(private val context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isProgressUploadEnabled(): Boolean =
        prefs.getBoolean(KEY_PROGRESS_UPLOAD_ENABLED, true)

    fun setProgressUploadEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_PROGRESS_UPLOAD_ENABLED, enabled).apply()
    }

    fun isKioskModeEnabled(): Boolean =
        prefs.getBoolean(KEY_KIOSK_MODE_ENABLED, false)

    fun setKioskModeEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_KIOSK_MODE_ENABLED, enabled).apply()
        applyKioskComponentsState(enabled)
    }

    /**
     * Mengaktifkan atau menonaktifkan komponen KioskAccessibilityService & BootReceiver secara dinamis.
     * Default di AndroidManifest adalah disabled (false) agar lolos scanning Google Play Protect.
     */
    fun applyKioskComponentsState(enabled: Boolean = isKioskModeEnabled()) {
        runCatching {
            val pm = context.packageManager
            val state = if (enabled) {
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            } else {
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            }
            pm.setComponentEnabledSetting(
                ComponentName(context, KioskAccessibilityService::class.java),
                state,
                PackageManager.DONT_KILL_APP
            )
            pm.setComponentEnabledSetting(
                ComponentName(context, BootReceiver::class.java),
                state,
                PackageManager.DONT_KILL_APP
            )
            pm.setComponentEnabledSetting(
                ComponentName(context.packageName, "com.dkaapis.sigma.presentation.player.KioskHomeLauncherAlias"),
                state,
                PackageManager.DONT_KILL_APP
            )
        }
    }

    companion object {
        private const val PREFS_NAME = "dka_player_settings"
        private const val KEY_PROGRESS_UPLOAD_ENABLED = "progress_upload_enabled"
        private const val KEY_KIOSK_MODE_ENABLED = "kiosk_mode_enabled"
    }
}
