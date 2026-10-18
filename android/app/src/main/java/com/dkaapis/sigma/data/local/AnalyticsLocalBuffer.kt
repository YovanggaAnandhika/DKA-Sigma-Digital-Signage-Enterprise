package com.dkaapis.sigma.data.local

import android.content.Context
import com.dkaapis.sigma.data.analytics.AnalyticsSnapshotData
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class AnalyticsLocalBuffer(context: Context) {

    private val analyticsDir = File(context.filesDir, "analytics").apply {
        if (!exists()) mkdirs()
    }
    private val bufferFile = File(analyticsDir, "pending.jsonl")
    private val maxBufferEntries = 5000

    @Synchronized
    fun append(snapshot: AnalyticsSnapshotData) {
        try {
            val jsonStr = snapshot.toJsonObject().toString() + "\n"
            FileOutputStream(bufferFile, true).use { fos ->
                fos.write(jsonStr.toByteArray(Charsets.UTF_8))
                fos.flush()
            }
        } catch (e: Exception) {
            android.util.Log.e("AnalyticsBuffer", "Gagal menyimpan buffer analitik: ${e.message}")
        }
    }

    @Synchronized
    fun hasPending(): Boolean {
        return bufferFile.exists() && bufferFile.length() > 0
    }

    @Synchronized
    fun drainBatch(maxItems: Int = 50): List<AnalyticsSnapshotData> {
        if (!bufferFile.exists() || bufferFile.length() == 0L) return emptyList()

        val items = mutableListOf<AnalyticsSnapshotData>()
        try {
            bufferFile.bufferedReader().useLines { lines ->
                for (line in lines) {
                    if (line.isBlank()) continue
                    try {
                        val obj = JSONObject(line)
                        items.add(AnalyticsSnapshotData.fromJsonObject(obj))
                        if (items.size >= maxItems) break
                    } catch (_: Exception) {}
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("AnalyticsBuffer", "Gagal membaca buffer analitik: ${e.message}")
        }
        return items
    }

    @Synchronized
    fun removeSynced(syncedIds: Set<String>) {
        if (!bufferFile.exists() || syncedIds.isEmpty()) return

        val tempFile = File(analyticsDir, "pending.tmp.jsonl")
        try {
            var retained = 0
            tempFile.bufferedWriter().use { writer ->
                bufferFile.bufferedReader().useLines { lines ->
                    for (line in lines) {
                        if (line.isBlank()) continue
                        try {
                            val obj = JSONObject(line)
                            val id = obj.optString("id", "")
                            if (!syncedIds.contains(id)) {
                                writer.write(line)
                                writer.newLine()
                                retained++
                                if (retained >= maxBufferEntries) break
                            }
                        } catch (_: Exception) {}
                    }
                }
            }
            tempFile.renameTo(bufferFile)
        } catch (e: Exception) {
            tempFile.delete()
            android.util.Log.e("AnalyticsBuffer", "Gagal membersihkan buffer tersinkron: ${e.message}")
        }
    }
}
