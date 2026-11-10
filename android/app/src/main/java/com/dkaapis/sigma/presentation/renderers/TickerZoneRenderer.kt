package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.dkaapis.sigma.presentation.renderers.model.TickerConfigPayload
import com.dkaapis.sigma.presentation.util.ColorParser

class TickerZoneRenderer(
    private val context: Context
) {
    fun createView(parent: ViewGroup, payload: TickerConfigPayload = TickerConfigPayload()): View {
        val zone = parent as? ZoneContainerView
        val scale = zone?.scaleFactorX ?: 1.0f
        val fontSize = minOf(
            payload.fontSize.takeIf { it > 0f } ?: 16f,
            (zone?.zoneHeight?.toFloat() ?: Float.MAX_VALUE).let { (it * 0.72f).coerceAtLeast(8f) }
        ).coerceAtLeast(8f) * scale
        val pad = (12f * scale).toInt().coerceAtLeast(1)
        val hasBorder = payload.borderColorHex.isNotBlank() && !payload.borderColorHex.equals("transparent", ignoreCase = true)

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(pad, 0, pad, 0)

            if (payload.borderRadiusDp > 0 || hasBorder) {
                background = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setColor(ColorParser.parseColor(payload.backgroundColorHex))
                    if (payload.borderRadiusDp > 0) cornerRadius = payload.borderRadiusDp * scale
                    if (hasBorder) setStroke((1f * scale).toInt().coerceAtLeast(1), ColorParser.parseColor(payload.borderColorHex))
                }
            } else {
                setBackgroundColor(ColorParser.parseColor(payload.backgroundColorHex))
            }
        }

        if (payload.badgeText.isNotBlank()) {
            val badgeFontSize = fontSize * 0.5f
            val badgePadH = (badgeFontSize * 0.35f).toInt().coerceAtLeast(1)
            val badgePadV = (badgeFontSize * 0.1f).toInt().coerceAtLeast(1)

            container.addView(
                TextView(context).apply {
                    text = payload.badgeText
                    setTextColor(ColorParser.parseColor(payload.badgeTextColorHex, Color.WHITE))
                    setTextSize(TypedValue.COMPLEX_UNIT_PX, badgeFontSize)
                    includeFontPadding = false
                    typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
                    setPadding(badgePadH, badgePadV, badgePadH, badgePadV)
                    background = GradientDrawable().apply {
                        shape = GradientDrawable.RECTANGLE
                        cornerRadius = 4f * scale
                        setColor(ColorParser.parseColor(payload.badgeBackgroundColorHex))
                    }
                    gravity = Gravity.CENTER
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                        rightMargin = pad
                    }
                }
            )
        }

        container.addView(
            MarqueeTextView(context).apply {
                text = payload.textMessage.ifBlank { "HNDSigma Teks Berjalan" }
                setTextColor(ColorParser.parseColor(payload.textColorHex, Color.WHITE))
                setTextSize(TypedValue.COMPLEX_UNIT_PX, fontSize)
                includeFontPadding = false
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
                speedPixelsPerSec = when (payload.speed.lowercase()) {
                    "fast" -> 160f * scale
                    "slow" -> 50f * scale
                    else -> 95f * scale
                }
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            }
        )

        return container
    }
}
