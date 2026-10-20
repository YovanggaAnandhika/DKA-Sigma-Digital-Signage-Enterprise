package com.dkaapis.sigma.data.repository

import android.util.Log
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.domain.model.HeartbeatMetrics
import com.dkaapis.sigma.domain.model.ServerCommand
import com.dkaapis.sigma.domain.model.ServerCommandType
import com.dkaapis.sigma.domain.repository.StreamRepository
import com.google.protobuf.ByteString
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import signage.distribution.v1.stream.StreamCommon
import signage.distribution.v1.stream.StreamCommon.ServerCommandType as ProtoCommandType
import signage.distribution.v1.stream.StreamServiceGrpcKt

class StreamRepositoryImpl(
    private val channelFactory: GrpcChannelFactory
) : StreamRepository {

    @Volatile
    private var outbound: Channel<StreamCommon.StreamClientMessage>? = null

    @Volatile
    private var activeDeviceId: String = ""

    override fun openDisplayStream(
        deviceId: String,
        deviceToken: String,
        heartbeatFlow: Flow<HeartbeatMetrics>
    ): Flow<ServerCommand> = flow<ServerCommand> {
        activeDeviceId = deviceId
        var backoffMs = 1_000L

        while (true) {
            var requests: Channel<StreamCommon.StreamClientMessage>? = null
            try {
                coroutineScope {
                    val channel = Channel<StreamCommon.StreamClientMessage>(Channel.BUFFERED)
                    requests = channel
                    outbound = channel

                    val stub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channelFactory.getChannel())
                    channel.send(pingMessage(deviceId, deviceToken, HeartbeatMetrics(0, 0, 0)))

                    val heartbeatJob = launch {
                        heartbeatFlow.collect { metrics ->
                            channel.send(pingMessage(deviceId, deviceToken, metrics))
                        }
                    }

                    try {
                        stub.displayStream(channel.receiveAsFlow()).collect { message ->
                            backoffMs = 1_000L
                            if (message.commandType != ProtoCommandType.COMMAND_UNSPECIFIED) {
                                emit(mapCommand(message))
                            }
                        }
                    } finally {
                        heartbeatJob.cancel()
                        channel.close()
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.w(TAG, "DisplayStream terputus: ${e.message}, rekoneksi dalam ${backoffMs}ms")
            } finally {
                if (outbound === requests) outbound = null
                runCatching { requests?.close() }
            }

            delay(backoffMs)
            backoffMs = (backoffMs * 2).coerceAtMost(30_000L)
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun sendCommandAck(messageId: String, success: Boolean, errorMessage: String?) {
        val ack = StreamCommon.StreamClientMessage.newBuilder()
            .setDeviceId(activeDeviceId)
            .setTimestamp(System.currentTimeMillis())
            .setCommandAck(
                StreamCommon.CommandAck.newBuilder()
                    .setMessageId(messageId)
                    .setSuccess(success)
                    .setErrorMessage(errorMessage.orEmpty())
                    .build()
            )
            .build()
        outbound?.trySend(ack)
    }

    override suspend fun uploadScreenshot(
        requestId: String,
        imageBytes: ByteArray,
        mimeType: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            if (activeDeviceId.isBlank()) error("Device belum terhubung ke DisplayStream")
            val stub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channelFactory.getChannel())
            val request = StreamCommon.UploadScreenshotRequest.newBuilder()
                .setDeviceId(activeDeviceId)
                .setImageData(ByteString.copyFrom(imageBytes))
                .setMimeType(mimeType)
                .build()
            stub.uploadScreenshot(request)
            Unit
        }
    }

    private fun pingMessage(
        deviceId: String,
        deviceToken: String,
        metrics: HeartbeatMetrics
    ): StreamCommon.StreamClientMessage =
        StreamCommon.StreamClientMessage.newBuilder()
            .setDeviceId(deviceId)
            .setDeviceToken(deviceToken)
            .setTimestamp(System.currentTimeMillis())
            .setPing(
                StreamCommon.HeartbeatPing.newBuilder()
                    .setMemoryPercent(metrics.memoryUsagePercent)
                    .setStorageFreeBytes(metrics.storageFreeBytes)
                    .setCurrentPlayingMediaId(metrics.currentPlayingMediaId)
                    .build()
            )
            .build()

    private fun mapCommand(message: StreamCommon.StreamServerMessage): ServerCommand =
        ServerCommand(
            messageId = message.messageId,
            commandType = when (message.commandType) {
                ProtoCommandType.COMMAND_RELOAD_MANIFEST -> ServerCommandType.RELOAD_MANIFEST
                ProtoCommandType.COMMAND_CAPTURE_SCREENSHOT -> ServerCommandType.CAPTURE_SCREENSHOT
                ProtoCommandType.COMMAND_REBOOT_PLAYER -> ServerCommandType.REBOOT_PLAYER
                ProtoCommandType.COMMAND_EMERGENCY_BROADCAST -> ServerCommandType.EMERGENCY_BROADCAST
                ProtoCommandType.COMMAND_CLEAR_CACHE -> ServerCommandType.CLEAR_CACHE
                ProtoCommandType.COMMAND_CUSTOM -> ServerCommandType.CUSTOM
                else -> ServerCommandType.UNSPECIFIED
            },
            payloadJson = message.payloadJson,
            timestamp = message.timestamp
        )

    companion object {
        private const val TAG = "StreamRepo"
    }
}
