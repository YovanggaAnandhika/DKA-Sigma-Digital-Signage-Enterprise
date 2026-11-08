package com.dkaapis.sigma.presentation.renderers.model

import org.json.JSONObject
import java.io.File

/**
 * Model item playlist video
 */
data class VideoPlaylistItem(
    val file: File,
    val durationSeconds: Int = 0,
    val isMuted: Boolean = false,
    val mediaId: String = "",
    val mediaName: String = "",
    val volumeLevel: Int = 100
)

data class AlbumSlidePayload(
    val file: File,
    val title: String,
    val promoBadge: String,
    val priceTag: String,
    val durationSeconds: Int
)

/**
 * Payload konfigurasi untuk TickerZoneRenderer
 */
data class TickerConfigPayload(
    val textMessage: String = "HNDSigma Teks Berjalan",
    val badgeText: String = "",
    val fontSize: Float = 16f,
    val backgroundColorHex: String = "transparent",
    val textColorHex: String = "#ffffff",
    val badgeBackgroundColorHex: String = "transparent",
    val badgeTextColorHex: String = "#ffffff",
    val borderColorHex: String = "transparent",
    val borderRadiusDp: Int = 0,
    val speed: String = "normal"
) {
    companion object {
        fun fromJson(json: JSONObject): TickerConfigPayload {
            val msgArr = json.optJSONArray("messagesList") ?: json.optJSONArray("messages")
            val msgs = msgArr?.let { arr ->
                (0 until arr.length()).mapNotNull { idx -> arr.optString(idx).takeIf { it.isNotBlank() } }
            } ?: emptyList()

            val text = when {
                msgs.isNotEmpty() -> msgs.joinToString("  ✦  ")
                else -> json.optString("name", "HNDSigma Teks Berjalan")
            }

            return TickerConfigPayload(
                textMessage = text,
                badgeText = json.optString("badge", ""),
                fontSize = json.optDouble("fontSize", 16.0).toFloat(),
                backgroundColorHex = json.optString("backgroundColor", "transparent").ifBlank { "transparent" },
                textColorHex = json.optString("textColor", "#ffffff").ifBlank { "#ffffff" },
                badgeBackgroundColorHex = json.optString("badgeBackgroundColor", "transparent").ifBlank { "transparent" },
                badgeTextColorHex = json.optString("badgeTextColor", "#ffffff").ifBlank { "#ffffff" },
                borderColorHex = json.optString("borderColor", "transparent").ifBlank { "transparent" },
                borderRadiusDp = json.optInt("borderRadius", 0),
                speed = json.optString("speed", "normal")
            )
        }
    }
}

/**
 * Payload konfigurasi untuk ClockZoneRenderer
 */
data class ClockConfigPayload(
    val city: String = "Makassar",
    val showSeconds: Boolean = true,
    val backgroundColorHex: String = "transparent",
    val textColorHex: String = "#ffffff",
    val subtitleColorHex: String = "#94a3b8",
    val borderColorHex: String = "transparent",
    val borderRadiusDp: Int = 0,
    val timeFontSizeSp: Float = 52f,
    val dateFontSizeSp: Float = 14f
) {
    companion object {
        fun fromJson(json: JSONObject): ClockConfigPayload = ClockConfigPayload(
            city = json.optString("city", "Makassar"),
            showSeconds = json.optBoolean("showSeconds", true),
            backgroundColorHex = json.optString("backgroundColor", "transparent").ifBlank { "transparent" },
            textColorHex = json.optString("textColor", "#ffffff").ifBlank { "#ffffff" },
            subtitleColorHex = json.optString("subtitleColor", "#94a3b8").ifBlank { "#94a3b8" },
            borderColorHex = json.optString("borderColor", "transparent").ifBlank { "transparent" },
            borderRadiusDp = json.optInt("borderRadius", 0),
            timeFontSizeSp = json.optDouble("timeFontSize", 52.0).toFloat(),
            dateFontSizeSp = json.optDouble("dateFontSize", 14.0).toFloat()
        )
    }
}

/**
 * Payload konfigurasi untuk WebviewZoneRenderer
 */
data class WebviewConfigPayload(
    val url: String = "https://google.com",
    val zoomPercent: Int = 100
) {
    companion object {
        fun fromJson(json: JSONObject): WebviewConfigPayload = WebviewConfigPayload(
            url = json.optString("url", "https://google.com"),
            zoomPercent = json.optInt("zoomPercent", 100)
        )
    }
}

/**
 * Payload konfigurasi untuk LiveStreamZoneRenderer
 */
data class LiveStreamConfigPayload(
    val name: String = "Live Stream",
    val streamMode: String = "EXTERNAL_EMBED",
    val sourceType: String = "HLS",
    val sourceUrl: String = "",
    val effectivePlaybackUrl: String = "",
    val autoReconnect: Boolean = true,
    val lowLatencyMode: Boolean = true,
    val isMuted: Boolean = true
) {
    companion object {
        fun fromJson(json: JSONObject): LiveStreamConfigPayload {
            val rawSource = json.optString("sourceUrl", "")
            val effective = json.optString("effectivePlaybackUrl", "").ifBlank { rawSource }
            return LiveStreamConfigPayload(
                name = json.optString("name", "Live Stream"),
                streamMode = json.optString("streamMode", "EXTERNAL_EMBED"),
                sourceType = json.optString("sourceType", "HLS"),
                sourceUrl = rawSource,
                effectivePlaybackUrl = effective,
                autoReconnect = json.optBoolean("autoReconnect", true),
                lowLatencyMode = json.optBoolean("lowLatencyMode", true),
                isMuted = json.optBoolean("isMuted", true)
            )
        }
    }
}
