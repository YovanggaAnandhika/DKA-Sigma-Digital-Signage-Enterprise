package com.dkasigma.player.presentation.overlay

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView

class EmergencyBannerOverlay(
    private val context: Context
) {
    fun createView(parent: ViewGroup, alertMessage: String): View {
        return TextView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.TOP
            }
            setBackgroundColor(Color.parseColor("#e11d48"))
            setTextColor(Color.WHITE)
            textSize = 28f
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(32, 24, 32, 24)
            text = "⚠️ PERINGATAN DARURAT: $alertMessage"
            elevation = 9999f
        }
    }
}
