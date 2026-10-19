package com.dkaapis.sigma.presentation.player.canvas

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.widget.FrameLayout
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.presentation.util.ColorParser

class ZoneContainerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val overlayView = View(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        visibility = GONE
    }

    init {
        clipChildren = true
        clipToPadding = true
        clipToOutline = true
    }

    var zoneX: Int = 0
    var zoneY: Int = 0
    var zoneWidth: Int = 400
    var zoneHeight: Int = 300
    var scaleFactorX: Float = 1.0f
    var scaleFactorY: Float = 1.0f

    fun bindZone(zone: LayerZone) {
        this.zoneX = zone.x
        this.zoneY = zone.y
        this.zoneWidth = zone.width
        this.zoneHeight = zone.height
        this.elevation = zone.zIndex.toFloat()

        // Alpha / Opacity (0.0 - 1.0)
        this.alpha = zone.opacity.coerceIn(0.0f, 1.0f)

        // Background & Border styling
        val bgDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(ColorParser.parseColor(zone.backgroundColor))

            if (zone.borderRadius > 0) cornerRadius = zone.borderRadius * scaleFactorX

            if (zone.borderWidth > 0 && !zone.borderColor.isNullOrBlank() && !zone.borderColor.equals("transparent", ignoreCase = true)) {
                setStroke((zone.borderWidth * scaleFactorX).toInt().coerceAtLeast(1), ColorParser.parseColor(zone.borderColor))
            }
        }
        background = bgDrawable

        // Overlay Scrim
        if (zone.overlayOpacity > 0.0f && !zone.overlayColor.isNullOrBlank() && !zone.overlayColor.equals("transparent", ignoreCase = true)) {
            overlayView.setBackgroundColor(ColorParser.parseColor(zone.overlayColor))
            overlayView.alpha = zone.overlayOpacity.coerceIn(0.0f, 1.0f)
            overlayView.visibility = VISIBLE
            ensureOverlayOnTop()
        } else {
            overlayView.visibility = GONE
        }
    }

    override fun onViewAdded(child: View?) {
        super.onViewAdded(child)
        if (child != overlayView) {
            ensureOverlayOnTop()
        }
    }

    private fun ensureOverlayOnTop() {
        if (overlayView.parent != this) {
            addView(overlayView)
        }
        overlayView.bringToFront()
    }
}
