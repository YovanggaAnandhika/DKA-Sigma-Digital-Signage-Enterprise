package com.dkaapis.sigma.domain.repository

import com.dkaapis.sigma.domain.model.DeviceInfo
import com.dkaapis.sigma.domain.model.PairingResult

data class HeartbeatResult(
    val needsManifestSync: Boolean,
    val pendingCommand: String? = null
)

interface DeviceRepository {
    suspend fun getLocalDeviceInfo(): DeviceInfo
    suspend fun registerDevice(): Result<PairingResult>
    suspend fun checkPairingStatus(pairingCode: String): Result<PairingResult>
    suspend fun sendHeartbeat(
        currentMediaId: String? = null,
        activeLayoutId: String? = null,
        manifestHash: String? = null
    ): Result<HeartbeatResult>
    fun saveDeviceCredentials(deviceId: String, deviceToken: String)
    fun getSavedDeviceId(): String?
    fun getSavedDeviceToken(): String?
    fun clearCredentials()
    fun isPaired(): Boolean
}
