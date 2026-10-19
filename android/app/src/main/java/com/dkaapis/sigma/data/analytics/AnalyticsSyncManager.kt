package com.dkaapis.sigma.data.analytics

import android.content.Context
import com.dkaapis.sigma.R
import com.dkaapis.sigma.data.local.AnalyticsLocalBuffer
import com.dkaapis.sigma.data.local.TokenStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class AnalyticsSyncManager(
    private val context: Context,
    private val tokenStorage: TokenStorage,
    private val localBuffer: AnalyticsLocalBuffer,
    private val channelFactory: com.dkaapis.sigma.data.grpc.GrpcChannelFactory
) {
    suspend fun recordAndSync(snapshot: AnalyticsSnapshotData) = withContext(Dispatchers.IO) {
        val deviceId = tokenStorage.getDeviceId() ?: return@withContext
        val deviceToken = tokenStorage.getDeviceToken() ?: ""

        val isDirectSuccess = try {
            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val protoSnapshot = signage.hardware.v1.device.DeviceCommon.AnalyticsSnapshot.newBuilder()
                .setId(snapshot.id)
                .setInputOutputJson(snapshot.inputOutputJson)
                .setAssetsStatsJson(snapshot.assetsStatsJson)
                .setRecordedAt(snapshot.recordedAt)
                .build()

            val request = signage.hardware.v1.device.DeviceCommon.IngestDeviceAnalyticsRequest.newBuilder()
                .setDeviceId(deviceId)
                .setDeviceToken(deviceToken)
                .setSnapshot(protoSnapshot)
                .build()

            val response = stub.ingestDeviceAnalytics(request)
            response.success
        } catch (_: Exception) {
            false
        }

        if (isDirectSuccess) {
            if (localBuffer.hasPending()) {
                flushOfflineBuffer(deviceId, deviceToken)
            }
        } else {
            localBuffer.append(snapshot)
        }
    }

    private suspend fun flushOfflineBuffer(deviceId: String, deviceToken: String) = withContext(Dispatchers.IO) {
        try {
            val batch = localBuffer.drainBatch(50)
            if (batch.isEmpty()) return@withContext

            val ids = mutableSetOf<String>()
            val reqBuilder = signage.hardware.v1.device.DeviceCommon.IngestDeviceAnalyticsBatchRequest.newBuilder()
                .setDeviceId(deviceId)
                .setDeviceToken(deviceToken)

            for (item in batch) {
                ids.add(item.id)
                reqBuilder.addSnapshots(
                    signage.hardware.v1.device.DeviceCommon.AnalyticsSnapshot.newBuilder()
                        .setId(item.id)
                        .setInputOutputJson(item.inputOutputJson)
                        .setAssetsStatsJson(item.assetsStatsJson)
                        .setRecordedAt(item.recordedAt)
                        .build()
                )
            }

            val stub = signage.hardware.v1.device.DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channelFactory.getChannel())
            val response = stub.ingestDeviceAnalyticsBatch(reqBuilder.build())
            if (response.success) {
                localBuffer.removeSynced(ids)
                android.util.Log.i("AnalyticsSync", "Batch flush gRPC berhasil: ${ids.size} data analitik offline terkirim.")
            }
        } catch (e: Exception) {
            android.util.Log.w("AnalyticsSync", "Gagal flush buffer offline gRPC: ${e.message}")
        }
    }
}
