package com.dkasigma.player.domain.repository

import com.dkasigma.player.domain.model.DeviceInfo
import com.dkasigma.player.domain.model.PairingResult

interface DeviceRepository {
    suspend fun getLocalDeviceInfo(): DeviceInfo
    suspend fun registerDevice(): Result<PairingResult>
    suspend fun checkPairingStatus(pairingCode: String): Result<PairingResult>
    fun saveDeviceCredentials(deviceId: String, deviceToken: String)
    fun getSavedDeviceId(): String?
    fun getSavedDeviceToken(): String?
    fun clearCredentials()
    fun isPaired(): Boolean
}
