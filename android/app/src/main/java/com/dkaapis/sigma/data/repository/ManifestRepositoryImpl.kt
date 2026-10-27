package com.dkaapis.sigma.data.repository

import android.content.Context
import android.util.Log
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.repository.mapper.ManifestJsonDeserializer
import com.dkaapis.sigma.data.repository.mapper.ManifestJsonSerializer
import com.dkaapis.sigma.data.repository.mapper.ManifestProtoMapper
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.repository.ManifestRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import signage.distribution.v1.manifest.ManifestCommon
import signage.distribution.v1.manifest.ManifestServiceGrpcKt

/**
 * Implementasi repositori manifest signage:
 * Mengorkestrasikan pemanggilan gRPC GetActiveManifest, fallback cache lokal,
 * dan delegasi mapping entity ke mapper terisolasi.
 */
class ManifestRepositoryImpl(
    private val context: Context,
    private val manifestStorage: ManifestStorage,
    private val channelFactory: GrpcChannelFactory,
    private val tokenStorage: com.dkaapis.sigma.data.local.TokenStorage? = null
) : ManifestRepository {

    private val protoMapper = ManifestProtoMapper()
    private val jsonDeserializer = ManifestJsonDeserializer()
    private val jsonSerializer = ManifestJsonSerializer()

    override suspend fun fetchActiveManifest(deviceId: String, currentHash: String): Result<Manifest?> = withContext(Dispatchers.IO) {
        runCatching {
            val stub = ManifestServiceGrpcKt.ManifestServiceCoroutineStub(channelFactory.getChannel())
            val deviceToken = tokenStorage?.getDeviceToken().orEmpty()
            val request = ManifestCommon.GetActiveManifestRequest.newBuilder()
                .setDeviceId(deviceId)
                .setDeviceToken(deviceToken)
                .setClientCurrentHash(currentHash)
                .build()

            val response = stub.getActiveManifest(request)
            when {
                response.isUpToDate -> getLocalCachedManifest()
                response.hasManifest() -> {
                    val parsed = protoMapper.mapToDomain(response.manifest)
                    val json = jsonSerializer.serialize(parsed)
                    manifestStorage.saveManifest(json)
                    parsed
                }
                else -> getLocalCachedManifest()
            }
        }.recoverCatching { err ->
            Log.w(TAG, "gRPC GetActiveManifest error: ${err.message}, falling back to cache")
            getLocalCachedManifest() ?: throw err
        }
    }

    override suspend fun getLocalCachedManifest(): Manifest? = withContext(Dispatchers.IO) {
        val json = manifestStorage.getActiveManifestJson() ?: return@withContext null
        runCatching {
            jsonDeserializer.parse(JSONObject(json))
        }.getOrNull()
    }

    override suspend fun saveManifestLocally(manifest: Manifest): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val json = jsonSerializer.serialize(manifest)
            val success = manifestStorage.saveManifest(json)
            if (!success) error("Gagal menulis manifest ke penyimpanan lokal")
        }
    }

    override suspend fun clearManifestCache(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            manifestStorage.clear()
        }
    }

    companion object {
        private const val TAG = "ManifestRepository"
    }
}
