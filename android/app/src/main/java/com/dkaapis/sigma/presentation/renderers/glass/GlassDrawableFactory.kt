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

