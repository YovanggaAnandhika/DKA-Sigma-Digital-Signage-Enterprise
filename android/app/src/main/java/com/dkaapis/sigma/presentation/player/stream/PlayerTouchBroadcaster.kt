package com.dkaapis.sigma.presentation.player.stream

import android.util.Log
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import signage.distribution.v1.stream.StreamCommon
import signage.distribution.v1.stream.StreamServiceGrpcKt

/**
 * Pengirim event broadcast dari player ke backend via gRPC StreamService.PushCommand port 50051
 */
class PlayerTouchBroadcaster(
    private val channelFactory: GrpcChannelFactory
) {
    suspend fun broadcastQueueTouch(
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
            sendGrpcCommand(payload)
        }.onFailure { err ->
            Log.w(TAG, "Gagal broadcast sentuh antrian via gRPC: ${err.message}")
        }
    }

    suspend fun broadcastDownloadProgress(
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
            sendGrpcCommand(payload)
        }.onFailure { err ->
            Log.w(TAG, "Gagal broadcast download progress via gRPC: ${err.message}")
        }
    }

    suspend fun broadcastDownloadComplete(
        deviceId: String
    ) = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("deviceId", deviceId)
                put("type", "ASSET_DOWNLOAD_COMPLETE")
                put("progressPercent", 100)
                put("isSync", true)
            }
            sendGrpcCommand(payload)
        }.onFailure { err ->
            Log.w(TAG, "Gagal broadcast download complete via gRPC: ${err.message}")
        }
    }

    private suspend fun sendGrpcCommand(json: JSONObject) {
        val stub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channelFactory.getChannel())
        val req = StreamCommon.PushCommandRequest.newBuilder()
            .setDeviceId("00000000-0000-0000-0000-000000000000") // Broadcast to all connected displays
            .setCommandType(StreamCommon.ServerCommandType.COMMAND_EMERGENCY_BROADCAST)
            .setPayloadJson(json.toString())
            .build()
        stub.pushCommand(req)
    }

    companion object {
        private const val TAG = "PlayerTouchBroadcaster"
    }
}
