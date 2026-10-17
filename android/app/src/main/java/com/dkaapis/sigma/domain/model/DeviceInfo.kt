package com.dkasigma.player.domain.model

data class DeviceInfo(
    val id: String = "",
    val name: String = "",
    val macAddress: String = "",
    val ipAddress: String = "",
    val screenWidth: Int = 1920,
    val screenHeight: Int = 1080,
    val isLandscape: Boolean = true,
    val appVersion: String = "1.0.0",
    val androidVersion: String = "",
    val isPaired: Boolean = false,
    val pairingCode: String = "",
    val deviceToken: String = ""
)

data class PairingResult(
    val isSuccess: Boolean,
    val deviceId: String,
    val deviceToken: String,
    val errorMessage: String? = null
)
