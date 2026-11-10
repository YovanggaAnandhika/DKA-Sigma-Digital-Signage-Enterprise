package com.dkaapis.sigma.presentation.player.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.view.View
import android.view.animation.LinearInterpolator
import kotlin.math.cos
import kotlin.math.sin

/**
 * Spektakuler Modern Mesh Aurora & Particle Field:
 * Animasi dinamis 3-blob organic plasma mesh (Electric Sky, Cyber Indigo, Radiant Emerald)
 * yang melayang halus dan berfusi lembut di seluruh layar, dilengkapi floating stardust light particles.
 * Hardware-accelerated, zero-allocation di onDraw.
 */
class SpektakulerAuroraBackgroundView(context: Context) : View(context) {

    private val density = context.resources.displayMetrics.density
    private var timeSec = 0f
    private var animator: ValueAnimator? = null

    private val blobPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val starPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    // Static particles pre-allocated (X-norm, Y-norm, radius, speed, phase)
    private val particles = arrayOf(
        floatArrayOf(0.18f, 0.25f, 2.5f, 0.4f, 0.2f),
        floatArrayOf(0.82f, 0.30f, 3.2f, 0.6f, 1.1f),
        floatArrayOf(0.35f, 0.75f, 2.0f, 0.5f, 2.3f),
        floatArrayOf(0.70f, 0.80f, 2.8f, 0.3f, 3.4f),
        floatArrayOf(0.15f, 0.85f, 3.0f, 0.7f, 4.2f),
        floatArrayOf(0.88f, 0.65f, 2.2f, 0.5f, 0.8f),
        floatArrayOf(0.50f, 0.15f, 3.5f, 0.4f, 5.0f),
        floatArrayOf(0.28f, 0.40f, 1.8f, 0.6f, 3.1f),
        floatArrayOf(0.75f, 0.45f, 2.4f, 0.5f, 1.9f)
    )

    init {
        start()
    }

    private fun start() {
        animator?.cancel()
        animator = ValueAnimator.ofFloat(0f, 1000f).apply {
            duration = 1000_000L // Continuous smooth clock
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
            addUpdateListener { va ->
                timeSec = (va.currentPlayTime / 1000f)
                invalidate()
            }
            start()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (animator?.isStarted != true) start()
    }

    override fun onDetachedFromWindow() {
        animator?.cancel()
        super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return

        val t = timeSec * 0.75f

        // 1. Blob A: Primary Electric Sky Blue (Mengambang melingkar kiri-atas ke tengah)
        val ax = w * (0.35f + 0.18f * sin(t * 0.8).toFloat())
        val ay = h * (0.35f + 0.14f * cos(t * 0.6).toFloat())
        val ar = (minOf(w, h) * (0.65f + 0.08f * sin(t * 0.9).toFloat()))
        blobPaint.shader = RadialGradient(
            ax, ay, ar,
            intArrayOf(
                Color.argb(85, 14, 165, 233),   // Sky 500
                Color.argb(45, 56, 189, 248),   // Sky 400
                Color.argb(12, 125, 211, 252),  // Sky 300
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 0.35f, 0.65f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(ax, ay, ar, blobPaint)

        // 2. Blob B: Cyber Indigo / Deep Violet (Mengambang kanan-bawah berlawanan)
        val bx = w * (0.68f + 0.16f * cos(t * 0.7 + 1.5).toFloat())
        val by = h * (0.62f + 0.15f * sin(t * 0.5 + 2.0).toFloat())
        val br = (minOf(w, h) * (0.70f + 0.10f * cos(t * 0.8).toFloat()))
        blobPaint.shader = RadialGradient(
            bx, by, br,
            intArrayOf(
                Color.argb(75, 79, 70, 229),    // Indigo 600
                Color.argb(40, 129, 140, 248),  // Indigo 400
                Color.argb(10, 192, 132, 252),  // Purple 400
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 0.38f, 0.70f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(bx, by, br, blobPaint)

        // 3. Blob C: Radiant Emerald / Cyan Accent (Aksen segar di pojok bawah-kiri)
        val cx = w * (0.22f + 0.12f * cos(t * 0.9 + 3.0).toFloat())
        val cy = h * (0.75f + 0.12f * sin(t * 0.7 + 1.0).toFloat())
        val cr = (minOf(w, h) * (0.50f + 0.06f * sin(t * 1.1).toFloat()))
        blobPaint.shader = RadialGradient(
            cx, cy, cr,
            intArrayOf(
                Color.argb(55, 16, 185, 129),   // Emerald 500
                Color.argb(25, 45, 212, 191),   // Teal 400
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 0.45f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx, cy, cr, blobPaint)
        blobPaint.shader = null

        // 4. Floating Ambient Stardust Particles
        for (p in particles) {
            val pxNorm = p[0]
            val pyNorm = p[1]
            val rBase = p[2] * density
            val speed = p[3]
            val phase = p[4]

            val curX = w * pxNorm + (18f * density) * sin(t * speed + phase).toFloat()
            val curY = h * pyNorm + (15f * density) * cos(t * speed * 0.8 + phase).toFloat()
            val alphaWave = 0.4f + 0.6f * ((sin(t * speed * 2f + phase).toFloat() + 1f) / 2f)

            starPaint.color = Color.argb((alphaWave * 180).toInt(), 255, 255, 255)
            canvas.drawCircle(curX, curY, rBase * (0.8f + 0.2f * alphaWave), starPaint)
        }
    }
}

