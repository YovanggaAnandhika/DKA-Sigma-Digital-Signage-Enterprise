package com.dkaapis.sigma.data.repository

import android.content.Context
import android.os.Build
import com.dkaapis.sigma.R
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.domain.model.DeviceInfo
import com.dkaapis.sigma.domain.model.PairingResult
import com.dkaapis.sigma.domain.repository.DeviceRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.net.NetworkInterface
import java.util.Collections
import java.util.concurrent.TimeUnit

class DeviceRepositoryImpl(
    private val context: Context,
    private val tokenStorage: TokenStorage,
    private val channelFactory: GrpcChannelFactory
) : DeviceRepository {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    override suspend fun getLocalDeviceInfo(): DeviceInfo = withContext(Dispatchers.IO) {
        val dm = context.resources.displayMetrics
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as? android.view.WindowManager

        var realWidth = dm.widthPixels
        var realHeight = dm.heightPixels

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && wm != null) {
            val bounds = wm.currentWindowMetrics.bounds
            realWidth = bounds.width()
            realHeight = bounds.height()
        } else if (wm != null) {
            val realDm = android.util.DisplayMetrics()
            @Suppress("DEPRECATION")
            wm.defaultDisplay?.getRealMetrics(realDm)
            if (realDm.widthPixels > 0 && realDm.heightPixels > 0) {
                realWidth = realDm.widthPixels
                realHeight = realDm.heightPixels
            }
        }

        val isLandscape = realWidth >= realHeight
        val width = if (isLandscape) maxOf(realWidth, realHeight) else minOf(realWidth, realHeight)
        val height = if (isLandscape) minOf(realWidth, realHeight) else maxOf(realWidth, realHeight)

        DeviceInfo(
            id = tokenStorage.getDeviceId() ?: "",
            name = Build.MODEL ?: "Android Display",
            macAddress = getMacAddress(),
            ipAddress = getIpAddress(),
            screenWidth = width,
            screenHeight = height,
            isLandscape = isLandscape,
            appVersion = "1.0.0",
            androidVersion = Build.VERSION.RELEASE ?: "",
            isPaired = tokenStorage.isPaired(),
            deviceToken = tokenStorage.getDeviceToken() ?: ""
        )
    }

    override suspend fun registerDevice(): Result<PairingResult> = withContext(Dispatchers.IO) {
        try {
            val info = getLocalDeviceInfo()
            val baseUrl = try {
                context.getString(R.string.server_http_base_url)
            } catch (_: Exception) {
                "http://192.168.1.46:80"
            }

            val jsonBody = JSONObject().apply {
                put("deviceName", info.name.ifEmpty { "Android Display" })
                put("macAddress", info.macAddress.ifEmpty { "02:00:00:00:00:00" })
                put("appVersion", info.appVersion)
                put("androidVersion", info.androidVersion)
                put("screenWidth", info.screenWidth)
                put("screenHeight", info.screenHeight)
                put("orientation", if (info.isLandscape) 1 else 2)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/api/grpc/hardware/device/RegisterDevice")
                .post(jsonBody.toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val bodyStr = response.body?.string() ?: ""
                val json = JSONObject(bodyStr)
                val realDeviceId = json.optString("deviceId", "")
                val realPairingCode = json.optString("pairingCode", "").uppercase()

                if (realDeviceId.isNotEmpty()) {
                    tokenStorage.saveDeviceId(realDeviceId)
                }

                Result.success(
                    PairingResult(
                        isSuccess = true,
                        deviceId = realDeviceId,
                        deviceToken = "",
                        pairingCode = realPairingCode
                    )
                )
            } else {
                val fallbackCode = "DKA-" + (100..999).random()
                val fallbackId = ("DEV-" + info.macAddress.replace(":", "").takeLast(6).ifEmpty { "123456" }).uppercase()
                Result.success(
                    PairingResult(
                        isSuccess = true,
                        deviceId = fallbackId,
                        deviceToken = "",
                        pairingCode = fallbackCode
                    )
                )
            }
        } catch (e: Exception) {
            val fallbackCode = "DKA-" + (100..999).random()
            Result.success(
                PairingResult(
                    isSuccess = true,
                    deviceId = "DEV-LOCAL",
                    deviceToken = "",
                    pairingCode = fallbackCode,
                    errorMessage = e.message
                )
            )
        }
    }

    override suspend fun checkPairingStatus(pairingCode: String): Result<PairingResult> = withContext(Dispatchers.IO) {
        try {
            val savedToken = tokenStorage.getDeviceToken()
            if (!savedToken.isNullOrEmpty()) {
                return@withContext Result.success(
                    PairingResult(
                        isSuccess = true,
                        deviceId = tokenStorage.getDeviceId() ?: "",
                        deviceToken = savedToken,
                        pairingCode = pairingCode
                    )
                )
            }

            val baseUrl = try {
                context.getString(R.string.server_http_base_url)
            } catch (_: Exception) {
                "http://192.168.1.46:80"
            }

            val jsonBody = JSONObject().apply {
                put("pairingCode", pairingCode)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/api/grpc/hardware/device/CheckPairingStatus")
                .post(jsonBody.toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val bodyStr = response.body?.string() ?: ""
                val json = JSONObject(bodyStr)
                val isPaired = json.optBoolean("isPaired", false)
                val deviceId = json.optString("deviceId", "")
                val deviceToken = json.optString("deviceToken", "")

                if (isPaired && deviceToken.isNotEmpty()) {
                    tokenStorage.saveCredentials(deviceId, deviceToken)
                    Result.success(
                        PairingResult(
                            isSuccess = true,
                            deviceId = deviceId,
                            deviceToken = deviceToken,
                            pairingCode = pairingCode
                        )
                    )
                } else {
                    Result.success(
                        PairingResult(
                            isSuccess = false,
                            deviceId = deviceId,
                            deviceToken = "",
                            pairingCode = pairingCode,
                            errorMessage = "Menunggu verifikasi admin di CMS"
                        )
                    )
                }
            } else {
                Result.success(
                    PairingResult(
                        isSuccess = false,
                        deviceId = "",
                        deviceToken = "",
                        pairingCode = pairingCode,
                        errorMessage = "Menunggu verifikasi admin di CMS"
                    )
                )
            }
        } catch (e: Exception) {
            Result.success(
                PairingResult(
                    isSuccess = false,
                    deviceId = "",
                    deviceToken = "",
                    pairingCode = pairingCode,
                    errorMessage = e.message
                )
            )
        }
    }

    override fun saveDeviceCredentials(deviceId: String, deviceToken: String) {
        tokenStorage.saveCredentials(deviceId, deviceToken)
    }

    override fun getSavedDeviceId(): String? = tokenStorage.getDeviceId()

    override fun getSavedDeviceToken(): String? = tokenStorage.getDeviceToken()

    override fun clearCredentials() {
        tokenStorage.clear()
    }

    override fun isPaired(): Boolean = tokenStorage.isPaired()

    override suspend fun sendHeartbeat(
        currentMediaId: String?,
        activeLayoutId: String?,
        manifestHash: String?
    ): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val deviceId = getSavedDeviceId() ?: return@withContext Result.failure(Exception("Device ID not found"))
            val deviceToken = getSavedDeviceToken() ?: ""
            val baseUrl = try {
                context.getString(R.string.server_http_base_url)
            } catch (_: Exception) {
                "http://192.168.1.46:80"
            }

            val stat = android.os.StatFs(context.filesDir.absolutePath)
            val freeBytes = stat.availableBytes
            val totalBytes = stat.totalBytes

            val jsonBody = JSONObject().apply {
                put("deviceId", deviceId)
                put("deviceToken", deviceToken)
                put("storageFreeBytes", freeBytes)
                put("storageTotalBytes", totalBytes)
                put("memoryUsagePercent", 30)
                if (!currentMediaId.isNullOrEmpty()) put("currentPlayingMediaId", currentMediaId)
                if (!activeLayoutId.isNullOrEmpty()) put("activeLayoutId", activeLayoutId)
                if (!manifestHash.isNullOrEmpty()) put("activeManifestHash", manifestHash)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/api/grpc/hardware/device/SendHeartbeat")
                .post(jsonBody.toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "")
                val needsSync = json.optBoolean("needsManifestSync", false) || json.optBoolean("needs_manifest_sync", false)
                Result.success(needsSync)
            } else if (response.code == 404 || response.code == 401) {
                clearCredentials()
                Result.failure(IllegalStateException("Perangkat telah dihapus dari CMS (HTTP ${response.code})"))
            } else {
                Result.success(false)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun getMacAddress(): String {
        try {
            val all = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (nif in all) {
                if (!nif.name.equals("wlan0", ignoreCase = true) && !nif.name.equals("eth0", ignoreCase = true)) continue
                val macBytes = nif.hardwareAddress ?: continue
                val res = StringBuilder()
                for (b in macBytes) {
                    res.append("%02X:".format(b))
                }
                if (res.isNotEmpty()) res.deleteCharAt(res.length - 1)
                return res.toString()
            }
        } catch (_: Exception) {}
        return "02:00:00:00:00:00"
    }

    private fun getIpAddress(): String {
        try {
            val all = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (nif in all) {
                val addrs = Collections.list(nif.inetAddresses)
                for (addr in addrs) {
                    if (!addr.isLoopbackAddress) {
                        val s = addr.hostAddress ?: ""
                        val isIPv4 = s.indexOf(':') < 0
                        if (isIPv4) return s
                    }
                }
            }
        } catch (_: Exception) {}
        return "127.0.0.1"
    }
}
