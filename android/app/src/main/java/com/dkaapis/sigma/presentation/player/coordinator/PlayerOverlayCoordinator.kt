package com.dkaapis.sigma.presentation.player.coordinator

import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Rect
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import com.dkaapis.sigma.presentation.renderers.glass.GlassDrawableFactory

/** Overlay status dengan snapshot frosted saat sync; video di balik overlay tertahan sampai selesai. */
class PlayerOverlayCoordinator(context: Context) {

    private val activity = context as? Activity
    private val density = context.resources.displayMetrics.density
    private val handler = Handler(Looper.getMainLooper())
    private val badge = TextView(context)
    private val title = TextView(context)
    private val detail = TextView(context)
    private val bar = ProgressBar(context, null, android.R.attr.progressBarStyleHorizontal)

    val root = FrameLayout(context)
    val isVisible get() = root.visibility == View.VISIBLE
    private lateinit var backdrop: ImageView
    private lateinit var card: FrameLayout
    private var hasSnapshot = false
    private var captureInProgress = false
    private var captureUnavailable = false
    private var pendingShow = false
    private var captureGeneration = 0

    init {
        root.visibility = View.GONE
        val pad = (14 * density).toInt()
        badge.run {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.05f
            gravity = Gravity.CENTER
            setPadding(pad, (5 * density).toInt(), pad, (5 * density).toInt())
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 14)
        }
        title.run {
            setTextColor(Color.parseColor("#0F172A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = lp(LinearLayout.LayoutParams.WRAP_CONTENT, bottom = 12)
        }
        bar.run {
            max = 100
            progressDrawable?.setTint(SKY)
            indeterminateDrawable?.setTint(SKY)
            layoutParams = lp((6 * density).toInt().coerceAtLeast(4), bottom = 12, matchWidth = true)
        }
        detail.run {
            setTextColor(Color.parseColor("#334155"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.5f)
            gravity = Gravity.CENTER
            setLineSpacing(4f, 1f)
        }
        val glassBackground = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 22 * density
            setColor(Color.TRANSPARENT)
            setStroke((1.2f * density).toInt().coerceAtLeast(1), Color.argb(180, 255, 255, 255))
        }
        val frostBackground = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.argb(112, 255, 255, 255),
                Color.argb(58, 255, 255, 255),
                Color.argb(86, 241, 245, 249)
            )
        )
        backdrop = ImageView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_CROP
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        card = FrameLayout(context).apply {
            background = glassBackground
            clipToOutline = true
            outlineProvider = ViewOutlineProvider.BACKGROUND
            elevation = 16 * density
            val w = (440 * density).toInt().coerceAtMost((context.resources.displayMetrics.widthPixels * 0.85f).toInt())
            layoutParams = FrameLayout.LayoutParams(w, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
            addView(backdrop)
            addView(View(context).apply {
                background = frostBackground
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            })
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                setPadding((32 * density).toInt(), (24 * density).toInt(), (32 * density).toInt(), (24 * density).toInt())
                listOf(badge, title, bar, detail).forEach(::addView)
            })
        }
        root.setBackgroundColor(Color.argb(25, 255, 255, 255))
        root.layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        root.addView(card)
        root.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
            override fun onViewAttachedToWindow(v: View) {
                if (pendingShow && !hasSnapshot && !captureUnavailable) captureBackdrop()
            }

            override fun onViewDetachedFromWindow(v: View) = Unit
        })
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
        badge.background = GlassDrawableFactory.createStatusPillDrawable(0x35000000 or rgb, 0x80000000.toInt() or rgb, 999f)
        title.setTextColor(titleColor)
        title.text = titleText
        detail.text = detailText
        bar.isIndeterminate = progress == null
        if (progress != null) bar.progress = progress
        pendingShow = true
        if (!hasSnapshot && !captureUnavailable) {
            if (root.isAttachedToWindow) {
                captureBackdrop()
                if (captureInProgress) return
            } else {
                root.visibility = View.VISIBLE
            }
        }
        root.visibility = View.VISIBLE
        root.alpha = 1f
    }

    fun hide() {
        pendingShow = false
        captureGeneration++
        if (captureInProgress) {
            root.animate().cancel()
            root.visibility = View.GONE
            return
        }
        if (!isVisible) return
        root.animate().alpha(0f).setDuration(600L).setInterpolator(DecelerateInterpolator(2f))
            .withEndAction {
                root.visibility = View.GONE
                root.alpha = 1f
                backdrop.setImageDrawable(null)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) backdrop.setRenderEffect(null)
                hasSnapshot = false
                captureUnavailable = false
            }.start()
    }

    fun postDelayed(ms: Long, r: Runnable) = root.postDelayed(r, ms)

    private fun captureBackdrop() {
        val sourceActivity = activity
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || sourceActivity == null) {
            captureUnavailable = true
            return
        }
        if (captureInProgress || hasSnapshot || !root.isAttachedToWindow) return

        captureInProgress = true
        root.post {
            if (!pendingShow || !root.isAttachedToWindow || card.width == 0 || card.height == 0) {
                captureInProgress = false
                captureUnavailable = true
                root.visibility = View.VISIBLE
                return@post
            }
            val location = IntArray(2)
            card.getLocationInWindow(location)
            val sourceRect = Rect(
                location[0],
                location[1],
                location[0] + card.width,
                location[1] + card.height
            )
            val bitmap = Bitmap.createBitmap(card.width, card.height, Bitmap.Config.ARGB_8888)
            val generation = ++captureGeneration
            root.visibility = View.INVISIBLE
            android.view.PixelCopy.request(
                sourceActivity.window,
                sourceRect,
                bitmap,
                { result ->
                    captureInProgress = false
                    if (generation != captureGeneration) {
                        bitmap.recycle()
                        if (pendingShow) captureBackdrop()
                        return@request
                    }
                    if (result == android.view.PixelCopy.SUCCESS) {
                        backdrop.setImageBitmap(bitmap)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            backdrop.setRenderEffect(
                                RenderEffect.createBlurEffect(16f * density, 16f * density, Shader.TileMode.CLAMP)
                            )
                        }
                        hasSnapshot = true
                    } else {
                        bitmap.recycle()
                        captureUnavailable = true
                    }
                    if (pendingShow) {
                        root.visibility = View.VISIBLE
                        root.alpha = 1f
                    }
                },
                handler
            )
        }
    }

    private companion object {
        val SKY = 0xFF38BDF8.toInt()
    }
}
