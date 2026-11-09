package com.dkaapis.sigma

import com.dkaapis.sigma.presentation.renderers.queue.parser.QueueLayoutParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class QueueLayoutParserTest {
    @Test
    fun missingLayoutUsesVisibleTicketAndCounterItems() {
        val config = QueueLayoutParser.parse(null)

        assertEquals(2, config.items.size)
        assertTrue(config.items.any { it.itemType == "ticket_number" })
        assertTrue(config.items.any { it.itemType == "counter_loket" })
    }
}
