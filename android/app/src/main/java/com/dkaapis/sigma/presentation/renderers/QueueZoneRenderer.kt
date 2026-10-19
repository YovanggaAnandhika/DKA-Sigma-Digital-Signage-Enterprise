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
import com.dkaapis.sigma.presentation.renderers.queue.parser.QueueLayoutParser
import com.dkaapis.sigma.presentation.util.ColorParser
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
        val cfg = QueueLayoutParser.parse(widgetDataJson)
        canvasW = cfg.canvasW
        canvasH = cfg.canvasH
        currentPrefix = cfg.prefix
        currentName = cfg.name
        currentCounterLabel = cfg.counterLabel
        currentCounter = cfg.counterName
        currentStatus = cfg.status
        currentSequence = cfg.latestNumber.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 1

        countersList.clear()
        counterStatusMap.clear()
        cfg.counters.forEach { (name, status) ->
            countersList.add(name)
            counterStatusMap[name] = status
        }

        val cv = QueueCanvasView(context, canvasW, canvasH).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setBackgroundColor(ColorParser.parseColor(cfg.bgColor))
            alpha = cfg.canvasOpacity.coerceIn(0.0f, 1.0f)
            val canClick = !isInactive()
            isClickable = canClick
            isFocusable = canClick
            setOnClickListener { if (!isInactive()) callNext() }
        }

        this.parentZoneView = parent
        this.canvasView = cv
        itemViews.clear()
        numberTextView = null
        counterTextView = null

        if (cfg.bgImageUrl.isNotBlank()) {
            cv.addView(
                ImageView(context).apply {
                    scaleType = ImageView.ScaleType.FIT_XY
                    tag = QueueItemMeta(
                        id = "queue-bg-image", itemType = "image",
                        x = 0, y = 0, width = canvasW, height = canvasH, zIndex = -1,
                        backgroundColor = "transparent", textColor = "transparent",
                        fontSize = 0f, fontWeight = "normal", textAlign = "left", templateContent = cfg.bgImageUrl
                    )
                    load(cfg.bgImageUrl)
                }
            )
        }

        for (meta in cfg.items.sortedBy { it.zIndex }) {
            val childView = createItemView(meta, cfg.latestNumber, cfg.counterName).apply { tag = meta }
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
            setColor(ColorParser.parseColor(meta.backgroundColor))
            if (meta.borderWidth > 0 && meta.borderColor.isNotBlank()) {
                setStroke(meta.borderWidth, ColorParser.parseColor(meta.borderColor))
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
                setTextColor(ColorParser.parseColor(meta.textColor, Color.WHITE))
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
                setTextColor(ColorParser.parseColor(meta.textColor, Color.WHITE))
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
                        originalCounterBgColor = ColorParser.parseColor(meta.backgroundColor)
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
        itemViews.values.forEach { (view, meta) ->
            (view as? TextView)?.text = interpolate(meta.templateContent, ticketNumber, counterName)
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
}
