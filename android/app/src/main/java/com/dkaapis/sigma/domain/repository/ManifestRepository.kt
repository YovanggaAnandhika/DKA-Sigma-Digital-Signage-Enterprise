package com.dkaapis.sigma.domain.repository

import com.dkaapis.sigma.domain.model.Manifest

interface ManifestRepository {
    suspend fun fetchActiveManifest(deviceId: String, currentHash: String): Result<Manifest?>
    suspend fun getLocalCachedManifest(): Manifest?
    suspend fun saveManifestLocally(manifest: Manifest): Result<Unit>
    suspend fun clearManifestCache(): Result<Unit>
}
