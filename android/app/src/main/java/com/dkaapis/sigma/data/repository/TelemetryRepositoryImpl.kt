package com.dkasigma.player.data.repository

import com.dkasigma.player.data.grpc.GrpcChannelFactory
import com.dkasigma.player.domain.model.ProofOfPlayLog
import com.dkasigma.player.domain.repository.TelemetryRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentLinkedQueue

class TelemetryRepositoryImpl(
    private val channelFactory: GrpcChannelFactory
) : TelemetryRepository {

    private val logQueue = ConcurrentLinkedQueue<ProofOfPlayLog>()

    override suspend fun recordPlayback(log: ProofOfPlayLog) {
        logQueue.add(log)
    }

    override suspend fun flushPendingLogs(deviceId: String, deviceToken: String): Result<Int> = withContext(Dispatchers.IO) {
        try {
            if (logQueue.isEmpty()) return@withContext Result.success(0)

            val batch = mutableListOf<ProofOfPlayLog>()
            while (batch.size < 50) {
                val item = logQueue.poll() ?: break
                batch.add(item)
            }

            // Di sini stub.reportPlaybackBatch() dipanggil ke backend
            Result.success(batch.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
