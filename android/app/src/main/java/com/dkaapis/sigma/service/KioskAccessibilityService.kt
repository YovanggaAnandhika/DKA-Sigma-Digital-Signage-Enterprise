package com.dkaapis.sigma.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.dkaapis.sigma.data.local.PlayerSettingsStorage
import com.dkaapis.sigma.presentation.player.PlayerActivity

/**
 * Layanan Aksesibilitas Kiosk untuk Google TV / Android TV (Opsional).
 * Hanya berjalan apabila mode Kiosk diaktifkan oleh pengguna di Pengaturan Layar.
 */
class KioskAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        if (!PlayerSettingsStorage(this).isKioskModeEnabled()) {
            Log.i(TAG, "Mode Kiosk nonaktif di pengaturan. Menonaktifkan KioskAccessibilityService.")
            disableSelf()
            return
        }
        Log.i(TAG, "KioskAccessibilityService aktif. Menjaga DKASigma aktif di Google TV.")
        launchPlayerIfNeeded()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        if (!PlayerSettingsStorage(this).isKioskModeEnabled()) return
        val pkgName = event.packageName?.toString() ?: return

        // Periksa apakah layar beralih ke launcher Google TV / Android TV
        if (isStockLauncherPackage(pkgName)) {
            Log.d(TAG, "Terdeteksi launcher sistem ($pkgName). Mengalihkan kembali ke DKASigma Player...")
            launchPlayerIfNeeded()
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "KioskAccessibilityService diinterupsi.")
    }

    private fun launchPlayerIfNeeded() {
        try {
            val intent = Intent(this, PlayerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            }
            startActivity(intent)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal meluncurkan PlayerActivity dari KioskAccessibilityService: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "DKAKioskService"

        private val STOCK_LAUNCHER_PACKAGES = setOf(
            "com.google.android.apps.tv.launcherx",    // Google TV launcher
            "com.google.android.tvlauncher",           // Android TV home launcher
            "com.google.android.tungsten.setupwraith", // Setup wizard
            "com.google.android.katniss",              // Google Assistant TV launcher overlay
            "com.google.android.deskclock",            // Screen saver / Clock Daydream
            "com.google.android.backdrop"              // Google TV Ambient Mode / Screensaver
        )

        fun isStockLauncherPackage(pkg: String): Boolean {
            return pkg in STOCK_LAUNCHER_PACKAGES ||
                    pkg.contains("launcherx", ignoreCase = true) ||
                    pkg.contains("screensaver", ignoreCase = true) ||
                    pkg.contains("dreams", ignoreCase = true) ||
                    pkg.contains("backdrop", ignoreCase = true) ||
                    (pkg.contains("tvlauncher", ignoreCase = true) && !pkg.contains("sigma", ignoreCase = true))
        }
    }
}
