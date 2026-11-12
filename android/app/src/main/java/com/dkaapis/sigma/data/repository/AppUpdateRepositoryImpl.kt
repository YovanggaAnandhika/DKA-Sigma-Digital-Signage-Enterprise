package com.dkaapis.sigma.data.repository

import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import com.dkaapis.sigma.BuildConfig
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.domain.model.AppUpdate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import signage.system.v1.update.AppUpdateServiceGrpcKt
import signage.system.v1.update.UpdateCommon
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

class AppUpdateRepositoryImpl(
    private val context: Context,
    private val channelFactory: GrpcChannelFactory
) {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .callTimeout(10, TimeUnit.MINUTES)
        .followRedirects(false)
        .build()

    suspend fun checkForUpdate(deviceId: String): AppUpdate? = withContext(Dispatchers.IO) {
        val request = UpdateCommon.CheckDeviceAppUpdateRequest.newBuilder()
            .setDeviceId(deviceId)
            .setCurrentVersionCode(BuildConfig.VERSION_CODE)
            .setCurrentVersionName(BuildConfig.VERSION_NAME)
            .build()

        val response = AppUpdateServiceGrpcKt.AppUpdateServiceCoroutineStub(channelFactory.getChannel())
            .withDeadlineAfter(30, TimeUnit.SECONDS)
            .checkDeviceAppUpdate(request)

        if (!response.updateAvailable || !response.hasLatestRelease()) return@withContext null

        response.latestRelease.let { release ->
            if (release.versionCode <= BuildConfig.VERSION_CODE) return@withContext null
            AppUpdate(
                id = release.id,
                versionCode = release.versionCode,
                versionName = release.versionName,
                apkFileUrl = release.apkFileUrl,
                fileSizeBytes = release.fileSizeBytes,
                sha256Hash = release.sha256Hash,
                releaseNotes = release.releaseNotes,
                isForceUpdate = response.isForceUpdate
            )
        }
    }

    suspend fun downloadAndVerify(
        update: AppUpdate,
        onProgress: (downloadedBytes: Long, totalBytes: Long) -> Unit
    ): File = withContext(Dispatchers.IO) {
        require(update.fileSizeBytes > 0) { "Ukuran APK tidak valid" }
        require(update.sha256Hash.matches(Regex("[a-fA-F0-9]{64}"))) { "Hash SHA-256 APK tidak valid" }

        val url = resolveApkUrl(update.apkFileUrl)
        val target = File.createTempFile("sigma-ota-", ".apk", context.cacheDir)

        try {
            val request = Request.Builder().url(url).get().build()
            httpClient.newCall(request).execute().use { response ->
                check(response.isSuccessful) { "Gagal mengunduh APK: HTTP ${response.code}" }
                val body = checkNotNull(response.body) { "Respons unduhan APK kosong" }
                val digest = MessageDigest.getInstance("SHA-256")
                var downloaded = 0L
                val coroutineJob = currentCoroutineContext()[Job]

                body.byteStream().use { input ->
                    FileOutputStream(target).use { output ->
                        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                        while (true) {
                            coroutineJob?.ensureActive()
                            val read = input.read(buffer)
                            if (read < 0) break
                            downloaded += read
                            check(downloaded <= update.fileSizeBytes) { "Ukuran APK melebihi ukuran rilis" }
                            digest.update(buffer, 0, read)
                            output.write(buffer, 0, read)
                            onProgress(downloaded, update.fileSizeBytes)
                        }
                    }
                }

                check(downloaded == update.fileSizeBytes) { "Ukuran APK tidak cocok dengan metadata rilis" }
                val actualHash = digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) }
                check(actualHash.equals(update.sha256Hash, ignoreCase = true)) {
                    "Hash SHA-256 APK tidak cocok"
                }
            }

            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageArchiveInfo(
                    target.absolutePath,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageArchiveInfo(target.absolutePath, 0)
            } ?: error("Berkas unduhan bukan APK yang valid")

            val apkVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toLong()
            }
            check(packageInfo.packageName == context.packageName) {
                "Package APK tidak cocok dengan aplikasi player"
            }
            check(apkVersionCode == update.versionCode.toLong()) {
                "Version code APK tidak cocok dengan rilis"
            }
            target
        } catch (error: Exception) {
            target.delete()
            throw error
        }
    }

    private fun resolveApkUrl(apkFileUrl: String): String {
        require(isAllowedApkPath(apkFileUrl)) { "URL APK harus berupa path /api/assets/<filename>" }
        val host = ServerConfig.getHost(context)
            .removePrefix("http://")
            .removePrefix("https://")
            .trimEnd('/')
        val scheme = if (ServerConfig.isTls(context)) "https" else "http"
        val serverUri = Uri.parse("$scheme://$host")
        require(
            !host.isBlank() &&
                serverUri.host != null &&
                serverUri.userInfo == null &&
                serverUri.encodedPath.isNullOrEmpty() &&
                serverUri.query == null &&
                serverUri.fragment == null
        ) { "Host server APK tidak valid" }
        return serverUri.buildUpon().encodedPath(apkFileUrl).build().toString()
    }

    companion object {
        internal fun isAllowedApkPath(path: String): Boolean {
            if (!path.startsWith("/api/assets/") || path.contains('?') || path.contains('#')) return false
            val filename = path.removePrefix("/api/assets/")
            return filename.isNotBlank() &&
                filename != "." &&
                filename != ".." &&
                filename.endsWith(".apk", ignoreCase = true) &&
                filename.matches(Regex("[A-Za-z0-9._-]+"))
        }
    }
}
