package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.ProofOfPlayLog
import com.dkaapis.sigma.domain.repository.DeviceRepository
import com.dkaapis.sigma.domain.repository.TelemetryRepository

class ReportProofOfPlayUseCase(
    private val deviceRepository: DeviceRepository,
    private val telemetryRepository: TelemetryRepository
) {
    suspend fun recordItem(mediaId: String, layoutId: String, durationSeconds: Int, isCompleted: Boolean) {
        val log = ProofOfPlayLog(
            mediaId = mediaId,
            layoutId = layoutId,
            startedAtSeconds = System.currentTimeMillis() / 1000,
            durationSeconds = durationSeconds,
            isCompleted = isCompleted
        )
        telemetryRepository.recordPlayback(log)
    }

    suspend fun flushBatch(): Result<Int> {
        val deviceId = deviceRepository.getSavedDeviceId() ?: return Result.failure(IllegalStateException("No device id"))
        val deviceToken = deviceRepository.getSavedDeviceToken() ?: return Result.failure(IllegalStateException("No token"))
        return telemetryRepository.flushPendingLogs(deviceId, deviceToken)
    }
}
