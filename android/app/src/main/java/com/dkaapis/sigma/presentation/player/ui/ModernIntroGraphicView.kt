package com.dkaapis.sigma.presentation.player.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.view.View
import android.view.animation.LinearInterpolator
import kotlin.math.cos
import kotlin.math.sin

/**
 * Modern Fullscreen Intro / Standby Ambient Canvas:
 * Menghasilkan visualisasi dramatis, eksklusif, dan ultra-smooth untuk launching app / standby screen.
 * - Multi-layer pulsating aurora nebula (Sky & Indigo)
 * - Dynamic orbiting planetary radar arcs dengan counter-rotation
 * - Futuristic floating core aperture dengan specular refraction
 */
class ModernIntroGraphicView(context: Context) : View(context) {

    private val density = context.resources.displayMetrics.density
    private var rotationAngle = 0f
    private var pulseFraction = 0f
    private var animator: ValueAnimator? = null

    private val auroraPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private val corePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val rectF = RectF()

    init {
        startAnimation()
    }

    private fun startAnimation() {
        animator?.cancel()
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 5000L
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
            addUpdateListener { va ->
                val fraction = va.animatedValue as Float
                rotationAngle = fraction * 360f
                pulseFraction = fraction
                invalidate()
            }
            start()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (animator?.isStarted != true) startAnimation()
    }

    override fun onDetachedFromWindow() {
        animator?.cancel()
        super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val cy = height / 2f
        val maxDim = kotlin.math.max(width, height).toFloat()
        val baseR = (minOf(cx, cy) * 0.95f).coerceAtLeast(60f * density)

        val pulse1 = 0.92f + 0.08f * sin(pulseFraction * Math.PI * 2).toFloat()
        val pulse2 = 0.88f + 0.12f * cos(pulseFraction * Math.PI * 2).toFloat()

        // 1. Ambient Fullscreen Breathing Aurora Glow
        auroraPaint.shader = RadialGradient(
            cx, cy, maxDim * 0.65f * pulse1,
            intArrayOf(
                Color.argb(45, 56, 189, 248),   // Sky 400
                Color.argb(22, 99, 102, 241),   // Indigo 500
                Color.argb(10, 168, 85, 247),   // Purple
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 0.40f, 0.75f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx, cy, maxDim * 0.65f * pulse1, auroraPaint)
        auroraPaint.shader = null

        // 2. Outer Ambient Atmosphere Ring
        ringPaint.strokeWidth = 1.5f * density
        ringPaint.color = Color.argb(40, 56, 189, 248)
        canvas.drawCircle(cx, cy, baseR * 1.05f * pulse1, ringPaint)

        // 3. Middle Dynamic Radar Orbit Arc (Rotating Clockwise)
        ringPaint.strokeWidth = 2.4f * density
        ringPaint.color = Color.argb(130, 56, 189, 248)
        val midR = baseR * 0.72f
        rectF.set(cx - midR, cy - midR, cx + midR, cy + midR)
        canvas.save()
        canvas.rotate(rotationAngle, cx, cy)
        canvas.drawArc(rectF, 0f, 75f, false, ringPaint)
        canvas.drawArc(rectF, 120f, 60f, false, ringPaint)
        canvas.drawArc(rectF, 220f, 85f, false, ringPaint)

        // Satellite Glow Dot on outer orbit
        val dotRad = Math.toRadians(rotationAngle.toDouble())
        val dotX = cx + midR * cos(dotRad).toFloat()
        val dotY = cy + midR * sin(dotRad).toFloat()
        dotPaint.color = Color.parseColor("#38BDF8")
        canvas.drawCircle(dotX, dotY, 4.5f * density, dotPaint)
        dotPaint.color = Color.WHITE
        canvas.drawCircle(dotX, dotY, 2.2f * density, dotPaint)
        canvas.restore()

        // 4. Inner Planetary Orbit Arc (Counter-rotating)
        ringPaint.strokeWidth = 2f * density
        ringPaint.color = Color.argb(110, 129, 140, 248)
        val inR = baseR * 0.46f
        rectF.set(cx - inR, cy - inR, cx + inR, cy + inR)
        canvas.save()
        canvas.rotate(-rotationAngle * 1.6f, cx, cy)
        canvas.drawArc(rectF, 20f, 95f, false, ringPaint)
        canvas.drawArc(rectF, 160f, 110f, false, ringPaint)

        // Inner satellite beacon
        val inDotRad = Math.toRadians((-rotationAngle * 1.6f + 20f).toDouble())
        val inDotX = cx + inR * cos(inDotRad).toFloat()
        val inDotY = cy + inR * sin(inDotRad).toFloat()
        dotPaint.color = Color.parseColor("#818CF8")
        canvas.drawCircle(inDotX, inDotY, 3.5f * density, dotPaint)
        canvas.restore()

        // 5. Central Specular Core Orb (Luminous Glass Crystal Sphere)
        corePaint.shader = RadialGradient(
            cx - 4 * density, cy - 4 * density, baseR * 0.25f,
            intArrayOf(
                Color.WHITE,                  // Glint
                Color.parseColor("#38BDF8"),  // Electric Sky Blue
                Color.parseColor("#0369A1"),  // Deep Azure Ocean
                Color.parseColor("#0F172A")   // Ground depth
            ),
            floatArrayOf(0f, 0.45f, 0.85f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx, cy, baseR * 0.24f * pulse2, corePaint)
        corePaint.shader = null

        // Specular Rim Light
        ringPaint.strokeWidth = 1.6f * density
        ringPaint.color = Color.argb(220, 255, 255, 255)
        canvas.drawCircle(cx, cy, baseR * 0.24f * pulse2, ringPaint)
    }
}
