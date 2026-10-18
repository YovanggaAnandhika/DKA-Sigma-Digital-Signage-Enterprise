package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.repository.MediaStorageRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow

sealed class DownloadState {
    data class Verifying(val assetIndex: Int, val totalAssets: Int, val filename: String) : DownloadState()
    data class Progress(
        val assetIndex: Int,
        val totalAssets: Int,
        val percent: Int,
        val downloadedBytes: Long = 0L,
        val totalBytes: Long = 0L,
        val currentFileName: String = ""
    ) : DownloadState()
    data class AssetComplete(val asset: MediaAsset) : DownloadState()
    data class AllComplete(val manifest: Manifest) : DownloadState()
    data class Error(val asset: MediaAsset, val message: String) : DownloadState()
}

class DownloadAndVerifyMediaUseCase(
    private val storageRepository: MediaStorageRepository
) {
    fun execute(manifest: Manifest): Flow<DownloadState> = channelFlow {
        val allAssets = manifest.requiredAssets
        val total = allAssets.size

        if (total == 0) {
            trySend(DownloadState.AllComplete(manifest))
            return@channelFlow
        }

        val uncachedAssets = mutableListOf<MediaAsset>()

        // 1. Verifikasi integritas hash setiap chunk aset
        allAssets.forEachIndexed { index, asset ->
            trySend(DownloadState.Verifying(index + 1, total, asset.localFilename))
            val isCachedAndValid = storageRepository.isAssetCachedAndValid(asset)
            if (!isCachedAndValid) {
                uncachedAssets.add(asset)
            }
        }

        // 2. Jika seluruh aset sudah valid dan tersimpan di lokal
        if (uncachedAssets.isEmpty()) {
            trySend(
                DownloadState.Progress(
                    assetIndex = total,
                    totalAssets = total,
                    percent = 100,
                    downloadedBytes = manifest.totalDownloadSizeBytes,
                    totalBytes = manifest.totalDownloadSizeBytes,
                    currentFileName = "Integritas seluruh chunk valid (SHA-256)"
                )
            )
            delay(500)
            trySend(DownloadState.AllComplete(manifest))
            return@channelFlow
        }

        // 3. Unduh chunk demi chunk secara real-time untuk aset yang belum ada/rusak
        val totalToDownload = uncachedAssets.size
        uncachedAssets.forEachIndexed { index, asset ->
            var lastEmittedPercent = -1

            val downloadResult = storageRepository.downloadAssetResumable(asset) { downloaded, totalBytes ->
                if (totalBytes > 0) {
                    val currentPercent = ((downloaded * 100) / totalBytes).toInt()
                    if (currentPercent != lastEmittedPercent) {
                        lastEmittedPercent = currentPercent
                        trySend(
                            DownloadState.Progress(
                                assetIndex = index + 1,
                                totalAssets = totalToDownload,
                                percent = currentPercent,
                                downloadedBytes = downloaded,
                                totalBytes = totalBytes,
                                currentFileName = asset.localFilename
                            )
                        )
                    }
                }
            }

            if (downloadResult.isSuccess) {
                val file = downloadResult.getOrThrow()
                val isHashValid = storageRepository.verifyFileSha256(file, asset.sha256Hash)
                if (isHashValid) {
                    trySend(DownloadState.AssetComplete(asset.copy(isCached = true, localPath = file.absolutePath)))
                    trySend(
                        DownloadState.Progress(
                            assetIndex = index + 1,
                            totalAssets = totalToDownload,
                            percent = 100,
                            downloadedBytes = file.length(),
                            totalBytes = file.length(),
                            currentFileName = asset.localFilename
                        )
                    )
                } else {
                    file.delete()
                    trySend(DownloadState.Error(asset, "Hash SHA-256 tidak cocok untuk file: ${asset.localFilename}"))
                    return@channelFlow
                }
            } else {
                trySend(DownloadState.Error(asset, downloadResult.exceptionOrNull()?.message ?: "Gagal unduh chunk"))
                return@channelFlow
            }
        }

        // Bersihkan file lama yang sudah tidak ada di manifest aktif
        val activeIds = manifest.requiredAssets.map { it.mediaId }.toSet()
        storageRepository.cleanOrphanAssets(activeIds)

        trySend(DownloadState.AllComplete(manifest))
    }
}
