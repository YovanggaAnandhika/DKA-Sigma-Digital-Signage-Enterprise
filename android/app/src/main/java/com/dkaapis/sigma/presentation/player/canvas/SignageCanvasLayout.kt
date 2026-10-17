package com.dkasigma.player.presentation.player.canvas

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import kotlin.math.min

class SignageCanvasLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : ViewGroup(context, attrs, defStyleAttr) {

    var virtualWidth: Int = 1920
        set(value) {
            field = if (value > 0) value else 1920
            requestLayout()
        }

    var virtualHeight: Int = 1080
        set(value) {
            field = if (value > 0) value else 1080
            requestLayout()
        }

    private var scaleFactor: Float = 1.0f
    private var offsetX: Int = 0
    private var offsetY: Int = 0

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val availableWidth = MeasureSpec.getSize(widthMeasureSpec)
        val availableHeight = MeasureSpec.getSize(heightMeasureSpec)

        val scaleX = availableWidth.toFloat() / virtualWidth
        val scaleY = availableHeight.toFloat() / virtualHeight
        scaleFactor = min(scaleX, scaleY)

        val canvasW = (virtualWidth * scaleFactor).toInt()
        val canvasH = (virtualHeight * scaleFactor).toInt()

        offsetX = (availableWidth - canvasW) / 2
        offsetY = (availableHeight - canvasH) / 2

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            if (child.visibility != GONE && child is ZoneContainerView) {
                val childW = (child.zoneWidth * scaleFactor).toInt()
                val childH = (child.zoneHeight * scaleFactor).toInt()
                child.measure(
                    MeasureSpec.makeMeasureSpec(childW, MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(childH, MeasureSpec.EXACTLY)
                )
            }
        }

        setMeasuredDimension(availableWidth, availableHeight)
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            if (child.visibility != GONE && child is ZoneContainerView) {
                val left = offsetX + (child.zoneX * scaleFactor).toInt()
                val top = offsetY + (child.zoneY * scaleFactor).toInt()
                val right = left + child.measuredWidth
                val bottom = top + child.measuredHeight
                child.layout(left, top, right, bottom)
            }
        }
    }
}
