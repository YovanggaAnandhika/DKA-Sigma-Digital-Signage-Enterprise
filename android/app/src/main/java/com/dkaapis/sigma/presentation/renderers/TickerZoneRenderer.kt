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

class TickerZoneRenderer(
    private val context: Context
) {
    fun createView(
        parent: ViewGroup,
        textMessage: String = "",
        badgeText: String = "",
        fontSize: Float = 16f,
        backgroundColorHex: String = "#1e3a8a",
        textColorHex: String = "#ffffff",
        badgeBackgroundColorHex: String = "rgba(255, 255, 255, 0.2)",
        badgeTextColorHex: String = "#ffffff",
        borderColorHex: String = "transparent",
        borderRadiusDp: Int = 0
    ): View {
        val density = context.resources.displayMetrics.density
        val bgColor = parseColor(backgroundColorHex, Color.parseColor("#1e3a8a"))
        val textColor = parseColor(textColorHex, Color.WHITE)
        val badgeBg = parseColor(badgeBackgroundColorHex, Color.parseColor("#33ffffff"))
        val badgeTextCol = parseColor(badgeTextColorHex, Color.WHITE)
        val hasBorder = borderColorHex.isNotBlank() && !borderColorHex.equals("transparent", ignoreCase = true)

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((12 * density).toInt(), 0, (12 * density).toInt(), 0)

            if (borderRadiusDp > 0 || hasBorder) {
                val bgDrawable = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setColor(bgColor)
                    if (borderRadiusDp > 0) {
                        cornerRadius = borderRadiusDp * density
                    }
                    if (hasBorder) {
                        setStroke((1 * density).toInt(), parseColor(borderColorHex, Color.TRANSPARENT))
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
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                setPadding((8 * density).toInt(), (2 * density).toInt(), (8 * density).toInt(), (2 * density).toInt())

                val badgeDrawable = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 4f * density
                    setColor(badgeBg)
                }
                background = badgeDrawable
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    rightMargin = (12 * density).toInt()
                }
            }
            container.addView(badge)
        }

        val marqueeText = TextView(context).apply {
            text = textMessage.ifBlank { "DKASigma Teks Berjalan" }
            setTextColor(textColor)
            textSize = if (fontSize > 0f) fontSize else 16f
            setTypeface(null, Typeface.BOLD)
            isSingleLine = true
            ellipsize = TextUtils.TruncateAt.MARQUEE
            marqueeRepeatLimit = -1
            isSelected = true
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
