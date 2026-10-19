package com.dkaapis.sigma.presentation.player.audio

import android.content.Context
import android.util.Log
import com.dkaapis.sigma.data.local.ServerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.net.URLEncoder

/**
 * Pengunduh audio TextToSpeech dari backend server dengan caching lokal pada disk.
 */
class RemoteTtsDownloader(
    private val httpClient: OkHttpClient
) {
    suspend fun downloadTtsAudio(context: Context, utteranceText: String): File? = withContext(Dispatchers.IO) {
        runCatching {
            val baseUrl = ServerConfig.getHttpBaseUrl(context)
            val encodedText = URLEncoder.encode(utteranceText, "UTF-8")
            val ttsUrl = "$baseUrl/api/tts?text=$encodedText"

            val ttsCacheDir = File(context.cacheDir, "tts_cache").apply { if (!exists()) mkdirs() }
            val cacheFileName = "tts_" + utteranceText.hashCode().toUInt().toString(16) + ".mp3"
            val cachedFile = File(ttsCacheDir, cacheFileName)

            if (!cachedFile.exists() || cachedFile.length() == 0L) {
                val request = Request.Builder()
                    .url(ttsUrl)
                    .header("User-Agent", "DKASigma-Signage-Android")
                    .build()
                val response = httpClient.newCall(request).execute()
                if (response.isSuccessful && response.body != null) {
                    val tempFile = File(ttsCacheDir, "$cacheFileName.tmp")
                    response.body!!.byteStream().use { input ->
                        FileOutputStream(tempFile).use { output ->
                            input.copyTo(output)
                        }
                    }
                    if (tempFile.length() > 0L) {
                        tempFile.renameTo(cachedFile)
                    } else {
                        tempFile.delete()
                    }
                }
            }

            cachedFile.takeIf { it.exists() && it.length() > 0L }
        }.onFailure { err ->
            Log.w(TAG, "Server TTS download gagal: ${err.message}")
        }.getOrNull()
    }

    companion object {
        private const val TAG = "RemoteTtsDownloader"
    }
}
