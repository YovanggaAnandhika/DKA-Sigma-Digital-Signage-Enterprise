package com.dkaapis.sigma.presentation.player.diagnostics

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Process
import android.os.SystemClock
import com.dkaapis.sigma.presentation.player.canvas.PlayerZoneManager
import signage.distribution.v1.stream.StreamCommon

/** Snapshot CPU (proses app), RAM, heap, dan status tiap zona video/live untuk panel realtime CMS. */
class DiagnosticsCollector(
    private val context: Context,
    private val zones: PlayerZoneManager
) {
    private val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
    private var lastCpuMs = Process.getElapsedCpuTime()
    private var lastWallMs = SystemClock.elapsedRealtime()

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

    fun snapshot(): StreamCommon.LiveDiagnostics {
        val mem = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
        val rt = Runtime.getRuntime()
        val b = StreamCommon.LiveDiagnostics.newBuilder()
            .setTimestampMs(System.currentTimeMillis())
            .setCpuPercent(cpuPercent())
            .setMemoryPercent(if (mem.totalMem > 0) (100 - mem.availMem * 100 / mem.totalMem).toInt() else 0)
            .setHeapUsedMb(((rt.totalMemory() - rt.freeMemory()) shr 20).toInt())
            .setHeapMaxMb((rt.maxMemory() shr 20).toInt())
        val batteryTemp = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            ?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
        if (batteryTemp > 0) b.setTemperatureC(batteryTemp / 10f)

        zones.getVideoRenderers().forEachIndexed { i, r ->
            val s = r.getDiagnosticsStats() ?: return@forEachIndexed
            b.addZones(
                StreamCommon.ZoneDiagnostics.newBuilder()
                    .setZoneId("video-$i").setKind("VIDEO").setMediaName(s.mediaName)
                    .setMediaId(s.mediaId)
                    .setState(s.playbackStatus).setTransport("FILE").setCodec(s.codec)
                    .setResolution(s.resolution).setBitrateKbps(s.bitrateKbps).setDroppedFrames(s.droppedFrames)
            )
        }
        zones.getLiveRenderers().forEach { b.addZones(it.diagnostics()) }
        zones.getStaticZoneDiagnostics().forEach(b::addZones)
        return b.build()
    }
}
