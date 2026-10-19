package com.dkaapis.sigma.data.http

import android.os.Build
import android.util.Log
import com.dkaapis.sigma.domain.model.MediaAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileInputStream
import java.io.RandomAccessFile
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

class ResumableDownloader(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
) {

    suspend fun download(
        asset: MediaAsset,
        partFile: File,
        targetFile: File,
        onProgress: (downloaded: Long, total: Long) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            // 1. Jika targetFile sudah ada dan valid (lolos hash SHA-256), gunakan langsung
            if (targetFile.exists() && targetFile.length() > 0) {
                if (asset.sha256Hash.isNotBlank() && verifySha256(targetFile, asset.sha256Hash)) {
                    if (partFile.exists()) partFile.delete()
                    return@withContext Result.success(targetFile)
                }
            }

            var existingBytes = 0L
            if (partFile.exists()) {
                existingBytes = partFile.length()
            }

            val requestBuilder = Request.Builder().url(asset.url)
            if (existingBytes > 0) {
                requestBuilder.header("Range", "bytes=$existingBytes-")
            }

            val response = client.newCall(requestBuilder.build()).execute()
            if (!response.isSuccessful && response.code != 206) {
                // If range request is not satisfiable (e.g. file changed), restart from 0
                if (response.code == 416) {
                    partFile.delete()
                    return@withContext download(asset, partFile, targetFile, onProgress)
                }
                return@withContext Result.failure(Exception("HTTP error code: ${response.code}"))
            }

            val body = response.body ?: return@withContext Result.failure(Exception("Empty body"))
            val contentLength = body.contentLength()
            val totalBytes = if (response.code == 206) existingBytes + contentLength else contentLength

            RandomAccessFile(partFile, "rw").use { randomAccess ->
                randomAccess.seek(existingBytes)

                val buffer = ByteArray(65536)
                var bytesRead: Int
                var currentBytes = existingBytes
                val inputStream = body.byteStream()
                var lastProgressEmitTime = 0L

                inputStream.use { stream ->
                    while (stream.read(buffer).also { bytesRead = it } != -1) {
                        randomAccess.write(buffer, 0, bytesRead)
                        currentBytes += bytesRead

                        val now = System.currentTimeMillis()
                        if (now - lastProgressEmitTime >= 100L || currentBytes >= totalBytes) {
                            lastProgressEmitTime = now
                            onProgress(currentBytes, totalBytes)
                        }
                    }
                }
                onProgress(currentBytes, totalBytes)

                try {
                    randomAccess.fd.sync()
                } catch (_: Exception) {}
            }

            // Download completed, pindahkan .part ke targetFile dengan strategi multi-tier
            val moveSuccess = movePartToTarget(partFile, targetFile)
            if (moveSuccess && targetFile.exists() && targetFile.length() > 0) {
                Result.success(targetFile)
            } else {
                Result.failure(Exception("Gagal memindahkan file .part ke target"))
            }
        } catch (e: Exception) {
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
                Log.w("ResumableDownloader", "Files.move failed: ${e.message}")
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
            Log.e("ResumableDownloader", "Stream copy fallback failed: ${e.message}", e)
        }

        return false
    }

    private fun verifySha256(file: File, expectedHash: String): Boolean {
        return try {
            val digest = MessageDigest.getInstance("SHA-256")
            FileInputStream(file).use { fis ->
                val buffer = ByteArray(65536)
                var bytesRead: Int
                while (fis.read(buffer).also { bytesRead = it } != -1) {
                    digest.update(buffer, 0, bytesRead)
                }
            }
            val computed = digest.digest().joinToString("") { "%02x".format(it) }
            computed.equals(expectedHash.trim(), ignoreCase = true)
        } catch (_: Exception) {
            false
        }
    }
}
