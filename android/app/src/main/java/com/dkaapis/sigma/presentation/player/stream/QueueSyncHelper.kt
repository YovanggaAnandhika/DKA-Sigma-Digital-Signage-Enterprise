package com.dkaapis.sigma.presentation.player.stream

import android.util.Log
import com.dkaapis.sigma.presentation.player.stream.model.QueueSyncStatePayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

/**
 * Pembantu rekonsiliasi state antrean dengan server saat koneksi internet pulih.
 */
class QueueSyncHelper(
    private val httpClient: OkHttpClient
) {
    suspend fun syncQueueState(
        baseUrl: String,
        queueDisplayId: String,
        activeCounterName: String,
        currentJson: String?
    ): QueueSyncStatePayload? = withContext(Dispatchers.IO) {
        if (queueDisplayId.isBlank()) return@withContext null

        runCatching {
            val syncUrl = "$baseUrl/api/grpc/studio/queue/GetQueueSyncState?queueDisplayId=$queueDisplayId"
            val request = Request.Builder().url(syncUrl).get().build()
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) return@withContext null
            val respBody = response.body?.string()?.takeIf { it.isNotBlank() } ?: return@withContext null

            val syncObj = JSONObject(respBody)
            val latestNum = syncObj.optString("currentTicketNumber",
                syncObj.optString("latestCalledNumber",
                syncObj.optString("current_ticket_number",
                syncObj.optString("latest_called_number", ""))))

            var counterNm = syncObj.optString("currentCounterName", syncObj.optString("current_counter_name", ""))
            var counterStatus = syncObj.optString("status", syncObj.optString("counterStatus", "ACTIVE")).uppercase()

            val countersArr = syncObj.optJSONArray("countersList") ?: syncObj.optJSONArray("counters")
            if (countersArr != null && countersArr.length() > 0) {
                for (i in 0 until countersArr.length()) {
                    val cObj = countersArr.getJSONObject(i)
                    val cName = cObj.optString("counterName", cObj.optString("counter_name", ""))
                    val cStatus = cObj.optString("status", "ACTIVE").uppercase()
                    if (i == 0 && counterNm.isBlank()) {
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

            val tLabel = syncObj.optString("ticketLabel", syncObj.optString("ticket_label", ""))
            val cLabel = syncObj.optString("counterLabel", syncObj.optString("counter_label", ""))
            val ttsCall = syncObj.optString("ttsTemplateCall", syncObj.optString("tts_template_call", ""))
            val ttsRecall = syncObj.optString("ttsTemplateRecall", syncObj.optString("tts_template_recall", ""))
            val ttsBreak = syncObj.optString("ttsTemplateBreak", syncObj.optString("tts_template_break", ""))

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
            Log.w(TAG, "Gagal rekonsiliasi antrian saat rekoneksi: ${err.message}")
        }.getOrNull()
    }

    companion object {
        private const val TAG = "QueueSyncHelper"
    }
}
