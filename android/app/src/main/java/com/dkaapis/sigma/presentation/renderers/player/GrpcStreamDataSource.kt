package com.dkaapis.sigma.presentation.renderers.player

import android.net.Uri
import androidx.media3.common.C
import androidx.media3.datasource.BaseDataSource
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import signage.components.v1.live_stream.LiveStreamCommon
import signage.components.v1.live_stream.LiveStreamServiceGrpc
import java.io.ByteArrayInputStream
import java.io.EOFException
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Secret Pipe DataSource for ExoPlayer:
 * Streams HLS manifests (.m3u8) and media segments (.ts) directly over the
 * persistent, multiplexed HTTP/2 gRPC channel (port 50051) to dka-product-sigma-backend.
 *
 * Eliminates all public HTTP URL routing, macOS Docker Desktop VPNKit port 80 drops,
 * MediaMTX cookie/session challenges, and WebRTC UDP NAT traversal problems.
 */
class GrpcStreamDataSource(
    private val stub: LiveStreamServiceGrpc.LiveStreamServiceBlockingStub,
    private val defaultStreamId: String = ""
) : BaseDataSource(/* isNetwork = */ true) {

    private var currentData: ByteArrayInputStream? = null
    private var openedUri: Uri? = null

    override fun open(dataSpec: DataSpec): Long {
        openedUri = dataSpec.uri
        transferInitializing(dataSpec)

        val uri = dataSpec.uri
        // Uri format: sigma-stream://<streamId>/<filename>
        val streamId = uri.host?.takeIf { it.isNotBlank() } ?: defaultStreamId
        val path = uri.path?.trimStart('/').orEmpty()
        val query = uri.query?.let { "?$it" }.orEmpty()
        val fileName = if (path.isBlank()) "live.m3u8" else "$path$query"

        if (streamId.isBlank()) {
            throw IOException("gRPC stream URI missing stream ID: $uri")
        }

        val request = LiveStreamCommon.GetStreamSegmentRequest.newBuilder()
            .setStreamId(streamId)
            .setFileName(fileName)
            .build()

        val response = try {
            stub.withDeadlineAfter(3_500L, TimeUnit.MILLISECONDS)
                .getStreamSegment(request)
        } catch (e: Exception) {
            throw IOException("gRPC GetStreamSegment failed for $streamId/$fileName: ${e.message}", e)
        }

        if (!response.success || response.data.isEmpty) {
            throw IOException("Stream segment '$fileName' unavailable on stream '$streamId' (offline)")
        }

        val bytes = response.data.toByteArray()
        val stream = ByteArrayInputStream(bytes)
        currentData = stream

        val bytesToSkip = dataSpec.position
        if (bytesToSkip > 0) {
            val skipped = stream.skip(bytesToSkip)
            if (skipped < bytesToSkip) {
                throw EOFException("Could not skip $bytesToSkip bytes in stream segment $fileName")
            }
        }

        val length = if (dataSpec.length != C.LENGTH_UNSET.toLong()) {
            dataSpec.length
        } else {
            (bytes.size - bytesToSkip).toLong()
        }

        transferStarted(dataSpec)
        return length
    }

    override fun read(buffer: ByteArray, offset: Int, length: Int): Int {
        if (length == 0) return 0
        val stream = currentData ?: return C.RESULT_END_OF_INPUT
        val bytesRead = stream.read(buffer, offset, length)
        if (bytesRead == -1) return C.RESULT_END_OF_INPUT
        bytesTransferred(bytesRead)
        return bytesRead
    }

    override fun getUri(): Uri? = openedUri

    override fun close() {
        currentData?.close()
        currentData = null
        if (openedUri != null) {
            openedUri = null
            transferEnded()
        }
    }
}

class GrpcStreamDataSourceFactory(
    private val stub: LiveStreamServiceGrpc.LiveStreamServiceBlockingStub,
    private val defaultStreamId: String = ""
) : DataSource.Factory {
    override fun createDataSource(): DataSource {
        return GrpcStreamDataSource(stub, defaultStreamId)
    }
}

