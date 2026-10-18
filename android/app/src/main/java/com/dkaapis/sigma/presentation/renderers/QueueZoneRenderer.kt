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
    val speed: String = "normal"
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
    private val onCallAudioFinished: () -> Unit = {}
) {
    private var numberTextView: TextView? = null
    private var counterTextView: TextView? = null
    private var currentPrefix: String = "A"
    private var currentName: String = "Layar Antrian"

    fun createView(
        parent: ViewGroup,
        widgetDataJson: String?
    ): View {
        var canvasW = 1920
        var canvasH = 1080
        var bgColor = "#0f172a"
        var latestNumber = "A-001"
        var counterName = "LOKET 01"
        var itemsJsonArray: JSONArray? = null

        if (!widgetDataJson.isNullOrBlank()) {
            try {
                val json = JSONObject(widgetDataJson)
                canvasW = json.optInt("canvasWidth", 1920).takeIf { it > 0 } ?: 1920
                canvasH = json.optInt("canvasHeight", 1080).takeIf { it > 0 } ?: 1080
                currentPrefix = json.optString("prefix", "A")
                currentName = json.optString("name", "Layar Antrian")
                latestNumber = json.optString("latestCalledNumber", "$currentPrefix-001")
                bgColor = json.optString("backgroundColor", "#0f172a").ifBlank { "#0f172a" }

                val countersArr = json.optJSONArray("countersList") ?: json.optJSONArray("counters")
                if (countersArr != null && countersArr.length() > 0) {
                    counterName = countersArr.getJSONObject(0).optString("counterName", "LOKET 01")
                }

                itemsJsonArray = json.optJSONArray("itemsList") ?: json.optJSONArray("items")
            } catch (_: Exception) {}
        }

        val canvasView = QueueCanvasView(context, canvasW, canvasH).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(parseColor(bgColor, Color.parseColor("#0f172a")))
        }

        val parsedItems = mutableListOf<QueueItemMeta>()

        if (itemsJsonArray != null && itemsJsonArray.length() > 0) {
            for (i in 0 until itemsJsonArray.length()) {
                val itemObj = itemsJsonArray.optJSONObject(i) ?: continue
                if (!itemObj.optBoolean("isVisible", true)) continue

                var br = 0f
                var bw = 0
                var bc = "#00000000"
                var spd = "normal"
                val configStr = itemObj.optString("configJson", "")
                if (configStr.isNotBlank()) {
                    try {
                        val cfg = JSONObject(configStr)
                        br = cfg.optDouble("borderRadius", 0.0).toFloat()
                        bw = cfg.optInt("borderWidth", 0)
                        bc = cfg.optString("borderColor", "#00000000")
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
                        speed = spd
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
            val textContent = interpolate(meta.templateContent, latestNumber, counterName)
            val isBold = meta.fontWeight == "800" || meta.fontWeight == "900" || meta.fontWeight.equals("bold", ignoreCase = true)
            val density = context.resources.displayMetrics.density

            val textView = if (meta.itemType == "marquee") {
                MarqueeTextView(context).apply {
                    speedPixelsPerSec = when (meta.speed.lowercase()) {
                        "fast" -> 160f
                        "slow" -> 60f
                        else -> 100f
                    }
                }
            } else {
                TextView(context)
            }.apply {
                tag = meta
                text = textContent
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

                if (meta.backgroundColor != "transparent" && meta.backgroundColor.isNotBlank()) {
                    val gd = GradientDrawable().apply {
                        shape = GradientDrawable.RECTANGLE
                        setColor(parseColor(meta.backgroundColor, Color.TRANSPARENT))
                        if (meta.borderRadius > 0f) {
                            cornerRadius = meta.borderRadius * density
                        }
                        if (meta.borderWidth > 0 && meta.borderColor != "#00000000" && meta.borderColor != "transparent") {
                            setStroke((meta.borderWidth * density).toInt(), parseColor(meta.borderColor, Color.TRANSPARENT))
                        }
                    }
                    background = gd
                }

                if (meta.itemType == "marquee") {
                    setPadding((16 * density).toInt(), 0, (16 * density).toInt(), 0)
                }
            }

            if (meta.itemType == "ticket_number") {
                numberTextView = textView
            } else if (meta.itemType == "counter_loket") {
                counterTextView = textView
            }

            canvasView.addView(textView)
        }

        return canvasView
    }

    private fun interpolate(template: String, queueNumber: String, queueCounter: String): String {
        return template
            .replace("\$queue_number\$", queueNumber)
            .replace("\$queue_counter\$", queueCounter)
            .replace("\$queue_prefix\$", currentPrefix)
            .replace("\$queue_name\$", currentName)
    }

    fun updateCall(ticketNumber: String, counterName: String) {
        numberTextView?.text = ticketNumber
        counterTextView?.text = counterName
        onCallAudioStarted()
        numberTextView?.postDelayed({
            onCallAudioFinished()
        }, 3000)
    }

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
