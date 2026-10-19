package com.dkaapis.sigma.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenStorage(private val context: Context) {

    private var fallbackPrefs: SharedPreferences? = null

    private val prefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (t: Throwable) {
            // Commercial Android displays (e.g. MaxHub, Seewo) often lack full hardware KeyStore or throw NoClassDefFoundError / AssertionError
            Log.w(TAG, "KeyStore/EncryptedSharedPreferences tidak didukung, menggunakan Plain SharedPreferences: ${t.message}")
            getPlainPrefs()
        }
    }

    private fun getPlainPrefs(): SharedPreferences {
        if (fallbackPrefs == null) {
            fallbackPrefs = context.getSharedPreferences(PREFS_NAME + "_plain", Context.MODE_PRIVATE)
        }
        return fallbackPrefs!!
    }

    fun saveCredentials(deviceId: String, deviceToken: String) {
        try {
            prefs.edit()
                .putString(KEY_DEVICE_ID, deviceId)
                .putString(KEY_DEVICE_TOKEN, deviceToken)
                .apply()
        } catch (t: Throwable) {
            Log.e(TAG, "Gagal simpan ke secure prefs, menyimpan ke plain prefs: ${t.message}")
            try {
                getPlainPrefs().edit()
                    .putString(KEY_DEVICE_ID, deviceId)
                    .putString(KEY_DEVICE_TOKEN, deviceToken)
                    .apply()
            } catch (inner: Throwable) {
                Log.e(TAG, "Gagal simpan credentials: ${inner.message}")
            }
        }
    }

    fun saveDeviceId(deviceId: String) {
        try {
            prefs.edit()
                .putString(KEY_DEVICE_ID, deviceId)
                .apply()
        } catch (t: Throwable) {
            try {
                getPlainPrefs().edit()
                    .putString(KEY_DEVICE_ID, deviceId)
                    .apply()
            } catch (inner: Throwable) {
                Log.e(TAG, "Gagal simpan deviceId: ${inner.message}")
            }
        }
    }

    fun getDeviceId(): String? {
        return try {
            prefs.getString(KEY_DEVICE_ID, null)
        } catch (t: Throwable) {
            try {
                getPlainPrefs().getString(KEY_DEVICE_ID, null)
            } catch (_: Throwable) {
                null
            }
        }
    }

    fun getDeviceToken(): String? {
        return try {
            prefs.getString(KEY_DEVICE_TOKEN, null)
        } catch (t: Throwable) {
            try {
                getPlainPrefs().getString(KEY_DEVICE_TOKEN, null)
            } catch (_: Throwable) {
                null
            }
        }
    }

    fun clear() {
        try {
            prefs.edit().clear().apply()
        } catch (t: Throwable) {
            Log.w(TAG, "Gagal clear secure prefs: ${t.message}")
        }
        try {
            getPlainPrefs().edit().clear().apply()
        } catch (_: Throwable) {}
    }

    fun isPaired(): Boolean {
        return !getDeviceId().isNullOrBlank() && !getDeviceToken().isNullOrBlank()
    }

    companion object {
        private const val TAG = "TokenStorage"
        private const val PREFS_NAME = "dkasigma_secure_prefs"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_TOKEN = "device_token"
    }
}
