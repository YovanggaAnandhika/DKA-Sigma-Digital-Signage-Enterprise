package com.dkaapis.sigma.presentation.player.stream

import com.dkaapis.sigma.presentation.player.stream.model.ChunkProgressModel
import com.dkaapis.sigma.presentation.player.stream.model.QueueCallEventModel
import org.json.JSONObject

/**
 * Interface listener untuk event SSE dari CMS
 */
interface OnDeviceEventListener {
    fun onChunkProgress(progress: ChunkProgressModel)
    fun onChunkComplete(fileName: String, totalChunks: Int)
    fun onChunkCancelled(fileName: String)
    fun onReloadManifest()
    fun onClearCache()
    fun onCaptureScreenshot()
    fun onReboot()
    fun onUnpair()
    fun onScreenSleep()
    fun onScreenWake()
    fun onQueueCall(event: QueueCallEventModel)
    fun onQueueReset(targetQueueId: String, resetToNumber: String)
    fun onCounterStatusChanged(targetQueueId: String, counterName: String, status: String)
}

/**
 * Parser pesan realtime JSON dari Server-Sent Events (SSE)
 */
class DeviceSseEventParser {

    fun parseAndDispatch(data: JSONObject, listener: OnDeviceEventListener) {
        val type = data.optString("type", "")
        when (type) {
            "CHUNK_PROGRESS" -> {
                val chunkIndex = data.optInt("chunkIndex", 0)
                val progress = ChunkProgressModel(
                    completedChunks = data.optInt("completedChunks", chunkIndex + 1),
                    totalChunks = data.optInt("totalChunks", 1),
                    percent = data.optInt("percent", 0),
                    uploadedBytes = data.optLong("uploadedBytes", 0L),
                    totalBytes = data.optLong("totalBytes", 0L),
                    fileName = data.optString("fileName", "Media Asset")
                )
                listener.onChunkProgress(progress)
            }
            "COMPLETE" -> {
                listener.onChunkComplete(
                    fileName = data.optString("fileName", "Media"),
                    totalChunks = data.optInt("totalChunks", 1)
                )
            }
            "CANCELLED" -> {
                listener.onChunkCancelled(data.optString("fileName", ""))
            }
            "RELOAD" -> listener.onReloadManifest()
            "CLEAR_CACHE" -> listener.onClearCache()
            "SCREENSHOT" -> listener.onCaptureScreenshot()
            "REBOOT" -> listener.onReboot()
            "UNPAIR", "DECOMMISSION" -> listener.onUnpair()
            "SCREEN_SLEEP", "SLEEP", "STANDBY" -> listener.onScreenSleep()
            "SCREEN_WAKE", "WAKE" -> listener.onScreenWake()
            "CALL_QUEUE", "QUEUE_CALL" -> {
                val callType = data.optString("callType", data.optString("call_type", "next"))
                val isRecall = callType.equals("recall", ignoreCase = true) || callType.equals("repeat", ignoreCase = true)
                val event = QueueCallEventModel(
                    targetQueueId = data.optString("queueId", data.optString("queue_id", "")),
                    ticketNumber = data.optString("ticketNumber", data.optString("ticket_number", "")),
                    counterName = data.optString("counterName", data.optString("counter_name", "LOKET 01")),
                    isRecall = isRecall,
                    source = data.optString("source", ""),
                    sourceDeviceId = data.optString("sourceDeviceId", ""),
                    ticketLabel = data.optString("ticketLabel", data.optString("ticket_label", "")),
                    counterLabel = data.optString("counterLabel", data.optString("counter_label", "")),
                    ttsTemplateCall = data.optString("ttsTemplateCall", data.optString("tts_template_call", "")),
                    ttsTemplateRecall = data.optString("ttsTemplateRecall", data.optString("tts_template_recall", ""))
                )
                listener.onQueueCall(event)
            }
            "RESET_QUEUE" -> {
                listener.onQueueReset(
                    targetQueueId = data.optString("queueId", data.optString("queue_id", "")),
                    resetToNumber = data.optString("resetToNumber", data.optString("reset_to_number", ""))
                )
            }
            "COUNTER_STATUS_CHANGED" -> {
                listener.onCounterStatusChanged(
                    targetQueueId = data.optString("queueId", data.optString("queue_id", "")),
                    counterName = data.optString("counterName", data.optString("counter_name", "LOKET 01")),
                    status = data.optString("status", "ACTIVE")
                )
            }
        }
    }
}
