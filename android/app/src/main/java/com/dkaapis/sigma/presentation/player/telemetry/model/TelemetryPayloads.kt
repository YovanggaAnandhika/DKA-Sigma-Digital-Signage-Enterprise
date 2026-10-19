package com.dkaapis.sigma.presentation.player.telemetry.model

import com.dkaapis.sigma.data.analytics.AssetStatsData

/**
 * Payload callback untuk Watchdog & Heartbeat Telemetry
 */
data class WatchdogCallbackPayload(
    val getActiveManifestHash: () -> String?,
    val isDevicePaired: () -> Boolean,
    val onDeviceUnpaired: () -> Unit,
    val onNeedsManifestSync: () -> Unit,
    val onPendingCommand: (command: String) -> Unit,
    val collectAssetStats: () -> List<AssetStatsData>
)
