package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
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

class ClockZoneRenderer(
    private val context: Context
) {
    private val handler = Handler(Looper.getMainLooper())
    private var updateRunnable: Runnable? = null

    fun createView(
        parent: ViewGroup,
        city: String = "Makassar",
        showSeconds: Boolean = true
    ): View {
        val container = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(24, 24, 24, 24)
            setBackgroundColor(Color.parseColor("#0f172a"))
        }

        val cityText = TextView(context).apply {
            text = "📍 $city • Cerah Berawan 31°C"
            setTextColor(Color.parseColor("#93c5fd"))
            textSize = 14f
            gravity = Gravity.CENTER
        }

        val timeText = TextView(context).apply {
            setTextColor(Color.WHITE)
            textSize = 52f
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
            setTypeface(typeface, Typeface.BOLD)
        }

        val dateText = TextView(context).apply {
            setTextColor(Color.parseColor("#94a3b8"))
            textSize = 14f
            gravity = Gravity.CENTER
        }

        container.addView(cityText)
        container.addView(timeText)
        container.addView(dateText)

        val timeFormat = SimpleDateFormat(if (showSeconds) "HH:mm:ss" else "HH:mm", Locale.getDefault())
        val dateFormat = SimpleDateFormat("EEEE, dd MMMM yyyy", Locale.forLanguageTag("id-ID"))

        val runnable = object : Runnable {
            override fun run() {
                val now = Date()
                timeText.text = timeFormat.format(now)
                dateText.text = dateFormat.format(now)
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
