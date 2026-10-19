package com.dkaapis.sigma.presentation.player.audio

import com.dkaapis.sigma.presentation.player.audio.model.CounterStatusPayload
import com.dkaapis.sigma.presentation.player.audio.model.QueueSpeechPayload
import org.json.JSONObject
import java.util.Calendar

/**
 * Pemroses teks pengucapan panggilan antrean dan status loket.
 * Bertanggung jawab memetakan template, digit suara bahasa Indonesia,
 * dan ucapan salam berdasarkan waktu.
 */
class QueueSpeechInterpolator {

    fun interpolateTicket(payload: QueueSpeechPayload, queueDataJson: String?): String {
        val qObj = runCatching { JSONObject(queueDataJson ?: "{}") }.getOrDefault(JSONObject())
        val pfx = payload.ticketNumber.substringBefore("-", "").trim()
        val digits = payload.ticketNumber.substringAfter("-", "").trim()
        val spokenDigits = mapDigitsToIndonesian(digits)
        val counterLabel = payload.counterLabelOverride?.takeIf { it.isNotBlank() }
            ?: qObj.optString("counterLabel", qObj.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()
        val cleanCounter = extractCleanCounterName(payload.counterName, counterLabel)
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val op = findOperatorName(qObj, payload.counterName)
        val qName = qObj.optString("name", "")
        val waitCount = qObj.optInt("waitingTicketsCount", qObj.optInt("waiting_tickets_count", 0)).toString()

        val defaultTpl = if (payload.isRecall) {
            "Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}"
        } else {
            "{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}"
        }

        val rawTpl = if (payload.isRecall) {
            payload.ttsTemplateRecallOverride?.takeIf { it.isNotBlank() }
                ?: qObj.optString("ttsTemplateRecall", qObj.optString("tts_template_recall", defaultTpl)).ifBlank { defaultTpl }
        } else {
            payload.ttsTemplateCallOverride?.takeIf { it.isNotBlank() }
                ?: qObj.optString("ttsTemplateCall", qObj.optString("tts_template_call", defaultTpl)).ifBlank { defaultTpl }
        }

        return applyReplacements(
            rawTpl,
            mapOf(
                "{ticket_label}" to (payload.ticketLabelOverride?.takeIf { it.isNotBlank() }
                    ?: qObj.optString("ticketLabel", qObj.optString("ticket_label", "Nomor Antrian")).ifBlank { "Nomor Antrian" }),
                "{counter_label}" to counterLabel,
                "{ticket_number}" to if (pfx.isNotBlank()) "$pfx, $spokenDigits" else spokenDigits,
                "{ticket_prefix}" to pfx,
                "{ticket_digits}" to spokenDigits,
                "{counter_name}" to if (rawTpl.contains("{counter_label}")) cleanCounter else "$counterLabel $cleanCounter".trim(),
                "{counter_number}" to payload.counterName.filter { it.isDigit() }.ifEmpty { cleanCounter },
                "{operator_name}" to op,
                "{petugas}" to op,
                "{queue_name}" to qName,
                "{nama_antrian}" to qName,
                "{salam}" to getTimeGreeting(hour),
                "{waktu}" to getTimePeriod(hour),
                "{waiting_count}" to waitCount,
                "{sisa_antrian}" to waitCount
            )
        )
    }

    fun interpolateStatus(payload: CounterStatusPayload, queueDataJson: String?): String {
        val qObj = runCatching { JSONObject(queueDataJson ?: "{}") }.getOrDefault(JSONObject())
        val counterLabel = qObj.optString("counterLabel", qObj.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()
        val cleanCounter = extractCleanCounterName(payload.counterName, counterLabel)
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val op = findOperatorName(qObj, payload.counterName)
        val qName = qObj.optString("name", "")

        val rawTpl = when (payload.status.uppercase()) {
            "BREAK" -> qObj.optString("ttsTemplateBreak", qObj.optString("tts_template_break", "{counter_label} {counter_name} sedang istirahat")).ifBlank { "{counter_label} {counter_name} sedang istirahat" }
            "LOCKED" -> "{counter_label} {counter_name} telah ditutup"
            else -> "{counter_label} {counter_name} siap melayani"
        }

        return applyReplacements(
            rawTpl,
            mapOf(
                "{counter_label}" to counterLabel,
                "{counter_name}" to if (rawTpl.contains("{counter_label}")) cleanCounter else "$counterLabel $cleanCounter".trim(),
                "{counter_number}" to payload.counterName.filter { it.isDigit() }.ifEmpty { cleanCounter },
                "{operator_name}" to op,
                "{petugas}" to op,
                "{queue_name}" to qName,
                "{nama_antrian}" to qName,
                "{salam}" to getTimeGreeting(hour),
                "{waktu}" to getTimePeriod(hour)
            )
        )
    }

    private fun applyReplacements(template: String, replacements: Map<String, String>): String =
        replacements.entries.fold(template) { acc, (k, v) -> acc.replace(k, v) }
            .replace(Regex("\\s+"), " ")
            .trim()

    private fun mapDigitsToIndonesian(digits: String): String = digits.map { ch ->
        when (ch) {
            '0' -> "kosong"
            '1' -> "satu"
            '2' -> "dua"
            '3' -> "tiga"
            '4' -> "empat"
            '5' -> "lima"
            '6' -> "enam"
            '7' -> "tujuh"
            '8' -> "delapan"
            '9' -> "sembilan"
            else -> ch.toString()
        }
    }.joinToString(" ")

    private fun extractCleanCounterName(counterName: String, counterLabel: String): String {
        val labelRegex = Regex("^(?:${Regex.escape(counterLabel)}|loket|poli|teller|kasir|meja|counter)\\s*", RegexOption.IGNORE_CASE)
        val stripped = counterName.replace(labelRegex, "").trim().let { raw ->
            if (raw.matches(Regex("^0+\\d+$"))) raw.replace(Regex("^0+"), "") else raw
        }
        return stripped.ifBlank { counterName.filter { it.isDigit() }.ifEmpty { "1" } }
    }

    private fun findOperatorName(qObj: JSONObject, counterName: String): String {
        val arr = qObj.optJSONArray("counters") ?: return ""
        return (0 until arr.length())
            .mapNotNull { arr.optJSONObject(it) }
            .firstOrNull { it.optString("counterName", it.optString("counter_name", "")).equals(counterName, ignoreCase = true) }
            ?.let { it.optString("operatorName", it.optString("operator_name", "")) }
            ?: ""
    }

    private fun getTimeGreeting(hour: Int): String = when (hour) {
        in 4..10 -> "selamat pagi"
        in 11..14 -> "selamat siang"
        in 15..17 -> "selamat sore"
        else -> "selamat malam"
    }

    private fun getTimePeriod(hour: Int): String = when (hour) {
        in 4..10 -> "pagi"
        in 11..14 -> "siang"
        in 15..17 -> "sore"
        else -> "malam"
    }
}
