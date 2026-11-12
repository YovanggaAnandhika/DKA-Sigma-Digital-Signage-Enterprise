package com.dkaapis.sigma.presentation.player.settings.model

import com.dkaapis.sigma.domain.model.AppUpdate

/**
 * Model payload untuk inisialisasi dialog pengaturan player
 */
data class PlayerSettingsPayload(
    val deviceId: String = "",
    val serverHost: String = "",
    val serverGrpcPort: Int = 50051,
    val availableAppUpdate: AppUpdate? = null,
    val onAppUpdateRequested: (AppUpdate) -> Unit = {},
    val isProgressUploadEnabled: Boolean = true,
    val onProgressUploadToggled: (Boolean) -> Unit = {},
    val isKioskModeEnabled: Boolean = false,
    val onKioskModeToggled: (Boolean) -> Unit = {},
    val onScreenSleepRequested: () -> Unit = {},
    val onExitAppRequested: () -> Unit = {},
    val onUnbindRequested: () -> Unit = {}
)
