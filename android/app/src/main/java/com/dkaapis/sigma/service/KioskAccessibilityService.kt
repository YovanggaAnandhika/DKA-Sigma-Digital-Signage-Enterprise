package com.dkaapis.sigma.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.dkaapis.sigma.presentation.player.PlayerActivity

/**
 * Layanan Aksesibilitas Kiosk untuk Google TV / Android TV.
 * Mengatasi pembatasan hardcoded Google TV Launcher (com.google.android.apps.tv.launcherx)
 * dengan mendeteksi kembalinya sistem ke launcher bawaan saat booting atau penekanan tombol Home,
 * lalu segera mengalihkan fokus kembali ke DKASigma Player.
 */
class KioskAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "KioskAccessibilityService aktif. Menjaga DKASigma aktif di Google TV.")
        launchPlayerIfNeeded()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
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
            "com.google.android.katniss"               // Google Assistant TV launcher overlay
        )

        fun isStockLauncherPackage(pkg: String): Boolean {
            return pkg in STOCK_LAUNCHER_PACKAGES ||
                    pkg.contains("launcherx", ignoreCase = true) ||
                    (pkg.contains("tvlauncher", ignoreCase = true) && !pkg.contains("sigma", ignoreCase = true))
        }
    }
}
