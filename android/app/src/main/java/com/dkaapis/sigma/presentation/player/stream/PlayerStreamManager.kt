package com.dkaapis.sigma.presentation.player.stream

import com.dkaapis.sigma.presentation.player.stream.model.QueueSyncStatePayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient

/**
 * Orkestrator event balik pemain ke server:
 * rekonsiliasi state antrean dan pengiriman event touch / progress.
 */
class PlayerStreamManager(
    private val scope: CoroutineScope,
    private val httpClient: OkHttpClient
) {
    private val queueSyncHelper = QueueSyncHelper(httpClient)
    private val touchBroadcaster = PlayerTouchBroadcaster(httpClient)

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
}
