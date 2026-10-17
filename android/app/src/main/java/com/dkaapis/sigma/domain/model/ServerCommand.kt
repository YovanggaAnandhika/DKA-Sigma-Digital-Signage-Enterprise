package com.dkaapis.sigma.domain.model

enum class ServerCommandType {
    UNSPECIFIED,
    RELOAD_MANIFEST,
    CAPTURE_SCREENSHOT,
    REBOOT_PLAYER,
    EMERGENCY_BROADCAST,
    CLEAR_CACHE
}

data class ServerCommand(
    val messageId: String,
    val commandType: ServerCommandType,
    val payloadJson: String = "",
    val timestamp: Long = System.currentTimeMillis()
)
