package com.dkaapis.sigma.data.http

import com.dkaapis.sigma.domain.model.MediaAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
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

            val randomAccess = RandomAccessFile(partFile, "rw")
            randomAccess.seek(existingBytes)

            val buffer = ByteArray(32768)
            var bytesRead: Int
            var currentBytes = existingBytes
            val inputStream = body.byteStream()

            inputStream.use { stream ->
                while (stream.read(buffer).also { bytesRead = it } != -1) {
                    randomAccess.write(buffer, 0, bytesRead)
                    currentBytes += bytesRead
                    onProgress(currentBytes, totalBytes)
                }
            }
            randomAccess.close()

            // Download completed, atomically rename .part to target
            if (targetFile.exists()) targetFile.delete()
            if (partFile.renameTo(targetFile)) {
                Result.success(targetFile)
            } else {
                Result.failure(Exception("Gagal rename file .part ke target"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
