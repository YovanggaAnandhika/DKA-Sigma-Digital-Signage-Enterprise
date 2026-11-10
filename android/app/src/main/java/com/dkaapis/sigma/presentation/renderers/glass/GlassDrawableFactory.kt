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
     * Luminous specular frosted glass with vertical luminance sheen, translucent acrylic body,
     * and a crystal specular rim highlight.
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
                Color.argb(220, (255 + r) / 2, (255 + g) / 2, (255 + b) / 2),
                Color.argb(165, (245 + r) / 2, (247 + g) / 2, (250 + b) / 2),
                Color.argb(185, (230 + r) / 2, (235 + g) / 2, (242 + b) / 2)
            )
        } else {
            intArrayOf(
                Color.argb(215, 255, 255, 255), // Top specular sheen
                Color.argb(155, 248, 250, 252), // Mid translucent acrylic
                Color.argb(180, 226, 232, 240)  // Bottom frosted reflection
            )
        }

        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            colors
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 999f
            val strokeColor = accentColor?.let {
                Color.argb(160, Color.red(it), Color.green(it), Color.blue(it))
            } ?: Color.argb(195, 255, 255, 255)
            setStroke((1.2f * density).toInt().coerceAtLeast(1), strokeColor)
        }
    }

    /**
     * macOS Tahoe Glass Card (For Standby / Offline):
     * Frosted acrylic floating sheet with luminous specular rim and ambient depth.
     */
    fun createMacOsTahoeGlassCard(
        cornerRadiusPx: Float,
        density: Float
    ): GradientDrawable {
        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.argb(230, 255, 255, 255), // Luminous top specular rim
                Color.argb(195, 248, 250, 252), // Glass body
                Color.argb(210, 241, 245, 249)  // Ground frosted reflection
            )
        ).apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = cornerRadiusPx
            setStroke((1.5f * density).toInt().coerceAtLeast(1), Color.argb(220, 255, 255, 255))
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

