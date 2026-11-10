package com.dkaapis.sigma.data.grpc

import android.content.Context
import com.dkaapis.sigma.R
import io.grpc.ManagedChannel
import io.grpc.okhttp.OkHttpChannelBuilder
import java.util.concurrent.TimeUnit

class GrpcChannelFactory(
    private val host: String = "10.0.2.2", // Standard Android emulator localhost bridge or server IP
    private val port: Int = 50051,
    private val useTls: Boolean = false
) {
    constructor(context: Context) : this(
        resolveHost(context),
        resolvePort(context),
        resolveTls(context)
    )

    companion object {
        private fun resolveHost(context: Context): String = try {
            com.dkaapis.sigma.data.local.ServerConfig.getHost(context)
        } catch (_: Exception) {
            "10.20.30.64"
        }

        private fun resolvePort(context: Context): Int = try {
            com.dkaapis.sigma.data.local.ServerConfig.getGrpcPort(context)
        } catch (_: Exception) {
            50051
        }

        private fun resolveTls(context: Context): Boolean = try {
            com.dkaapis.sigma.data.local.ServerConfig.isTls(context)
        } catch (_: Exception) {
            false
        }

        @Volatile
        private var sharedChannel: ManagedChannel? = null
        private var cachedKey: String? = null

        @Synchronized
        fun getSharedChannel(host: String, port: Int, useTls: Boolean): ManagedChannel {
            val key = "$host:$port:$useTls"
            val existing = sharedChannel
            if (existing != null && !existing.isShutdown && !existing.isTerminated && cachedKey == key) {
                return existing
            }

            try {
                existing?.shutdownNow()
            } catch (_: Exception) {}

            val builder = OkHttpChannelBuilder.forAddress(host, port)
                .keepAliveTime(15, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .keepAliveWithoutCalls(true)
                .flowControlWindow(1024 * 1024) // 1MB window: eliminates stream buffer starvation & dropped frames
                .maxInboundMessageSize(16 * 1024 * 1024) // 16MB max message size for HD video chunks

            if (!useTls) {
                builder.usePlaintext()
            }

            val newChannel = builder.build()
            sharedChannel = newChannel
            cachedKey = key
            return newChannel
        }

        @Synchronized
        fun shutdownSharedChannel() {
            try {
                sharedChannel?.shutdownNow()
            } catch (_: Exception) {}
            sharedChannel = null
            cachedKey = null
        }
    }

    fun getChannel(): ManagedChannel {
        return getSharedChannel(host, port, useTls)
    }

    fun shutdown() {
        shutdownSharedChannel()
    }
}
