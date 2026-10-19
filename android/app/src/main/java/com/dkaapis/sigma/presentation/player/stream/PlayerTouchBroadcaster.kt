package com.dkaapis.sigma.presentation.player.stream

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * Pengirim event broadcast dari player ke backend via SSE POST /api/stream/device
 */
class PlayerTouchBroadcaster(
    private val httpClient: OkHttpClient
) {
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun broadcastQueueTouch(
        baseUrl: String,
        deviceId: String,
        queueId: String,
        ticketNum: String,
        counterNm: String
    ) = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("deviceId", "all")
                put("type", "CALL_QUEUE")
                put("queueId", queueId)
                put("queueName", "Layar Antrian")
                put("ticketNumber", ticketNum)
                put("counterName", counterNm)
                put("source", "player_touch")
                put("sourceDeviceId", deviceId)
            }
            sendPost(baseUrl, payload)
        }.onFailure { err ->
            Log.w(TAG, "Gagal broadcast sentuh antrian: ${err.message}")
        }
    }

    suspend fun broadcastDownloadProgress(
        baseUrl: String,
        deviceId: String,
        assetIndex: Int,
        totalAssets: Int,
        progressPercent: Int,
        downloadedBytes: Long,
        totalBytes: Long,
        fileName: String
    ) = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("deviceId", deviceId)
                put("type", "ASSET_DOWNLOAD_PROGRESS")
                put("assetIndex", assetIndex)
                put("totalAssets", totalAssets)
                put("progressPercent", progressPercent)
                put("downloadedBytes", downloadedBytes)
                put("totalBytes", totalBytes)
                put("fileName", fileName)
            }
            sendPost(baseUrl, payload)
        }.onFailure { err ->
            Log.w(TAG, "Gagal broadcast download progress: ${err.message}")
        }
    }

    suspend fun broadcastDownloadComplete(
        baseUrl: String,
        deviceId: String
    ) = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("deviceId", deviceId)
                put("type", "ASSET_DOWNLOAD_COMPLETE")
                put("progressPercent", 100)
                put("isSync", true)
            }
            sendPost(baseUrl, payload)
        }.onFailure { err ->
            Log.w(TAG, "Gagal broadcast download complete: ${err.message}")
        }
    }

    private fun sendPost(baseUrl: String, json: JSONObject) {
        val body = json.toString().toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("$baseUrl/api/stream/device")
            .post(body)
            .build()
        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                Log.w(TAG, "POST /api/stream/device status=${response.code}")
            }
        }
    }

    companion object {
        private const val TAG = "PlayerTouchBroadcaster"
    }
}
