package com.dkasigma.player.presentation.renderers

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
        textMessage: String,
        badgeText: String = "INFO",
        bgColorHex: String = "#0284c7"
    ): View {
        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            try {
                setBackgroundColor(Color.parseColor(bgColorHex))
            } catch (_: Exception) {
                setBackgroundColor(Color.parseColor("#0284c7"))
            }
        }

        if (badgeText.isNotBlank()) {
            val badge = TextView(context).apply {
                text = badgeText
                setTextColor(Color.WHITE)
                textSize = 14f
                setTypeface(null, Typeface.BOLD)
                setPadding(24, 8, 24, 8)
                setBackgroundColor(Color.parseColor("#f59e0b"))
                gravity = Gravity.CENTER
            }
            container.addView(badge)
        }

        val marqueeText = TextView(context).apply {
            text = textMessage
            setTextColor(Color.WHITE)
            textSize = 20f
            setTypeface(null, Typeface.BOLD)
            setPadding(16, 0, 16, 0)
            isSingleLine = true
            ellipsize = TextUtils.TruncateAt.MARQUEE
            marqueeRepeatLimit = -1
            isSelected = true
        }
        container.addView(marqueeText)

        return container
    }
}
