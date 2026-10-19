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
                child.setTextSize(TypedValue.COMPLEX_UNIT_PX, fontPx)
                child.includeFontPadding = false
            }

            val widthSpec = MeasureSpec.makeMeasureSpec(childW, MeasureSpec.EXACTLY)
            val heightSpec = if (child is TextView && meta.itemType != "marquee") {
                child.measure(widthSpec, MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
                val paddingBuffer = (4 * context.resources.displayMetrics.density).toInt()
                val neededH = maxOf(childH, child.measuredHeight + paddingBuffer)
                MeasureSpec.makeMeasureSpec(neededH, MeasureSpec.EXACTLY)
            } else {
                MeasureSpec.makeMeasureSpec(childH, MeasureSpec.EXACTLY)
            }

            child.measure(widthSpec, heightSpec)
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
            val childH = if (child is TextView && meta.itemType != "marquee") {
                maxOf((meta.height * scaleY).toInt(), child.measuredHeight)
            } else {
                (meta.height * scaleY).toInt().coerceAtLeast(1)
            }

            child.layout(childX, childY, childX + childW, childY + childH)
        }
    }
}
