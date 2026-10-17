package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.PairingResult
import com.dkaapis.sigma.domain.repository.DeviceRepository

class RegisterAndPairUseCase(
    private val deviceRepository: DeviceRepository
) {
    suspend fun register(): Result<PairingResult> {
        return deviceRepository.registerDevice()
    }

    suspend fun checkStatus(pairingCode: String): Result<PairingResult> {
        val result = deviceRepository.checkPairingStatus(pairingCode)
        if (result.isSuccess) {
            val pairing = result.getOrNull()
            if (pairing != null && pairing.isSuccess && pairing.deviceToken.isNotEmpty()) {
                deviceRepository.saveDeviceCredentials(pairing.deviceId, pairing.deviceToken)
            }
        }
        return result
    }

    fun isAlreadyPaired(): Boolean {
        return deviceRepository.isPaired()
    }
}
