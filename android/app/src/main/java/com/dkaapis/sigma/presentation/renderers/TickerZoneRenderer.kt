package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

import android.util.TypedValue

class TickerZoneRenderer(
    private val context: Context
) {
    fun createView(
        parent: ViewGroup,
        textMessage: String = "",
        badgeText: String = "",
        fontSize: Float = 16f,
        backgroundColorHex: String = "transparent",
        textColorHex: String = "#ffffff",
        badgeBackgroundColorHex: String = "transparent",
        badgeTextColorHex: String = "#ffffff",
        borderColorHex: String = "transparent",
        borderRadiusDp: Int = 0,
        speed: String = "normal"
    ): View {
        val zoneContainer = parent as? com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
        val scaleFactor = zoneContainer?.scaleFactorX ?: 1.0f

        val effectiveFontSizePx = (if (fontSize > 0f) fontSize else 16f) * scaleFactor
        val effectiveBadgeFontSizePx = 12f * scaleFactor

        val containerPad = (12f * scaleFactor).toInt().coerceAtLeast(1)
        val badgePadH = (8f * scaleFactor).toInt().coerceAtLeast(1)
        val badgePadV = (2f * scaleFactor).toInt().coerceAtLeast(1)
        val badgeMarginR = (12f * scaleFactor).toInt().coerceAtLeast(1)
        val badgeCornerR = 4f * scaleFactor
        val containerCornerR = borderRadiusDp.toFloat() * scaleFactor
        val borderW = (1f * scaleFactor).toInt().coerceAtLeast(1)

        val bgColor = parseColor(backgroundColorHex, Color.TRANSPARENT)
        val textColor = parseColor(textColorHex, Color.WHITE)
        val badgeBg = parseColor(badgeBackgroundColorHex, Color.TRANSPARENT)
        val badgeTextCol = parseColor(badgeTextColorHex, Color.WHITE)
        val hasBorder = borderColorHex.isNotBlank() && !borderColorHex.equals("transparent", ignoreCase = true)

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(containerPad, 0, containerPad, 0)

            if (borderRadiusDp > 0 || hasBorder) {
                val bgDrawable = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setColor(bgColor)
                    if (borderRadiusDp > 0) {
                        cornerRadius = containerCornerR
                    }
                    if (hasBorder) {
                        setStroke(borderW, parseColor(borderColorHex, Color.TRANSPARENT))
                    }
                }
                background = bgDrawable
            } else {
                setBackgroundColor(bgColor)
            }
        }

        if (badgeText.isNotBlank()) {
            val badge = TextView(context).apply {
                text = badgeText
                setTextColor(badgeTextCol)
                setTextSize(TypedValue.COMPLEX_UNIT_PX, effectiveBadgeFontSizePx)
                includeFontPadding = false
                setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD))
                setPadding(badgePadH, badgePadV, badgePadH, badgePadV)

                val badgeDrawable = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = badgeCornerR
                    setColor(badgeBg)
                }
                background = badgeDrawable
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    rightMargin = badgeMarginR
                }
            }
            container.addView(badge)
        }

        val marqueeText = MarqueeTextView(context).apply {
            text = textMessage.ifBlank { "DKASigma Teks Berjalan" }
            setTextColor(textColor)
            setTextSize(TypedValue.COMPLEX_UNIT_PX, effectiveFontSizePx)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            speedPixelsPerSec = when (speed.lowercase()) {
                "fast" -> 160f * scaleFactor
                "slow" -> 50f * scaleFactor
                else -> 95f * scaleFactor
            }
            layoutParams = LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1f
            )
        }
        container.addView(marqueeText)

        return container
    }

    private fun parseColor(colorStr: String, fallback: Int): Int {
        if (colorStr.isBlank() || colorStr.equals("transparent", ignoreCase = true)) return Color.TRANSPARENT
        val trimmed = colorStr.trim()
        if (trimmed.startsWith("#")) {
            return try { Color.parseColor(trimmed) } catch (_: Exception) { fallback }
        }
        if (trimmed.startsWith("rgba", ignoreCase = true)) {
            try {
                val parts = trimmed.substringAfter("(").substringBefore(")").split(",")
                if (parts.size >= 4) {
                    val r = parts[0].trim().toInt()
                    val g = parts[1].trim().toInt()
                    val b = parts[2].trim().toInt()
                    val a = (parts[3].trim().toFloat() * 255).toInt().coerceIn(0, 255)
                    return Color.argb(a, r, g, b)
                }
            } catch (_: Exception) {}
        }
        return try { Color.parseColor(trimmed) } catch (_: Exception) { fallback }
    }
}
