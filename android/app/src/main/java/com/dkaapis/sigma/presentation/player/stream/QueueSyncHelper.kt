package com.dkaapis.sigma.presentation.player.stream

import android.util.Log
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.presentation.player.stream.model.QueueSyncStatePayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import signage.components.v1.queue.ticket.TicketCommon
import signage.components.v1.queue.ticket.QueueTicketServiceGrpcKt
import signage.components.v1.queue.display.DisplayCommon
import signage.components.v1.queue.display.QueueDisplayServiceGrpcKt

/**
 * Pembantu rekonsiliasi state antrean dengan server via gRPC murni port 50051 saat koneksi internet pulih.
 */
class QueueSyncHelper(
    private val channelFactory: GrpcChannelFactory
) {
    suspend fun syncQueueState(
        queueDisplayId: String,
        activeCounterName: String,
        currentJson: String?
    ): QueueSyncStatePayload? = withContext(Dispatchers.IO) {
        if (queueDisplayId.isBlank()) return@withContext null

        runCatching {
            val stub = QueueDisplayServiceGrpcKt.QueueDisplayServiceCoroutineStub(channelFactory.getChannel())
            val request = DisplayCommon.GetQueueDisplayRequest.newBuilder()
                .setId(queueDisplayId)
                .build()

            val detail = stub.getQueueDisplay(request)
            val latestNum = detail.latestCalledNumber

            var counterNm = ""
            var counterStatus = "ACTIVE"

            if (detail.countersCount > 0) {
                for (c in detail.countersList) {
                    val cName = c.counterName
                    val cStatus = c.status.ifBlank { "ACTIVE" }.uppercase()
                    if (counterNm.isBlank()) {
                        counterNm = cName
                        counterStatus = cStatus
                    }
                    if (activeCounterName.isNotBlank() && cName.equals(activeCounterName, ignoreCase = true)) {
                        counterNm = cName
                        counterStatus = cStatus
                        break
                    }
                }
            }
            if (counterNm.isBlank()) counterNm = "LOKET 01"

            val tLabel = detail.ticketLabel
            val cLabel = detail.counterLabel
            val ttsCall = detail.ttsTemplateCall
            val ttsRecall = detail.ttsTemplateRecall
            val ttsBreak = detail.ttsTemplateBreak

            val mergedJson = runCatching {
                JSONObject(currentJson ?: "{}").apply {
                    if (tLabel.isNotBlank()) put("ticketLabel", tLabel)
                    if (cLabel.isNotBlank()) put("counterLabel", cLabel)
                    if (ttsCall.isNotBlank()) put("ttsTemplateCall", ttsCall)
                    if (ttsRecall.isNotBlank()) put("ttsTemplateRecall", ttsRecall)
                    if (ttsBreak.isNotBlank()) put("ttsTemplateBreak", ttsBreak)
                    if (latestNum.isNotBlank()) put("latestCalledNumber", latestNum)
                    put("status", counterStatus)
                    put("counterStatus", counterStatus)
                    put("currentCounterName", counterNm)
                }.toString()
            }.getOrDefault(currentJson ?: "{}")

            QueueSyncStatePayload(
                latestNumber = latestNum,
                counterName = counterNm,
                counterStatus = counterStatus,
                updatedJson = mergedJson
            )
        }.onFailure { err ->
            Log.w(TAG, "Gagal rekonsiliasi antrian gRPC saat rekoneksi: ${err.message}")
        }.getOrNull()
    }

    suspend fun callNextTicket(
        queueDisplayId: String,
        counterName: String
    ): Pair<String, String> = withContext(Dispatchers.IO) {
        require(queueDisplayId.isNotBlank()) { "Queue display ID is required" }

        val channel = channelFactory.getChannel()
        val displayStub = QueueDisplayServiceGrpcKt.QueueDisplayServiceCoroutineStub(channel)
        val detail = displayStub.getQueueDisplay(
            DisplayCommon.GetQueueDisplayRequest.newBuilder()
                .setId(queueDisplayId)
                .build()
        )
        val counter = detail.countersList.firstOrNull {
            it.counterName.equals(counterName, ignoreCase = true)
        } ?: detail.countersList.firstOrNull { it.isActive }
            ?: throw IllegalStateException("Backend tidak memiliki loket aktif untuk antrean ini")

        val ticketStub = QueueTicketServiceGrpcKt.QueueTicketServiceCoroutineStub(channel)
        val response = ticketStub.callNextTicket(
            TicketCommon.CallNextTicketRequest.newBuilder()
                .setQueueDisplayId(queueDisplayId)
                .setCounterId(counter.id)
                .build()
        )
        val ticketNumber = response.ticket.ticketNumber
        check(ticketNumber.isNotBlank()) { "Backend tidak mengembalikan nomor antrean" }
        ticketNumber to response.counter.counterName
    }

    companion object {
        private const val TAG = "QueueSyncHelper"
    }
}
