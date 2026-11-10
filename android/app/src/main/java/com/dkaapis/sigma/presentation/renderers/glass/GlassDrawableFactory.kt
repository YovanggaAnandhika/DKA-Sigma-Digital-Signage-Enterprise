package com.dkaapis.sigma.presentation.renderers.glass

import android.graphics.Color
import android.graphics.drawable.GradientDrawable

/**
 * Pabrik Drawable Glassmorphism hardware-accelerated:
 * Menghasilkan efek kaca frosted modern dengan specular rim light tanpa operasi konvolusi
 * blur dinamis pada GPU, menjamin 60 FPS stabil pada perangkat low-spec (RAM 1 GB).
 */
object GlassDrawableFactory {

    fun createGlassCardDrawable(
        cornerRadiusPx: Float = 36f,
        strokeWidthPx: Int = 2,
        isHighlight: Boolean = false
    ): GradientDrawable {
        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                if (isHighlight) 0xDD1E293B.toInt() else 0xCC0F172A.toInt(),
                if (isHighlight) 0xF00F172A.toInt() else 0xEA0B0F19.toInt()
            )
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerRadiusPx
            setStroke(
                strokeWidthPx,
                if (isHighlight) 0x6638BDF8.toInt() else 0x38FFFFFF.toInt()
            )
        }
    }

    fun createStatusPillDrawable(
        bgColor: Int,
        strokeColor: Int,
        cornerRadiusPx: Float = 999f
    ): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerRadiusPx
            setColor(bgColor)
            setStroke(2, strokeColor)
        }
    }

    /**
     * macOS Tahoe Liquid Glass Pill:
     * True transparent crystal frosted glass pill with luminous specular sheen and rim highlight.
     */
    fun createMacOsTahoeGlassPill(
        density: Float,
        accentColor: Int? = null
    ): GradientDrawable {
        val colors = if (accentColor != null) {
            val r = Color.red(accentColor)
            val g = Color.green(accentColor)
            val b = Color.blue(accentColor)
            intArrayOf(
                Color.argb(85, (255 + r) / 2, (255 + g) / 2, (255 + b) / 2),
                Color.argb(32, (255 + r) / 2, (255 + g) / 2, (255 + b) / 2),
                Color.argb(55, r, g, b)
            )
        } else {
            intArrayOf(
                Color.argb(80, 255, 255, 255), // Top specular sheen
                Color.argb(30, 255, 255, 255), // Mid transparent glass
                Color.argb(50, 226, 232, 240)  // Bottom frosted reflection
            )
        }

        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            colors
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 999f
            val strokeColor = accentColor?.let {
                Color.argb(150, Color.red(it), Color.green(it), Color.blue(it))
            } ?: Color.argb(130, 255, 255, 255)
            setStroke((1.2f * density).toInt().coerceAtLeast(1), strokeColor)
        }
    }

    /**
     * macOS Tahoe Glass Card (For Standby / Offline):
     * True transparent crystal frosted glass sheet with luminous specular rim and ambient depth.
     */
    fun createMacOsTahoeGlassCard(
        cornerRadiusPx: Float,
        density: Float
    ): GradientDrawable {
        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.argb(75, 255, 255, 255), // Top specular sheen
                Color.argb(28, 255, 255, 255), // Crystal clear glass body (transparent)
                Color.argb(48, 241, 245, 249)  // Ground frosted subtle reflection
            )
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerRadiusPx
            setStroke((1.2f * density).toInt().coerceAtLeast(1), Color.argb(130, 255, 255, 255))
        }
    }

    fun createGlassCardWithAccent(
        accentColor: Int,
        cornerRadiusPx: Float = 36f,
        strokeWidthPx: Int = 2
    ): GradientDrawable {
        val topAlpha = Color.argb(45, Color.red(accentColor), Color.green(accentColor), Color.blue(accentColor))
        val strokeAlpha = Color.argb(90, Color.red(accentColor), Color.green(accentColor), Color.blue(accentColor))

        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.argb(220, 15, 23, 42),
                Color.argb(240, 11, 15, 25)
            )
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerRadiusPx
            setStroke(strokeWidthPx, strokeAlpha)
        }
    }
}

