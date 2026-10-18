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
        textMessage: String = "Dapatkan diskon 20% untuk semua transaksi member hari ini di seluruh cabang DKASigma.",
        badgeText: String = "PROMO HARI INI",
        bgColorHex: String = "#1e3a8a"
    ): View {
        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val bgDrawable = android.graphics.drawable.GradientDrawable(
                android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(Color.parseColor("#1e3a8a"), Color.parseColor("#1d4ed8"))
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
                    setColor(Color.parseColor("#2563eb"))
                    setStroke(
                        (1 * context.resources.displayMetrics.density).toInt(),
                        Color.parseColor("#60a5fa")
                    )
                }
                background = badgeBg
                gravity = Gravity.CENTER
            }
            container.addView(badge)
        }

        val marqueeText = TextView(context).apply {
            text = textMessage
            setTextColor(Color.WHITE)
            textSize = 18f
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
}
