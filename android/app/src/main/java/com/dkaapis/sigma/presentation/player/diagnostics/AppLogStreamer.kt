package com.dkaapis.sigma.presentation.player.diagnostics

import android.util.Log
import android.os.Process
import android.os.SystemClock
import java.io.IOException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import signage.distribution.v1.stream.StreamCommon

/**
 * Meneruskan logcat milik proses app sendiri (tanpa izin READ_LOGS) ke CMS, per 1 detik.
 * Hanya jalan selama CMS memperbarui "lease" (enable() tiap ~30 dtk); otomatis berhenti setelah 60 dtk tanpa lease.
 */
class AppLogStreamer(
    private val scope: CoroutineScope,
    private val send: (StreamCommon.LogBatch) -> Unit
) {
    private var job: Job? = null
    @Volatile private var leaseUntil = 0L

    fun enable() {
        leaseUntil = SystemClock.elapsedRealtime() + LEASE_MS
        if (job?.isActive == true) return
        job = scope.launch(Dispatchers.IO) { run() }
    }

    fun disable() {
        leaseUntil = 0L
        job?.cancel()
        job = null
    }

    private suspend fun run() = kotlinx.coroutines.coroutineScope {
        val proc = runCatching {
            ProcessBuilder("logcat", "-v", "epoch", "--pid=${Process.myPid()}", "-T", "200")
                .redirectErrorStream(true).start()
        }.onFailure { Log.w(TAG, "Tidak dapat memulai logcat proses player", it) }.getOrNull()
            ?: return@coroutineScope
        val pending = ArrayList<StreamCommon.LogLine>()
        val reader = launch(Dispatchers.IO) {
            try {
                proc.inputStream.bufferedReader().use { r ->
                    while (isActive) {
                        val line = r.readLine() ?: break
                        parse(line)?.let {
                            synchronized(pending) {
                                if (pending.size < MAX_BATCH_LINES) pending.add(it)
                            }
                        }
                    }
                }
            } catch (error: IOException) {
                if (isActive) Log.w(TAG, "Gagal membaca logcat proses player", error)
            }
        }
        try {
            while (isActive && SystemClock.elapsedRealtime() < leaseUntil && reader.isActive) {
                delay(1000)
                val lines = synchronized(pending) { pending.toList().also { pending.clear() } }
                if (lines.isNotEmpty()) send(StreamCommon.LogBatch.newBuilder().addAllLines(lines).build())
            }
        } finally {
            reader.cancel()
            proc.destroy()
        }
    }

    private fun parse(raw: String): StreamCommon.LogLine? {
        val m = LINE.matchEntire(raw) ?: return null
        return StreamCommon.LogLine.newBuilder()
            .setTimestampMs(m.groupValues[1].toLong() * 1000 + m.groupValues[2].padEnd(3, '0').take(3).toLong())
            .setLevel(m.groupValues[3])
            .setTag(m.groupValues[4].trim())
            .setMessage(SECRET.replace(m.groupValues[5]) { match ->
                "${match.groupValues[1]}${match.groupValues[2]}***"
            })
            .build()
    }

    private companion object {
        const val LEASE_MS = 60_000L
        const val MAX_BATCH_LINES = 500
        const val TAG = "AppLogStreamer"
        // epoch: "1699999999.123  1234  1234 I Tag     : message"
        val LINE = Regex("""^\s*(\d+)\.(\d+)\s+\d+\s+\d+\s+([VDIWEF])\s+(.*?)\s*:\s(.*)$""")
        val SECRET = Regex("""(?i)\b(authorization|device[_-]?token|token|password)\b(["']?\s*[:=]\s*["']?)(?:bearer\s+)?[^,\s"'&}]+""")
    }
}
