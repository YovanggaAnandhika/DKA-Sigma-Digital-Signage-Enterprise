package com.dkaapis.sigma.data.local

import android.content.Context
import android.content.SharedPreferences

/**
 * Penyimpanan preferensi operasional player (misal: toggle upload progres unduhan).
 */
class PlayerSettingsStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isProgressUploadEnabled(): Boolean =
        prefs.getBoolean(KEY_PROGRESS_UPLOAD_ENABLED, true)

    fun setProgressUploadEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_PROGRESS_UPLOAD_ENABLED, enabled).apply()
    }

    companion object {
        private const val PREFS_NAME = "dka_player_settings"
        private const val KEY_PROGRESS_UPLOAD_ENABLED = "progress_upload_enabled"
    }
}
