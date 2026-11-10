package com.dkaapis.sigma.presentation.renderers.queue

import android.content.Context
import android.util.TypedValue
import android.view.ViewGroup
import android.widget.TextView
import com.dkaapis.sigma.presentation.renderers.queue.model.QueueItemMeta

/**
 * Custom ViewGroup untuk merender canvas antrean dengan skala font proporsional
 * mirip CSS container queries (100cqw).
 */
class QueueCanvasView(
    context: Context,
    private val canvasWidth: Int = 1920,
    private val canvasHeight: Int = 1080
) : ViewGroup(context) {

    init {
        clipChildren = false
        clipToPadding = false
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val height = MeasureSpec.getSize(heightMeasureSpec)
        setMeasuredDimension(width, height)

        if (width <= 0 || height <= 0) return

        val scaleX = width.toFloat() / canvasWidth.toFloat()
        val scaleY = height.toFloat() / canvasHeight.toFloat()

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val meta = child.tag as? QueueItemMeta ?: continue
            val childW = (meta.width * scaleX).toInt().coerceAtLeast(1)
            val childH = (meta.height * scaleY).toInt().coerceAtLeast(1)

            if (child is TextView) {
                val fontPx = meta.fontSize * scaleX
                // Anti-layout thrashing: Only update text size if changed to prevent recursive measurement passes
                if (kotlin.math.abs(child.textSize - fontPx) > 0.5f) {
                    child.setTextSize(TypedValue.COMPLEX_UNIT_PX, fontPx)
                }
                child.includeFontPadding = false
            }

            val widthSpec = MeasureSpec.makeMeasureSpec(childW, MeasureSpec.EXACTLY)
            child.measure(widthSpec, MeasureSpec.makeMeasureSpec(childH, MeasureSpec.EXACTLY))
        }
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        val width = r - l
        val height = b - t
        if (width <= 0 || height <= 0) return

        val scaleX = width.toFloat() / canvasWidth.toFloat()
        val scaleY = height.toFloat() / canvasHeight.toFloat()

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val meta = child.tag as? QueueItemMeta ?: continue

            val childX = (meta.x * scaleX).toInt()
            val childY = (meta.y * scaleY).toInt()
            val childW = (meta.width * scaleX).toInt().coerceAtLeast(1)
            val childH = (meta.height * scaleY).toInt().coerceAtLeast(1)

            child.layout(childX, childY, childX + childW, childY + childH)
        }
    }
}
