package com.dkaapis.sigma.presentation.player.stream

import android.util.Log
import com.dkaapis.sigma.presentation.player.stream.model.QueueSyncStatePayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

/**
 * Orkestrator Aliran Data Realtime (SSE) untuk Signage Player:
 * Mengkoordinasikan koneksi event stream, rekonsiliasi state antrean,
 * dan pengiriman event balik (touch / progress) ke server.
 */
class PlayerStreamManager(
    private val scope: CoroutineScope,
    private val httpClient: OkHttpClient,
    private val listener: OnDeviceEventListener
) {
    private val eventParser = DeviceSseEventParser()
    private val queueSyncHelper = QueueSyncHelper(httpClient)
    private val touchBroadcaster = PlayerTouchBroadcaster(httpClient)
    private var streamJob: Job? = null

    fun startStream(
        baseUrl: String,
        deviceId: String,
        onConnected: suspend () -> Unit
    ) {
        if (deviceId.isBlank()) return
        stopStream()

        streamJob = scope.launch(Dispatchers.IO) {
            while (isActive) {
                runCatching {
                    val request = Request.Builder()
                        .url("$baseUrl/api/stream/device?deviceId=$deviceId")
                        .addHeader("Accept", "text/event-stream")
                        .build()

                    httpClient.newCall(request).execute().use { response ->
                        if (response.isSuccessful) {
                            onConnected()

                            response.body?.byteStream()?.bufferedReader()?.useLines { lines ->
                                for (line in lines) {
                                    if (!isActive) break
                                    if (line.startsWith("data: ")) {
                                        val jsonStr = line.substring(6).trim()
                                        runCatching {
                                            val data = JSONObject(jsonStr)
                                            eventParser.parseAndDispatch(data, listener)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }.onFailure { err ->
                    Log.w(TAG, "SSE Stream disconnected: ${err.message}, reconnecting in 3s...")
                }
                delay(3000)
            }
        }
    }

    suspend fun syncQueueOnReconnect(
        baseUrl: String,
        queueDisplayId: String,
        activeCounterName: String,
        currentJson: String?
    ): QueueSyncStatePayload? {
        return queueSyncHelper.syncQueueState(baseUrl, queueDisplayId, activeCounterName, currentJson)
    }

    fun broadcastTouch(
        baseUrl: String,
        deviceId: String,
        queueId: String,
        ticketNum: String,
        counterNm: String
    ) {
        scope.launch {
            touchBroadcaster.broadcastQueueTouch(baseUrl, deviceId, queueId, ticketNum, counterNm)
        }
    }

    fun broadcastDownloadProgress(
        baseUrl: String,
        deviceId: String,
        assetIndex: Int,
        totalAssets: Int,
        progressPercent: Int,
        downloadedBytes: Long,
        totalBytes: Long,
        fileName: String
    ) {
        scope.launch {
            touchBroadcaster.broadcastDownloadProgress(
                baseUrl, deviceId, assetIndex, totalAssets, progressPercent, downloadedBytes, totalBytes, fileName
            )
        }
    }

    fun broadcastDownloadComplete(baseUrl: String, deviceId: String) {
        scope.launch {
            touchBroadcaster.broadcastDownloadComplete(baseUrl, deviceId)
        }
    }

    fun stopStream() {
        streamJob?.cancel()
        streamJob = null
    }

    companion object {
        private const val TAG = "PlayerStreamManager"
    }
}
