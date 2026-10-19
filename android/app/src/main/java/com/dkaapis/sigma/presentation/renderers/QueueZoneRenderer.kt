package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import coil.load
import com.dkaapis.sigma.presentation.renderers.queue.QueueCanvasView
import com.dkaapis.sigma.presentation.renderers.queue.QueueStatusOverlayHelper
import com.dkaapis.sigma.presentation.renderers.queue.QueueVisualEffectHelper
import com.dkaapis.sigma.presentation.renderers.queue.model.QueueCallbacksPayload
import com.dkaapis.sigma.presentation.renderers.queue.model.QueueItemMeta
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

/**
 * Renderer Zona Antrean (Queue Zone Renderer):
 * Mengkoordinasikan kanvas antrean, tata letak blok item, efek visual panggilan,
 * dan overlay status loket ("ISTIRAHAT" / "TUTUP").
 */
class QueueZoneRenderer(
    private val context: Context,
    private val callbacks: QueueCallbacksPayload = QueueCallbacksPayload()
) {
    constructor(
        context: Context,
        onCallAudioStarted: () -> Unit = {},
        onCallAudioFinished: () -> Unit = {},
        onUserTapNext: (ticketNumber: String, counterName: String) -> Unit = { _, _ -> }
    ) : this(context, QueueCallbacksPayload(onCallAudioStarted, onCallAudioFinished, onUserTapNext))

    private val visualEffectHelper = QueueVisualEffectHelper()
    private val statusOverlayHelper = QueueStatusOverlayHelper(context)

    private var parentZoneView: ViewGroup? = null
    private var canvasView: QueueCanvasView? = null
    private var numberTextView: TextView? = null
    private var counterTextView: TextView? = null
    private var originalCounterBgColor: Int = Color.TRANSPARENT

    private var currentSequence: Int = 1
    private var currentPrefix: String = "A"
    private var currentCounter: String = "LOKET 01"
    private var currentCounterLabel: String = "Loket"
    private var currentName: String = "Layar Antrian"
    private var currentStatus: String = "ACTIVE"
    private var canvasW: Int = 1920
    private var canvasH: Int = 1080

    private val countersList = mutableListOf<String>()
    private val counterStatusMap = mutableMapOf<String, String>()
    private val itemViews = mutableMapOf<String, Pair<View, QueueItemMeta>>()

    fun getCurrentCounter(): String = currentCounter
    fun getCurrentTicketNumber(): String = "$currentPrefix-${String.format(Locale.US, "%03d", currentSequence)}"
    fun getCurrentCounterName(): String = currentCounter

    private fun isInactive(): Boolean =
        currentStatus.equals("BREAK", ignoreCase = true) || currentStatus.equals("LOCKED", ignoreCase = true)

    fun createView(parent: ViewGroup, widgetDataJson: String?): View {
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
            runCatching {
                val json = JSONObject(widgetDataJson)
                canvasW = json.optInt("canvasWidth", 1920).takeIf { it > 0 } ?: 1920
                canvasH = json.optInt("canvasHeight", 1080).takeIf { it > 0 } ?: 1080
                currentPrefix = json.optString("prefix", "A").ifBlank { "A" }
                currentName = json.optString("name", "Layar Antrian")
                currentCounterLabel = json.optString("counterLabel", json.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()
                latestNumber = json.optString("latestCalledNumber", "$currentPrefix-001")
                bgColor = json.optString("backgroundColor", "transparent").ifBlank { "transparent" }
                bgImageUrl = json.optString("backgroundImageUrl", "").ifBlank { json.optString("background_image_url", "") }
                canvasOpacity = json.optDouble("opacity", 1.0).toFloat()
                overlayColor = json.optString("overlayColor", "").ifEmpty { json.optString("overlay_color", "") }
                overlayOpacity = json.optDouble("overlayOpacity", json.optDouble("overlay_opacity", 0.0)).toFloat()

                val countersArr = json.optJSONArray("countersList") ?: json.optJSONArray("counters")
                countersList.clear()
                counterStatusMap.clear()
                var firstCounterStatus = ""
                if (countersArr != null && countersArr.length() > 0) {
                    for (cIdx in 0 until countersArr.length()) {
                        val cObj = countersArr.getJSONObject(cIdx)
                        val cName = cObj.optString("counterName", "LOKET ${cIdx + 1}")
                        val cStatus = cObj.optString("status", "ACTIVE").uppercase()
                        countersList.add(cName)
                        counterStatusMap[cName] = cStatus
                        if (cIdx == 0) firstCounterStatus = cStatus
                    }
                    counterName = json.optString("currentCounterName", "").ifBlank { countersList.first() }
                } else {
                    countersList.addAll(listOf("LOKET 01", "LOKET 02", "LOKET 03"))
                }

                val initialStatus = json.optString("status", json.optString("counterStatus", firstCounterStatus.ifBlank { "ACTIVE" }))
                if (initialStatus.equals("BREAK", ignoreCase = true) || initialStatus.equals("LOCKED", ignoreCase = true)) {
                    currentStatus = initialStatus.uppercase()
                } else if (counterStatusMap.containsKey(counterName)) {
                    currentStatus = counterStatusMap[counterName] ?: "ACTIVE"
                }

                itemsJsonArray = json.optJSONArray("itemsList") ?: json.optJSONArray("items")
            }
        } else {
            countersList.addAll(listOf("LOKET 01", "LOKET 02", "LOKET 03"))
        }

        currentCounter = counterName
        currentSequence = latestNumber.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 1

        val cv = QueueCanvasView(context, canvasW, canvasH).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setBackgroundColor(parseColor(bgColor, Color.TRANSPARENT))
            alpha = canvasOpacity.coerceIn(0.0f, 1.0f)
            val canClick = !isInactive()
            isClickable = canClick
            isFocusable = canClick
            setOnClickListener { if (!isInactive()) callNext() }
        }

        this.parentZoneView = parent
        this.canvasView = cv

        val parsedItems = mutableListOf<QueueItemMeta>()
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

        if (itemsJsonArray != null) {
            for (i in 0 until itemsJsonArray.length()) {
                val itemObj = itemsJsonArray.optJSONObject(i) ?: continue
                if (!itemObj.optBoolean("isVisible", true)) continue

                var itemOpacity = itemObj.optDouble("opacity", 1.0).toFloat()
                var br = itemObj.optDouble("borderRadius", itemObj.optDouble("border_radius", 0.0)).toFloat()
                var bw = itemObj.optInt("borderWidth", itemObj.optInt("border_width", 0))
                var bc = itemObj.optString("borderColor", itemObj.optString("border_color", "transparent"))
                var spd = "normal"

                val configStr = itemObj.optString("configJson", "")
                if (configStr.isNotBlank()) {
                    runCatching {
                        val cfg = JSONObject(configStr)
                        if (!itemObj.has("borderRadius") && !itemObj.has("border_radius")) br = cfg.optDouble("borderRadius", 0.0).toFloat()
                        if (!itemObj.has("borderWidth") && !itemObj.has("border_width")) bw = cfg.optInt("borderWidth", 0)
                        if (!itemObj.has("borderColor") && !itemObj.has("border_color")) bc = cfg.optString("borderColor", "transparent")
                        if (!itemObj.has("opacity")) itemOpacity = cfg.optDouble("opacity", 1.0).toFloat()
                        spd = cfg.optString("speed", "normal")
                    }
                }

                parsedItems.add(
                    QueueItemMeta(
                        id = itemObj.optString("id", "item-$i"),
                        itemType = itemObj.optString("itemType", itemObj.optString("item_type", "text")),
                        x = itemObj.optInt("x", 0),
                        y = itemObj.optInt("y", 0),
                        width = itemObj.optInt("width", 200).coerceAtLeast(1),
                        height = itemObj.optInt("height", 100).coerceAtLeast(1),
                        zIndex = itemObj.optInt("zIndex", itemObj.optInt("z_index", i)),
                        backgroundColor = itemObj.optString("backgroundColor", itemObj.optString("background_color", "transparent")),
                        textColor = itemObj.optString("textColor", itemObj.optString("text_color", "#ffffff")),
                        fontSize = itemObj.optDouble("fontSize", itemObj.optDouble("font_size", 24.0)).toFloat(),
                        fontWeight = itemObj.optString("fontWeight", itemObj.optString("font_weight", "bold")),
                        textAlign = itemObj.optString("textAlign", itemObj.optString("text_align", "center")),
                        templateContent = itemObj.optString("templateContent", itemObj.optString("template_content", "")),
                        borderRadius = br,
                        borderWidth = bw,
                        borderColor = bc,
                        speed = spd,
                        opacity = itemOpacity
                    )
                )
            }
        }

        itemViews.clear()
        numberTextView = null
        counterTextView = null

        if (bgImageUrl.isNotBlank()) {
            val bgIv = ImageView(context).apply {
                scaleType = ImageView.ScaleType.FIT_XY
                tag = QueueItemMeta(
                    id = "queue-bg-image", itemType = "image",
                    x = 0, y = 0, width = canvasW, height = canvasH, zIndex = -1,
                    backgroundColor = "transparent", textColor = "transparent",
                    fontSize = 0f, fontWeight = "normal", textAlign = "left", templateContent = bgImageUrl
                )
                load(bgImageUrl)
            }
            cv.addView(bgIv)
        }

        for (meta in parsedItems.sortedBy { it.zIndex }) {
            val childView = createItemView(meta, latestNumber, counterName)
            childView.tag = meta
            cv.addView(childView)
            itemViews[meta.id] = Pair(childView, meta)
        }

        statusOverlayHelper.updateStatusScreen(cv, currentStatus, currentCounter, currentCounterLabel, canvasW, canvasH, numberTextView, counterTextView)
        return cv
    }

    private fun createItemView(meta: QueueItemMeta, queueNumber: String, queueCounter: String): View {
        val bgDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            if (meta.borderRadius > 0f) cornerRadius = meta.borderRadius
            val bgCol = parseColor(meta.backgroundColor, Color.TRANSPARENT)
            setColor(bgCol)
            if (meta.borderWidth > 0 && meta.borderColor.isNotBlank()) {
                setStroke(meta.borderWidth, parseColor(meta.borderColor, Color.TRANSPARENT))
            }
        }

        return when (meta.itemType) {
            "image" -> ImageView(context).apply {
                background = bgDrawable
                scaleType = ImageView.ScaleType.FIT_XY
                alpha = meta.opacity.coerceIn(0.0f, 1.0f)
                if (meta.templateContent.isNotBlank()) load(meta.templateContent)
            }
            "marquee" -> MarqueeTextView(context).apply {
                background = bgDrawable
                setTextColor(parseColor(meta.textColor, Color.WHITE))
                typeface = resolveTypeface(meta.fontWeight)
                alpha = meta.opacity.coerceIn(0.0f, 1.0f)
                speedPixelsPerSec = when (meta.speed.lowercase()) {
                    "fast" -> 160f
                    "slow" -> 50f
                    else -> 95f
                }
                text = interpolate(meta.templateContent.ifBlank { "DKASigma Layanan Antrian" }, queueNumber, queueCounter)
            }
            else -> TextView(context).apply {
                background = bgDrawable
                setTextColor(parseColor(meta.textColor, Color.WHITE))
                typeface = resolveTypeface(meta.fontWeight)
                gravity = resolveGravity(meta.textAlign)
                alpha = meta.opacity.coerceIn(0.0f, 1.0f)
                text = interpolate(meta.templateContent, queueNumber, queueCounter)

                when (meta.itemType) {
                    "number" -> {
                        numberTextView = this
                        val canClick = !isInactive()
                        isClickable = canClick
                        isFocusable = canClick
                        setOnClickListener { if (!isInactive()) callNext() }
                    }
                    "counter" -> {
                        counterTextView = this
                        originalCounterBgColor = parseColor(meta.backgroundColor, Color.TRANSPARENT)
                        val canClick = !isInactive()
                        isClickable = canClick
                        isFocusable = canClick
                        setOnClickListener { if (!isInactive()) cycleNextCounter() }
                    }
                }
            }
        }
    }

    private fun interpolate(template: String, queueNumber: String, queueCounter: String): String =
        template
            .replace("{ticket_number}", queueNumber)
            .replace("{number}", queueNumber)
            .replace("{nomor_antrian}", queueNumber)
            .replace("{counter_name}", queueCounter)
            .replace("{counter}", queueCounter)
            .replace("{loket}", queueCounter)
            .replace("{name}", currentName)
            .replace("{prefix}", currentPrefix)

    fun callNext(): String {
        currentSequence++
        val formattedNumber = "$currentPrefix-${String.format(Locale.US, "%03d", currentSequence)}"
        updateDisplay(formattedNumber, currentCounter)
        callbacks.onUserTapNext(formattedNumber, currentCounter)
        return formattedNumber
    }

    fun cycleNextCounter(): String {
        if (countersList.isEmpty()) return currentCounter
        val nextIdx = (countersList.indexOf(currentCounter) + 1) % countersList.size
        currentCounter = countersList[nextIdx]
        currentStatus = counterStatusMap[currentCounter] ?: "ACTIVE"
        val formattedNumber = "$currentPrefix-${String.format(Locale.US, "%03d", currentSequence)}"
        setCounterStatus(currentCounter, currentStatus)
        applyDisplayText(formattedNumber, currentCounter)
        return currentCounter
    }

    fun syncTicketDisplay(ticketNumber: String, counterName: String? = null) {
        val seq = ticketNumber.replace(Regex("[^0-9]"), "").toIntOrNull()
        if (seq != null) currentSequence = seq
        val pfx = ticketNumber.substringBefore("-", "").trim()
        if (pfx.isNotBlank()) currentPrefix = pfx
        if (!counterName.isNullOrBlank()) currentCounter = counterName
        applyDisplayText(ticketNumber, currentCounter)
    }

    fun applyDisplayText(ticketNumber: String, counterName: String) {
        for ((_, pair) in itemViews) {
            val (view, meta) = pair
            if (view is TextView) {
                view.text = interpolate(meta.templateContent, ticketNumber, counterName)
            }
        }
    }

    fun updateCall(ticketNumber: String, counterName: String) {
        val seq = ticketNumber.replace(Regex("[^0-9]"), "").toIntOrNull()
        if (seq != null) currentSequence = seq
        val pfx = ticketNumber.substringBefore("-", "").trim()
        if (pfx.isNotBlank()) currentPrefix = pfx
        currentCounter = counterName
        updateDisplay(ticketNumber, counterName)
    }

    fun resetQueue(resetToNumber: String? = null) {
        currentSequence = if (!resetToNumber.isNullOrBlank()) {
            val seq = resetToNumber.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 1
            val pfx = resetToNumber.substringBefore("-", "").trim()
            if (pfx.isNotBlank()) currentPrefix = pfx
            seq
        } else {
            1
        }
        val formattedNumber = "$currentPrefix-${String.format(Locale.US, "%03d", currentSequence)}"
        applyDisplayText(formattedNumber, currentCounter)
    }

    fun setCounterStatus(counterName: String, status: String) {
        val upperStatus = status.uppercase()
        if (counterName.isNotBlank()) {
            counterStatusMap[counterName] = upperStatus
            currentCounter = counterName
        }
        currentStatus = upperStatus
        counterTextView?.text = when (currentStatus) {
            "BREAK" -> "$currentCounter [ISTIRAHAT]"
            "LOCKED" -> "$currentCounter [TUTUP]"
            else -> currentCounter
        }

        val bgDrawable = counterTextView?.background as? GradientDrawable
        if (bgDrawable != null) {
            when (currentStatus) {
                "BREAK" -> bgDrawable.setColor(Color.parseColor("#F59E0B"))
                "LOCKED" -> bgDrawable.setColor(Color.parseColor("#EF4444"))
                else -> bgDrawable.setColor(if (originalCounterBgColor != Color.TRANSPARENT) originalCounterBgColor else Color.TRANSPARENT)
            }
        }

        canvasView?.let { cv ->
            statusOverlayHelper.updateStatusScreen(cv, currentStatus, currentCounter, currentCounterLabel, canvasW, canvasH, numberTextView, counterTextView)
        }
    }

    private fun updateDisplay(ticketNumber: String, counterName: String) {
        applyDisplayText(ticketNumber, counterName)
        startCallEffect(ticketNumber, counterName)
    }

    fun startCallEffect(ticketNumber: String, counterName: String) {
        val target = parentZoneView ?: canvasView ?: return
        callbacks.onCallAudioStarted()
        visualEffectHelper.startCallEffect(target) {
            applyDisplayText(ticketNumber, counterName)
        }
    }

    fun stopCallEffect() {
        val target = parentZoneView ?: canvasView ?: return
        visualEffectHelper.stopCallEffect(target) {
            if (currentStatus == "ACTIVE") {
                val bg = counterTextView?.background as? GradientDrawable
                if (bg != null && originalCounterBgColor != Color.TRANSPARENT) {
                    bg.setColor(originalCounterBgColor)
                }
            }
            callbacks.onCallAudioFinished()
        }
    }

    private fun resolveGravity(align: String): Int = when (align.lowercase()) {
        "left", "start" -> Gravity.START or Gravity.CENTER_VERTICAL
        "right", "end" -> Gravity.END or Gravity.CENTER_VERTICAL
        else -> Gravity.CENTER
    }

    private fun resolveTypeface(weight: String): Typeface = when (weight.lowercase()) {
        "bold", "700", "800", "900" -> Typeface.DEFAULT_BOLD
        else -> Typeface.DEFAULT
    }

    private fun parseColor(colorStr: String, fallback: Int): Int {
        if (colorStr.isBlank() || colorStr.equals("transparent", ignoreCase = true)) return Color.TRANSPARENT
        val trimmed = colorStr.trim()
        if (trimmed.startsWith("#")) {
            return runCatching { Color.parseColor(trimmed) }.getOrDefault(fallback)
        }
        if (trimmed.startsWith("rgba", ignoreCase = true)) {
            return runCatching {
                val parts = trimmed.substringAfter("(").substringBefore(")").split(",")
                if (parts.size >= 4) {
                    val r = parts[0].trim().toInt()
                    val g = parts[1].trim().toInt()
                    val b = parts[2].trim().toInt()
                    val a = (parts[3].trim().toFloat() * 255).toInt().coerceIn(0, 255)
                    Color.argb(a, r, g, b)
                } else fallback
            }.getOrDefault(fallback)
        }
        return runCatching { Color.parseColor(trimmed) }.getOrDefault(fallback)
    }
}
