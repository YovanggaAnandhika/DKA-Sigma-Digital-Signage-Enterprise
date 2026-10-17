package com.dkasigma.player.presentation.player.canvas

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.widget.FrameLayout
import com.dkasigma.player.domain.model.LayerZone

class ZoneContainerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    var zoneX: Int = 0
    var zoneY: Int = 0
    var zoneWidth: Int = 400
    var zoneHeight: Int = 300

    fun bindZone(zone: LayerZone) {
        this.zoneX = zone.x
        this.zoneY = zone.y
        this.zoneWidth = zone.width
        this.zoneHeight = zone.height
        this.elevation = zone.zIndex.toFloat()

        if (!zone.backgroundColor.isNullOrBlank() && zone.backgroundColor != "transparent") {
            try {
                setBackgroundColor(Color.parseColor(zone.backgroundColor))
            } catch (_: Exception) {}
        } else {
            setBackgroundColor(Color.TRANSPARENT)
        }
    }
}
