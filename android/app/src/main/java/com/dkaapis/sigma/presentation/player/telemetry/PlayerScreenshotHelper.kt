package com.dkaapis.sigma.presentation.player.telemetry

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.PixelCopy
import android.view.View
import android.view.Window
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.google.protobuf.ByteString
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import signage.distribution.v1.stream.StreamCommon
import signage.distribution.v1.stream.StreamServiceGrpcKt
import java.io.ByteArrayOutputStream

/**
 * Pengambil & pengunggah tangkapan layar (screenshot) layar signage:
 * - PixelCopy API (Hardware Surface) dengan fallback software canvas
 * - Kompresi JPEG 80% resolusi dinamis maksimal 1280px
 * - Pengunggahan langsung via gRPC stream stub
 */
class PlayerScreenshotHelper {

    fun captureScreen(window: Window, onCaptured: (ByteArray?) -> Unit) {
        runCatching {
            val decorView = window.decorView
            val width = decorView.width.coerceAtLeast(1)
            val height = decorView.height.coerceAtLeast(1)

            val maxDim = 1280f
            val currentMax = maxOf(width, height).toFloat()
            val scale = if (currentMax > maxDim) maxDim / currentMax else 1.0f
            val targetW = (width * scale).toInt().coerceAtLeast(1)
            val targetH = (height * scale).toInt().coerceAtLeast(1)

            val bitmap = Bitmap.createBitmap(targetW, targetH, Bitmap.Config.ARGB_8888)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PixelCopy.request(
                    window,
                    bitmap,
                    { copyResult ->
                        if (copyResult == PixelCopy.SUCCESS) {
                            val stream = ByteArrayOutputStream()
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
                            onCaptured(stream.toByteArray())
                        } else {
                            captureWithCanvas(decorView, targetW, targetH, onCaptured)
                        }
                    },
                    Handler(Looper.getMainLooper())
                )
            } else {
                captureWithCanvas(decorView, targetW, targetH, onCaptured)
            }
        }.onFailure { err ->
            Log.e(TAG, "Gagal captureScreen: ${err.message}")
            onCaptured(null)
        }
    }

    private fun captureWithCanvas(view: View, targetW: Int, targetH: Int, onCaptured: (ByteArray?) -> Unit) {
        runCatching {
            val srcW = view.width.coerceAtLeast(1)
            val srcH = view.height.coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(srcW, srcH, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            view.draw(canvas)
            val scaled = if (srcW != targetW || srcH != targetH) {
                Bitmap.createScaledBitmap(bitmap, targetW, targetH, true)
            } else {
                bitmap
            }
            val stream = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 80, stream)
            onCaptured(stream.toByteArray())
        }.onFailure { err ->
            Log.e(TAG, "Canvas capture failed: ${err.message}")
            onCaptured(null)
        }
    }

    fun uploadScreenshot(
        scope: CoroutineScope,
        channelFactory: GrpcChannelFactory,
        deviceId: String,
        imageBytes: ByteArray,
        onComplete: () -> Unit
    ) {
        scope.launch(Dispatchers.IO) {
            runCatching {
                val stub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channelFactory.getChannel())
                val request = StreamCommon.UploadScreenshotRequest.newBuilder()
                    .setDeviceId(deviceId)
                    .setImageData(ByteString.copyFrom(imageBytes))
                    .setMimeType("image/jpeg")
                    .build()

                val response = stub.uploadScreenshot(request)
                Log.i(TAG, "Upload screenshot gRPC selesai: success=${response.success}")
            }.onFailure { err ->
                Log.e(TAG, "Gagal upload screenshot gRPC: ${err.message}")
            }
            onComplete()
        }
    }

    companion object {
        private const val TAG = "PlayerScreenshotHelper"
    }
}
