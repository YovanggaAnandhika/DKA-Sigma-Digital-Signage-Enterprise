package com.dkasigma.player.domain.model

data class PowerSchedule(
    val enabled: Boolean = false,
    val sleepTime: String = "22:00:00",
    val wakeTime: String = "06:00:00"
)

data class Manifest(
    val manifestId: String,
    val deviceId: String,
    val versionHash: String,
    val layoutId: String,
    val layoutName: String,
    val canvasWidth: Int = 1920,
    val canvasHeight: Int = 1080,
    val zones: List<LayerZone> = emptyList(),
    val requiredAssets: List<MediaAsset> = emptyList(),
    val totalDownloadSizeBytes: Long = 0L,
    val powerSchedule: PowerSchedule? = null,
    val isCanary: Boolean = false,
    val generatedAt: String = ""
) {
    val isCompleteLocal: Boolean
        get() = requiredAssets.all { it.isCached }
}
