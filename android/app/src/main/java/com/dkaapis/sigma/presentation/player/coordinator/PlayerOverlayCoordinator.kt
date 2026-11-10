package com.dkaapis.sigma.presentation.player.coordinator

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import com.dkaapis.sigma.presentation.player.ui.SpektakulerAuroraBackgroundView
import com.dkaapis.sigma.presentation.renderers.glass.GlassDrawableFactory

/**
 * Overlay status loading, sync, standby & clear cache dengan tampilan Fullscreen Spektakuler:
 * - Fluid Aurora Mesh Background (Sky, Indigo, Emerald) + stardust particles
 * - Cinematic Intro Entrance Animation (Overshoot pop-in, floating glide, staggered children fade)
 * - Ultra-smooth dismissal transition saat transisi ke active playback
 */
class PlayerOverlayCoordinator(context: Context, private val canvas: View) {

    private val density = context.resources.displayMetrics.density
    private val auroraBg = SpektakulerAuroraBackgroundView(context)

    private val badge = TextView(context)
    private val title = TextView(context)
    private val detail = TextView(context)
    private val bar = ProgressBar(context, null, android.R.attr.progressBarStyleHorizontal)
    private val card: LinearLayout

    val root = FrameLayout(context)
    val isVisible get() = root.visibility == View.VISIBLE
    private var isIntroAnimated = false

    init {
        root.visibility = View.GONE

        // 1. Spektakuler Animated Fluid Mesh Aurora di latar belakang penuh
        auroraBg.layoutParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        root.addView(auroraBg)

        // 2. Status Badge Pill
        val padX = (18 * density).toInt()
        val padY = (7 * density).toInt()
        badge.run {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.5f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.09f
            gravity = Gravity.CENTER
            setPadding(padX, padY, padX, padY)
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 16)
        }

        // 3. Title Text
        title.run {
            setTextColor(Color.parseColor("#0F172A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.01f
            gravity = Gravity.CENTER
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 12)
        }

        // 4. Progress Bar
        bar.run {
            max = 100
            progressDrawable?.setTint(SKY)
            indeterminateDrawable?.setTint(SKY)
            layoutParams = lp((5 * density).toInt().coerceAtLeast(4), bottom = 12, matchWidth = true)
        }

        // 5. Detail Subtitle Text
        detail.run {
            setTextColor(Color.parseColor("#334155"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setLineSpacing(4f, 1.05f)
        }

        // 6. Frosted Glass Floating Card
        card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GlassDrawableFactory.createMacOsTahoeGlassCard(28 * density, density)
            elevation = 24 * density
            outlineProvider = ViewOutlineProvider.BACKGROUND
            clipToOutline = true
            setPadding(
                (40 * density).toInt(),
                (30 * density).toInt(),
                (40 * density).toInt(),
                (30 * density).toInt()
            )
            val w = (490 * density).toInt().coerceAtMost((context.resources.displayMetrics.widthPixels * 0.85f).toInt())
            layoutParams = FrameLayout.LayoutParams(w, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
            listOf(badge, title, bar, detail).forEach(::addView)
        }

        root.addView(card)

        // Continuous subtle breathing motion pada kartu kaca
        ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 3600L
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            interpolator = DecelerateInterpolator()
            addUpdateListener { va ->
                val f = va.animatedValue as Float
                val s = 1.0f + 0.018f * f
                val transY = -6f * density * f
                if (isIntroAnimated) {
                    card.scaleX = s
                    card.scaleY = s
                    card.translationY = transY
                }
            }
            start()
        }

        show("● SINKRONISASI JADWAL", SKY and 0xFFFFFF, "Memulai HNDSigma Player...", "")
    }

    private fun lp(h: Int, bottom: Int, matchWidth: Boolean = false) = LinearLayout.LayoutParams(
        if (matchWidth) ViewGroup.LayoutParams.MATCH_PARENT else LinearLayout.LayoutParams.WRAP_CONTENT, h
    ).also { it.bottomMargin = (bottom * density).toInt() }

    /** Menjalankan cinematic intro entrance animation saat pertama kali muncul */
    private fun triggerCinematicIntroEntrance() {
        isIntroAnimated = false

        // Card awal: scaled down, sedikit di bawah, alpha 0
        card.alpha = 0f
        card.scaleX = 0.82f
        card.scaleY = 0.82f
        card.translationY = 32f * density

        // Aurora background fade in
        auroraBg.alpha = 0f
        auroraBg.animate()
            .alpha(1f)
            .setDuration(700L)
            .setInterpolator(DecelerateInterpolator())
            .start()

        // Card entrance: Overshoot spring-like scale & glide up
        val scaleXAnim = ObjectAnimator.ofFloat(card, View.SCALE_X, 0.82f, 1.0f).apply {
            duration = 750L
            interpolator = OvershootInterpolator(1.2f)
        }
        val scaleYAnim = ObjectAnimator.ofFloat(card, View.SCALE_Y, 0.82f, 1.0f).apply {
            duration = 750L
            interpolator = OvershootInterpolator(1.2f)
        }
        val transYAnim = ObjectAnimator.ofFloat(card, View.TRANSLATION_Y, 32f * density, 0f).apply {
            duration = 750L
            interpolator = DecelerateInterpolator(2f)
        }
        val alphaAnim = ObjectAnimator.ofFloat(card, View.ALPHA, 0f, 1f).apply {
            duration = 500L
            interpolator = DecelerateInterpolator()
        }

        // Staggered fade in untuk elemen teks di dalam kartu
        listOf(badge, title, bar, detail).forEachIndexed { index, view ->
            view.alpha = 0f
            view.translationY = 12f * density
            view.animate()
                .alpha(1f)
                .translationY(0f)
                .setStartDelay(200L + (index * 70L))
                .setDuration(450L)
                .setInterpolator(DecelerateInterpolator(2f))
                .start()
        }

        AnimatorSet().apply {
            playTogether(scaleXAnim, scaleYAnim, transYAnim, alphaAnim)
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    isIntroAnimated = true
                }
            })
            start()
        }
    }

    /** [progress] null = indeterminate. [rgb] = warna pill (tanpa alpha). */
    fun show(
        badgeText: String,
        rgb: Int,
        titleText: String,
        detailText: String,
        progress: Int? = null,
        titleColor: Int = Color.parseColor("#0F172A"),
        badgeTextRgb: Int = rgb
    ) {
        val wasHidden = root.visibility != View.VISIBLE

        badge.text = badgeText
        badge.setTextColor(0xFF000000.toInt() or badgeTextRgb)
        badge.background = GlassDrawableFactory.createStatusPillDrawable(0x24000000 or rgb, 0x95000000.toInt() or rgb, 999f)
        title.setTextColor(titleColor)
        title.text = titleText
        detail.text = detailText
        bar.isIndeterminate = progress == null
        if (progress != null) bar.progress = progress

        root.visibility = View.VISIBLE
        root.alpha = 1f

        if (wasHidden) {
            triggerCinematicIntroEntrance()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            canvas.setRenderEffect(RenderEffect.createBlurEffect(24f * density, 24f * density, Shader.TileMode.CLAMP))
        }
    }

    fun hide() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            canvas.setRenderEffect(null)
        }
        if (!isVisible) return

        isIntroAnimated = false

        // Cinematic exit: card zoom out & glide down softly
        card.animate()
            .scaleX(0.92f)
            .scaleY(0.92f)
            .translationY(20f * density)
            .alpha(0f)
            .setDuration(450L)
            .setInterpolator(DecelerateInterpolator(2f))
            .start()

        root.animate()
            .alpha(0f)
            .setDuration(500L)
            .setInterpolator(DecelerateInterpolator(2f))
            .withEndAction {
                root.visibility = View.GONE
                root.alpha = 1f
                card.scaleX = 1f
                card.scaleY = 1f
                card.translationY = 0f
                card.alpha = 1f
            }
            .start()
    }

    fun postDelayed(ms: Long, r: Runnable) = root.postDelayed(r, ms)

    private companion object {
        val SKY = 0xFF0284C7.toInt()
    }
}
