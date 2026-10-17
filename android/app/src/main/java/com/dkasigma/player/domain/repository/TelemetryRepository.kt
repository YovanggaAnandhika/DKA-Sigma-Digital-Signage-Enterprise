package com.dkasigma.player.domain.repository

import com.dkasigma.player.domain.model.ProofOfPlayLog

interface TelemetryRepository {
    suspend fun recordPlayback(log: ProofOfPlayLog)
    suspend fun flushPendingLogs(deviceId: String, deviceToken: String): Result<Int>
}
