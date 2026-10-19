package com.dkaapis.sigma.presentation.renderers.queue.model

/**
 * Payload callback untuk QueueZoneRenderer
 */
data class QueueCallbacksPayload(
    val onCallAudioStarted: () -> Unit = {},
    val onCallAudioFinished: () -> Unit = {},
    val onUserTapNext: (ticketNumber: String, counterName: String) -> Unit = { _, _ -> }
)
