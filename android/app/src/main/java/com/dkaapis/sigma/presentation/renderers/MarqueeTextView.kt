package com.dkaapis.sigma.presentation.renderers

import android.animation.ValueAnimator
import android.content.Context
import android.util.AttributeSet
import android.view.animation.LinearInterpolator
import android.widget.TextView

class MarqueeTextView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : TextView(context, attrs, defStyleAttr) {

    private var animator: ValueAnimator? = null
    var speedPixelsPerSec: Float = 100f
    var cycleDurationMs: Long? = null

    init {
        maxLines = 1
        setSingleLine(true)
        ellipsize = null
        setHorizontallyScrolling(true)
    }

    fun startMarquee() {
        animator?.cancel()
        val textStr = text?.toString() ?: ""
        if (textStr.isBlank()) return

        val textWidth = paint.measureText(textStr)
        val viewWidth = width.toFloat().takeIf { it > 0 } ?: return

        // Sweep from right edge all the way to left edge, exactly like Web Studio CSS @keyframes marquee-scroll
        val startX = -viewWidth
        val endX = textWidth
        val distance = endX - startX

        val durationMs = cycleDurationMs ?: ((distance / speedPixelsPerSec) * 1000).toLong().coerceAtLeast(1000)

        animator = ValueAnimator.ofFloat(startX, endX).apply {
            duration = durationMs
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
            interpolator = LinearInterpolator()
            addUpdateListener { va ->
                val currX = (va.animatedValue as Float).toInt()
                scrollTo(currX, 0)
            }
            start()
        }
    }

    override fun setText(text: CharSequence?, type: BufferType?) {
        super.setText(text, type)
        if (width > 0) {
            post { startMarquee() }
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w > 0) {
            post { startMarquee() }
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        post { startMarquee() }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        animator?.cancel()
        animator = null
    }
}
