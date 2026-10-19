package com.dkaapis.sigma.presentation.renderers.queue

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator

/**
 * Pengelola efek visual animasi pemanggilan antrean:
 * Mengendalikan efek inversi warna (140 ms inverting, 180 ms returning)
 * via Hardware Layer ColorMatrix dan safety watchdog.
 */
class QueueVisualEffectHelper {

    private val mainHandler = Handler(Looper.getMainLooper())
    private val invertPaint = Paint()
    private var invertAnimator: ValueAnimator? = null
    private var currentInvertProgress = 0f
    private var isCallingActive = false
    private var callEffectWatchdog: Runnable? = null

    val isEffectActive: Boolean
        get() = isCallingActive

    fun startCallEffect(target: View, onApplyDisplay: () -> Unit) {
        isCallingActive = true
        onApplyDisplay()

        stopWatchdog()
        val watchdog = Runnable { stopCallEffect(target) {} }
        callEffectWatchdog = watchdog
        mainHandler.postDelayed(watchdog, 15000L)

        invertAnimator?.cancel()

        if (currentInvertProgress > 0.8f) {
            invertAnimator = ValueAnimator.ofFloat(1.0f, 0.0f, 1.0f).apply {
                duration = 120
                interpolator = AccelerateDecelerateInterpolator()
                addUpdateListener { va ->
                    applyColorInversion(target, va.animatedValue as Float)
                }
                start()
            }
        } else {
            invertAnimator = ValueAnimator.ofFloat(currentInvertProgress, 1.0f).apply {
                duration = 140
                interpolator = DecelerateInterpolator()
                addUpdateListener { va ->
                    applyColorInversion(target, va.animatedValue as Float)
                }
                start()
            }
        }
    }

    fun stopCallEffect(target: View, onRestoreCounterColor: () -> Unit) {
        stopWatchdog()
        if (!isCallingActive && currentInvertProgress <= 0.001f) return
        isCallingActive = false

        onRestoreCounterColor()

        invertAnimator?.cancel()
        invertAnimator = ValueAnimator.ofFloat(currentInvertProgress, 0.0f).apply {
            duration = 180
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { va ->
                applyColorInversion(target, va.animatedValue as Float)
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    applyColorInversion(target, 0.0f)
                }
                override fun onAnimationCancel(animation: Animator) {
                    applyColorInversion(target, 0.0f)
                }
            })
            start()
        }
    }

    private fun applyColorInversion(target: View, t: Float) {
        currentInvertProgress = t
        if (t <= 0.001f) {
            target.setLayerType(View.LAYER_TYPE_NONE, null)
            target.invalidate()
            return
        }

        val scale = 1.0f - 2.0f * t
        val offset = 255.0f * t
        val matrix = ColorMatrix(floatArrayOf(
            scale, 0f, 0f, 0f, offset,
            0f, scale, 0f, 0f, offset,
            0f, 0f, scale, 0f, offset,
            0f, 0f, 0f, 1f, 0f
        ))
        invertPaint.colorFilter = ColorMatrixColorFilter(matrix)
        target.setLayerType(View.LAYER_TYPE_HARDWARE, invertPaint)
        target.invalidate()
    }

    private fun stopWatchdog() {
        callEffectWatchdog?.let { mainHandler.removeCallbacks(it) }
        callEffectWatchdog = null
    }

    fun release(target: View?) {
        stopWatchdog()
        invertAnimator?.cancel()
        target?.let { applyColorInversion(it, 0f) }
    }
}
