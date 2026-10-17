package com.dkaapis.sigma.domain.model

data class QueueDisplayData(
    val queueNumber: String = "A-001",
    val queueCounter: String = "LOKET 01",
    val queuePrefix: String = "A",
    val queueName: String = "Layanan Antrian",
    val operatorName: String = "Petugas",
    val waitingCount: Int = 0,
    val soundChimeEnabled: Boolean = true,
    val ttsVoiceEnabled: Boolean = true
)
