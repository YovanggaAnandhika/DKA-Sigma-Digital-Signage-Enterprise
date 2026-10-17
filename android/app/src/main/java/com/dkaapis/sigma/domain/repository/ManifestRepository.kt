package com.dkasigma.player.domain.repository

import com.dkasigma.player.domain.model.Manifest

interface ManifestRepository {
    suspend fun fetchActiveManifest(deviceId: String, currentHash: String): Result<Manifest?>
    suspend fun getLocalCachedManifest(): Manifest?
    suspend fun saveManifestLocally(manifest: Manifest): Result<Unit>
    suspend fun clearManifestCache(): Result<Unit>
}
