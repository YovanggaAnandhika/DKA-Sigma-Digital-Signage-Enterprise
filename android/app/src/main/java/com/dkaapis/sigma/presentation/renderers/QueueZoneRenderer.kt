package com.dkaapis.sigma.presentation.renderers

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import coil.load
import com.dkaapis.sigma.R
import org.json.JSONArray
import org.json.JSONObject

data class QueueItemMeta(
    val id: String,
    val itemType: String,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val zIndex: Int,
    val backgroundColor: String,
    val textColor: String,
    val fontSize: Float,
    val fontWeight: String,
    val textAlign: String,
    val templateContent: String,
    val borderRadius: Float = 0f,
    val borderWidth: Int = 0,
    val borderColor: String = "#00000000",
    val speed: String = "normal",
    val opacity: Float = 1.0f
)

class QueueCanvasView(
    context: Context,
    private val canvasWidth: Int = 1920,
    private val canvasHeight: Int = 1080
) : ViewGroup(context) {

    init {
        clipChildren = false
        clipToPadding = false
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val height = MeasureSpec.getSize(heightMeasureSpec)
        setMeasuredDimension(width, height)

        if (width <= 0 || height <= 0) return

        val scaleX = width.toFloat() / canvasWidth.toFloat()
        val scaleY = height.toFloat() / canvasHeight.toFloat()

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val meta = child.tag as? QueueItemMeta ?: continue
            val childW = (meta.width * scaleX).toInt().coerceAtLeast(1)
            val childH = (meta.height * scaleY).toInt().coerceAtLeast(1)

            if (child is TextView) {
                // Skala font proporsional mengikuti lebar kontainer, persis CSS container queries (100cqw)
                val fontPx = meta.fontSize * scaleX
                child.setTextSize(TypedValue.COMPLEX_UNIT_PX, fontPx)
                child.includeFontPadding = false
            }

            val widthSpec = MeasureSpec.makeMeasureSpec(childW, MeasureSpec.EXACTLY)
            val heightSpec = if (child is TextView && meta.itemType != "marquee") {
                // Ukur ketinggian alami teks tanpa pembatasan terlebih dahulu agar font besar tidak terpotong
                child.measure(widthSpec, MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
                val paddingBuffer = (4 * context.resources.displayMetrics.density).toInt()
                val neededH = maxOf(childH, child.measuredHeight + paddingBuffer)
                MeasureSpec.makeMeasureSpec(neededH, MeasureSpec.EXACTLY)
            } else {
                MeasureSpec.makeMeasureSpec(childH, MeasureSpec.EXACTLY)
            }

            child.measure(widthSpec, heightSpec)
        }
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        val width = r - l
        val height = b - t
        if (width <= 0 || height <= 0) return

        val scaleX = width.toFloat() / canvasWidth.toFloat()
        val scaleY = height.toFloat() / canvasHeight.toFloat()

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val meta = child.tag as? QueueItemMeta ?: continue
            val boxLeft = (meta.x * scaleX).toInt()
            val boxTop = (meta.y * scaleY).toInt()
            val boxW = (meta.width * scaleX).toInt().coerceAtLeast(1)
            val boxH = (meta.height * scaleY).toInt().coerceAtLeast(1)

            // Posisikan dan pusatkan view di dalam kotak targetnya secara presisi
            val left = boxLeft + (boxW - child.measuredWidth) / 2
            val top = boxTop + (boxH - child.measuredHeight) / 2
            val right = left + child.measuredWidth
            val bottom = top + child.measuredHeight
            child.layout(left, top, right, bottom)
        }
    }
}

class QueueZoneRenderer(
    private val context: Context,
    private val onCallAudioStarted: () -> Unit = {},
    private val onCallAudioFinished: () -> Unit = {},
    var onUserTapNext: ((ticketNumber: String, counterName: String) -> Unit)? = null
) {
    private var numberTextView: TextView? = null
    private var counterTextView: TextView? = null
    private var currentPrefix: String = "A"
    private var currentName: String = "Layar Antrian"
    private var currentSequence: Int = 1
    private var currentCounter: String = "LOKET 01"
    private var currentCounterLabel: String = "Loket"
    private val countersList = mutableListOf<String>()

    private var parentZoneView: ViewGroup? = null
    private var canvasView: QueueCanvasView? = null
    private var isCallingActive = false
    private var invertAnimator: ValueAnimator? = null
    private var currentInvertProgress = 0f
    private val invertPaint = Paint()

    private var canvasW: Int = 1920
    private var canvasH: Int = 1080

    fun createView(
        parent: ViewGroup,
        widgetDataJson: String?
    ): View {
        canvasW = 1920
        canvasH = 1080
        var bgColor = "transparent"
        var bgImageUrl = ""
        var canvasOpacity = 1.0f
        var overlayColor = ""
        var overlayOpacity = 0.0f
        var latestNumber = "A-001"
        var counterName = "LOKET 01"
        var itemsJsonArray: JSONArray? = null

        if (!widgetDataJson.isNullOrBlank()) {
            try {
                val json = JSONObject(widgetDataJson)
                canvasW = json.optInt("canvasWidth", 1920).takeIf { it > 0 } ?: 1920
                canvasH = json.optInt("canvasHeight", 1080).takeIf { it > 0 } ?: 1080
                currentPrefix = json.optString("prefix", "A").ifBlank { "A" }
                currentName = json.optString("name", "Layar Antrian")
                currentCounterLabel = json.optString("counterLabel", json.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()
                latestNumber = json.optString("latestCalledNumber", "$currentPrefix-001")
                bgColor = json.optString("backgroundColor", "transparent").ifBlank { "transparent" }
                bgImageUrl = json.optString("backgroundImageUrl", "").ifBlank { json.optString("background_image_url", "") }
                canvasOpacity = (if (json.has("opacity")) json.optDouble("opacity", 1.0) else 1.0).toFloat()
                overlayColor = json.optString("overlayColor", "").ifEmpty { json.optString("overlay_color", "") }
                overlayOpacity = (if (json.has("overlayOpacity")) json.optDouble("overlayOpacity", 0.0) else json.optDouble("overlay_opacity", 0.0)).toFloat()

                val countersArr = json.optJSONArray("countersList") ?: json.optJSONArray("counters")
                countersList.clear()
                if (countersArr != null && countersArr.length() > 0) {
                    for (cIdx in 0 until countersArr.length()) {
                        val cObj = countersArr.getJSONObject(cIdx)
                        val cName = cObj.optString("counterName", "LOKET ${cIdx + 1}")
                        countersList.add(cName)
                    }
                    counterName = countersList.first()
                } else {
                    countersList.addAll(listOf("LOKET 01", "LOKET 02", "LOKET 03"))
                }

                itemsJsonArray = json.optJSONArray("itemsList") ?: json.optJSONArray("items")
            } catch (_: Exception) {}
        } else {
            countersList.addAll(listOf("LOKET 01", "LOKET 02", "LOKET 03"))
        }

        currentCounter = counterName
        currentSequence = latestNumber.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 1

        val canvasView = QueueCanvasView(context, canvasW, canvasH).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(parseColor(bgColor, Color.TRANSPARENT))
            alpha = canvasOpacity.coerceIn(0.0f, 1.0f)
            isClickable = true
            isFocusable = true
            setOnClickListener {
                callNext()
            }
        }

        this.parentZoneView = parent
        this.canvasView = canvasView

        val parsedItems = mutableListOf<QueueItemMeta>()

        // Scrim overlay item if defined
        if (overlayOpacity > 0f && overlayColor.isNotBlank() && !overlayColor.equals("transparent", ignoreCase = true)) {
            parsedItems.add(
                QueueItemMeta(
                    id = "queue-overlay-scrim",
                    itemType = "overlay_scrim",
                    x = 0, y = 0, width = canvasW, height = canvasH, zIndex = 0,
                    backgroundColor = overlayColor,
                    textColor = "transparent", fontSize = 0f,
                    fontWeight = "normal", textAlign = "left", templateContent = "",
                    opacity = overlayOpacity
                )
            )
        }

        if (itemsJsonArray != null && itemsJsonArray.length() > 0) {
            for (i in 0 until itemsJsonArray.length()) {
                val itemObj = itemsJsonArray.optJSONObject(i) ?: continue
                if (!itemObj.optBoolean("isVisible", true)) continue

                var itemOpacity = (if (itemObj.has("opacity")) itemObj.optDouble("opacity", 1.0) else 1.0).toFloat()
                var br = if (itemObj.has("borderRadius")) itemObj.optDouble("borderRadius", 0.0).toFloat()
                         else itemObj.optDouble("border_radius", 0.0).toFloat()
                var bw = if (itemObj.has("borderWidth")) itemObj.optInt("borderWidth", 0)
                         else itemObj.optInt("border_width", 0)
                var bc = if (itemObj.has("borderColor") && itemObj.optString("borderColor").isNotBlank()) itemObj.optString("borderColor")
                         else itemObj.optString("border_color", "transparent")
                var spd = "normal"
                val configStr = itemObj.optString("configJson", "")
                if (configStr.isNotBlank()) {
                    try {
                        val cfg = JSONObject(configStr)
                        if (!itemObj.has("borderRadius") && !itemObj.has("border_radius")) br = cfg.optDouble("borderRadius", 0.0).toFloat()
                        if (!itemObj.has("borderWidth") && !itemObj.has("border_width")) bw = cfg.optInt("borderWidth", 0)
                        if (!itemObj.has("borderColor") && !itemObj.has("border_color")) bc = cfg.optString("borderColor", "transparent")
                        if (!itemObj.has("opacity")) itemOpacity = cfg.optDouble("opacity", 1.0).toFloat()
                        spd = cfg.optString("speed", "normal")
                    } catch (_: Exception) {}
                }

                parsedItems.add(
                    QueueItemMeta(
                        id = itemObj.optString("id", "item-$i"),
                        itemType = itemObj.optString("itemType", "text_label"),
                        x = itemObj.optInt("x", 0),
                        y = itemObj.optInt("y", 0),
                        width = itemObj.optInt("width", 200),
                        height = itemObj.optInt("height", 100),
                        zIndex = itemObj.optInt("zIndex", i + 1),
                        backgroundColor = itemObj.optString("backgroundColor", "transparent"),
                        textColor = itemObj.optString("textColor", "#ffffff"),
                        fontSize = itemObj.optDouble("fontSize", 24.0).toFloat(),
                        fontWeight = itemObj.optString("fontWeight", "bold"),
                        textAlign = itemObj.optString("textAlign", "center"),
                        templateContent = itemObj.optString("templateContent", ""),
                        borderRadius = br,
                        borderWidth = bw,
                        borderColor = bc,
                        speed = spd,
                        opacity = itemOpacity
                    )
                )
            }
        } else {
            // Database-synced fallback matching migration 0042
            parsedItems.add(
                QueueItemMeta(
                    id = "fallback-title",
                    itemType = "text_label",
                    x = 60, y = 60, width = 1800, height = 70, zIndex = 1,
                    backgroundColor = "transparent", textColor = "#10b981", fontSize = 36f,
                    fontWeight = "800", textAlign = "center", templateContent = "\$queue_name\$"
                )
            )
            parsedItems.add(
                QueueItemMeta(
                    id = "fallback-ticket",
                    itemType = "ticket_number",
                    x = 360, y = 190, width = 1200, height = 440, zIndex = 2,
                    backgroundColor = "transparent", textColor = "#10b981", fontSize = 150f,
                    fontWeight = "900", textAlign = "center", templateContent = "\$queue_number\$"
                )
            )
            parsedItems.add(
                QueueItemMeta(
                    id = "fallback-counter",
                    itemType = "counter_loket",
                    x = 710, y = 680, width = 500, height = 90, zIndex = 3,
                    backgroundColor = "#059669", textColor = "#ffffff", fontSize = 32f,
                    fontWeight = "800", textAlign = "center", templateContent = "\$queue_counter\$",
                    borderRadius = 14f
                )
            )
            parsedItems.add(
                QueueItemMeta(
                    id = "fallback-marquee",
                    itemType = "marquee",
                    x = 0, y = 990, width = 1920, height = 90, zIndex = 4,
                    backgroundColor = "#064e3b", textColor = "#ffffff", fontSize = 24f,
                    fontWeight = "bold", textAlign = "left",
                    templateContent = "PENGUMUMAN: Silakan menuju \$queue_counter\$ saat nomor \$queue_number\$ dipanggil. Terima kasih.",
                    speed = "normal"
                )
            )
        }

        parsedItems.sortBy { it.zIndex }

        for (meta in parsedItems) {
            if (meta.itemType == "overlay_scrim") {
                val scrimView = View(context).apply {
                    tag = meta
                    setBackgroundColor(parseColor(meta.backgroundColor, Color.TRANSPARENT))
                    alpha = meta.opacity.coerceIn(0.0f, 1.0f)
                }
                canvasView.addView(scrimView)
                continue
            }

            val textContent = interpolate(meta.templateContent, latestNumber, counterName)
            val isBold = meta.fontWeight == "800" || meta.fontWeight == "900" || meta.fontWeight.equals("bold", ignoreCase = true)
            val density = context.resources.displayMetrics.density

            val textView = if (meta.itemType == "marquee") {
                MarqueeTextView(context).apply {
                    cycleDurationMs = when (meta.speed.lowercase()) {
                        "fast" -> 12_000L
                        "slow" -> 25_000L
                        else -> 18_000L
                    }
                }
            } else {
                TextView(context)
            }.apply {
                tag = meta
                text = textContent
                alpha = meta.opacity.coerceIn(0.0f, 1.0f)
                setTextColor(parseColor(meta.textColor, Color.WHITE))
                includeFontPadding = false
                gravity = when (meta.textAlign.lowercase()) {
                    "left", "start" -> Gravity.START or Gravity.CENTER_VERTICAL
                    "right", "end" -> Gravity.END or Gravity.CENTER_VERTICAL
                    else -> Gravity.CENTER
                }
                typeface = Typeface.create(
                    Typeface.SANS_SERIF,
                    if (isBold) Typeface.BOLD else Typeface.NORMAL
                )
                if (meta.itemType == "ticket_number") {
                    isSingleLine = true
                    maxLines = 1
                    letterSpacing = 0.02f
                } else if (meta.itemType == "counter_loket") {
                    isSingleLine = true
                    maxLines = 1
                }

                val hasBg = meta.backgroundColor.isNotBlank() && !meta.backgroundColor.equals("transparent", ignoreCase = true)
                val hasBorder = meta.borderWidth > 0 && meta.borderColor.isNotBlank() && !meta.borderColor.equals("transparent", ignoreCase = true) && !meta.borderColor.equals("#00000000", ignoreCase = true)

                if (hasBg || hasBorder || meta.borderRadius > 0f) {
                    val gd = GradientDrawable().apply {
                        shape = GradientDrawable.RECTANGLE
                        setColor(if (hasBg) parseColor(meta.backgroundColor, Color.TRANSPARENT) else Color.TRANSPARENT)
                        if (meta.borderRadius > 0f) {
                            cornerRadius = meta.borderRadius * density
                        }
                        if (hasBorder) {
                            setStroke((meta.borderWidth * density).toInt(), parseColor(meta.borderColor, Color.TRANSPARENT))
                        }
                    }
                    background = gd
                } else {
                    background = null
                }

                if (meta.itemType == "marquee") {
                    setPadding((16 * density).toInt(), 0, (16 * density).toInt(), 0)
                } else if (meta.itemType == "counter_loket" && hasBg) {
                    setPadding((16 * density).toInt(), 0, (16 * density).toInt(), 0)
                }
            }

            if (meta.itemType == "ticket_number") {
                numberTextView = textView
                textView.isClickable = true
                textView.setOnClickListener {
                    callNext()
                }
            } else if (meta.itemType == "counter_loket") {
                counterTextView = textView
                textView.isClickable = true
                textView.setOnClickListener {
                    cycleNextCounter()
                }
            }

            canvasView.addView(textView)
        }

        if (bgImageUrl.isBlank()) return canvasView

        // Background image (center-crop = CSS background-size: cover) behind the canvas
        val resolvedUrl = if (bgImageUrl.startsWith("/")) {
            val base = com.dkaapis.sigma.data.local.ServerConfig.getHttpBaseUrl(context)
            "${base.trimEnd('/')}$bgImageUrl"
        } else bgImageUrl

        return FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            addView(ImageView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                scaleType = ImageView.ScaleType.CENTER_CROP
                alpha = canvasOpacity.coerceIn(0.0f, 1.0f)
                load(resolvedUrl) { crossfade(300) }
            })
            addView(canvasView)
        }
    }

    private fun interpolate(template: String, queueNumber: String, queueCounter: String): String {
        val labelRegex = Regex("^(?:${Regex.escape(currentCounterLabel)}|loket|poli|teller|kasir|meja|counter|pickup point)\\s*", RegexOption.IGNORE_CASE)
        var cleanNum = queueCounter.replace(labelRegex, "").trim()
        if (cleanNum.matches(Regex("^0+\\d+$"))) {
            cleanNum = cleanNum.replace(Regex("^0+"), "")
        }
        if (cleanNum.isBlank()) {
            cleanNum = queueCounter.filter { it.isDigit() }.ifEmpty { "1" }
        }
        val formattedCounter = "${currentCounterLabel.uppercase()} $cleanNum"

        return template
            .replace("\$queue_number\$", queueNumber)
            .replace("\$queue_counter\$", formattedCounter)
            .replace("\$queue_prefix\$", currentPrefix)
            .replace("\$queue_name\$", currentName)
    }

    fun callNext(): String {
        currentSequence++
        val newTicket = "$currentPrefix-${String.format(java.util.Locale.US, "%03d", currentSequence)}"
        updateDisplay(newTicket, currentCounter)
        onCallAudioStarted()
        onUserTapNext?.invoke(newTicket, currentCounter)
        return newTicket
    }

    fun cycleNextCounter(): String {
        if (countersList.isNotEmpty()) {
            val currIdx = countersList.indexOf(currentCounter)
            val nextIdx = if (currIdx >= 0) (currIdx + 1) % countersList.size else 0
            currentCounter = countersList[nextIdx]
            counterTextView?.text = currentCounter
            counterTextView?.animate()?.scaleX(1.08f)?.scaleY(1.08f)?.setDuration(100)?.withEndAction {
                counterTextView?.animate()?.scaleX(1.0f)?.scaleY(1.0f)?.setDuration(150)?.start()
            }?.start()
            onUserTapNext?.invoke(getCurrentTicketNumber(), currentCounter)
        }
        return currentCounter
    }

    private var statusOverlayView: View? = null

    fun updateCall(ticketNumber: String, counterName: String) {
        statusOverlayView?.visibility = View.GONE
        val numPart = ticketNumber.replace(Regex("[^0-9]"), "").toIntOrNull()
        if (numPart != null) {
            currentSequence = numPart
        }
        if (counterName.isNotBlank()) {
            currentCounter = counterName
        }
        updateDisplay(ticketNumber, currentCounter)
        onCallAudioStarted()
    }

    fun resetQueue(resetToNumber: String? = null) {
        statusOverlayView?.visibility = View.GONE
        val target = resetToNumber?.ifBlank { null } ?: "$currentPrefix-000"
        val numPart = target.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 0
        currentSequence = numPart
        numberTextView?.text = target
        stopCallEffect()
    }

    fun setCounterStatus(counterName: String, status: String) {
        if (counterName.isNotBlank()) {
            currentCounter = counterName
        }
        val displayCounter = when (status.uppercase()) {
            "BREAK" -> "$counterName [ISTIRAHAT]"
            "LOCKED" -> "$counterName [TUTUP]"
            else -> counterName
        }
        counterTextView?.text = displayCounter

        val bgDrawable = counterTextView?.background
        if (bgDrawable is android.graphics.drawable.GradientDrawable) {
            when (status.uppercase()) {
                "BREAK" -> bgDrawable.setColor(Color.parseColor("#F59E0B"))
                "LOCKED" -> bgDrawable.setColor(Color.parseColor("#EF4444"))
                else -> bgDrawable.setColor(Color.parseColor("#10B981"))
            }
        }

        showDedicatedStatusScreen(status, counterName)
    }

    private fun showDedicatedStatusScreen(status: String, counterName: String) {
        val cv = canvasView ?: return
        val isBreak = status.equals("BREAK", ignoreCase = true)
        val isLocked = status.equals("LOCKED", ignoreCase = true)

        if (!isBreak && !isLocked) {
            statusOverlayView?.visibility = View.GONE
            return
        }

        val overlay = (statusOverlayView as? LinearLayout) ?: LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            tag = QueueItemMeta(
                id = "status-overlay-dedicated",
                itemType = "status_overlay",
                x = 0,
                y = 0,
                width = canvasW,
                height = canvasH,
                zIndex = 9999,
                backgroundColor = "#00000000",
                textColor = "#ffffff",
                fontSize = 16f,
                fontWeight = "normal",
                textAlign = "center",
                templateContent = ""
            )
            cv.addView(this)
            statusOverlayView = this
        }

        overlay.visibility = View.VISIBLE
        overlay.removeAllViews()
        overlay.setBackgroundColor(Color.parseColor(if (isBreak) "#0D111A" else "#0B0E17"))

        val titleText = TextView(context).apply {
            text = if (isBreak) "SEDANG ISTIRAHAT" else "LOKET DITUTUP"
            setTextColor(Color.parseColor(if (isBreak) "#F59E0B" else "#EF4444"))
            textSize = 38f
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            gravity = Gravity.CENTER
            includeFontPadding = false
        }

        val density = context.resources.displayMetrics.density
        val counterBadge = TextView(context).apply {
            text = counterName
            setTextColor(Color.WHITE)
            textSize = 22f
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            setPadding((24 * density).toInt(), (8 * density).toInt(), (24 * density).toInt(), (8 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 12 * density
                setColor(Color.parseColor(if (isBreak) "#D97706" else "#DC2626"))
            }
            gravity = Gravity.CENTER
        }

        val descText = TextView(context).apply {
            text = if (isBreak) 
                "Petugas sedang dalam jam istirahat.\nLayanan akan dibuka kembali segera."
            else 
                "Mohon maaf, layanan antrian pada loket ini sedang ditutup.\nSilakan menuju loket lain yang beroperasi."
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, (14 * density).toInt(), 0, 0)
        }

        overlay.addView(titleText)
        val spacer1 = View(context).apply { layoutParams = LinearLayout.LayoutParams(1, (16 * density).toInt()) }
        overlay.addView(spacer1)
        overlay.addView(counterBadge)
        overlay.addView(descText)
    }

    private fun getTargetView(): View? = parentZoneView ?: canvasView

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

    fun startCallEffect(ticketNumber: String, counterName: String) {
        isCallingActive = true
        numberTextView?.text = ticketNumber
        counterTextView?.text = counterName

        val target = getTargetView() ?: return
        invertAnimator?.cancel()

        // Jika sebelumnya sudah dalam status ter-invers (misal dipanggil berturut-turut),
        // berikan efek micro-shutter 120ms (dip ke normal lalu kembali invers) sebagai konfirmasi tiket baru
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
            // Transisi bersih & rapi (140ms) menuju warna terinversi
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

    fun stopCallEffect() {
        if (!isCallingActive && currentInvertProgress <= 0.001f) return
        isCallingActive = false

        val target = getTargetView() ?: return
        invertAnimator?.cancel()

        // Kembalikan warna ke normal secara mulus (180ms)
        invertAnimator = ValueAnimator.ofFloat(currentInvertProgress, 0.0f).apply {
            duration = 180
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { va ->
                applyColorInversion(target, va.animatedValue as Float)
            }
            start()
        }
    }

    private fun updateDisplay(ticketNumber: String, counterName: String) {
        startCallEffect(ticketNumber, counterName)
    }

    fun getCurrentTicketNumber(): String = "$currentPrefix-${String.format(java.util.Locale.US, "%03d", currentSequence)}"
    fun getCurrentCounterName(): String = currentCounter

    private fun parseColor(colorStr: String, fallback: Int): Int {
        if (colorStr.isBlank() || colorStr.equals("transparent", ignoreCase = true)) return Color.TRANSPARENT
        val trimmed = colorStr.trim()
        if (trimmed.startsWith("#")) {
            return try { Color.parseColor(trimmed) } catch (_: Exception) { fallback }
        }
        if (trimmed.startsWith("rgba", ignoreCase = true)) {
            try {
                val parts = trimmed.substringAfter("(").substringBefore(")").split(",")
                if (parts.size >= 4) {
                    val r = parts[0].trim().toInt()
                    val g = parts[1].trim().toInt()
                    val b = parts[2].trim().toInt()
                    val a = (parts[3].trim().toFloat() * 255).toInt().coerceIn(0, 255)
                    return Color.argb(a, r, g, b)
                }
            } catch (_: Exception) {}
        }
        return try { Color.parseColor(trimmed) } catch (_: Exception) { fallback }
    }
}
