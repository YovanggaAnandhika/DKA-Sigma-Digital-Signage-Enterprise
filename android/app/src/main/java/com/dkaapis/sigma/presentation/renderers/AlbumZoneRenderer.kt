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
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import coil.load
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.dkaapis.sigma.presentation.renderers.model.AlbumSlidePayload

class AlbumZoneRenderer(
    private val context: Context
) {
    private val handler = Handler(Looper.getMainLooper())
    private val advanceSlide = Runnable {
        if (!paused && !released && slides.size > 1) {
            currentIndex = (currentIndex + 1) % slides.size
            showCurrentSlide()
            scheduleNextSlide()
        }
    }

    private var slides: List<AlbumSlidePayload> = emptyList()
    private var currentIndex = 0
    private var paused = false
    private var released = false
    private var transitionEffect = "fade"
    private lateinit var imageView: ImageView
    private lateinit var badgeView: TextView
    private lateinit var titleView: TextView
    private lateinit var priceView: TextView

    fun createView(parent: ViewGroup, slides: List<AlbumSlidePayload>, transitionEffect: String): View {
        this.slides = slides
        this.transitionEffect = transitionEffect.lowercase()
        val scale = (parent as? ZoneContainerView)?.scaleFactorX ?: 1f
        val frame = FrameLayout(context)

        imageView = ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.CENTER_CROP
        }
        frame.addView(imageView)

        badgeView = TextView(context).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 14f * scale)
            typeface = Typeface.DEFAULT_BOLD
            setPadding((10f * scale).toInt(), (5f * scale).toInt(), (10f * scale).toInt(), (5f * scale).toInt())
            background = GradientDrawable().apply {
                setColor(0xCC111111.toInt())
                cornerRadius = 6f * scale
            }
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.TOP or Gravity.START
            ).apply {
                setMargins((16f * scale).toInt(), (16f * scale).toInt(), (16f * scale).toInt(), 0)
            }
        }
        frame.addView(badgeView)

        val caption = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((18f * scale).toInt(), (12f * scale).toInt(), (18f * scale).toInt(), (12f * scale).toInt())
            background = GradientDrawable().apply {
                setColor(0xCC111111.toInt())
                cornerRadius = 8f * scale
            }
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            ).apply {
                setMargins((16f * scale).toInt(), 0, (16f * scale).toInt(), (16f * scale).toInt())
            }
        }
        titleView = TextView(context).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 20f * scale)
            typeface = Typeface.DEFAULT_BOLD
        }
        priceView = TextView(context).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_PX, 16f * scale)
        }
        caption.addView(titleView)
        caption.addView(priceView)
        frame.addView(caption)

        showCurrentSlide()
        scheduleNextSlide()
        return frame
    }

    fun pause() {
        paused = true
        handler.removeCallbacks(advanceSlide)
    }

    fun resume() {
        if (!paused || released) return
        paused = false
        scheduleNextSlide()
    }

    fun release() {
        released = true
        handler.removeCallbacks(advanceSlide)
    }

    private fun showCurrentSlide() {
        val slide = slides.getOrNull(currentIndex) ?: return
        imageView.load(slide.file) {
            listener(onSuccess = { _, _ -> animateSlide() })
        }
        badgeView.text = slide.promoBadge
        badgeView.visibility = if (slide.promoBadge.isBlank()) View.GONE else View.VISIBLE
        titleView.text = slide.title
        titleView.visibility = if (slide.title.isBlank()) View.GONE else View.VISIBLE
        priceView.text = slide.priceTag
        priceView.visibility = if (slide.priceTag.isBlank()) View.GONE else View.VISIBLE
    }

    private fun animateSlide() {
        imageView.animate().cancel()
        imageView.alpha = 1f
        imageView.translationX = 0f
        imageView.scaleX = 1f
        imageView.scaleY = 1f

        when (transitionEffect) {
            "ken-burns" -> imageView.animate()
                .scaleX(1.12f)
                .scaleY(1.12f)
                .setDuration(slides[currentIndex].durationSeconds * 1000L)
                .start()
            "slide" -> {
                imageView.translationX = imageView.width.toFloat()
                imageView.animate().translationX(0f).setDuration(350).start()
            }
            "zoom" -> {
                imageView.scaleX = 1.2f
                imageView.scaleY = 1.2f
                imageView.animate().scaleX(1f).scaleY(1f).setDuration(350).start()
            }
            else -> {
                imageView.alpha = 0f
                imageView.animate().alpha(1f).setDuration(350).start()
            }
        }
    }

    private fun scheduleNextSlide() {
        handler.removeCallbacks(advanceSlide)
        val slide = slides.getOrNull(currentIndex) ?: return
        if (!paused && !released && slides.size > 1) {
            handler.postDelayed(advanceSlide, slide.durationSeconds * 1000L)
        }
    }
}
