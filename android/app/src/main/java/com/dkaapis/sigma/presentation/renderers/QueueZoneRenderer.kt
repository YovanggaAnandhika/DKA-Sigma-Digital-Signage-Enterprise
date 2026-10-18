package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.media.AudioAttributes
import android.media.SoundPool
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.dkaapis.sigma.domain.model.QueueDisplayData

class QueueZoneRenderer(
    private val context: Context,
    private val onCallAudioStarted: () -> Unit = {},
    private val onCallAudioFinished: () -> Unit = {}
) {
    private var numberTextView: TextView? = null
    private var counterTextView: TextView? = null

    fun createView(
        parent: ViewGroup,
        data: QueueDisplayData = QueueDisplayData(),
        themePreset: String = "clean-light",
        backgroundColorHex: String? = null
    ): View {
        val isDark = themePreset == "solid-dark" || themePreset == "executive-blue"
        val isMedical = themePreset == "medical-green"

        val bgColor = backgroundColorHex?.ifBlank { null } ?: if (isDark || isMedical) "#0f172a" else "#f8fafc"
        val primaryColor = if (isMedical) "#10b981" else if (isDark) "#38bdf8" else "#0284c7"
        val subtitleColor = if (isMedical) "#10b981" else if (isDark) "#94a3b8" else "#64748b"
        val borderColor = if (isMedical) "#059669" else if (isDark) "#1e3a8a" else "#e2e8f0"
        val badgeBgColor = if (isMedical) "#059669" else "#f59e0b"
        val footerBg = if (isMedical) "#064e3b" else if (isDark) "#020617" else "#0369a1"

        // Outer container with background matching Web Studio theme
        val root = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            val bgDrawable = android.graphics.drawable.GradientDrawable().apply {
                cornerRadius = 16f * context.resources.displayMetrics.density
                setColor(Color.parseColor(bgColor))
                setStroke(
                    (1 * context.resources.displayMetrics.density).toInt(),
                    Color.parseColor(borderColor)
                )
            }
            background = bgDrawable
            setPadding(32, 40, 32, 24)
        }

        // Title
        val title = TextView(context).apply {
            text = data.queueName.ifBlank { "Antrian" }
            textSize = 20f
            setTextColor(Color.parseColor(subtitleColor))
            setTypeface(null, Typeface.BOLD)
            letterSpacing = 0.12f
            gravity = Gravity.CENTER
        }

        // Ticket Number
        val number = TextView(context).apply {
            text = data.queueNumber.ifBlank { "${data.queuePrefix}-001" }
            textSize = 76f
            setTextColor(Color.parseColor(primaryColor))
            setTypeface(Typeface.MONOSPACE, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 16)
        }
        numberTextView = number

        // Counter Badge (Pill matching Web Studio)
        val counterBadge = TextView(context).apply {
            text = data.queueCounter.ifBlank { "LOKET 01" }
            textSize = 24f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            letterSpacing = 0.08f
            setPadding(48, 14, 48, 14)
            val badgeBg = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                cornerRadius = 9999f
                setColor(Color.parseColor(badgeBgColor))
            }
            background = badgeBg
            gravity = Gravity.CENTER
        }
        counterTextView = counterBadge

        // Footer Marquee
        val footerMarquee = TextView(context).apply {
            val counterText = data.queueCounter.ifBlank { "Loket" }
            val numText = data.queueNumber.ifBlank { "${data.queuePrefix}-001" }
            text = "PENGUMUMAN: Silakan menuju $counterText saat nomor $numText dipanggil."
            textSize = 12f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            val footerBgDrawable = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                cornerRadius = 8f * context.resources.displayMetrics.density
                setColor(Color.parseColor(footerBg))
            }
            background = footerBgDrawable
            setPadding(24, 10, 24, 10)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 32
            }
        }

        root.addView(title)
        root.addView(number)
        root.addView(counterBadge)
        root.addView(footerMarquee)

        return root
    }

    fun updateCall(ticketNumber: String, counterName: String) {
        numberTextView?.text = ticketNumber
        counterTextView?.text = counterName
        onCallAudioStarted()
        // Audio chime / TTS notification
        numberTextView?.postDelayed({
            onCallAudioFinished()
        }, 3000)
    }
}
