package com.dkasigma.player.data.grpc

import io.grpc.ManagedChannel
import io.grpc.okhttp.OkHttpChannelBuilder
import java.util.concurrent.TimeUnit

class GrpcChannelFactory(
    private val host: String = "10.0.2.2", // Standard Android emulator localhost bridge or server IP
    private val port: Int = 50051,
    private val useTls: Boolean = false
) {
    private var channel: ManagedChannel? = null

    @Synchronized
    fun getChannel(): ManagedChannel {
        val current = channel
        if (current != null && !current.isShutdown && !current.isTerminated) {
            return current
        }

        val builder = OkHttpChannelBuilder.forAddress(host, port)
            .keepAliveTime(15, TimeUnit.SECONDS)
            .keepAliveTimeout(10, TimeUnit.SECONDS)
            .keepAliveWithoutCalls(true)

        if (!useTls) {
            builder.usePlaintext()
        }

        val newChannel = builder.build()
        channel = newChannel
        return newChannel
    }

    @Synchronized
    fun shutdown() {
        try {
            channel?.shutdownNow()
        } catch (_: Exception) {}
        channel = null
    }
}
