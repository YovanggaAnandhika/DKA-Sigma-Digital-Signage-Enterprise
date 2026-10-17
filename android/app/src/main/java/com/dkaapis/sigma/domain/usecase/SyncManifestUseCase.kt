package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.repository.DeviceRepository
import com.dkaapis.sigma.domain.repository.ManifestRepository

class SyncManifestUseCase(
    private val deviceRepository: DeviceRepository,
    private val manifestRepository: ManifestRepository
) {
    suspend fun execute(): Result<Manifest?> {
        val deviceId = deviceRepository.getSavedDeviceId()
            ?: return Result.failure(IllegalStateException("Perangkat belum terhubung (ID kosong)"))

        val cached = manifestRepository.getLocalCachedManifest()
        val currentHash = cached?.versionHash ?: ""

        val remoteResult = manifestRepository.fetchActiveManifest(deviceId, currentHash)
        if (remoteResult.isSuccess) {
            val remoteManifest = remoteResult.getOrNull()
            if (remoteManifest != null) {
                manifestRepository.saveManifestLocally(remoteManifest)
                return Result.success(remoteManifest)
            }
            // Hash sama (up-to-date), kembalikan cached manifest
            return Result.success(cached)
        }

        val err = remoteResult.exceptionOrNull()
        val errMsg = err?.message ?: ""

        // Jika device telah dihapus atau ditolak dari CMS (404/401/Device not found)
        if (errMsg.contains("Device not found", ignoreCase = true) ||
            errMsg.contains("404") ||
            errMsg.contains("Unauthorized", ignoreCase = true) ||
            errMsg.contains("401") ||
            errMsg.contains("tidak ditemukan", ignoreCase = true)
        ) {
            deviceRepository.clearCredentials()
            manifestRepository.clearManifestCache()
            return Result.failure(IllegalStateException("Perangkat telah dihapus dari CMS. Silakan lakukan pairing ulang."))
        }

        // Jika offline murni / timeout, fallback ke manifest lokal yang sudah dicache
        return if (cached != null) {
            Result.success(cached)
        } else {
            Result.failure(err ?: Exception("Gagal sinkronisasi manifest"))
        }
    }
}
