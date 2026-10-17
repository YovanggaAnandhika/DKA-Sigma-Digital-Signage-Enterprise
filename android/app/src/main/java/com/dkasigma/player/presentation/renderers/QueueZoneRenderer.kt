package com.dkasigma.player.presentation.renderers

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
import com.dkasigma.player.domain.model.QueueDisplayData

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
        val root = LinearLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#f8fafc"))
            setPadding(32, 32, 32, 32)
        }

        val title = TextView(context).apply {
            text = data.queueName
            textSize = 24f
            setTextColor(Color.parseColor("#0284c7"))
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }

        val number = TextView(context).apply {
            text = data.queueNumber
            textSize = 80f
            setTextColor(Color.parseColor("#0f172a"))
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        numberTextView = number

        val counterBadge = TextView(context).apply {
            text = data.queueCounter
            textSize = 28f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            setPadding(32, 12, 32, 12)
            setBackgroundColor(Color.parseColor("#f59e0b"))
            gravity = Gravity.CENTER
        }
        counterTextView = counterBadge

        root.addView(title)
        root.addView(number)
        root.addView(counterBadge)

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
