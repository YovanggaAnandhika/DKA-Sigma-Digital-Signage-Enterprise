package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.TextView
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

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val height = MeasureSpec.getSize(heightMeasureSpec)
        setMeasuredDimension(width, height)

        if (width <= 0 || height <= 0) return

        val scale = width.toFloat() / canvasWidth.toFloat()

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val meta = child.tag as? QueueItemMeta ?: continue
            val childW = (meta.width * scale).toInt().coerceAtLeast(1)
            val childH = (meta.height * scale).toInt().coerceAtLeast(1)

            child.measure(
                MeasureSpec.makeMeasureSpec(childW, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(childH, MeasureSpec.EXACTLY)
            )

            if (child is TextView) {
                val fontPx = meta.fontSize * scale
                child.setTextSize(TypedValue.COMPLEX_UNIT_PX, fontPx)
            }
        }
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        val width = r - l
        if (width <= 0) return

        val scale = width.toFloat() / canvasWidth.toFloat()

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val meta = child.tag as? QueueItemMeta ?: continue
            val left = (meta.x * scale).toInt()
            val top = (meta.y * scale).toInt()
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
    private var callingPillView: TextView? = null
    private var currentPrefix: String = "A"
    private var currentName: String = "Layar Antrian"
    private var currentSequence: Int = 1
    private var currentCounter: String = "LOKET 01"
    private val countersList = mutableListOf<String>()

    fun createView(
        parent: ViewGroup,
        widgetDataJson: String?
    ): View {
        var canvasW = 1920
        var canvasH = 1080
        var bgColor = "transparent"
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
                latestNumber = json.optString("latestCalledNumber", "$currentPrefix-001")
                bgColor = json.optString("backgroundColor", "transparent").ifBlank { "transparent" }
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

        val density = context.resources.displayMetrics.density
        // Dynamic Call Announcement Pill Banner
        callingPillView = TextView(context).apply {
            tag = QueueItemMeta(
                id = "queue-calling-pill",
                itemType = "calling_pill",
                x = ((canvasW - 740) / 2).coerceAtLeast(0),
                y = 40,
                width = 740,
                height = 76,
                zIndex = 999,
                backgroundColor = "#0f172a",
                textColor = "#fde047",
                fontSize = 28f,
                fontWeight = "800",
                textAlign = "center",
                templateContent = "",
                borderRadius = 38f,
                borderWidth = 2,
                borderColor = "#f59e0b"
            )
            text = "🔔  PANGGILAN NOMOR ANTRIAN  🔔"
            setTextColor(Color.parseColor("#FDE047"))
            gravity = Gravity.CENTER
            typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            visibility = View.GONE
            alpha = 0f

            val gd = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 38f * density
                setColor(Color.parseColor("#E60F172A"))
                setStroke((2 * density).toInt(), Color.parseColor("#F59E0B"))
            }
            background = gd
            setPadding((24 * density).toInt(), (8 * density).toInt(), (24 * density).toInt(), (8 * density).toInt())
        }
        canvasView.addView(callingPillView)

        return canvasView
    }

    private fun interpolate(template: String, queueNumber: String, queueCounter: String): String {
        return template
            .replace("\$queue_number\$", queueNumber)
            .replace("\$queue_counter\$", queueCounter)
            .replace("\$queue_prefix\$", currentPrefix)
            .replace("\$queue_name\$", currentName)
    }

    fun callNext(): String {
        currentSequence++
        val newTicket = "$currentPrefix-${String.format(java.util.Locale.US, "%03d", currentSequence)}"
        updateDisplay(newTicket, currentCounter)
        onCallAudioStarted()
        onUserTapNext?.invoke(newTicket, currentCounter)
        numberTextView?.postDelayed({
            onCallAudioFinished()
        }, 3500)
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

    fun updateCall(ticketNumber: String, counterName: String) {
        val numPart = ticketNumber.replace(Regex("[^0-9]"), "").toIntOrNull()
        if (numPart != null) {
            currentSequence = numPart
        }
        if (counterName.isNotBlank()) {
            currentCounter = counterName
        }
        updateDisplay(ticketNumber, currentCounter)
        onCallAudioStarted()
        numberTextView?.postDelayed({
            onCallAudioFinished()
        }, 3500)
    }

    private fun updateDisplay(ticketNumber: String, counterName: String) {
        numberTextView?.text = ticketNumber
        counterTextView?.text = counterName

        // 1. Calling Pill Banner Animation (Pop-down with Overshoot)
        callingPillView?.let { pill ->
            pill.visibility = View.VISIBLE
            pill.alpha = 0f
            pill.scaleX = 0.7f
            pill.scaleY = 0.7f
            pill.animate()
                ?.alpha(1f)
                ?.scaleX(1.0f)
                ?.scaleY(1.0f)
                ?.setInterpolator(OvershootInterpolator(2.2f))
                ?.setDuration(350)
                ?.withEndAction {
                    pill.animate()
                        ?.scaleX(1.04f)
                        ?.scaleY(1.04f)
                        ?.setDuration(400)
                        ?.withEndAction {
                            pill.animate()?.scaleX(1.0f)?.scaleY(1.0f)?.setDuration(400)?.start()
                        }
                        ?.start()
                }
                ?.start()
        }

        // 2. High-impact Glowing Ticket Number Animation
        val originalTextColor = (numberTextView?.tag as? QueueItemMeta)?.let {
            parseColor(it.textColor, Color.WHITE)
        } ?: Color.WHITE

        val accentGlowColor = Color.parseColor("#38BDF8") // Vivid cyan aura
        val highlightColor = Color.parseColor("#FDE047") // Bright gold

        numberTextView?.setTextColor(highlightColor)
        numberTextView?.setShadowLayer(45f, 0f, 0f, accentGlowColor)

        numberTextView?.animate()
            ?.scaleX(1.26f)
            ?.scaleY(1.26f)
            ?.setInterpolator(OvershootInterpolator(2.5f))
            ?.setDuration(350)
            ?.withEndAction {
                // Heartbeat pulse 1
                numberTextView?.animate()
                    ?.scaleX(1.12f)
                    ?.scaleY(1.12f)
                    ?.setDuration(280)
                    ?.withEndAction {
                        // Heartbeat pulse 2
                        numberTextView?.animate()
                            ?.scaleX(1.22f)
                            ?.scaleY(1.22f)
                            ?.setDuration(280)
                            ?.withEndAction {
                                // Settle back smoothly
                                numberTextView?.animate()
                                    ?.scaleX(1.0f)
                                    ?.scaleY(1.0f)
                                    ?.setInterpolator(DecelerateInterpolator())
                                    ?.setDuration(450)
                                    ?.withEndAction {
                                        numberTextView?.setTextColor(originalTextColor)
                                        numberTextView?.setShadowLayer(0f, 0f, 0f, 0)
                                    }
                                    ?.start()
                            }
                            ?.start()
                    }
                    ?.start()
            }
            ?.start()

        // 3. Counter Loket Badge Attention Pop & Wobble
        counterTextView?.animate()
            ?.scaleX(1.20f)
            ?.scaleY(1.20f)
            ?.rotation(-3.5f)
            ?.setInterpolator(OvershootInterpolator(2.0f))
            ?.setDuration(280)
            ?.withEndAction {
                counterTextView?.animate()
                    ?.rotation(3.5f)
                    ?.setDuration(180)
                    ?.withEndAction {
                        counterTextView?.animate()
                            ?.rotation(0f)
                            ?.scaleX(1.0f)
                            ?.scaleY(1.0f)
                            ?.setInterpolator(DecelerateInterpolator())
                            ?.setDuration(300)
                            ?.start()
                    }
                    ?.start()
            }
            ?.start()

        // 4. Fade out calling pill after announcement (3.8 seconds)
        callingPillView?.postDelayed({
            callingPillView?.animate()
                ?.alpha(0f)
                ?.scaleX(0.8f)
                ?.scaleY(0.8f)
                ?.setDuration(350)
                ?.withEndAction {
                    callingPillView?.visibility = View.GONE
                }
                ?.start()
        }, 3800)
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
