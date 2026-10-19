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

        val prefix = payload.ticketNumber.substringBefore("-", "").trim()
        val digits = payload.ticketNumber.substringAfter("-", "").trim()
        val spokenDigits = mapDigitsToIndonesian(digits)
        val formattedTicket = when {
            prefix.isNotBlank() -> "$prefix, $spokenDigits"
            else -> spokenDigits
        }

        val ticketLabel = payload.ticketLabelOverride?.takeIf { it.isNotBlank() }
            ?: qObj.optString("ticketLabel", qObj.optString("ticket_label", "Nomor Antrian")).ifBlank { "Nomor Antrian" }

        val counterLabel = payload.counterLabelOverride?.takeIf { it.isNotBlank() }
            ?: qObj.optString("counterLabel", qObj.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()

        val defaultCallTemplate = "{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}"
        val defaultRecallTemplate = "Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}"

        val rawTemplate = when {
            payload.isRecall -> {
                payload.ttsTemplateRecallOverride?.takeIf { it.isNotBlank() }
                    ?: qObj.optString("ttsTemplateRecall", qObj.optString("tts_template_recall", defaultRecallTemplate)).ifBlank { defaultRecallTemplate }
            }
            else -> {
                payload.ttsTemplateCallOverride?.takeIf { it.isNotBlank() }
                    ?: qObj.optString("ttsTemplateCall", qObj.optString("tts_template_call", defaultCallTemplate)).ifBlank { defaultCallTemplate }
            }
        }

        val cleanCounterName = extractCleanCounterName(payload.counterName, counterLabel)
        val counterNumOnly = payload.counterName.filter { it.isDigit() }.ifEmpty { cleanCounterName }
        val operatorName = findOperatorName(qObj, payload.counterName)

        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val timeGreeting = getTimeGreeting(hour)
        val timePeriod = getTimePeriod(hour)
        val queueName = qObj.optString("name", "")
        val waitingCount = qObj.optInt("waitingTicketsCount", qObj.optInt("waiting_tickets_count", 0))

        val counterNameForTemplate = when {
            rawTemplate.contains("{counter_label}") -> cleanCounterName
            else -> "$counterLabel $cleanCounterName".trim()
        }

        return rawTemplate
            .replace("{ticket_label}", ticketLabel)
            .replace("{counter_label}", counterLabel)
            .replace("{ticket_number}", formattedTicket)
            .replace("{ticket_prefix}", prefix)
            .replace("{ticket_digits}", spokenDigits)
            .replace("{counter_name}", counterNameForTemplate)
            .replace("{counter_number}", counterNumOnly)
            .replace("{operator_name}", operatorName)
            .replace("{petugas}", operatorName)
            .replace("{queue_name}", queueName)
            .replace("{nama_antrian}", queueName)
            .replace("{salam}", timeGreeting)
            .replace("{waktu}", timePeriod)
            .replace("{waiting_count}", waitingCount.toString())
            .replace("{sisa_antrian}", waitingCount.toString())
            .replace(Regex("\\s+"), " ")
            .trim()
    }

    fun interpolateStatus(payload: CounterStatusPayload, queueDataJson: String?): String {
        val qObj = runCatching { JSONObject(queueDataJson ?: "{}") }.getOrDefault(JSONObject())
        val counterLabel = qObj.optString("counterLabel", qObj.optString("counter_label", "Loket")).ifBlank { "Loket" }.trim()
        val cleanCounterName = extractCleanCounterName(payload.counterName, counterLabel)
        val counterNumOnly = payload.counterName.filter { it.isDigit() }.ifEmpty { cleanCounterName }
        val opName = findOperatorName(qObj, payload.counterName)

        val defaultBreakTemplate = "{counter_label} {counter_name} sedang istirahat"
        val rawTemplate = when (payload.status.uppercase()) {
            "BREAK" -> qObj.optString("ttsTemplateBreak", qObj.optString("tts_template_break", defaultBreakTemplate)).ifBlank { defaultBreakTemplate }
            "LOCKED" -> "{counter_label} {counter_name} telah ditutup"
            else -> "{counter_label} {counter_name} siap melayani"
        }

        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val timeGreeting = getTimeGreeting(hour)
        val timePeriod = getTimePeriod(hour)
        val queueName = qObj.optString("name", "")

        val counterNameForTemplate = when {
            rawTemplate.contains("{counter_label}") -> cleanCounterName
            else -> "$counterLabel $cleanCounterName".trim()
        }

        return rawTemplate
            .replace("{counter_label}", counterLabel)
            .replace("{counter_name}", counterNameForTemplate)
            .replace("{counter_number}", counterNumOnly)
            .replace("{operator_name}", opName)
            .replace("{petugas}", opName)
            .replace("{queue_name}", queueName)
            .replace("{nama_antrian}", queueName)
            .replace("{salam}", timeGreeting)
            .replace("{waktu}", timePeriod)
            .replace(Regex("\\s+"), " ")
            .trim()
    }

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
        val cArr = qObj.optJSONArray("counters") ?: return ""
        for (i in 0 until cArr.length()) {
            val c = cArr.optJSONObject(i) ?: continue
            val cName = c.optString("counterName", c.optString("counter_name", ""))
            if (cName.equals(counterName, ignoreCase = true)) {
                return c.optString("operatorName", c.optString("operator_name", ""))
            }
        }
        return ""
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
