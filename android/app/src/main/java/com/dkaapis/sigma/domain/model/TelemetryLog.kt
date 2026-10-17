package com.dkaapis.sigma.domain.model

data class ProofOfPlayLog(
    val mediaId: String,
    val layoutId: String,
    val startedAtSeconds: Long,
    val durationSeconds: Int,
    val isCompleted: Boolean
)

data class HeartbeatMetrics(
    val memoryUsagePercent: Int,
    val storageFreeBytes: Long,
    val storageTotalBytes: Long,
    val currentPlayingMediaId: String = "",
    val activeLayoutId: String = "",
    val activeManifestHash: String = ""
)
