package com.dkaapis.sigma.domain.repository

import com.dkaapis.sigma.domain.model.MediaAsset
import java.io.File

interface MediaStorageRepository {
    fun isAssetCachedAndValid(asset: MediaAsset): Boolean
    fun getLocalFileForAsset(mediaId: String): File?
    suspend fun downloadAssetResumable(
        asset: MediaAsset,
        onProgress: (bytesDownloaded: Long, totalBytes: Long) -> Unit
    ): Result<File>
    suspend fun verifyFileSha256(file: File, expectedHash: String): Boolean
    suspend fun cleanOrphanAssets(activeAssetIds: Set<String>)
    fun getFreeDiskSpaceBytes(): Long
    fun getTotalDiskSpaceBytes(): Long
}
