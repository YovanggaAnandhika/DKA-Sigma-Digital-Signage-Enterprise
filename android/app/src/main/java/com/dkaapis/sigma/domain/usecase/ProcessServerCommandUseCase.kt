package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.ServerCommand
import com.dkaapis.sigma.domain.model.ServerCommandType
import com.dkaapis.sigma.domain.repository.ManifestRepository
import com.dkaapis.sigma.domain.repository.MediaStorageRepository
import com.dkaapis.sigma.domain.repository.StreamRepository

sealed class CommandExecutionResult {
    data class ReloadManifest(val messageId: String) : CommandExecutionResult()
    data class CaptureScreenshot(val messageId: String) : CommandExecutionResult()
    data class ShowEmergency(val messageId: String, val alertText: String) : CommandExecutionResult()
    data class RebootPlayer(val messageId: String) : CommandExecutionResult()
    data class CacheCleared(val messageId: String) : CommandExecutionResult()
    data class Ignored(val messageId: String) : CommandExecutionResult()
}

class ProcessServerCommandUseCase(
    private val streamRepository: StreamRepository,
    private val manifestRepository: ManifestRepository,
    private val storageRepository: MediaStorageRepository
) {
    suspend fun execute(command: ServerCommand): CommandExecutionResult {
        return when (command.commandType) {
            ServerCommandType.RELOAD_MANIFEST -> {
                CommandExecutionResult.ReloadManifest(command.messageId)
            }
            ServerCommandType.CAPTURE_SCREENSHOT -> {
                CommandExecutionResult.CaptureScreenshot(command.messageId)
            }
            ServerCommandType.EMERGENCY_BROADCAST -> {
                CommandExecutionResult.ShowEmergency(command.messageId, command.payloadJson)
            }
            ServerCommandType.REBOOT_PLAYER -> {
                streamRepository.sendCommandAck(command.messageId, true)
                CommandExecutionResult.RebootPlayer(command.messageId)
            }
            ServerCommandType.CLEAR_CACHE -> {
                manifestRepository.clearManifestCache()
                storageRepository.cleanOrphanAssets(emptySet())
                streamRepository.sendCommandAck(command.messageId, true)
                CommandExecutionResult.CacheCleared(command.messageId)
            }
            else -> CommandExecutionResult.Ignored(command.messageId)
        }
    }
}
