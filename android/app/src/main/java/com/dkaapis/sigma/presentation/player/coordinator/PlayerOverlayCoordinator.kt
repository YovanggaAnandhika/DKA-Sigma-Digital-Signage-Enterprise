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
import com.dkaapis.sigma.presentation.renderers.glass.GlassDrawableFactory

/**
 * Overlay status loading, sync, & clear cache dengan tampilan Fullscreen Glassmorphism modern.
 * Memadukan backdrop blur (RenderEffect pada canvas di Android 12+), ambient specular tint,
 * dan floating frosted glass card presisi di tengah layar.
 */
class PlayerOverlayCoordinator(context: Context, private val canvas: View) {

    private val density = context.resources.displayMetrics.density
    private val badge = TextView(context)
    private val title = TextView(context)
    private val detail = TextView(context)
    private val bar = ProgressBar(context, null, android.R.attr.progressBarStyleHorizontal)

    val root = FrameLayout(context)
    val isVisible get() = root.visibility == View.VISIBLE

    init {
        root.visibility = View.GONE

        // 1. Fullscreen translucent glass veil: subtle light frosting (bukan abu-abu gelap)
        // Ketika canvas kosong (putih) atau berisi konten terakhir, efek frosted glass tetap cerah & bersih
        root.setBackgroundColor(Color.argb(35, 255, 255, 255))

        // 2. Status Badge Pill
        val padX = (16 * density).toInt()
        val padY = (6 * density).toInt()
        badge.run {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.06f
            gravity = Gravity.CENTER
            setPadding(padX, padY, padX, padY)
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 16)
        }

        // 3. Title Text
        title.run {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setShadowLayer(8f, 0f, 2f, 0xCC000000.toInt())
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
            setTextColor(Color.parseColor("#F1F5F9"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setLineSpacing(4f, 1f)
            setShadowLayer(6f, 0f, 2f, 0xCC000000.toInt())
        }

        // 6. Frosted Glass Floating Card (Crystalline Glass dengan specular rim)
        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GlassDrawableFactory.createMacOsTahoeGlassCard(24 * density, density)
            elevation = 20 * density
            outlineProvider = ViewOutlineProvider.BACKGROUND
            clipToOutline = true
            setPadding(
                (36 * density).toInt(),
                (28 * density).toInt(),
                (36 * density).toInt(),
                (28 * density).toInt()
            )
            val w = (480 * density).toInt().coerceAtMost((context.resources.displayMetrics.widthPixels * 0.85f).toInt())
            layoutParams = FrameLayout.LayoutParams(w, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
            listOf(badge, title, bar, detail).forEach(::addView)
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
        titleColor: Int = Color.WHITE,
        badgeTextRgb: Int = rgb
    ) {
        badge.text = badgeText
        badge.setTextColor(0xFF000000.toInt() or badgeTextRgb)
        badge.background = GlassDrawableFactory.createStatusPillDrawable(0x35000000 or rgb, 0x80000000.toInt() or rgb, 999f)
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
