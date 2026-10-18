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
        data: QueueDisplayData = QueueDisplayData()
    ): View {
        // Outer container with dark HDR background matching Web Studio
        val root = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            val bgDrawable = android.graphics.drawable.GradientDrawable(
                android.graphics.drawable.GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#0f172a"), Color.parseColor("#1e293b"))
            ).apply {
                cornerRadius = 16f * context.resources.displayMetrics.density
                setStroke(
                    (1 * context.resources.displayMetrics.density).toInt(),
                    Color.parseColor("#1e3a8a")
                )
            }
            background = bgDrawable
            setPadding(32, 40, 32, 24)
        }

        // Title
        val title = TextView(context).apply {
            text = if (data.queueName.isNotBlank()) data.queueName else "Layar Antrian Baru"
            textSize = 20f
            setTextColor(Color.parseColor("#94a3b8"))
            setTypeface(null, Typeface.BOLD)
            letterSpacing = 0.12f
            gravity = Gravity.CENTER
        }

        // Ticket Number (Emerald Green / Cyan)
        val number = TextView(context).apply {
            text = if (data.queueNumber.isNotBlank()) data.queueNumber else "A-001"
            textSize = 76f
            setTextColor(Color.parseColor("#10b981"))
            setTypeface(Typeface.MONOSPACE, Typeface.BOLD)
            setShadowLayer(25f, 0f, 0f, Color.parseColor("#8010b981"))
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 16)
        }
        numberTextView = number

        // Counter Badge (Emerald Green Pill)
        val counterBadge = TextView(context).apply {
            text = if (data.queueCounter.isNotBlank()) data.queueCounter else "LOKET 01"
            textSize = 24f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            letterSpacing = 0.08f
            setPadding(48, 14, 48, 14)
            val badgeBg = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                cornerRadius = 9999f
                setColor(Color.parseColor("#059669"))
            }
            background = badgeBg
            gravity = Gravity.CENTER
        }
        counterTextView = counterBadge

        // Footer Marquee
        val footerMarquee = TextView(context).apply {
            text = "PENGUMUMAN: Silakan menuju ${if (data.queueCounter.isNotBlank()) data.queueCounter else "LOKET 01"} saat nomor ${if (data.queueNumber.isNotBlank()) data.queueNumber else "A-001"} dipanggil."
            textSize = 12f
            setTextColor(Color.parseColor("#6ee7b7"))
            setTypeface(null, Typeface.BOLD)
            val footerBg = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                cornerRadius = 8f * context.resources.displayMetrics.density
                setColor(Color.parseColor("#152438"))
                setStroke(
                    (1 * context.resources.displayMetrics.density).toInt(),
                    Color.parseColor("#1e3a5f")
                )
            }
            background = footerBg
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
