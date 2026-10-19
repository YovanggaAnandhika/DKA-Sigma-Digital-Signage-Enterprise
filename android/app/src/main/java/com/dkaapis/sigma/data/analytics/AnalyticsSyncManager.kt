package com.dkaapis.sigma.data.analytics

import android.content.Context
import com.dkaapis.sigma.R
import com.dkaapis.sigma.data.local.AnalyticsLocalBuffer
import com.dkaapis.sigma.data.local.TokenStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class AnalyticsSyncManager(
    private val context: Context,
    private val tokenStorage: TokenStorage,
    private val localBuffer: AnalyticsLocalBuffer
) {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    suspend fun recordAndSync(snapshot: AnalyticsSnapshotData) = withContext(Dispatchers.IO) {
        val deviceId = tokenStorage.getDeviceId() ?: return@withContext
        val deviceToken = tokenStorage.getDeviceToken() ?: ""
        val baseUrl = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(context)

        val isDirectSuccess = try {
            val jsonBody = JSONObject().apply {
                put("deviceId", deviceId)
                put("deviceToken", deviceToken)
                put("snapshot", JSONObject().apply {
                    put("id", snapshot.id)
                    put("inputOutputJson", snapshot.inputOutputJson)
                    put("assetsStatsJson", snapshot.assetsStatsJson)
                    put("recordedAt", snapshot.recordedAt)
                })
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/api/grpc/hardware/device/IngestDeviceAnalytics")
                .post(jsonBody.toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            response.isSuccessful
        } catch (_: Exception) {
            false
        }

        if (isDirectSuccess) {
            // Jika ada antrean offline sebelumnya, flush dalam batch
            if (localBuffer.hasPending()) {
                flushOfflineBuffer(baseUrl, deviceId, deviceToken)
            }
        } else {
            // Simpan ke buffer lokal offline
            localBuffer.append(snapshot)
        }
    }

    private fun flushOfflineBuffer(baseUrl: String, deviceId: String, deviceToken: String) {
        try {
            val batch = localBuffer.drainBatch(50)
            if (batch.isEmpty()) return

            val snapshotsArray = JSONArray()
            val ids = mutableSetOf<String>()

            for (item in batch) {
                ids.add(item.id)
                snapshotsArray.put(JSONObject().apply {
                    put("id", item.id)
                    put("inputOutputJson", item.inputOutputJson)
                    put("assetsStatsJson", item.assetsStatsJson)
                    put("recordedAt", item.recordedAt)
                })
            }

            val jsonBody = JSONObject().apply {
                put("deviceId", deviceId)
                put("deviceToken", deviceToken)
                put("snapshots", snapshotsArray)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/api/grpc/hardware/device/IngestDeviceAnalyticsBatch")
                .post(jsonBody.toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                localBuffer.removeSynced(ids)
                android.util.Log.i("AnalyticsSync", "Batch flush berhasil: ${ids.size} data analitik offline terkirim.")
            }
        } catch (e: Exception) {
            android.util.Log.w("AnalyticsSync", "Gagal flush buffer offline: ${e.message}")
        }
    }
}
