package com.dkaapis.sigma.data.analytics

import org.json.JSONObject

data class HardwareMetricsData(
    val cpuPercent: Float = 0f,
    val cpuCores: Int = Runtime.getRuntime().availableProcessors(),
    val ramUsedBytes: Long = 0L,
    val ramTotalBytes: Long = 0L,
    val ramPercent: Int = 0,
    val storageFreeBytes: Long = 0L,
    val storageTotalBytes: Long = 0L,
    val batteryTempCelsius: Float = 0f,
    val fps: Float = 60f,
    val networkType: String = "WIFI"
) {
    fun toJson(): String {
        return JSONObject().apply {
            put("cpu_percent", cpuPercent)
            put("cpu_cores", cpuCores)
            put("ram_used_bytes", ramUsedBytes)
            put("ram_total_bytes", ramTotalBytes)
            put("ram_percent", ramPercent)
            put("storage_free_bytes", storageFreeBytes)
            put("storage_total_bytes", storageTotalBytes)
            put("battery_temp_celsius", batteryTempCelsius)
            put("fps", fps)
            put("network_type", networkType)
        }.toString()
    }
}

data class AssetStatsData(
    val zoneName: String = "",
    val mediaId: String = "",
    val mediaName: String = "",
    val mimeType: String = "video/mp4",
    val codec: String = "H.264 / AVC",
    val resolution: String = "1920x1080",
    val bitrateKbps: Int = 4500,
    val decoderName: String = "Hardware MediaCodec",
    val isHardwareAccelerated: Boolean = true,
    val droppedFrames: Int = 0,
    val totalFrames: Int = 0,
    val droppedFrameRatePercent: Float = 0f,
    val playbackStatus: String = "PLAYING",
    val diagnosticFlag: String = "OPTIMAL",
    val diagnosticNote: String = "Pemutaran lancar, hardware decoder aktif."
) {
    fun toJson(): String {
        return JSONObject().apply {
            put("zone_name", zoneName)
            put("media_id", mediaId)
            put("media_name", mediaName)
            put("mime_type", mimeType)
            put("codec", codec)
            put("resolution", resolution)
            put("bitrate_kbps", bitrateKbps)
            put("decoder_name", decoderName)
            put("is_hardware_accelerated", isHardwareAccelerated)
            put("dropped_frames", droppedFrames)
            put("total_frames", totalFrames)
            put("dropped_frame_rate_percent", droppedFrameRatePercent)
            put("playback_status", playbackStatus)
            put("diagnostic_flag", diagnosticFlag)
            put("diagnostic_note", diagnosticNote)
        }.toString()
    }
}

data class AnalyticsSnapshotData(
    val id: String = java.util.UUID.randomUUID().toString(),
    val inputOutputJson: String,
    val assetsStatsJson: String,
    val recordedAt: String = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
        timeZone = java.util.TimeZone.getTimeZone("UTC")
    }.format(java.util.Date())
) {
    fun toJsonObject(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("input_output_json", inputOutputJson)
            put("assets_stats_json", assetsStatsJson)
            put("recorded_at", recordedAt)
        }
    }

    companion object {
        fun fromJsonObject(json: JSONObject): AnalyticsSnapshotData {
            return AnalyticsSnapshotData(
                id = json.optString("id", java.util.UUID.randomUUID().toString()),
                inputOutputJson = json.optString("input_output_json", "{}"),
                assetsStatsJson = json.optString("assets_stats_json", "{}"),
                recordedAt = json.optString("recorded_at", "")
            )
        }
    }
}
