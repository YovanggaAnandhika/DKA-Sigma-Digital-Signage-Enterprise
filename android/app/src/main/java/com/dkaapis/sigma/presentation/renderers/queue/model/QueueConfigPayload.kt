package com.dkaapis.sigma.presentation.renderers.queue.model

/**
 * Payload callback untuk QueueZoneRenderer
 */
data class QueueCallbacksPayload(
    val onCallAudioStarted: () -> Unit = {},
    val onCallAudioFinished: () -> Unit = {},
    val onUserTapNext: (ticketNumber: String, counterName: String) -> Unit = { _, _ -> }
)

/**
 * Data konfigurasi ter-parsing untuk canvas dan item antrean
 */
data class QueueLayoutConfig(
    val canvasW: Int = 1920,
    val canvasH: Int = 1080,
    val prefix: String = "A",
    val name: String = "Layar Antrian",
    val counterLabel: String = "Loket",
    val latestNumber: String = "A-001",
    val counterName: String = "LOKET 01",
    val status: String = "ACTIVE",
    val bgColor: String = "transparent",
    val bgImageUrl: String = "",
    val canvasOpacity: Float = 1.0f,
    val counters: List<Pair<String, String>> = listOf(
        "LOKET 01" to "ACTIVE",
        "LOKET 02" to "ACTIVE",
        "LOKET 03" to "ACTIVE"
    ),
    val items: List<QueueItemMeta> = emptyList()
)
