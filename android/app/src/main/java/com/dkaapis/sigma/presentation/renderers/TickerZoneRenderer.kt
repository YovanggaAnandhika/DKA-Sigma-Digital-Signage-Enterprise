package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
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
        theme: String = "blue",
        fontSize: Float = 16f
    ): View {
        val (bgStart, bgEnd, badgeBgColor, badgeStrokeColor) = when (theme.lowercase()) {
            "red" -> Quadruple("#7f1d1d", "#991b1b", "#dc2626", "#ef4444")
            "dark" -> Quadruple("#0f172a", "#1e293b", "#334155", "#475569")
            "emerald" -> Quadruple("#064e3b", "#065f46", "#059669", "#10b981")
            "amber" -> Quadruple("#78350f", "#92400e", "#d97706", "#f59e0b")
            else -> Quadruple("#1e3a8a", "#1d4ed8", "#2563eb", "#60a5fa") // blue
        }

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val bgDrawable = android.graphics.drawable.GradientDrawable(
                android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(Color.parseColor(bgStart), Color.parseColor(bgEnd))
            )
            background = bgDrawable
            setPadding(24, 0, 24, 0)
        }

        if (badgeText.isNotBlank()) {
            val badge = TextView(context).apply {
                text = badgeText
                setTextColor(Color.WHITE)
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                setPadding(20, 8, 20, 8)
                val badgeBg = android.graphics.drawable.GradientDrawable().apply {
                    shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                    cornerRadius = 8f * context.resources.displayMetrics.density
                    setColor(Color.parseColor(badgeBgColor))
                    setStroke(
                        (1 * context.resources.displayMetrics.density).toInt(),
                        Color.parseColor(badgeStrokeColor)
                    )
                }
                background = badgeBg
                gravity = Gravity.CENTER
            }
            container.addView(badge)
        }

        val marqueeText = TextView(context).apply {
            text = textMessage.ifBlank { "DKASigma Teks Berjalan" }
            setTextColor(Color.WHITE)
            textSize = if (fontSize > 0f) fontSize else 16f
            setTypeface(null, Typeface.BOLD)
            setPadding(20, 0, 20, 0)
            isSingleLine = true
            ellipsize = TextUtils.TruncateAt.MARQUEE
            marqueeRepeatLimit = -1
            isSelected = true
        }
        container.addView(marqueeText)

        return container
    }

    private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
}
