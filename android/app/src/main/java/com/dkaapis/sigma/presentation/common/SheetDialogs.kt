package com.dkaapis.sigma.presentation.common

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

/**
 * BottomSheet transparan, selalu expanded, dan berukuran ramah TV/landscape.
 * [heightFraction] null = tinggi mengikuti konten.
 */
fun createExpandedSheet(
    context: Context,
    layoutRes: Int,
    landscapeMaxDp: Int,
    portraitMaxDp: Int? = null,
    heightFraction: Pair<Float, Float>? = null
): BottomSheetDialog = BottomSheetDialog(context).apply {
    setContentView(layoutRes)
    window?.setBackgroundDrawableResource(android.R.color.transparent)
    window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
    behavior.state = BottomSheetBehavior.STATE_EXPANDED
    behavior.skipCollapsed = true
    setOnShowListener {
        val sheet = findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet) ?: return@setOnShowListener
        sheet.setBackgroundColor(Color.TRANSPARENT)
        BottomSheetBehavior.from(sheet).apply { state = BottomSheetBehavior.STATE_EXPANDED; skipCollapsed = true }
        val dm = context.resources.displayMetrics
        val landscape = dm.widthPixels > dm.heightPixels
        val lp = sheet.layoutParams
        val maxDp = if (landscape) landscapeMaxDp else portraitMaxDp
        if (maxDp != null) {
            val margin = if (landscape) 48 else 32
            lp.width = minOf(dm.widthPixels - (margin * dm.density).toInt(), (maxDp * dm.density).toInt())
        }
        heightFraction?.let { lp.height = (dm.heightPixels * if (landscape) it.first else it.second).toInt() }
        if (maxDp != null && lp is CoordinatorLayout.LayoutParams) lp.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
        sheet.layoutParams = lp
    }
}
