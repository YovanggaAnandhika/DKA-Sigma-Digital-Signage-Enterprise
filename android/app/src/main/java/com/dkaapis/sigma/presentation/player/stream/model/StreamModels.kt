package com.dkaapis.sigma.presentation.player.stream.model

/**
 * Model data kemajuan penerimaan chunk aset via SSE
 */
data class ChunkProgressModel(
    val completedChunks: Int,
    val totalChunks: Int,
    val percent: Int,
    val uploadedBytes: Long,
    val totalBytes: Long,
    val fileName: String
)

/**
 * Model data panggilan antrian realtime via SSE
 */
data class QueueCallEventModel(
    val targetQueueId: String,
    val ticketNumber: String,
    val counterName: String,
    val isRecall: Boolean,
    val source: String,
    val sourceDeviceId: String,
    val ticketLabel: String,
    val counterLabel: String,
    val ttsTemplateCall: String,
    val ttsTemplateRecall: String
)

/**
 * State hasil rekonsiliasi antrian dari server saat player reconnect
 */
data class QueueSyncStatePayload(
    val latestNumber: String,
    val counterName: String,
    val counterStatus: String,
    val updatedJson: String
)
