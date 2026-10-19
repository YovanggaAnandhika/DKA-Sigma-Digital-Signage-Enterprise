package com.dkaapis.sigma.presentation.renderers.queue

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import com.dkaapis.sigma.presentation.renderers.queue.model.QueueItemMeta

/**
 * Pembantu render layar status loket khusus (ISTIRAHAT / TUTUP)
 */
class QueueStatusOverlayHelper(
    private val context: Context
) {
    private var statusOverlayView: View? = null

    fun updateStatusScreen(
        canvasView: QueueCanvasView,
        status: String,
        counterName: String,
        counterLabel: String,
        canvasW: Int,
        canvasH: Int,
        numberTextView: View?,
        counterTextView: View?
    ) {
        val isBreak = status.equals("BREAK", ignoreCase = true)
        val isLocked = status.equals("LOCKED", ignoreCase = true)
        val inactive = isBreak || isLocked

        canvasView.isClickable = !inactive
        canvasView.isFocusable = !inactive
        numberTextView?.isClickable = !inactive
        counterTextView?.isClickable = !inactive

        if (!inactive) {
            statusOverlayView?.visibility = View.GONE
            statusOverlayView?.isClickable = false
            statusOverlayView?.isFocusable = false
            return
        }

        val overlay = (statusOverlayView as? LinearLayout) ?: LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            tag = QueueItemMeta(
                id = "status-overlay-dedicated",
                itemType = "status_overlay",
                x = 0,
                y = 0,
                width = canvasW,
                height = canvasH,
                zIndex = 9999,
                backgroundColor = "#00000000",
                textColor = "#ffffff",
                fontSize = 16f,
                fontWeight = "normal",
                textAlign = "center",
                templateContent = ""
            )
            canvasView.addView(this)
            statusOverlayView = this
        }

        overlay.apply {
            visibility = View.VISIBLE
            isClickable = true
            isFocusable = true
            setOnClickListener { /* Serap klik agar tidak tembus */ }
            removeAllViews()
            setBackgroundColor(Color.parseColor(if (isBreak) "#0D111A" else "#0B0E17"))
        }

        val titleText = TextView(context).apply {
            text = if (isBreak) "SEDANG ISTIRAHAT" else "${counterLabel.uppercase()} DITUTUP"
            setTextColor(Color.parseColor(if (isBreak) "#F59E0B" else "#EF4444"))
            textSize = 38f
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
            includeFontPadding = false
        }

        val density = context.resources.displayMetrics.density
        overlay.setPadding((24 * density).toInt(), (28 * density).toInt(), (24 * density).toInt(), (28 * density).toInt())

        val counterBadge = TextView(context).apply {
            text = counterName
            setTextColor(Color.WHITE)
            textSize = 22f
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            setPadding((24 * density).toInt(), (14 * density).toInt(), (24 * density).toInt(), (14 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 14 * density
                setColor(Color.parseColor(if (isBreak) "#D97706" else "#DC2626"))
            }
            gravity = Gravity.CENTER
            maxWidth = (480 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                leftMargin = (44 * density).toInt()
                rightMargin = (44 * density).toInt()
                topMargin = (22 * density).toInt()
                bottomMargin = (20 * density).toInt()
            }
        }

        val descText = TextView(context).apply {
            text = if (isBreak) {
                "Petugas sedang dalam jam istirahat.\nLayanan akan dibuka kembali segera."
            } else {
                "Mohon maaf, layanan antrian pada ${counterLabel.lowercase()} ini sedang ditutup.\nSilakan menuju ${counterLabel.lowercase()} lain yang beroperasi."
            }
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 15f
            gravity = Gravity.CENTER
            setLineSpacing(4f * density, 1f)
            setPadding((16 * density).toInt(), 0, (16 * density).toInt(), 0)
        }

        overlay.addView(titleText)
        overlay.addView(counterBadge)
        overlay.addView(descText)
    }
}
