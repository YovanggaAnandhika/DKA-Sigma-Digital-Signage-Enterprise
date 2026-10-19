package com.dkaapis.sigma.presentation.player.audio.model

import java.io.File

/**
 * Konfigurasi dependensi pemutar audio player
 */
data class AudioConfigPayload(
    val onDuckingChanged: (isDucked: Boolean) -> Unit,
    val onStopCallEffect: () -> Unit,
    val getActiveQueueDataJson: () -> String?,
    val getLocalFileForAsset: (mediaId: String) -> File?
)

/**
 * Payload parameter pemanggilan nomor tiket antrian
 */
data class QueueSpeechPayload(
    val ticketNumber: String,
    val counterName: String,
    val isRecall: Boolean = false,
    val ticketLabelOverride: String? = null,
    val counterLabelOverride: String? = null,
    val ttsTemplateCallOverride: String? = null,
    val ttsTemplateRecallOverride: String? = null
)

/**
 * Payload pemanggilan status loket
 */
data class CounterStatusPayload(
    val counterName: String,
    val status: String
)
