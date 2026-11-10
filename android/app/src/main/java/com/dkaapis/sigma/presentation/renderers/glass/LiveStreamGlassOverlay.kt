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
import android.view.ViewOutlineProvider
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
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

    // Centered modal card container (Offline / Standby)
    private val centerModalCard: LinearLayout
    private val centerIconContainer: FrameLayout
    private val centerStatusPill: TextView
    private val centerSubText: TextView
    private val centerProgressBar: ProgressBar

    // Floating modern transparent glass buffering pill (No bulky card!)
    private val glassBufferingPill: LinearLayout
    private val bufferingSpinner: ProgressBar
    private val bufferingLabel: TextView

    // Top-left live badge pill
    private val liveBadgePill: LinearLayout
    private val liveDotView: View
    private val liveBadgeText: TextView

    init {
        layoutParams = LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        isClickable = false
        isFocusable = false

        val density = context.resources.displayMetrics.density

        // --- Centered Modal Glass Card (For Offline / Standby only - Pure Transparent Crystal Sheet) ---
        centerModalCard = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GlassDrawableFactory.createMacOsTahoeGlassCard(20 * density, density)
            elevation = 8 * density
            outlineProvider = ViewOutlineProvider.BACKGROUND
            val padH = (22 * density).toInt()
            val padV = (16 * density).toInt()
            setPadding(padH, padV, padH, padV)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER
            }
            visibility = View.GONE
        }

        // Circular Icon Badge Container
        centerIconContainer = FrameLayout(context).apply {
            val size = (44 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                bottomMargin = (10 * density).toInt()
            }
            background = GlassDrawableFactory.createStatusPillDrawable(0x22EF4444.toInt(), 0x55EF4444.toInt(), size.toFloat())
        }

        // Central indeterminate spinner (for offline card if needed)
        centerProgressBar = ProgressBar(context).apply {
            layoutParams = LinearLayout.LayoutParams((32 * density).toInt(), (32 * density).toInt()).apply {
                bottomMargin = (10 * density).toInt()
            }
            indeterminateDrawable?.setTint(0xFF38BDF8.toInt())
            visibility = View.GONE
        }

        // Status Pill (e.g. "SIARAN OFFLINE" / "SIAGA")
        centerStatusPill = TextView(context).apply {
            setTextColor(0xFFFF4D4D.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.5f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.05f
            gravity = Gravity.CENTER
            setShadowLayer(4f, 0f, 1f, 0xB0000000.toInt())
            val pillPadH = (12 * density).toInt()
            val pillPadV = (4 * density).toInt()
            setPadding(pillPadH, pillPadV, pillPadH, pillPadV)
            background = GlassDrawableFactory.createStatusPillDrawable(0x35EF4444.toInt(), 0x80EF4444.toInt(), 999f)
            layoutParams = LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = (8 * density).toInt()
            }
        }

        // Subtitle / Description Text (Crisp white with ambient shadow on transparent glass)
        centerSubText = TextView(context).apply {
            setTextColor(0xFFF1F5F9.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            gravity = Gravity.CENTER
            maxLines = 2
            setShadowLayer(6f, 0f, 1.5f, 0xCC000000.toInt())
            layoutParams = LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        }

        centerModalCard.addView(centerProgressBar)
        centerModalCard.addView(centerStatusPill)
        centerModalCard.addView(centerSubText)
        addView(centerModalCard)

        // --- Floating Modern macOS Tahoe Glass Buffering Pill ---
        glassBufferingPill = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = GlassDrawableFactory.createMacOsTahoeGlassPill(density, 0xFF38BDF8.toInt())
            elevation = 6 * density
            outlineProvider = ViewOutlineProvider.BACKGROUND
            val padH = (16 * density).toInt()
            val padV = (8 * density).toInt()
            setPadding(padH, padV, (18 * density).toInt(), padV)
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER
            }
            visibility = View.GONE
        }

        bufferingSpinner = ProgressBar(context).apply {
            val size = (16 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                rightMargin = (8 * density).toInt()
            }
            indeterminateDrawable?.setTint(0xFF38BDF8.toInt())
        }

        bufferingLabel = TextView(context).apply {
            text = "Memuat Siaran..."
            setTextColor(0xFFF8FAFC.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.02f
            gravity = Gravity.CENTER_VERTICAL
            setShadowLayer(4f, 0f, 1f, 0xCC000000.toInt())
        }

        glassBufferingPill.addView(bufferingSpinner)
        glassBufferingPill.addView(bufferingLabel)
        addView(glassBufferingPill)

        // --- Top-Left Live Badge Pill (macOS Tahoe Liquid Glass) ---
        liveBadgePill = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = GlassDrawableFactory.createMacOsTahoeGlassPill(density, 0xFF10B981.toInt())
            elevation = 6 * density
            outlineProvider = ViewOutlineProvider.BACKGROUND
            val pillPadH = (12 * density).toInt()
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
            text = "SIARAN LANGSUNG"
            setTextColor(0xFFECFDF5.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.04f
            setShadowLayer(4f, 0f, 1f, 0xCC000000.toInt())
        }

        liveBadgePill.addView(liveDotView)
        liveBadgePill.addView(liveBadgeText)
        addView(liveBadgePill)
    }

    fun setBuffering(streamName: String = "") {
        mainHandler.post {
            currentState = StreamState.BUFFERING
            liveBadgePill.visibility = View.GONE
            centerModalCard.visibility = View.GONE

            // Sleek macOS Tahoe glass pill without obstructing screen with a card
            bufferingLabel.text = if (streamName.isNotBlank()) "Memuat $streamName..." else "Memuat Siaran..."
            glassBufferingPill.visibility = View.VISIBLE
            glassBufferingPill.alpha = 0f
            glassBufferingPill.scaleX = 0.90f
            glassBufferingPill.scaleY = 0.90f
            glassBufferingPill.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(260)
                .setInterpolator(DecelerateInterpolator(2.0f))
                .start()
        }
    }

    fun setOffline(streamName: String = "", customNote: String = "") {
        mainHandler.post {
            currentState = StreamState.OFFLINE
            liveBadgePill.visibility = View.GONE
            glassBufferingPill.visibility = View.GONE

            centerModalCard.visibility = View.VISIBLE
            centerModalCard.alpha = 0f
            centerModalCard.scaleX = 0.92f
            centerModalCard.scaleY = 0.92f
            centerProgressBar.visibility = View.GONE

            centerStatusPill.text = "SIARAN OFFLINE"
            centerStatusPill.setTextColor(0xFFFF4D4D.toInt())
            centerStatusPill.background = GlassDrawableFactory.createStatusPillDrawable(0x35EF4444.toInt(), 0x80EF4444.toInt(), 999f)

            centerSubText.text = if (customNote.isNotBlank()) customNote else "Menunggu siaran dimulai dari OBS Studio / encoder."

            centerModalCard.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(280)
                .setInterpolator(DecelerateInterpolator(2.0f))
                .start()
        }
    }

    fun setIdle(streamName: String = "") {
        mainHandler.post {
            currentState = StreamState.IDLE
            liveBadgePill.visibility = View.GONE
            glassBufferingPill.visibility = View.GONE

            centerModalCard.visibility = View.VISIBLE
            centerModalCard.alpha = 0f
            centerModalCard.scaleX = 0.92f
            centerModalCard.scaleY = 0.92f
            centerProgressBar.visibility = View.GONE

            centerStatusPill.text = "SIARAN SIAGA"
            centerStatusPill.setTextColor(0xFFFBBF24.toInt())
            centerStatusPill.background = GlassDrawableFactory.createStatusPillDrawable(0x35F59E0B.toInt(), 0x80F59E0B.toInt(), 999f)

            centerSubText.text = "Jadwal tayang siaran belum aktif."

            centerModalCard.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(280)
                .setInterpolator(DecelerateInterpolator(2.0f))
                .start()
        }
    }

    fun setLive(isLowLatency: Boolean = true) {
        mainHandler.post {
            currentState = StreamState.LIVE

            // Smoothly fade out center card & buffering pill with Apple-style exit scale
            if (centerModalCard.visibility == View.VISIBLE) {
                centerModalCard.animate()
                    .alpha(0f)
                    .scaleX(0.94f)
                    .scaleY(0.94f)
                    .setDuration(180)
                    .setInterpolator(AccelerateInterpolator(1.8f))
                    .withEndAction { centerModalCard.visibility = View.GONE }
                    .start()
            }

            if (glassBufferingPill.visibility == View.VISIBLE) {
                glassBufferingPill.animate()
                    .alpha(0f)
                    .scaleX(0.94f)
                    .scaleY(0.94f)
                    .setDuration(180)
                    .setInterpolator(AccelerateInterpolator(1.8f))
                    .withEndAction { glassBufferingPill.visibility = View.GONE }
                    .start()
            }

            // Show live pill with smooth macOS Tahoe entrance
            liveBadgePill.visibility = View.VISIBLE
            liveBadgePill.alpha = 0f
            liveBadgePill.scaleX = 0.90f
            liveBadgePill.scaleY = 0.90f
            liveBadgeText.text = if (isLowLatency) "LIVE • WHEP 0.2s" else "LIVE • RTSP"
            liveBadgePill.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(260)
                .setInterpolator(DecelerateInterpolator(2.0f))
                .start()

            // Smooth pulse breathing on live dot
            ObjectAnimator.ofFloat(liveDotView, "alpha", 1f, 0.35f, 1f).apply {
                duration = 1400
                repeatCount = ObjectAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator()
                start()
            }
        }
    }

    fun hideAll() {
        mainHandler.post {
            currentState = StreamState.NONE
            centerModalCard.visibility = View.GONE
            glassBufferingPill.visibility = View.GONE
            liveBadgePill.visibility = View.GONE
        }
    }
}

