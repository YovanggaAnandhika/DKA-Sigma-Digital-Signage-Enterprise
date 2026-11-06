package com.dkaapis.sigma

import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.hasActiveBlockAt
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LayerZoneScheduleTest {
    @Test
    fun activeBlocksUseInclusiveStartAndExclusiveEnd() {
        val zone = LayerZone(
            id = "zone",
            name = "Zone",
            x = 0,
            y = 0,
            width = 100,
            height = 100,
            blocks = listOf(LayerBlock(id = "block", startTimeSeconds = 10, durationSeconds = 5))
        )

        assertFalse(zone.hasActiveBlockAt(9))
        assertTrue(zone.hasActiveBlockAt(10))
        assertTrue(zone.hasActiveBlockAt(14))
        assertFalse(zone.hasActiveBlockAt(15))
    }
}
