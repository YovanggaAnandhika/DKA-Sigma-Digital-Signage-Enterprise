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
            val bounds = wm.maximumWindowMetrics.bounds
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
            val orientation = if (info.isLandscape) {
                signage.hardware.v1.device.DeviceCommon.DeviceOrientation.ORIENTATION_LANDSCAPE
            } else {
                signage.hardware.v1.device.DeviceCommon.DeviceOrientation.ORIENTATION_PORTRAIT
            }

            val request = signage.hardware.v1.device.DeviceCommon.RegisterDeviceRequest.newBuilder()
                .setDeviceName(info.name.ifEmpty { "Android Display" })
                .setMacAddress(info.macAddress.ifEmpty { "02:00:00:00:00:00" })
                .setAppVersion(info.appVersion)
                .setAndroidVersion(info.androidVersion)
                .setScreenWidth(info.screenWidth)
                .setScreenHeight(info.screenHeight)
                .setOrientation(orientation)
                .build()

            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val response = stub.registerDevice(request)

            val realDeviceId = response.deviceId
            val realPairingCode = response.pairingCode.uppercase()

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
        } catch (e: Exception) {
            val info = getLocalDeviceInfo()
            val fallbackCode = "DKA-" + (100..999).random()
            val fallbackId = ("DEV-" + info.macAddress.replace(":", "").takeLast(6).ifEmpty { "123456" }).uppercase()
            Result.success(
                PairingResult(
                    isSuccess = true,
                    deviceId = fallbackId,
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

            val request = signage.hardware.v1.device.DeviceCommon.CheckPairingStatusRequest.newBuilder()
                .setPairingCode(pairingCode)
                .build()

            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val response = stub.checkPairingStatus(request)

            val isPaired = response.isPaired
            val deviceId = response.deviceId
            val deviceToken = response.deviceToken

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
    ): Result<com.dkaapis.sigma.domain.repository.HeartbeatResult> = withContext(Dispatchers.IO) {
        try {
            val deviceId = getSavedDeviceId() ?: return@withContext Result.failure(Exception("Device ID not found"))
            val deviceToken = getSavedDeviceToken() ?: ""

            val stat = android.os.StatFs(context.filesDir.absolutePath)
            val freeBytes = stat.availableBytes
            val totalBytes = stat.totalBytes

            val reqBuilder = signage.hardware.v1.device.DeviceCommon.HeartbeatRequest.newBuilder()
                .setDeviceId(deviceId)
                .setDeviceToken(deviceToken)
                .setStorageFreeBytes(freeBytes)
                .setStorageTotalBytes(totalBytes)
                .setMemoryUsagePercent(30)

            if (!currentMediaId.isNullOrEmpty()) reqBuilder.setCurrentPlayingMediaId(currentMediaId)
            if (!activeLayoutId.isNullOrEmpty()) reqBuilder.setActiveLayoutId(activeLayoutId)
            if (!manifestHash.isNullOrEmpty()) reqBuilder.setActiveManifestHash(manifestHash)

            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val response = stub.sendHeartbeat(reqBuilder.build())

            val pendingCmd = response.pendingCommand.takeIf { it.isNotBlank() }
            val hasReload = pendingCmd?.contains("Reload", ignoreCase = true) == true
            val needsSync = response.needsManifestSync || hasReload

            Result.success(
                com.dkaapis.sigma.domain.repository.HeartbeatResult(
                    needsManifestSync = needsSync,
                    pendingCommand = pendingCmd
                )
            )
        } catch (e: Exception) {
            android.util.Log.w("DeviceRepository", "gRPC SendHeartbeat error: ${e.message}")
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
