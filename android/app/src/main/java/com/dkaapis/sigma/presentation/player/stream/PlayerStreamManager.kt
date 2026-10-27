package com.dkaapis.sigma.presentation.player.stream

import android.util.Log
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.presentation.player.stream.model.QueueSyncStatePayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import signage.distribution.v1.stream.StreamCommon
import signage.distribution.v1.stream.StreamServiceGrpcKt

/**
 * Orkestrator Aliran Data Realtime gRPC Murni (DisplayStream):
 * Mengkoordinasikan stream dua arah port 50051 antara server gRPC dan Android Player,
 * rekonsiliasi state antrean via gRPC, dan pengiriman event balik (touch/progress).
 */
class PlayerStreamManager(
    private val scope: CoroutineScope,
    private val channelFactory: GrpcChannelFactory,
    private val tokenStorage: TokenStorage,
    private val listener: OnDeviceEventListener
) {
    private val eventParser = DeviceSseEventParser()
    private val queueSyncHelper = QueueSyncHelper(channelFactory)
    private val touchBroadcaster = PlayerTouchBroadcaster(channelFactory)
    private var streamJob: Job? = null

    // Outgoing client stream channel for DisplayStream
    private val clientMessageFlow = MutableSharedFlow<StreamCommon.StreamClientMessage>(
        replay = 1,
        extraBufferCapacity = 64,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    fun startStream(
        deviceId: String,
        onConnected: suspend () -> Unit
    ) {
        if (deviceId.isBlank()) return
        stopStream()

        streamJob = scope.launch(Dispatchers.IO) {
            while (isActive) {
                runCatching {
                    Log.i(TAG, "Membuka gRPC DisplayStream dua arah untuk perangkat $deviceId...")
                    val channel = channelFactory.getChannel()
                    val stub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channel)

                    val deviceToken = tokenStorage.getDeviceToken().orEmpty()

                    fun createPing(): StreamCommon.StreamClientMessage {
                        return StreamCommon.StreamClientMessage.newBuilder()
                            .setDeviceId(deviceId)
                            .setDeviceToken(deviceToken)
                            .setTimestamp(System.currentTimeMillis())
                            .setPing(
                                StreamCommon.HeartbeatPing.newBuilder()
                                    .setMemoryPercent(30)
                                    .setStorageFreeBytes(1024L * 1024L * 1024L)
                                    .build()
                            )
                            .build()
                    }

                    // Emisi pesan inisial untuk mendaftarkan koneksi di server
                    clientMessageFlow.emit(createPing())

                    // Background keepalive ping berkala setiap 20 detik (timeout socket server 45 detik)
                    val pingJob = launch {
                        while (isActive) {
                            delay(20_000L)
                            clientMessageFlow.emit(createPing())
                        }
                    }

                    try {
                        // Panggil RPC streaming dua arah
                        val responseFlow = stub.displayStream(clientMessageFlow)
                        onConnected()

                        responseFlow.collect { serverMsg ->
                            if (!isActive) return@collect
                            handleServerMessage(serverMsg)
                        }
                    } finally {
                        pingJob.cancel()
                    }
                }.onFailure { err ->
                    Log.w(TAG, "gRPC DisplayStream disconnected: ${err.message}, reconnecting in 3s...")
                }
                delay(3000)
            }
        }
    }

    private fun handleServerMessage(msg: StreamCommon.StreamServerMessage) {
        when (msg.commandType) {
            StreamCommon.ServerCommandType.COMMAND_RELOAD_MANIFEST -> listener.onReloadManifest()
            StreamCommon.ServerCommandType.COMMAND_CAPTURE_SCREENSHOT -> listener.onCaptureScreenshot()
            StreamCommon.ServerCommandType.COMMAND_REBOOT_PLAYER -> listener.onReboot()
            StreamCommon.ServerCommandType.COMMAND_CLEAR_CACHE -> listener.onClearCache()
            else -> {
                // Parse payload_json jika ada (e.g. CALL_QUEUE, UNPAIR, RESET_QUEUE, dll)
                if (msg.payloadJson.isNotBlank()) {
                    runCatching {
                        val json = JSONObject(msg.payloadJson)
                        eventParser.parseAndDispatch(json, listener)
                    }.onFailure { e ->
                        Log.w(TAG, "Gagal mengurai payload JSON server: ${e.message}")
                    }
                }
            }
        }
    }

    suspend fun syncQueueOnReconnect(
        queueDisplayId: String,
        activeCounterName: String,
        currentJson: String?
    ): QueueSyncStatePayload? {
        return queueSyncHelper.syncQueueState(queueDisplayId, activeCounterName, currentJson)
    }

    fun broadcastTouch(
        deviceId: String,
        queueId: String,
        ticketNum: String,
        counterNm: String
    ) {
        scope.launch {
            touchBroadcaster.broadcastQueueTouch(deviceId, queueId, ticketNum, counterNm)
        }
    }

    fun broadcastDownloadProgress(
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
                deviceId, assetIndex, totalAssets, progressPercent, downloadedBytes, totalBytes, fileName
            )
        }
    }

    fun broadcastDownloadComplete(deviceId: String) {
        scope.launch {
            touchBroadcaster.broadcastDownloadComplete(deviceId)
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
