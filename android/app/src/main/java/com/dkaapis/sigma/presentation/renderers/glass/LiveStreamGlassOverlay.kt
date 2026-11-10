package com.dkaapis.sigma.presentation.renderers.glass

import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/**
 * Overlay Status Glassmorphism Cerdas untuk Live Stream:
 * Menampilkan state BUFFERING, OFFLINE, IDLE, dan LIVE dengan estetika frosted glass modern,
 * konsisten dengan tampilan Web Studio CMS.
 */
class LiveStreamGlassOverlay(context: Context) : FrameLayout(context) {

    enum class StreamState {
        NONE, BUFFERING, OFFLINE, IDLE, LIVE
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var currentState = StreamState.NONE

    // Centered modal card container
    private val centerModalCard: LinearLayout
    private val centerIconContainer: FrameLayout
    private val centerStatusPill: TextView
    private val centerTitleText: TextView
    private val centerSubText: TextView
    private val centerProgressBar: ProgressBar

    // Top-left live badge pill
    private val liveBadgePill: LinearLayout
    private val liveDotView: View
    private val liveBadgeText: TextView

    init {
        layoutParams = LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        isClickable = false
        isFocusable = false

        val density = context.resources.displayMetrics.density

        // --- Centered Modal Glass Card ---
        centerModalCard = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GlassDrawableFactory.createGlassCardDrawable(24 * density)
            val padH = (28 * density).toInt()
            val padV = (24 * density).toInt()
            setPadding(padH, padV, padH, padV)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER
            }
            visibility = View.GONE
        }

        // Circular Icon Badge Container
        centerIconContainer = FrameLayout(context).apply {
            val size = (48 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                bottomMargin = (12 * density).toInt()
            }
            background = GlassDrawableFactory.createStatusPillDrawable(0x22EF4444.toInt(), 0x55EF4444.toInt(), size.toFloat())
        }

        // Central indeterminate spinner
        centerProgressBar = ProgressBar(context).apply {
            layoutParams = LinearLayout.LayoutParams((36 * density).toInt(), (36 * density).toInt()).apply {
                bottomMargin = (14 * density).toInt()
            }
            indeterminateDrawable?.setTint(0xFF38BDF8.toInt())
            visibility = View.GONE
        }

        // Status Pill (e.g. "SIARAN OFFLINE" / "SIAGA")
        centerStatusPill = TextView(context).apply {
            setTextColor(0xFFEF4444.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val pillPadH = (12 * density).toInt()
            val pillPadV = (4 * density).toInt()
            setPadding(pillPadH, pillPadV, pillPadH, pillPadV)
            background = GlassDrawableFactory.createStatusPillDrawable(0x28EF4444.toInt(), 0x55EF4444.toInt(), 999f)
            layoutParams = LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = (8 * density).toInt()
            }
        }

        // Main Title Text
        centerTitleText = TextView(context).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = (4 * density).toInt()
            }
        }

        // Subtitle / Description Text
        centerSubText = TextView(context).apply {
            setTextColor(0xFF94A3B8.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            gravity = Gravity.CENTER
            maxLines = 2
            layoutParams = LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        }

        centerModalCard.addView(centerProgressBar)
        centerModalCard.addView(centerStatusPill)
        centerModalCard.addView(centerTitleText)
        centerModalCard.addView(centerSubText)
        addView(centerModalCard)

        // --- Top-Left Live Badge Pill ---
        liveBadgePill = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = GlassDrawableFactory.createStatusPillDrawable(0xAA0B0F19.toInt(), 0x4410B981.toInt(), 999f)
            val pillPadH = (10 * density).toInt()
            val pillPadV = (5 * density).toInt()
            setPadding(pillPadH, pillPadV, pillPadH, pillPadV)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.TOP or Gravity.START
                leftMargin = (12 * density).toInt()
                topMargin = (12 * density).toInt()
            }
            visibility = View.GONE
        }

        // Glowing Emerald Dot
        liveDotView = View(context).apply {
            val dotSize = (8 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(dotSize, dotSize).apply {
                rightMargin = (6 * density).toInt()
            }
            background = GlassDrawableFactory.createStatusPillDrawable(0xFF10B981.toInt(), 0xFF10B981.toInt(), 999f)
        }

        liveBadgeText = TextView(context).apply {
            text = "LIVE • 0.2s"
            setTextColor(0xFF10B981.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            typeface = Typeface.DEFAULT_BOLD
        }

        liveBadgePill.addView(liveDotView)
        liveBadgePill.addView(liveBadgeText)
        addView(liveBadgePill)
    }

    fun setBuffering(streamName: String = "") {
        mainHandler.post {
            currentState = StreamState.BUFFERING
            liveBadgePill.visibility = View.GONE

            centerModalCard.visibility = View.VISIBLE
            centerModalCard.alpha = 1f
            centerProgressBar.visibility = View.VISIBLE

            centerStatusPill.text = "BUFFERING"
            centerStatusPill.setTextColor(0xFF38BDF8.toInt())
            centerStatusPill.background = GlassDrawableFactory.createStatusPillDrawable(0x280284C7.toInt(), 0x5538BDF8.toInt(), 999f)

            centerTitleText.text = if (streamName.isNotBlank()) streamName else "Memuat Aliran Siaran..."
            centerSubText.text = "Menghubungkan ke jalur ultra-low latency..."
        }
    }

    fun setOffline(streamName: String = "", customNote: String = "") {
        mainHandler.post {
            currentState = StreamState.OFFLINE
            liveBadgePill.visibility = View.GONE

            centerModalCard.visibility = View.VISIBLE
            centerModalCard.alpha = 1f
            centerProgressBar.visibility = View.GONE

            centerStatusPill.text = "SIARAN OFFLINE"
            centerStatusPill.setTextColor(0xFFEF4444.toInt())
            centerStatusPill.background = GlassDrawableFactory.createStatusPillDrawable(0x28EF4444.toInt(), 0x55EF4444.toInt(), 999f)

            centerTitleText.text = if (streamName.isNotBlank()) streamName else "Siaran Langsung Mati"
            centerSubText.text = if (customNote.isNotBlank()) customNote else "Menunggu siaran dimulai dari OBS Studio / encoder."
        }
    }

    fun setIdle(streamName: String = "") {
        mainHandler.post {
            currentState = StreamState.IDLE
            liveBadgePill.visibility = View.GONE

            centerModalCard.visibility = View.VISIBLE
            centerModalCard.alpha = 1f
            centerProgressBar.visibility = View.GONE

            centerStatusPill.text = "SIARAN SIAGA"
            centerStatusPill.setTextColor(0xFFF59E0B.toInt())
            centerStatusPill.background = GlassDrawableFactory.createStatusPillDrawable(0x28F59E0B.toInt(), 0x55F59E0B.toInt(), 999f)

            centerTitleText.text = if (streamName.isNotBlank()) streamName else "Siaran Standby"
            centerSubText.text = "Jadwal tayang siaran belum aktif."
        }
    }

    fun setLive(isLowLatency: Boolean = true) {
        mainHandler.post {
            currentState = StreamState.LIVE

            // Smoothly fade out center card
            if (centerModalCard.visibility == View.VISIBLE) {
                centerModalCard.animate()
                    .alpha(0f)
                    .setDuration(220)
                    .withEndAction { centerModalCard.visibility = View.GONE }
                    .start()
            }

            // Show live pill
            liveBadgePill.visibility = View.VISIBLE
            liveBadgePill.alpha = 0f
            liveBadgeText.text = if (isLowLatency) "LIVE • WHEP 0.2s" else "LIVE • RTSP"
            liveBadgePill.animate().alpha(1f).setDuration(200).start()

            // Pulse live dot animation
            ObjectAnimator.ofFloat(liveDotView, "alpha", 1f, 0.35f, 1f).apply {
                duration = 1200
                repeatCount = ObjectAnimator.INFINITE
                start()
            }
        }
    }

    fun hideAll() {
        mainHandler.post {
            currentState = StreamState.NONE
            centerModalCard.visibility = View.GONE
            liveBadgePill.visibility = View.GONE
        }
    }
}

