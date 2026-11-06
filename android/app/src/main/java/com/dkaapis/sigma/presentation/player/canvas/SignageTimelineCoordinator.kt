package com.dkaapis.sigma.presentation.player.canvas

import android.view.View
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.hasActiveBlockAt
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
        zoneViewPairs: List<Pair<LayerZone, ZoneContainerView>>,
        onZoneActiveChanged: (zoneId: String, isActive: Boolean) -> Unit
    ): Job {
        val playStartTime = System.currentTimeMillis()
        val duration = layoutDuration.coerceAtLeast(1)

        return scope.launch {
            val activeByZone = mutableMapOf<String, Boolean>()
            while (isActive) {
                val elapsed = ((System.currentTimeMillis() - playStartTime) / 1000) % duration
                for ((zone, zoneView) in zoneViewPairs) {
                    val hasActiveBlock = zone.hasActiveBlockAt(elapsed.toInt())
                    zoneView.visibility = if (hasActiveBlock) View.VISIBLE else View.INVISIBLE
                    if (activeByZone[zone.id] != hasActiveBlock) {
                        activeByZone[zone.id] = hasActiveBlock
                        onZoneActiveChanged(zone.id, hasActiveBlock)
                    }
                }
                delay(500)
            }
        }
    }
}
