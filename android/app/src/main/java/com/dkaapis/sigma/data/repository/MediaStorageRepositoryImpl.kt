package com.dkaapis.sigma.data.repository

import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.grpc.GrpcMediaDownloader
import com.dkaapis.sigma.data.local.MediaDiskCache
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.repository.MediaStorageRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class MediaStorageRepositoryImpl(
    private val diskCache: MediaDiskCache,
    private val downloader: GrpcMediaDownloader
) : MediaStorageRepository {

    constructor(diskCache: MediaDiskCache, channelFactory: GrpcChannelFactory) : this(
        diskCache,
        GrpcMediaDownloader(channelFactory)
    )

    override fun isAssetCachedAndValid(asset: MediaAsset): Boolean {
        val file = diskCache.getAssetFile(asset.mediaId)
        if (!file.exists() || file.length() == 0L) return false
        return diskCache.verifyFileSha256(file, asset.sha256Hash)
    }

    override fun getLocalFileForAsset(mediaId: String): File? {
        val file = diskCache.getAssetFile(mediaId)
        return if (file.exists() && file.length() > 0) file else null
    }

    override suspend fun downloadAssetResumable(
        asset: MediaAsset,
        onProgress: (bytesDownloaded: Long, totalBytes: Long) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        val partFile = diskCache.getPartFile(asset.mediaId)
        val targetFile = diskCache.getAssetFile(asset.mediaId)
        downloader.download(asset, partFile, targetFile, onProgress)
    }

    override suspend fun verifyFileSha256(file: File, expectedHash: String): Boolean = withContext(Dispatchers.IO) {
        diskCache.verifyFileSha256(file, expectedHash)
    }

    override suspend fun cleanOrphanAssets(activeAssetIds: Set<String>) = withContext(Dispatchers.IO) {
        diskCache.cleanOrphanFiles(activeAssetIds)
    }

    override fun getFreeDiskSpaceBytes(): Long = diskCache.getFreeSpaceBytes()

    override fun getTotalDiskSpaceBytes(): Long = diskCache.getTotalSpaceBytes()
}
