package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.dkaapis.sigma.presentation.renderers.model.ClockConfigPayload
import com.dkaapis.sigma.presentation.util.ColorParser
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ClockZoneRenderer(
    private val context: Context
) {
    private val handler = Handler(Looper.getMainLooper())
    private var updateRunnable: Runnable? = null

    fun createView(parent: ViewGroup, payload: ClockConfigPayload = ClockConfigPayload()): View {
        val scale = (parent as? ZoneContainerView)?.scaleFactorX ?: 1.0f
        val pad = (16f * scale).toInt().coerceAtLeast(1)
        val hasBorder = payload.borderColorHex.isNotBlank() && !payload.borderColorHex.equals("transparent", ignoreCase = true)

        val timeFontPx = ((if (payload.timeFontSizeSp > 0f) payload.timeFontSizeSp else 52f) * 0.7f) * scale
        val dateFontPx = (if (payload.dateFontSizeSp > 0f) payload.dateFontSizeSp else 14f) * scale

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(pad, pad, pad, pad)

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

        val timeText = TextView(context).apply {
            setTextColor(ColorParser.parseColor(payload.textColorHex, Color.WHITE))
            setTextSize(TypedValue.COMPLEX_UNIT_PX, timeFontPx)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
            isSingleLine = true
            maxLines = 1
            letterSpacing = 0.02f
        }

        val cityText = TextView(context).apply {
            text = "${payload.city} • Cerah 31°C"
            setTextColor(ColorParser.parseColor(payload.subtitleColorHex, Color.parseColor("#94a3b8")))
            setTextSize(TypedValue.COMPLEX_UNIT_PX, dateFontPx)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
            gravity = Gravity.CENTER
            setPadding(0, (6f * scale).toInt().coerceAtLeast(1), 0, 0)
        }

        container.addView(timeText)
        container.addView(cityText)

        val timeFormat = SimpleDateFormat(if (payload.showSeconds) "HH.mm.ss" else "HH.mm", Locale.getDefault())
        val runnable = object : Runnable {
            override fun run() {
                timeText.text = timeFormat.format(Date())
                handler.postDelayed(this, 1000)
            }
        }
        updateRunnable = runnable
        handler.post(runnable)

        return container
    }

    fun release() {
        updateRunnable?.let { handler.removeCallbacks(it) }
        updateRunnable = null
    }
}
