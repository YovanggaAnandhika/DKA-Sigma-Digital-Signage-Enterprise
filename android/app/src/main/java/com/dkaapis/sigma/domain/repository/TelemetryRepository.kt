package com.dkaapis.sigma.domain.repository

import com.dkaapis.sigma.domain.model.ProofOfPlayLog

interface TelemetryRepository {
    suspend fun recordPlayback(log: ProofOfPlayLog)
    suspend fun flushPendingLogs(deviceId: String, deviceToken: String): Result<Int>
}
