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
        badgeBackgroundColorHex: String = "#2563eb",
        badgeTextColorHex: String = "#ffffff",
        borderColorHex: String = "#60a5fa",
        borderRadiusDp: Int = 8
    ): View {
        val density = context.resources.displayMetrics.density

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL

            val bgDrawable = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                setColor(Color.parseColor(backgroundColorHex.ifBlank { "#1e3a8a" }))
                if (borderRadiusDp > 0) {
                    cornerRadius = borderRadiusDp * density
                }
                if (borderColorHex.isNotBlank() && borderColorHex != "transparent") {
                    setStroke((1 * density).toInt(), Color.parseColor(borderColorHex))
                }
            }
            background = bgDrawable
            setPadding((16 * density).toInt(), 0, (16 * density).toInt(), 0)
        }

        if (badgeText.isNotBlank()) {
            val badge = TextView(context).apply {
                text = badgeText
                setTextColor(Color.parseColor(badgeTextColorHex.ifBlank { "#ffffff" }))
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                setPadding((12 * density).toInt(), (4 * density).toInt(), (12 * density).toInt(), (4 * density).toInt())

                val badgeBg = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = 4f * density
                    setColor(Color.parseColor(badgeBackgroundColorHex.ifBlank { "#2563eb" }))
                }
                background = badgeBg
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
            setTextColor(Color.parseColor(textColorHex.ifBlank { "#ffffff" }))
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
}
