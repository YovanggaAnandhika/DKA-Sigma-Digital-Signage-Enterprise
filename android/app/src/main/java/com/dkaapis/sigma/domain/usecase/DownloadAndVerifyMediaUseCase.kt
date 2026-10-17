package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.repository.MediaStorageRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

sealed class DownloadState {
    data class Progress(val assetIndex: Int, val totalAssets: Int, val percent: Int) : DownloadState()
    data class AssetComplete(val asset: MediaAsset) : DownloadState()
    data class AllComplete(val manifest: Manifest) : DownloadState()
    data class Error(val asset: MediaAsset, val message: String) : DownloadState()
}

class DownloadAndVerifyMediaUseCase(
    private val storageRepository: MediaStorageRepository
) {
    fun execute(manifest: Manifest): Flow<DownloadState> = flow {
        val uncachedAssets = manifest.requiredAssets.filter { !storageRepository.isAssetCachedAndValid(it) }

        if (uncachedAssets.isEmpty()) {
            emit(DownloadState.AllComplete(manifest))
            return@flow
        }

        val total = uncachedAssets.size
        uncachedAssets.forEachIndexed { index, asset ->
            var lastPercent = 0
            val downloadResult = storageRepository.downloadAssetResumable(asset) { downloaded, totalBytes ->
                if (totalBytes > 0) {
                    val currentPercent = ((downloaded * 100) / totalBytes).toInt()
                    if (currentPercent != lastPercent) {
                        lastPercent = currentPercent
                    }
                }
            }

            if (downloadResult.isSuccess) {
                val file = downloadResult.getOrThrow()
                val isHashValid = storageRepository.verifyFileSha256(file, asset.sha256Hash)
                if (isHashValid) {
                    emit(DownloadState.AssetComplete(asset.copy(isCached = true, localPath = file.absolutePath)))
                    emit(DownloadState.Progress(index + 1, total, ((index + 1) * 100) / total))
                } else {
                    file.delete()
                    emit(DownloadState.Error(asset, "Hash SHA-256 tidak cocok untuk file: ${asset.localFilename}"))
                    return@flow
                }
            } else {
                emit(DownloadState.Error(asset, downloadResult.exceptionOrNull()?.message ?: "Gagal unduh"))
                return@flow
            }
        }

        // Bersihkan file lama yang sudah tidak ada di manifest aktif
        val activeIds = manifest.requiredAssets.map { it.mediaId }.toSet()
        storageRepository.cleanOrphanAssets(activeIds)

        emit(DownloadState.AllComplete(manifest))
    }
}
