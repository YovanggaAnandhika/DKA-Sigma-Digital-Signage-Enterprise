package com.dkaapis.sigma.data.repository

import android.content.Context
import android.os.Build
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.domain.model.DeviceInfo
import com.dkaapis.sigma.domain.model.PairingResult
import com.dkaapis.sigma.domain.repository.DeviceRepository
import com.dkaapis.sigma.domain.repository.HeartbeatResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
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
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as? android.view.WindowManager
        val (rawW, rawH) = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && wm != null -> {
                val b = wm.maximumWindowMetrics.bounds
                b.width() to b.height()
            }
            wm != null -> {
                val dm = android.util.DisplayMetrics()
                @Suppress("DEPRECATION")
                wm.defaultDisplay?.getRealMetrics(dm)
                if (dm.widthPixels > 0 && dm.heightPixels > 0) dm.widthPixels to dm.heightPixels
                else context.resources.displayMetrics.let { it.widthPixels to it.heightPixels }
            }
            else -> context.resources.displayMetrics.let { it.widthPixels to it.heightPixels }
        }

        val isLandscape = rawW >= rawH
        DeviceInfo(
            id = tokenStorage.getDeviceId().orEmpty(),
            name = Build.MODEL ?: "Android Display",
            macAddress = getMacAddress(),
            ipAddress = getIpAddress(),
            screenWidth = if (isLandscape) maxOf(rawW, rawH) else minOf(rawW, rawH),
            screenHeight = if (isLandscape) minOf(rawW, rawH) else maxOf(rawW, rawH),
            isLandscape = isLandscape,
            appVersion = "1.0.0",
            androidVersion = Build.VERSION.RELEASE.orEmpty(),
            isPaired = tokenStorage.isPaired(),
            deviceToken = tokenStorage.getDeviceToken().orEmpty()
        )
    }

    override suspend fun registerDevice(): Result<PairingResult> = withContext(Dispatchers.IO) {
        runCatching {
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

            if (response.deviceId.isNotEmpty()) {
                tokenStorage.saveDeviceId(response.deviceId)
            }

            PairingResult(
                isSuccess = true,
                deviceId = response.deviceId,
                deviceToken = "",
                pairingCode = response.pairingCode.uppercase()
            )
        }.recoverCatching { e ->
            val info = getLocalDeviceInfo()
            PairingResult(
                isSuccess = true,
                deviceId = ("DEV-" + info.macAddress.replace(":", "").takeLast(6).ifEmpty { "123456" }).uppercase(),
                deviceToken = "",
                pairingCode = "DKA-" + (100..999).random(),
                errorMessage = e.message
            )
        }
    }

    override suspend fun checkPairingStatus(pairingCode: String): Result<PairingResult> = withContext(Dispatchers.IO) {
        val savedToken = tokenStorage.getDeviceToken()
        if (!savedToken.isNullOrEmpty()) {
            return@withContext Result.success(
                PairingResult(
                    isSuccess = true,
                    deviceId = tokenStorage.getDeviceId().orEmpty(),
                    deviceToken = savedToken,
                    pairingCode = pairingCode
                )
            )
        }

        runCatching {
            val request = signage.hardware.v1.device.DeviceCommon.CheckPairingStatusRequest.newBuilder()
                .setPairingCode(pairingCode)
                .build()

            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val response = stub.checkPairingStatus(request)

            if (response.isPaired && response.deviceToken.isNotEmpty()) {
                tokenStorage.saveCredentials(response.deviceId, response.deviceToken)
                PairingResult(
                    isSuccess = true,
                    deviceId = response.deviceId,
                    deviceToken = response.deviceToken,
                    pairingCode = pairingCode
                )
            } else {
                PairingResult(
                    isSuccess = false,
                    deviceId = response.deviceId,
                    deviceToken = "",
                    pairingCode = pairingCode,
                    errorMessage = "Menunggu verifikasi admin di CMS"
                )
            }
        }.recoverCatching { e ->
            PairingResult(
                isSuccess = false,
                deviceId = "",
                deviceToken = "",
                pairingCode = pairingCode,
                errorMessage = e.message
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
    ): Result<HeartbeatResult> = withContext(Dispatchers.IO) {
        val deviceId = getSavedDeviceId() ?: return@withContext Result.failure(Exception("Device ID not found"))
        val stat = android.os.StatFs(context.filesDir.absolutePath)

        runCatching {
            val req = signage.hardware.v1.device.DeviceCommon.HeartbeatRequest.newBuilder()
                .setDeviceId(deviceId)
                .setDeviceToken(getSavedDeviceToken().orEmpty())
                .setStorageFreeBytes(stat.availableBytes)
                .setStorageTotalBytes(stat.totalBytes)
                .setMemoryUsagePercent(30)
                .apply {
                    if (!currentMediaId.isNullOrEmpty()) setCurrentPlayingMediaId(currentMediaId)
                    if (!activeLayoutId.isNullOrEmpty()) setActiveLayoutId(activeLayoutId)
                    if (!manifestHash.isNullOrEmpty()) setActiveManifestHash(manifestHash)
                }
                .build()

            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val response = stub.sendHeartbeat(req)
            val pendingCmd = response.pendingCommand.takeIf { it.isNotBlank() }

            HeartbeatResult(
                needsManifestSync = response.needsManifestSync || (pendingCmd?.contains("Reload", ignoreCase = true) == true),
                pendingCommand = pendingCmd
            )
        }.onFailure { e ->
            android.util.Log.w("DeviceRepository", "gRPC SendHeartbeat error: ${e.message}")
        }
    }

    private fun getMacAddress(): String = runCatching {
        Collections.list(NetworkInterface.getNetworkInterfaces())
            .filter { it.name.equals("wlan0", ignoreCase = true) || it.name.equals("eth0", ignoreCase = true) }
            .mapNotNull { it.hardwareAddress }
            .firstOrNull { it.isNotEmpty() }
            ?.joinToString(":") { "%02X".format(it) }
    }.getOrNull() ?: "02:00:00:00:00:00"

    private fun getIpAddress(): String = runCatching {
        Collections.list(NetworkInterface.getNetworkInterfaces())
            .asSequence()
            .flatMap { Collections.list(it.inetAddresses).asSequence() }
            .firstOrNull { !it.isLoopbackAddress && it.hostAddress?.contains(':') == false }
            ?.hostAddress
    }.getOrNull() ?: "127.0.0.1"
}
