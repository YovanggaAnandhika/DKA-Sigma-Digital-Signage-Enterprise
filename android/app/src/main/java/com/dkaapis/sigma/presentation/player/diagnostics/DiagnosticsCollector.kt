package com.dkaapis.sigma.presentation.player.diagnostics

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Process
import android.os.SystemClock
import android.util.Log
import androidx.media3.common.util.UnstableApi
import java.io.File
import java.io.IOException
import com.dkaapis.sigma.presentation.player.canvas.PlayerZoneManager
import signage.distribution.v1.stream.StreamCommon

/** Snapshot CPU (proses app), RAM, heap, dan status tiap zona video/live untuk panel realtime CMS. */
class DiagnosticsCollector(
    private val context: Context,
    private val zones: PlayerZoneManager,
    private val isScreenSleeping: () -> Boolean
) {
    private val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
    private var lastCpuMs = Process.getElapsedCpuTime()
    private var lastWallMs = SystemClock.elapsedRealtime()
    private val lastCrash = readLastCrash()

    // shortcut: CPU = beban proses app (/proc/stat diblokir di Android 8+), upgrade bila butuh CPU sistem total
    private fun cpuPercent(): Float {
        val cpu = Process.getElapsedCpuTime()
        val wall = SystemClock.elapsedRealtime()
        val dWall = (wall - lastWallMs).coerceAtLeast(1)
        val pct = (cpu - lastCpuMs) * 100f / (dWall * cores)
        lastCpuMs = cpu
        lastWallMs = wall
        return pct.coerceIn(0f, 100f)
    }

    @androidx.annotation.OptIn(markerClass = [UnstableApi::class])
    fun snapshot(): StreamCommon.LiveDiagnostics {
        val mem = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
        val rt = Runtime.getRuntime()
        val b = StreamCommon.LiveDiagnostics.newBuilder()
            .setTimestampMs(System.currentTimeMillis())
            .setCpuPercent(cpuPercent())
            .setMemoryPercent(if (mem.totalMem > 0) (100 - mem.availMem * 100 / mem.totalMem).toInt() else 0)
            .setHeapUsedMb(((rt.totalMemory() - rt.freeMemory()) shr 20).toInt())
            .setHeapMaxMb((rt.maxMemory() shr 20).toInt())
            .setScreenSleeping(isScreenSleeping())
        lastCrash?.let {
            b.setLastCrashTimestampMs(it.timestampMs)
                .setLastCrashSummary(it.summary)
        }
        val batteryTemp = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            ?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
        if (batteryTemp > 0) b.setTemperatureC(batteryTemp / 10f)

        zones.getVideoRenderers().forEachIndexed { i, r ->
            r.getDiagnostics()?.let { b.addZones(it.toBuilder().setZoneId("video-$i").build()) }
        }
        zones.getLiveRenderers().forEach { b.addZones(it.diagnostics()) }
        zones.getStaticZoneDiagnostics().forEach(b::addZones)
        return b.build()
    }

    private fun readLastCrash(): CrashInfo? {
        val file = File(context.filesDir, "last_crash.txt")
        if (!file.isFile) return null
        return try {
            val lines = file.bufferedReader().use { reader ->
                List(5) { reader.readLine().orEmpty() }
            }
            val timestamp = lines[0].substringAfter("Crash Time Ms: ").toLongOrNull() ?: return null
            val exception = lines[4].substringAfter("Exception: ").substringBefore(":").trim()
            val thread = lines[3].substringAfter("Thread: ").trim()
            if (exception.isBlank()) return null
            CrashInfo(timestamp, "$exception pada thread ${thread.ifBlank { "unknown" }}")
        } catch (error: IOException) {
            Log.w(TAG, "Tidak dapat membaca laporan crash sebelumnya", error)
            null
        }
    }

    private data class CrashInfo(val timestampMs: Long, val summary: String)

    private companion object {
        const val TAG = "DiagnosticsCollector"
    }
}
