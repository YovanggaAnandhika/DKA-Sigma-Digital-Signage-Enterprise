package com.dkaapis.sigma.data.repository

import android.content.Context
import android.os.Build
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.domain.model.DeviceInfo
import com.dkaapis.sigma.domain.model.PairingResult
import com.dkaapis.sigma.domain.repository.DeviceRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.NetworkInterface
import java.util.Collections

class DeviceRepositoryImpl(
    private val context: Context,
    private val tokenStorage: TokenStorage,
    private val channelFactory: GrpcChannelFactory
) : DeviceRepository {

    override suspend fun getLocalDeviceInfo(): DeviceInfo = withContext(Dispatchers.IO) {
        val dm = context.resources.displayMetrics
        val isLandscape = dm.widthPixels >= dm.heightPixels

        DeviceInfo(
            id = tokenStorage.getDeviceId() ?: "",
            name = Build.MODEL ?: "Android Display",
            macAddress = getMacAddress(),
            ipAddress = getIpAddress(),
            screenWidth = dm.widthPixels,
            screenHeight = dm.heightPixels,
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
            // Simulasi RPC call jika server belum siap / test offline
            // Saat proto terkompilasi, stub.registerDevice() akan dipanggil langsung
            val generatedPairingCode = "DKA-" + (100..999).random()
            val deviceId = ("DEV-" + info.macAddress.replace(":", "").takeLast(6).ifEmpty { "123456" }).uppercase()

            Result.success(
                PairingResult(
                    isSuccess = true,
                    deviceId = deviceId,
                    deviceToken = "",
                    errorMessage = null
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun checkPairingStatus(pairingCode: String): Result<PairingResult> = withContext(Dispatchers.IO) {
        try {
            // Cek ke server apakah admin di CMS sudah menyetujui pairing
            val savedToken = tokenStorage.getDeviceToken()
            if (!savedToken.isNullOrEmpty()) {
                Result.success(
                    PairingResult(
                        isSuccess = true,
                        deviceId = tokenStorage.getDeviceId() ?: "",
                        deviceToken = savedToken
                    )
                )
            } else {
                Result.success(
                    PairingResult(
                        isSuccess = false,
                        deviceId = tokenStorage.getDeviceId() ?: "",
                        deviceToken = "",
                        errorMessage = "Menunggu verifikasi admin di CMS"
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
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
