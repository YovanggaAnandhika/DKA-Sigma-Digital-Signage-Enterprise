package com.dkaapis.sigma.data.local

import android.content.Context
import android.content.SharedPreferences
import com.dkaapis.sigma.R

object ServerConfig {
    private const val PREFS_NAME = "dkasigma_server_config"
    private const val KEY_HOST = "server_host"
    private const val KEY_GRPC_PORT = "server_grpc_port"
    private const val KEY_USE_TLS = "server_use_tls"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getHost(context: Context): String {
        val saved = getPrefs(context).getString(KEY_HOST, null)
        if (!saved.isNullOrBlank()) return saved.trim()
        return try {
            context.getString(R.string.server_host).trim()
        } catch (_: Exception) {
            "10.20.30.63"
        }
    }

    fun getGrpcPort(context: Context): Int {
        val saved = getPrefs(context).getInt(KEY_GRPC_PORT, -1)
        if (saved > 0) return saved
        return try {
            context.getString(R.string.server_port).trim().toInt()
        } catch (_: Exception) {
            50051
        }
    }

    fun isTls(context: Context): Boolean {
        if (getPrefs(context).contains(KEY_USE_TLS)) {
            return getPrefs(context).getBoolean(KEY_USE_TLS, false)
        }
        return try {
            context.getString(R.string.server_use_tls).toBoolean()
        } catch (_: Exception) {
            false
        }
    }

    fun saveConfig(context: Context, rawHost: String, grpcPort: Int, useTls: Boolean = false) {
        var cleanHost = rawHost.trim()
            .removePrefix("grpc://")
            .removePrefix("http://")
            .removePrefix("https://")
            .trimEnd('/')

        var resolvedGrpcPort = grpcPort
        if (cleanHost.contains(":")) {
            val parts = cleanHost.split(":")
            cleanHost = parts[0]
            val inlinePort = parts.getOrNull(1)?.toIntOrNull()
            if (inlinePort != null && inlinePort > 0 && resolvedGrpcPort <= 0) {
                resolvedGrpcPort = inlinePort
            }
        }

        getPrefs(context).edit()
            .putString(KEY_HOST, cleanHost)
            .putInt(KEY_GRPC_PORT, if (resolvedGrpcPort > 0) resolvedGrpcPort else 50051)
            .putBoolean(KEY_USE_TLS, useTls)
            .apply()
    }

    fun resetToDefaults(context: Context) {
        getPrefs(context).edit().clear().apply()
    }
}
