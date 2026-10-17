package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import coil.load
import java.io.File

class ImageZoneRenderer(
    private val context: Context
) {
    fun createView(parent: ViewGroup, imageFile: File): ImageView {
        return ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.FIT_CENTER
            load(imageFile) {
                crossfade(300)
            }
        }
    }
}
