package com.dkaapis.sigma.domain.usecase

import com.dkaapis.sigma.domain.model.DownloadState
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.repository.MediaStorageRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow

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

        // 1. Verifikasi integritas hash setiap chunk aset
        val uncachedAssets = allAssets.filterIndexed { index, asset ->
            trySend(DownloadState.Verifying(index + 1, total, asset.localFilename))
            !storageRepository.isAssetCachedAndValid(asset)
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
        val totalDownloadBytes = uncachedAssets.sumOf { it.fileSizeBytes }.let { if (it > 0) it else 1L }
        var accumulatedDownloadedBytes = 0L
        var lastEmittedPercent = -1

        uncachedAssets.forEachIndexed { index, asset ->
            val assetExpectedSize = if (asset.fileSizeBytes > 0) asset.fileSizeBytes else 1L

            val downloadResult = storageRepository.downloadAssetResumable(asset) { downloaded, _ ->
                val overallDownloaded = (accumulatedDownloadedBytes + downloaded).coerceAtMost(totalDownloadBytes)
                val rawPercent = ((overallDownloaded * 100) / totalDownloadBytes).toInt()
                val monotonicPercent = maxOf(lastEmittedPercent, minOf(rawPercent, 99))

                if (monotonicPercent > lastEmittedPercent) {
                    lastEmittedPercent = monotonicPercent
                    trySend(
                        DownloadState.Progress(
                            assetIndex = index + 1,
                            totalAssets = totalToDownload,
                            percent = monotonicPercent,
                            downloadedBytes = overallDownloaded,
                            totalBytes = totalDownloadBytes,
                            currentFileName = asset.localFilename
                        )
                    )
                }
            }

            if (downloadResult.isSuccess) {
                val file = downloadResult.getOrThrow()
                if (storageRepository.verifyFileSha256(file, asset.sha256Hash)) {
                    accumulatedDownloadedBytes += file.length().coerceAtLeast(assetExpectedSize)
                    val overallDownloaded = accumulatedDownloadedBytes.coerceAtMost(totalDownloadBytes)
                    val stepPercent = ((overallDownloaded * 100) / totalDownloadBytes).toInt()
                    lastEmittedPercent = maxOf(lastEmittedPercent, minOf(stepPercent, if (index + 1 == totalToDownload) 100 else 99))

                    trySend(DownloadState.AssetComplete(asset.copy(isCached = true, localPath = file.absolutePath)))
                    trySend(
                        DownloadState.Progress(
                            assetIndex = index + 1,
                            totalAssets = totalToDownload,
                            percent = lastEmittedPercent,
                            downloadedBytes = overallDownloaded,
                            totalBytes = totalDownloadBytes,
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
