package com.dkaapis.sigma.presentation.renderers

internal enum class LiveStreamProfile(val path: String) {
    SOURCE("live"),
    HD("hd/live"),
    SD("sd/live");

    fun lowerQuality(): LiveStreamProfile? = values().getOrNull(ordinal + 1)

    fun higherQuality(maximum: LiveStreamProfile): LiveStreamProfile? =
        values().getOrNull(ordinal - 1)?.takeIf { it.ordinal >= maximum.ordinal }
}

internal data class LiveStreamQualityWindow(
    val droppedFrames: Int,
    val renderedFrames: Int,
    val bufferingEvents: Int
) {
    private val totalFrames: Int
        get() = droppedFrames + renderedFrames

    private val dropPercent: Float
        get() = if (totalFrames > 0) droppedFrames * 100f / totalFrames else 0f

    fun isPoor(): Boolean =
        bufferingEvents >= 2 ||
            (totalFrames >= 100 && droppedFrames >= 8 && dropPercent >= 2f)

    fun isSevere(): Boolean =
        bufferingEvents >= 4 ||
            (totalFrames >= 100 && droppedFrames >= 15 && dropPercent >= 5f)

    fun isStable(): Boolean =
        bufferingEvents == 0 && totalFrames >= 100 && dropPercent <= 0.5f
}
