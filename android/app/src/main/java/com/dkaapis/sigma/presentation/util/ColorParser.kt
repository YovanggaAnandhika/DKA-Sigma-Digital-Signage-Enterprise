package com.dkaapis.sigma.presentation.util

import android.graphics.Color

/**
 * Utilitas parsing warna terpusat untuk format Hex (#RRGGBB, #AARRGGBB) dan CSS RGBA.
 */
object ColorParser {

    fun parseColor(colorStr: String?, fallback: Int = Color.TRANSPARENT): Int {
        if (colorStr.isNullOrBlank() || colorStr.equals("transparent", ignoreCase = true)) {
            return Color.TRANSPARENT
        }
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
