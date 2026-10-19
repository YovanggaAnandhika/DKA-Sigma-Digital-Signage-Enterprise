package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import android.util.TypedValue

class ClockZoneRenderer(
    private val context: Context
) {
    private val handler = Handler(Looper.getMainLooper())
    private var updateRunnable: Runnable? = null

    fun createView(
        parent: ViewGroup,
        city: String = "Makassar",
        showSeconds: Boolean = true,
        backgroundColorHex: String = "transparent",
        textColorHex: String = "#ffffff",
        subtitleColorHex: String = "#94a3b8",
        borderColorHex: String = "transparent",
        borderRadiusDp: Int = 0,
        timeFontSizeSp: Float = 52f,
        dateFontSizeSp: Float = 14f
    ): View {
        val zoneContainer = parent as? com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
        val scaleFactor = zoneContainer?.scaleFactorX ?: 1.0f

        val containerPad = (16f * scaleFactor).toInt().coerceAtLeast(1)
        val containerCornerR = borderRadiusDp.toFloat() * scaleFactor
        val borderW = (1f * scaleFactor).toInt().coerceAtLeast(1)
        val timeFontPx = ((if (timeFontSizeSp > 0f) timeFontSizeSp else 52f) * 0.7f) * scaleFactor
        val dateFontPx = (if (dateFontSizeSp > 0f) dateFontSizeSp else 14f) * scaleFactor
        val subtitlePadTop = (6f * scaleFactor).toInt().coerceAtLeast(1)

        val bgColor = parseColor(backgroundColorHex, Color.TRANSPARENT)
        val textColor = parseColor(textColorHex, Color.WHITE)
        val subColor = parseColor(subtitleColorHex, Color.parseColor("#94a3b8"))
        val hasBorder = borderColorHex.isNotBlank() && !borderColorHex.equals("transparent", ignoreCase = true)

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(containerPad, containerPad, containerPad, containerPad)

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

        // Line 1: Time (matches Web Studio layout and sans-serif font)
        val timeText = TextView(context).apply {
            setTextColor(textColor)
            setTextSize(TypedValue.COMPLEX_UNIT_PX, timeFontPx)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
            isSingleLine = true
            maxLines = 1
            letterSpacing = 0.02f
        }

        // Line 2: City / Weather Subtitle (matches Web Studio line 445: City • Cerah 31°C)
        val cityText = TextView(context).apply {
            text = "$city • Cerah 31°C"
            setTextColor(subColor)
            setTextSize(TypedValue.COMPLEX_UNIT_PX, dateFontPx)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
            gravity = Gravity.CENTER
            setPadding(0, subtitlePadTop, 0, 0)
        }

        container.addView(timeText)
        container.addView(cityText)

        // Web Studio uses toLocaleTimeString('id-ID') which formats with dots (e.g. 17.40.07)
        val timeFormat = SimpleDateFormat(if (showSeconds) "HH.mm.ss" else "HH.mm", Locale.getDefault())

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
