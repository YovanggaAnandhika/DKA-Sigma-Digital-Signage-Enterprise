package com.dkaapis.sigma.data.grpc

import android.os.Build
import android.util.Log
import com.dkaapis.sigma.domain.model.MediaAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import signage.studio.v1.media.MediaCommon
import signage.studio.v1.media.MediaServiceGrpcKt
import java.io.File
import java.io.RandomAccessFile
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * Pengunduh berkas media berbasis gRPC murni (StreamMediaFile):
 * - Menggunakan port 50051 (StreamMediaFile RPC) tanpa port HTTP 80
 * - Mendukung resumable range download dengan start_byte offset
 * - Streaming chunk 256KB langsung ditulis ke disk .part file
 * - Multi-tier move strategi (.part -> file final)
 */
class GrpcMediaDownloader(
    private val channelFactory: GrpcChannelFactory
) {
    suspend fun download(
        asset: MediaAsset,
        partFile: File,
        targetFile: File,
        onProgress: (downloaded: Long, total: Long) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            // 1. Jika targetFile sudah ada di disk, gunakan langsung
            if (targetFile.exists() && targetFile.length() > 0) {
                if (partFile.exists()) partFile.delete()
                return@withContext Result.success(targetFile)
            }

            var existingBytes = 0L
            if (partFile.exists()) {
                existingBytes = partFile.length()
            }

            val channel = channelFactory.getChannel()
            val stub = MediaServiceGrpcKt.MediaServiceCoroutineStub(channel)

            // Tentukan nama file yang diminta ke backend
            val filenameToRequest = when {
                asset.localFilename.isNotBlank() && !asset.localFilename.startsWith("media_") -> asset.localFilename
                asset.url.isNotBlank() -> asset.url.substringAfterLast('/')
                else -> asset.mediaId
            }

            Log.i(TAG, "Requesting gRPC media stream for '$filenameToRequest' (start_byte=$existingBytes, targetSize=${asset.fileSizeBytes})")

            val request = MediaCommon.StreamMediaFileRequest.newBuilder()
                .setFilename(filenameToRequest)
                .setStartByte(existingBytes)
                .setEndByte(-1L)
                .build()

            var totalBytes = if (asset.fileSizeBytes > 0) asset.fileSizeBytes else existingBytes
            var currentBytes = existingBytes
            var lastProgressEmitTime = 0L

            RandomAccessFile(partFile, "rw").use { randomAccess ->
                if (existingBytes > 0) {
                    randomAccess.seek(existingBytes)
                }

                stub.streamMediaFile(request).collect { response ->
                    if (response.errorMessage.isNotEmpty()) {
                        throw Exception("gRPC StreamMediaFile error: ${response.errorMessage}")
                    }

                    if (response.totalSize > 0) {
                        totalBytes = response.totalSize
                    }

                    val chunk = response.chunkData.toByteArray()
                    if (chunk.isNotEmpty()) {
                        randomAccess.write(chunk)
                        currentBytes += chunk.size

                        val now = System.currentTimeMillis()
                        if (now - lastProgressEmitTime >= 100L || currentBytes >= totalBytes) {
                            lastProgressEmitTime = now
                            onProgress(currentBytes, totalBytes)
                        }
                    }
                }

                try {
                    randomAccess.fd.sync()
                } catch (_: Exception) {}
            }

            onProgress(currentBytes, totalBytes)

            // Pindahkan file .part ke targetFile dengan multi-tier fallback
            val moveSuccess = movePartToTarget(partFile, targetFile)
            if (moveSuccess && targetFile.exists() && targetFile.length() > 0) {
                Log.i(TAG, "Download gRPC sukses untuk $filenameToRequest (${targetFile.length()} bytes)")
                Result.success(targetFile)
            } else {
                Result.failure(Exception("Gagal memindahkan berkas .part ke target ($filenameToRequest)"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Gagal mengunduh media via gRPC: ${e.message}", e)
            Result.failure(e)
        }
    }

    private fun movePartToTarget(partFile: File, targetFile: File): Boolean {
        if (!partFile.exists() || partFile.length() == 0L) return false

        // Strategi 1: Coba rename biasa jika target belum ada / bisa dihapus
        if (targetFile.exists()) {
            targetFile.delete()
        }
        if (partFile.renameTo(targetFile)) {
            return true
        }

        // Strategi 2: Java NIO Files.move dengan REPLACE_EXISTING (Android API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Files.move(
                    partFile.toPath(),
                    targetFile.toPath(),
                    StandardCopyOption.REPLACE_EXISTING
                )
                if (targetFile.exists() && targetFile.length() > 0) {
                    return true
                }
            } catch (e: Exception) {
                Log.w(TAG, "Files.move failed: ${e.message}")
            }
        }

        // Strategi 3: Stream copy fallback (menembus file lock / FUSE emulated storage)
        try {
            partFile.inputStream().use { input ->
                targetFile.outputStream().use { output ->
                    input.copyTo(output)
                    output.flush()
                }
            }
            partFile.delete()
            return targetFile.exists() && targetFile.length() > 0
        } catch (e: Exception) {
            Log.e(TAG, "Stream copy fallback failed: ${e.message}", e)
        }

        return false
    }

    companion object {
        private const val TAG = "GrpcMediaDownloader"
    }
}
