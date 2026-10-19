package com.dkaapis.sigma.presentation.player.gesture

import android.content.Context
import android.view.MotionEvent
import kotlin.math.abs

/**
 * Detektor gesture swipe ke bawah dengan dua jari (two-finger swipe down).
 * Digunakan untuk membuka modal pengaturan rahasia/teknis pada player signage.
 */
class TwoFingerSwipeDetector(
    private val context: Context,
    private val onSwipeDownTriggered: () -> Unit
) {
    private var startY0 = 0f
    private var startY1 = 0f
    private var startX0 = 0f
    private var startX1 = 0f
    private var isTracking = false
    private var gestureFired = false

    private val minDistance: Float = 90f * context.resources.displayMetrics.density

    fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_POINTER_DOWN -> {
                if (event.pointerCount == 2) {
                    startY0 = event.getY(0)
                    startY1 = event.getY(1)
                    startX0 = event.getX(0)
                    startX1 = event.getX(1)
                    isTracking = true
                    gestureFired = false
                }
            }
            MotionEvent.ACTION_MOVE -> {
                if (event.pointerCount >= 2) {
                    if (!isTracking) {
                        startY0 = event.getY(0)
                        startY1 = event.getY(1)
                        startX0 = event.getX(0)
                        startX1 = event.getX(1)
                        isTracking = true
                        gestureFired = false
                    } else if (!gestureFired) {
                        val dy0 = event.getY(0) - startY0
                        val dy1 = event.getY(1) - startY1
                        val dx0 = abs(event.getX(0) - startX0)
                        val dx1 = abs(event.getX(1) - startX1)

                        // Kedua jari bergerak ke bawah melebihi threshold dan lebih vertikal daripada horizontal
                        if (dy0 > minDistance && dy1 > minDistance && dy0 > dx0 && dy1 > dx1) {
                            gestureFired = true
                            onSwipeDownTriggered()
                        }
                    }
                } else {
                    isTracking = false
                }
            }
            MotionEvent.ACTION_POINTER_UP -> {
                if (event.pointerCount <= 2) isTracking = false
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                isTracking = false
                gestureFired = false
            }
        }
        return false
    }
}
