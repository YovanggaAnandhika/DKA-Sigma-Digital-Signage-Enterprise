package com.dkaapis.sigma.presentation.player.canvas

import android.view.View
import com.dkaapis.sigma.domain.model.LayerZone
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Koordinator linimasa (timeline) untuk sinkronisasi rotasi blok dan visibilitas zona
 */
class SignageTimelineCoordinator {

    fun startTimeline(
        scope: CoroutineScope,
        layoutDuration: Int,
        zoneViewPairs: List<Pair<LayerZone, ZoneContainerView>>
    ): Job {
        val playStartTime = System.currentTimeMillis()
        val duration = layoutDuration.coerceAtLeast(1)

        return scope.launch {
            while (isActive) {
                val elapsed = ((System.currentTimeMillis() - playStartTime) / 1000) % duration
                for ((zone, zoneView) in zoneViewPairs) {
                    val hasActiveBlock = zone.blocks.any { b ->
                        elapsed >= b.startTimeSeconds && elapsed < (b.startTimeSeconds + b.durationSeconds)
                    }
                    zoneView.visibility = if (hasActiveBlock) View.VISIBLE else View.INVISIBLE
                }
                delay(500)
            }
        }
    }
}
