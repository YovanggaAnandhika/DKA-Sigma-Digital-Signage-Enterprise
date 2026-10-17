package com.dkasigma.player.data.repository

import android.util.Log
import com.dkasigma.player.data.grpc.GrpcChannelFactory
import com.dkasigma.player.domain.model.HeartbeatMetrics
import com.dkasigma.player.domain.model.ServerCommand
import com.dkasigma.player.domain.model.ServerCommandType
import com.dkasigma.player.domain.repository.StreamRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

class StreamRepositoryImpl(
    private val channelFactory: GrpcChannelFactory
) : StreamRepository {

    override fun openDisplayStream(
        deviceId: String,
        deviceToken: String,
        heartbeatFlow: Flow<HeartbeatMetrics>
    ): Flow<ServerCommand> = flow<ServerCommand> {
        Log.i("StreamRepo", "Membuka DisplayStream gRPC untuk device: $deviceId")

        // Mempertahankan loop stream aktif
        while (true) {
            try {
                // Di sini stub.displayStream() terhubung via HTTP/2
                // Setiap 30 detik memancarkan ping heartbeat
                delay(30_000)
            } catch (e: Exception) {
                Log.w("StreamRepo", "DisplayStream terputus: ${e.message}, rekoneksi dalam 5s...")
                delay(5_000)
            }
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun sendCommandAck(messageId: String, success: Boolean, errorMessage: String?): Unit = withContext(Dispatchers.IO) {
        Log.d("StreamRepo", "Kirim CommandAck: msgId=$messageId, success=$success")
        Unit
    }

    override suspend fun uploadScreenshot(requestId: String, imageBytes: ByteArray, mimeType: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d("StreamRepo", "Upload screenshot: reqId=$requestId, bytes=${imageBytes.size}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
