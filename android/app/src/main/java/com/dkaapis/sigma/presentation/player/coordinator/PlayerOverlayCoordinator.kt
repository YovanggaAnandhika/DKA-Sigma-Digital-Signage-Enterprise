package com.dkaapis.sigma.presentation.player.coordinator

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
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import com.dkaapis.sigma.presentation.player.ui.ModernIntroGraphicView
import com.dkaapis.sigma.presentation.renderers.glass.GlassDrawableFactory

/**
 * Overlay status loading, sync, & clear cache dengan tampilan Fullscreen Glassmorphism modern
 * dan animasi intro grafis futuristik (glowing pulsating orbit rings & core lens).
 */
class PlayerOverlayCoordinator(context: Context, private val canvas: View) {

    private val density = context.resources.displayMetrics.density
    private val introGraphic = ModernIntroGraphicView(context)
    private val badge = TextView(context)
    private val title = TextView(context)
    private val detail = TextView(context)
    private val bar = ProgressBar(context, null, android.R.attr.progressBarStyleHorizontal)

    val root = FrameLayout(context)
    val isVisible get() = root.visibility == View.VISIBLE

    init {
        root.visibility = View.GONE

        // 1. Fullscreen translucent glass veil: subtle light frosting
        root.setBackgroundColor(Color.argb(35, 255, 255, 255))

        // Fullscreen dynamic ambient aurora background di balik kartu kaca
        val backgroundGraphic = ModernIntroGraphicView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(backgroundGraphic)

        // 2. Animated Modern Graphic Hero Orb di dalam kartu kaca
        val graphicSize = (72 * density).toInt()
        introGraphic.layoutParams = LinearLayout.LayoutParams(graphicSize, graphicSize).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = (14 * density).toInt()
        }

        // 3. Status Badge Pill
        val padX = (16 * density).toInt()
        val padY = (6 * density).toInt()
        badge.run {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.06f
            gravity = Gravity.CENTER
            setPadding(padX, padY, padX, padY)
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 14)
        }

        // 4. Title Text (Tajam dan kontras tinggi di atas kaca cerah)
        title.run {
            setTextColor(Color.parseColor("#0F172A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 10)
        }

        // 5. Progress Bar
        bar.run {
            max = 100
            progressDrawable?.setTint(SKY)
            indeterminateDrawable?.setTint(SKY)
            layoutParams = lp((5 * density).toInt().coerceAtLeast(4), bottom = 10, matchWidth = true)
        }

        // 6. Detail Subtitle Text
        detail.run {
            setTextColor(Color.parseColor("#334155"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setLineSpacing(4f, 1f)
        }

        // 7. Frosted Glass Floating Card (Crystalline Glass dengan specular rim)
        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GlassDrawableFactory.createMacOsTahoeGlassCard(26 * density, density)
            elevation = 20 * density
            outlineProvider = ViewOutlineProvider.BACKGROUND
            clipToOutline = true
            setPadding(
                (36 * density).toInt(),
                (24 * density).toInt(),
                (36 * density).toInt(),
                (24 * density).toInt()
            )
            val w = (480 * density).toInt().coerceAtMost((context.resources.displayMetrics.widthPixels * 0.85f).toInt())
            layoutParams = FrameLayout.LayoutParams(w, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
            listOf(introGraphic, badge, title, bar, detail).forEach(::addView)
        }

        root.layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        root.addView(card)

        show("● SINKRONISASI JADWAL", SKY and 0xFFFFFF, "Memulai HNDSigma Player...", "")
    }

    private fun lp(h: Int, bottom: Int, matchWidth: Boolean = false) = LinearLayout.LayoutParams(
        if (matchWidth) ViewGroup.LayoutParams.MATCH_PARENT else LinearLayout.LayoutParams.WRAP_CONTENT, h
    ).also { it.bottomMargin = (bottom * density).toInt() }

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
        badge.text = badgeText
        badge.setTextColor(0xFF000000.toInt() or badgeTextRgb)
        badge.background = GlassDrawableFactory.createStatusPillDrawable(0x25000000 or rgb, 0x80000000.toInt() or rgb, 999f)
        title.setTextColor(titleColor)
        title.text = titleText
        detail.text = detailText
        bar.isIndeterminate = progress == null
        if (progress != null) bar.progress = progress

        root.visibility = View.VISIBLE
        root.alpha = 1f

        // Hardware-accelerated full canvas blur di belakang overlay
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            canvas.setRenderEffect(RenderEffect.createBlurEffect(24f * density, 24f * density, Shader.TileMode.CLAMP))
        }
    }

    fun hide() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            canvas.setRenderEffect(null)
        }
        if (!isVisible) return
        root.animate()
            .alpha(0f)
            .setDuration(450L)
            .setInterpolator(DecelerateInterpolator(2f))
            .withEndAction {
                root.visibility = View.GONE
                root.alpha = 1f
            }
            .start()
    }

    fun postDelayed(ms: Long, r: Runnable) = root.postDelayed(r, ms)

    private companion object {
        val SKY = 0xFF38BDF8.toInt()
    }
}
