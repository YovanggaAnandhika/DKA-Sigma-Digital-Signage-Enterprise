package com.dkaapis.sigma.presentation.renderers.queue

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator

/**
 * Pengelola efek visual animasi pemanggilan antrean (Radiant Neon Glass Pulse):
 * Menganimasikan getaran skala lembut (1.0 -> 1.035 -> 1.0) dan pendaran cahaya neon cyan/emas
 * pada kartu kaca nomor antrean tanpa operasi konvolusi berat, menjamin 60 FPS pada RAM 1 GB.
 */
class QueueVisualEffectHelper {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var pulseAnimator: ValueAnimator? = null
    private var isCallingActive = false
    private var callEffectWatchdog: Runnable? = null

    val isEffectActive: Boolean
        get() = isCallingActive

    fun startCallEffect(target: View, highlightView: View? = null, onApplyDisplay: () -> Unit) {
        isCallingActive = true
        onApplyDisplay()

        stopWatchdog()
        val watchdog = Runnable { stopCallEffect(target, highlightView) {} }
        callEffectWatchdog = watchdog
        mainHandler.postDelayed(watchdog, 15000L)

        pulseAnimator?.cancel()

        val pulseTarget = highlightView ?: target
        val bgDrawable = pulseTarget.background as? GradientDrawable

        pulseAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 500
            repeatMode = ValueAnimator.REVERSE
            repeatCount = 5 // 3 full cycles of gentle pulse
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { va ->
                val progress = va.animatedValue as Float
                // Smooth scale pulse 1.0 to 1.035
                val scale = 1.0f + (progress * 0.035f)
                pulseTarget.scaleX = scale
                pulseTarget.scaleY = scale

                // Dynamic cyan specular stroke glow (Radiant Cyan #38BDF8)
                bgDrawable?.let { gd ->
                    val alpha = (80 + (progress * 175)).toInt().coerceIn(0, 255)
                    val strokeWidth = (2 + (progress * 3)).toInt()
                    gd.setStroke(strokeWidth, Color.argb(alpha, 56, 189, 248))
                }
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    resetTarget(pulseTarget, bgDrawable)
                }

                override fun onAnimationCancel(animation: Animator) {
                    resetTarget(pulseTarget, bgDrawable)
                }
            })
            start()
        }
    }

    private fun resetTarget(pulseTarget: View, bgDrawable: GradientDrawable?) {
        pulseTarget.scaleX = 1.0f
        pulseTarget.scaleY = 1.0f
        bgDrawable?.setStroke(2, Color.argb(60, 255, 255, 255))
    }

    fun stopCallEffect(target: View, highlightView: View? = null, onRestoreCounterColor: () -> Unit) {
        stopWatchdog()
        if (!isCallingActive) return
        isCallingActive = false

        onRestoreCounterColor()

        pulseAnimator?.cancel()
        val pulseTarget = highlightView ?: target
        val bgDrawable = pulseTarget.background as? GradientDrawable
        resetTarget(pulseTarget, bgDrawable)
    }

    private fun stopWatchdog() {
        callEffectWatchdog?.let { mainHandler.removeCallbacks(it) }
        callEffectWatchdog = null
    }

    fun release(target: View?, highlightView: View? = null) {
        stopWatchdog()
        pulseAnimator?.cancel()
        val pulseTarget = highlightView ?: target
        pulseTarget?.let {
            val bgDrawable = it.background as? GradientDrawable
            resetTarget(it, bgDrawable)
        }
    }
}
