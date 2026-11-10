package com.dkaapis.sigma.presentation.player.coordinator

import android.os.Handler
import android.os.Looper
import android.view.KeyEvent

/**
 * Urutan tombol remote: Menu/Info/dll atau tahan OK/Back -> pengaturan; Back 2x -> pengaturan; Back 4x -> keluar.
 * Fungsi on* mengembalikan true bila event sudah ditangani.
 */
class PlayerKeyCoordinator(
    private val isSleeping: () -> Boolean,
    private val wake: () -> Unit,
    private val openSettings: () -> Unit,
    private val exitApp: () -> Unit,
    private val isSettingsShowing: () -> Boolean,
    private val dismissSettings: () -> Unit,
    private val toast: (String) -> Unit
) {
    private var lastBackAt = 0L
    private var backCount = 0
    private val handler = Handler(Looper.getMainLooper())
    private val delayedOpen = Runnable {
        if (backCount in 2..3) {
            backCount = 0
            openSettings()
        }
    }

    private fun isSelectOrBack(k: Int) =
        k == KeyEvent.KEYCODE_DPAD_CENTER || k == KeyEvent.KEYCODE_ENTER || k == KeyEvent.KEYCODE_BACK

    fun cancelPending() = handler.removeCallbacks(delayedOpen)

    fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (isSleeping()) {
            wake()
            return true
        }
        when (keyCode) {
            KeyEvent.KEYCODE_MENU, KeyEvent.KEYCODE_SETTINGS, KeyEvent.KEYCODE_INFO,
            KeyEvent.KEYCODE_GUIDE, KeyEvent.KEYCODE_PROG_RED -> {
                openSettings()
                return true
            }
        }
        if (isSelectOrBack(keyCode)) {
            event?.startTracking()
            return true
        }
        return false
    }

    fun onKeyLongPress(keyCode: Int): Boolean {
        if (!isSelectOrBack(keyCode)) return false
        cancelPending()
        backCount = 0
        openSettings()
        return true
    }

    fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (event?.isCanceled == true) return true
        if (keyCode != KeyEvent.KEYCODE_BACK) return false
        val now = System.currentTimeMillis()
        backCount = if (now - lastBackAt <= 1200L) backCount + 1 else 1
        lastBackAt = now
        cancelPending()
        when {
            backCount >= 4 -> {
                backCount = 0
                dismissSettings()
                toast("Menutup HNDSigma Player...")
                exitApp()
            }
            backCount == 1 ->
                if (isSettingsShowing()) dismissSettings()
                else toast("Tekan Back 2x: Pengaturan • 4x: Keluar Aplikasi")
            // Tunggu 450ms untuk melihat apakah pengguna lanjut menekan sampai 4x
            else -> handler.postDelayed(delayedOpen, 450L)
        }
        return true
    }
}
