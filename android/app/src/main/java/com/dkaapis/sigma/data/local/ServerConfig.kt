package com.dkaapis.sigma.data.local

import android.content.Context
import android.content.SharedPreferences
import com.dkaapis.sigma.R
import java.net.URI

object ServerConfig {
    private const val PREFS_NAME = "dkasigma_server_config"
    private const val KEY_HOST = "server_host"
    private const val KEY_GRPC_PORT = "server_grpc_port"
    private const val KEY_HTTP_PORT = "server_http_port"
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
            "10.20.30.64"
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

    fun getHttpPort(context: Context): Int {
        val saved = getPrefs(context).getInt(KEY_HTTP_PORT, -1)
        if (saved > 0) return saved
        return try {
            val url = context.getString(R.string.server_http_base_url)
            val uri = URI(url)
            if (uri.port > 0) uri.port else 80
        } catch (_: Exception) {
            80
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

    fun getHttpBaseUrl(context: Context): String {
        val host = getHost(context)
        val httpPort = getHttpPort(context)
        val scheme = if (isTls(context)) "https" else "http"
        return if ((scheme == "http" && httpPort == 80) || (scheme == "https" && httpPort == 443)) {
            "$scheme://$host"
        } else {
            "$scheme://$host:$httpPort"
        }
    }

    fun saveConfig(context: Context, rawHost: String, grpcPort: Int, httpPort: Int, useTls: Boolean = false) {
        var cleanHost = rawHost.trim()
            .removePrefix("http://")
            .removePrefix("https://")
            .trimEnd('/')

        var resolvedHttpPort = httpPort
        if (cleanHost.contains(":")) {
            val parts = cleanHost.split(":")
            cleanHost = parts[0]
            val inlinePort = parts.getOrNull(1)?.toIntOrNull()
            if (inlinePort != null && inlinePort > 0 && resolvedHttpPort <= 0) {
                resolvedHttpPort = inlinePort
            }
        }

        getPrefs(context).edit()
            .putString(KEY_HOST, cleanHost)
            .putInt(KEY_GRPC_PORT, if (grpcPort > 0) grpcPort else 50051)
            .putInt(KEY_HTTP_PORT, if (resolvedHttpPort > 0) resolvedHttpPort else 80)
            .putBoolean(KEY_USE_TLS, useTls)
            .apply()
    }

    fun resetToDefaults(context: Context) {
        getPrefs(context).edit().clear().apply()
    }
}
