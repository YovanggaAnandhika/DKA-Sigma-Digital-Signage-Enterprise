package com.dkaapis.sigma

import com.dkaapis.sigma.domain.model.DownloadState
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.repository.MediaStorageRepository
import com.dkaapis.sigma.domain.usecase.DownloadAndVerifyMediaUseCase
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.flow.toList
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class DownloadAndVerifyMediaUseCaseTest {
    @Test
    fun verifiesEveryCachedAssetBeforeCompleting() = runBlocking {
        val assets = listOf(
            MediaAsset("a", "", "hash-a", 1, "a.jpg"),
            MediaAsset("b", "", "hash-b", 1, "b.jpg")
        )
        val repository = CachedAssetRepository()
        val manifest = Manifest("manifest", "device", "hash", "layout", "Layout", requiredAssets = assets)

        val states = DownloadAndVerifyMediaUseCase(repository).execute(manifest).toList()

        assertEquals(listOf("a", "b"), repository.checkedMediaIds)
        assertEquals(2, states.count { it is DownloadState.Verifying })
        assertTrue(states.last() is DownloadState.AllComplete)
    }

    private class CachedAssetRepository : MediaStorageRepository {
        val checkedMediaIds = mutableListOf<String>()

        override suspend fun isAssetCachedAndValid(asset: MediaAsset): Boolean {
            checkedMediaIds.add(asset.mediaId)
            return true
        }

        override fun getLocalFileForAsset(mediaId: String): File? = null

        override suspend fun downloadAssetResumable(
            asset: MediaAsset,
            onProgress: (bytesDownloaded: Long, totalBytes: Long) -> Unit
        ): Result<File> = Result.failure(UnsupportedOperationException())

        override suspend fun verifyFileSha256(file: File, expectedHash: String): Boolean = false

        override suspend fun cleanOrphanAssets(activeAssetIds: Set<String>) = Unit

        override fun getFreeDiskSpaceBytes(): Long = 0

        override fun getTotalDiskSpaceBytes(): Long = 0
    }
}
