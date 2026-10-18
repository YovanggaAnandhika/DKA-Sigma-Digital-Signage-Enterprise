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

        // Fallback offline-first: jika remote fetch gagal (network timeout, 404, 401, atau server restart),
        // gunakan manifest lokal yang tersimpan agar player tetap beroperasi normal tanpa logout otomatis.
        return if (cached != null) {
            Result.success(cached)
        } else {
            Result.failure(err ?: Exception("Gagal sinkronisasi manifest dan belum ada cache lokal"))
        }
    }
}
