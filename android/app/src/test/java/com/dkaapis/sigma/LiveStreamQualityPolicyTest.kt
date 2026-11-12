package com.dkaapis.sigma

import com.dkaapis.sigma.presentation.renderers.LiveStreamProfile
import com.dkaapis.sigma.presentation.renderers.LiveStreamQualityWindow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LiveStreamQualityPolicyTest {
    @Test
    fun qualityProfilesStepDownAndRecoverWithinTheDeviceLimit() {
        assertEquals(LiveStreamProfile.HD, LiveStreamProfile.SOURCE.lowerQuality())
        assertEquals(LiveStreamProfile.SD, LiveStreamProfile.HD.lowerQuality())
        assertEquals(LiveStreamProfile.HD, LiveStreamProfile.SD.higherQuality(LiveStreamProfile.HD))
        assertEquals(null, LiveStreamProfile.HD.higherQuality(LiveStreamProfile.HD))
    }

    @Test
    fun qualityWindowDetectsRepeatedBufferingOrMeaningfulFrameDrops() {
        assertTrue(LiveStreamQualityWindow(0, 300, 2).isPoor())
        assertTrue(LiveStreamQualityWindow(10, 290, 0).isPoor())
        assertFalse(LiveStreamQualityWindow(3, 297, 0).isPoor())
        assertTrue(LiveStreamQualityWindow(0, 300, 0).isStable())
    }
}
