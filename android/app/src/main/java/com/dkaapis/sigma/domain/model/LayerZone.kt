package com.dkaapis.sigma.domain.model

enum class ZoneWidgetType {
    NONE,
    CLOCK,
    TICKER,
    QUEUE,
    WEBVIEW
}

data class LayerPlaylistItem(
    val id: String = "",
    val mediaItemId: String = "",
    val position: Int = 0,
    val durationSeconds: Int = 0,
    val isMuted: Boolean = false
)

data class LayerBlock(
    val id: String,
    val mediaItemId: String? = null,
    val playlistId: String? = null,
    val widgetType: ZoneWidgetType = ZoneWidgetType.NONE,
    val widgetDataJson: String? = null,
    val startTimeSeconds: Int = 0,
    val durationSeconds: Int = 10,
    val isMuted: Boolean = false,
    val playlistItems: List<LayerPlaylistItem> = emptyList()
)

data class LayerZone(
    val id: String,
    val name: String,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val zIndex: Int = 1,
    val backgroundColor: String? = null,
    val opacity: Float = 1.0f,
    val overlayColor: String? = null,
    val overlayOpacity: Float = 0.0f,
    val borderRadius: Int = 0,
    val borderColor: String? = null,
    val borderWidth: Int = 0,
    val blocks: List<LayerBlock> = emptyList(),
    val isLocked: Boolean = false
)
