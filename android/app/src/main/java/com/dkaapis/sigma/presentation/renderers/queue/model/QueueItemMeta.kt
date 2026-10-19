package com.dkaapis.sigma.presentation.renderers.queue.model

/**
 * Metadata tata letak dan gaya per-item antrian pada canvas
 */
data class QueueItemMeta(
    val id: String,
    val itemType: String,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val zIndex: Int,
    val backgroundColor: String,
    val textColor: String,
    val fontSize: Float,
    val fontWeight: String,
    val textAlign: String,
    val templateContent: String,
    val borderRadius: Float = 0f,
    val borderWidth: Int = 0,
    val borderColor: String = "#00000000",
    val speed: String = "normal",
    val opacity: Float = 1.0f
)
