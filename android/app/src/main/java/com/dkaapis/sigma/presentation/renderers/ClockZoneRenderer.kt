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
import androidx.core.graphics.toColorInt
import com.dkaapis.sigma.R
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.dkaapis.sigma.presentation.renderers.model.ClockConfigPayload
import com.dkaapis.sigma.presentation.util.ColorParser
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ClockZoneRenderer(
    private val context: Context
) {
    private val handler = Handler(Looper.getMainLooper())
    private var updateRunnable: Runnable? = null

    fun createView(parent: ViewGroup, payload: ClockConfigPayload = ClockConfigPayload()): View {
        val zone = parent as? ZoneContainerView
        val scale = zone?.scaleFactorX ?: 1.0f
        val densityScale = minOf(
            zone?.zoneWidth?.div(440f) ?: 1f,
            zone?.zoneHeight?.div(230f) ?: 1f
        ).coerceAtLeast(0.1f) * scale
        val pad = (20f * densityScale).toInt().coerceAtLeast(1)
        val weather = weatherForCity(payload.city)
        val hasBorder = payload.borderColorHex.isNotBlank() && !payload.borderColorHex.equals("transparent", ignoreCase = true)

        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((28f * densityScale).toInt(), pad, (28f * densityScale).toInt(), pad)

            if (payload.borderRadiusDp > 0 || hasBorder) {
                background = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setColor(ColorParser.parseColor(payload.backgroundColorHex))
                    cornerRadius = 24f * densityScale
                    if (hasBorder) setStroke((1f * densityScale).toInt().coerceAtLeast(1), ColorParser.parseColor(payload.borderColorHex))
                }
            } else {
                setBackgroundColor(ColorParser.parseColor(payload.backgroundColorHex))
            }
        }

        val locationText = TextView(context).apply {
            text = context.getString(R.string.clock_location, weather.city)
            setTextColor("#93c5fd".toColorInt())
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 14f * densityScale)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        }

        val conditionText = TextView(context).apply {
            text = context.getString(R.string.clock_condition, weather.condition)
            setTextColor("#fbbf24".toColorInt())
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 13f * densityScale)
            includeFontPadding = false
            gravity = Gravity.END
        }

        container.addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(locationText, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(conditionText)
        })

        val timeRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, (10f * densityScale).toInt(), 0, (4f * densityScale).toInt())
        }
        val mainTime = TextView(context).apply {
            setTextColor(ColorParser.parseColor(payload.textColorHex, Color.WHITE))
            setTextSize(TypedValue.COMPLEX_UNIT_PX, (payload.timeFontSizeSp.coerceAtLeast(24f) * 0.7f) * densityScale)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            letterSpacing = -0.02f
        }
        val secondsText = TextView(context).apply {
            setTextColor("#94a3b8".toColorInt())
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 28f * densityScale)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        }
        val periodText = TextView(context).apply {
            setTextColor("#38bdf8".toColorInt())
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 16f * densityScale)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            setPadding((4f * densityScale).toInt(), 0, 0, 0)
        }
        timeRow.addView(mainTime)
        if (payload.showSeconds) timeRow.addView(secondsText)
        if (!payload.is24Hour) timeRow.addView(periodText)
        container.addView(timeRow)

        val dateText = TextView(context).apply {
            setTextColor("#cbd5e1".toColorInt())
            setTextSize(TypedValue.COMPLEX_UNIT_PX, payload.dateFontSizeSp * densityScale)
            includeFontPadding = false
            text = ""
        }
        if (payload.showDate) container.addView(dateText)

        container.addView(View(context).apply {
            setBackgroundColor("#33ffffff".toColorInt())
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (1f * densityScale).toInt().coerceAtLeast(1)).apply {
                topMargin = (12f * densityScale).toInt()
            }
        })

        val weatherRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, (10f * densityScale).toInt(), 0, 0)
        }
        val temperatureText = TextView(context).apply {
            text = context.getString(R.string.clock_temperature, weather.temperature)
            setTextColor(ColorParser.parseColor(payload.textColorHex, Color.WHITE))
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 28f * densityScale)
            includeFontPadding = false
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        }
        val metricsText = TextView(context).apply {
            text = context.getString(R.string.clock_weather_metrics, weather.humidity, weather.windSpeed)
            setTextColor("#94a3b8".toColorInt())
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 12f * densityScale)
            includeFontPadding = false
            gravity = Gravity.END
        }
        weatherRow.addView(temperatureText, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        weatherRow.addView(metricsText)
        container.addView(weatherRow)

        val timePattern = when {
            payload.is24Hour -> "HH:mm"
            else -> "hh:mm"
        }
        val timeFormat = SimpleDateFormat(timePattern, Locale.forLanguageTag("id-ID")).apply {
            timeZone = TimeZone.getTimeZone(payload.timezone)
        }
        val secondsFormat = SimpleDateFormat("ss", Locale.forLanguageTag("id-ID")).apply {
            timeZone = TimeZone.getTimeZone(payload.timezone)
        }
        val periodFormat = SimpleDateFormat("a", Locale.forLanguageTag("id-ID")).apply {
            timeZone = TimeZone.getTimeZone(payload.timezone)
        }
        val dateFormat = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.forLanguageTag("id-ID")).apply {
            timeZone = TimeZone.getTimeZone(payload.timezone)
        }
        val runnable = object : Runnable {
            override fun run() {
                val now = Date()
                mainTime.text = timeFormat.format(now)
                secondsText.text = if (payload.showSeconds) ":${secondsFormat.format(now)}" else ""
                periodText.text = if (payload.is24Hour) "" else periodFormat.format(now)
                dateText.text = context.getString(R.string.clock_date, dateFormat.format(now))
                handler.postDelayed(this, 1000)
            }
        }
        updateRunnable = runnable
        handler.post(runnable)

        return container
    }

    // shortcut: weather values mirror the CMS city presets until a live forecast is provided by the backend.
    private fun weatherForCity(city: String): Weather = when (city) {
        "Jakarta" -> Weather("Jakarta", "Cerah", 33, 68, 12)
        "Surabaya" -> Weather("Surabaya", "Cerah Panas", 34, 65, 16)
        "Bandung" -> Weather("Bandung", "Hujan Ringan", 24, 85, 10)
        "Denpasar" -> Weather("Denpasar", "Cerah", 30, 75, 18)
        "Medan" -> Weather("Medan", "Berawan", 29, 80, 11)
        else -> Weather("Makassar", "Cerah Berawan", 31, 72, 14)
    }

    private data class Weather(
        val city: String,
        val condition: String,
        val temperature: Int,
        val humidity: Int,
        val windSpeed: Int
    )

    fun release() {
        updateRunnable?.let { handler.removeCallbacks(it) }
        updateRunnable = null
    }
}
