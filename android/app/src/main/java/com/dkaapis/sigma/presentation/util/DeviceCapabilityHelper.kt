package com.dkaapis.sigma.presentation.util

import android.app.ActivityManager
import android.content.Context

object DeviceCapabilityHelper {

    fun isLowSpecDevice(context: Context): Boolean {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return false
        if (am.isLowRamDevice) return true

        val memInfo = ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfo)
        val totalRamMb = memInfo.totalMem / (1024 * 1024)
        return totalRamMb <= 1536
    }

    data class BufferConfig(
        val minBufferMs: Int,
        val maxBufferMs: Int,
        val bufferForPlaybackMs: Int,
        val bufferForPlaybackAfterRebufferMs: Int
    )

    fun getVideoBufferConfig(context: Context): BufferConfig {
        return if (isLowSpecDevice(context)) {
            // Lean 3s-6s buffer (approx 15-25MB memory footprint, avoids GC pressure on 1GB RAM)
            BufferConfig(
                minBufferMs = 3_000,
                maxBufferMs = 6_000,
                bufferForPlaybackMs = 500,
                bufferForPlaybackAfterRebufferMs = 1_000
            )
        } else {
            // Rich 8s-20s buffer on devices with >1.5GB RAM
            BufferConfig(
                minBufferMs = 8_000,
                maxBufferMs = 20_000,
                bufferForPlaybackMs = 1_500,
                bufferForPlaybackAfterRebufferMs = 2_500
            )
        }
    }
}

