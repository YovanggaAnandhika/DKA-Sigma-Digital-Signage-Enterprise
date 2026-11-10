package com.dkaapis.sigma.presentation.player.coordinator

import android.os.PowerManager
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.dkaapis.sigma.domain.model.PowerSchedule
import com.dkaapis.sigma.presentation.player.audio.PlayerAudioManager
import com.dkaapis.sigma.presentation.player.canvas.PlayerZoneManager
import com.dkaapis.sigma.presentation.player.telemetry.PlayerTelemetryManager
import com.dkaapis.sigma.service.WatchdogService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Calendar

/** WakeLock, jadwal tidur layar (Toko Tutup), dan overlay blackout. */
class PlayerSleepCoordinator(
    private val activity: AppCompatActivity,
    private val canvas: View,
    private val audio: PlayerAudioManager,
    private val zones: PlayerZoneManager,
    private val telemetry: PlayerTelemetryManager,
    private val hasActivePlayback: () -> Boolean
) {
    var isSleeping = false
        private set
    private var manualOverride: Boolean? = null
    private var schedule: PowerSchedule? = null
    private var screenLock: PowerManager.WakeLock? = null
    private var cpuLock: PowerManager.WakeLock? = null

    val blackout = View(activity).apply {
        setBackgroundColor(android.graphics.Color.BLACK)
        layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        visibility = View.GONE
        isClickable = true
        isFocusable = true
        setOnClickListener { setSleep(false, manual = true) }
    }

    fun startMonitor() {
        activity.lifecycleScope.launch {
            while (isActive) {
                evaluate()
                delay(30_000L)
            }
        }
    }

    fun setSchedule(ps: PowerSchedule?) {
        schedule = ps
        manualOverride = null
        evaluate()
    }

    @Suppress("DEPRECATION")
    fun acquireScreenLock() {
        runCatching {
            val pm = activity.getSystemService(AppCompatActivity.POWER_SERVICE) as? PowerManager ?: return
            releaseLock(cpuLock); cpuLock = null
            if (screenLock?.isHeld == true) return
            // shortcut: SCREEN_BRIGHT_WAKE_LOCK deprecated di API 13, tapi dibutuhkan firmware TV (Polytron/MediaTek/Realtek) yang mengabaikan FLAG_KEEP_SCREEN_ON saat idle lama
            screenLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "HNDSigma:SignageScreenWakeLock"
            ).also { it.setReferenceCounted(false); it.acquire() }
        }
    }

    fun releaseLocks() {
        releaseLock(screenLock); screenLock = null
        releaseLock(cpuLock); cpuLock = null
    }

    private fun releaseLock(l: PowerManager.WakeLock?) {
        runCatching { if (l?.isHeld == true) l.release() }
    }

    private fun acquireCpuLock() {
        runCatching {
            if (cpuLock?.isHeld == true) return
            val pm = activity.getSystemService(AppCompatActivity.POWER_SERVICE) as? PowerManager ?: return
            cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HNDSigma:SignageCpuSleepWakeLock")
                .also { it.setReferenceCounted(false); it.acquire() }
        }
    }

    private fun evaluate() {
        if (manualOverride != null) return
        val ps = schedule
        if (ps == null || !ps.enabled) {
            if (isSleeping) setSleep(false, manual = false)
            return
        }
        val shouldSleep = inSleepWindow(ps.sleepTime, ps.wakeTime)
        if (shouldSleep != isSleeping) setSleep(shouldSleep, manual = false)
    }

    private fun inSleepWindow(sleepStr: String, wakeStr: String): Boolean {
        fun mins(s: String): Int? {
            val p = s.trim().split(":")
            if (p.size < 2) return null
            return (p[0].toIntOrNull() ?: return null) * 60 + (p[1].toIntOrNull() ?: return null)
        }
        val sleep = mins(sleepStr) ?: return false
        val wake = mins(wakeStr) ?: return false
        if (sleep == wake) return false
        val cal = Calendar.getInstance()
        val now = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        // Rentang lintas tengah malam (misal 22:00 s/d 06:00)
        return if (sleep < wake) now in sleep until wake else now >= sleep || now < wake
    }

    /**
     * Mode tidur layar (Toko Tutup): kecerahan 0, blackout, jeda video+suara; gRPC stream tetap hidup.
     * Sinyal HDMI-CEC standby/wake dikirim di background bila hardware mendukung.
     */
    fun setSleep(sleep: Boolean, manual: Boolean) {
        activity.runOnUiThread {
            if (manual) manualOverride = sleep
            if (isSleeping == sleep && blackout.visibility == (if (sleep) View.VISIBLE else View.GONE)) return@runOnUiThread
            isSleeping = sleep
            val window = activity.window
            val lp = window.attributes
            if (sleep) {
                // Lepas semua pengunci layar agar backlight TV boleh mati penuh oleh driver display/CEC
                releaseLock(screenLock); screenLock = null
                acquireCpuLock()
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                window.decorView.keepScreenOn = false
                canvas.keepScreenOn = false
                lp.screenBrightness = 0.0f
                window.attributes = lp
                blackout.visibility = View.VISIBLE
                blackout.bringToFront()
                audio.stopCurrentVoice()
                zones.pausePlayback()
                WatchdogService.setPlaybackActive(activity, false)
            } else {
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                window.decorView.keepScreenOn = true
                canvas.keepScreenOn = true
                lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                window.attributes = lp
                blackout.visibility = View.GONE
                acquireScreenLock()
                if (hasActivePlayback()) {
                    zones.resumePlayback()
                    WatchdogService.setPlaybackActive(activity, true)
                }
            }
            activity.lifecycleScope.launch(Dispatchers.IO) { telemetry.handleDisplayPowerCec(turnOn = !sleep) }
        }
    }
}
