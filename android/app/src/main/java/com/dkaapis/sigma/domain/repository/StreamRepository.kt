package com.dkaapis.sigma.domain.repository

import com.dkaapis.sigma.domain.model.HeartbeatMetrics
import com.dkaapis.sigma.domain.model.ServerCommand
import kotlinx.coroutines.flow.Flow

interface StreamRepository {
    fun openDisplayStream(
        deviceId: String,
        deviceToken: String,
        heartbeatFlow: Flow<HeartbeatMetrics>
    ): Flow<ServerCommand>

    suspend fun sendCommandAck(messageId: String, success: Boolean, errorMessage: String? = null)
    suspend fun uploadScreenshot(requestId: String, imageBytes: ByteArray, mimeType: String = "image/jpeg"): Result<Unit>
}
