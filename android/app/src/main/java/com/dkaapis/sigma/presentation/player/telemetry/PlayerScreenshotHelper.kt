package com.dkaapis.sigma.presentation.player.telemetry

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Rect
import android.graphics.RectF
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.View
import android.view.ViewGroup
import android.view.Window
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.presentation.player.canvas.SignageCanvasLayout
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.google.protobuf.ByteString
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import signage.distribution.v1.stream.StreamCommon
import signage.distribution.v1.stream.StreamServiceGrpcKt
import java.io.ByteArrayOutputStream

/**
 * Pengambil & pengunggah tangkapan layar (screenshot) layar signage:
 * - PixelCopy API (Hardware Window + composite semua SurfaceView aktif agar video/live stream ikut terekam)
 * - Fallback software canvas untuk OS lama
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
            val mainHandler = Handler(Looper.getMainLooper())

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PixelCopy.request(
                    window,
                    bitmap,
                    { copyResult ->
                        if (copyResult == PixelCopy.SUCCESS) {
                            compositeSurfaceViews(decorView, bitmap, scale, mainHandler) {
                                onCaptured(compressJpeg(bitmap))
                            }
                        } else {
                            captureWithCanvas(decorView, targetW, targetH, scale, mainHandler, onCaptured)
                        }
                    },
                    mainHandler
                )
            } else {
                captureWithCanvas(decorView, targetW, targetH, scale, mainHandler, onCaptured)
            }
        }.onFailure { err ->
            Log.e(TAG, "Gagal captureScreen: ${err.message}")
            onCaptured(null)
        }
    }

    private fun compositeSurfaceViews(
        decorView: View,
        targetBitmap: Bitmap,
        scale: Float,
        handler: Handler,
        onDone: () -> Unit
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            onDone()
            return
        }

        val surfaceViews = mutableListOf<SurfaceView>()
        collectVisibleSurfaceViews(decorView, surfaceViews)
        if (surfaceViews.isEmpty()) {
            onDone()
            return
        }

        val canvas = Canvas(targetBitmap)
        fun copyNext(index: Int) {
            if (index >= surfaceViews.size) {
                onDone()
                return
            }
            val sv = surfaceViews[index]
            if (!sv.isAttachedToWindow || !sv.isShown || sv.width <= 0 || sv.height <= 0 || !sv.holder.surface.isValid) {
                copyNext(index + 1)
                return
            }

            val svBitmap = runCatching {
                Bitmap.createBitmap(sv.width, sv.height, Bitmap.Config.ARGB_8888)
            }.getOrNull()
            if (svBitmap == null) {
                copyNext(index + 1)
                return
            }

            runCatching {
                PixelCopy.request(
                    sv,
                    svBitmap,
                    { result ->
                        if (result == PixelCopy.SUCCESS) {
                            drawSurfaceViewBitmap(canvas, sv, svBitmap, scale)
                        }
                        svBitmap.recycle()
                        copyNext(index + 1)
                    },
                    handler
                )
            }.onFailure {
                svBitmap.recycle()
                copyNext(index + 1)
            }
        }

        copyNext(0)
    }

    private fun collectVisibleSurfaceViews(view: View, out: MutableList<SurfaceView>) {
        if (view.visibility != View.VISIBLE || view.alpha <= 0f) return
        if (view is SurfaceView) {
            out.add(view)
            return
        }
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                collectVisibleSurfaceViews(view.getChildAt(i), out)
            }
        }
    }

    private fun drawSurfaceViewBitmap(
        canvas: Canvas,
        sv: SurfaceView,
        svBitmap: Bitmap,
        scale: Float
    ) {
        val loc = IntArray(2)
        sv.getLocationInWindow(loc)
        val drawRect = RectF(
            loc[0] * scale,
            loc[1] * scale,
            (loc[0] + sv.width) * scale,
            (loc[1] + sv.height) * scale
        )

        val visibleRect = Rect()
        val hasClip = sv.getGlobalVisibleRect(visibleRect)
        val ownerZone = findAncestorZone(sv)
        val ownerRect = Rect()
        val hasOwnerClip = ownerZone?.getGlobalVisibleRect(ownerRect) == true

        val saveCount = canvas.save()
        if (hasOwnerClip) {
            canvas.clipRect(
                ownerRect.left * scale,
                ownerRect.top * scale,
                ownerRect.right * scale,
                ownerRect.bottom * scale
            )
        } else if (hasClip) {
            canvas.clipRect(
                visibleRect.left * scale,
                visibleRect.top * scale,
                visibleRect.right * scale,
                visibleRect.bottom * scale
            )
        }

        // Jangan menimpa zona lain (mis. Ticker, Clock, Queue) yang berada di atas SurfaceView ini
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && ownerZone != null) {
            val canvasParent = ownerZone.parent as? SignageCanvasLayout
            if (canvasParent != null) {
                val ownerIndex = canvasParent.indexOfChild(ownerZone)
                for (i in (ownerIndex + 1) until canvasParent.childCount) {
                    val sibling = canvasParent.getChildAt(i)
                    if (sibling.visibility == View.VISIBLE && sibling.alpha > 0f) {
                        val sibRect = Rect()
                        if (sibling.getGlobalVisibleRect(sibRect)) {
                            canvas.clipOutRect(
                                sibRect.left * scale,
                                sibRect.top * scale,
                                sibRect.right * scale,
                                sibRect.bottom * scale
                            )
                        }
                    }
                }
            }
        }

        canvas.drawBitmap(svBitmap, null, drawRect, null)
        canvas.restoreToCount(saveCount)
    }

    private fun findAncestorZone(view: View): ZoneContainerView? {
        var current = view.parent
        while (current is View) {
            if (current is ZoneContainerView) return current
            current = current.parent
        }
        return null
    }

    private fun captureWithCanvas(
        view: View,
        targetW: Int,
        targetH: Int,
        scale: Float,
        handler: Handler,
        onCaptured: (ByteArray?) -> Unit
    ) {
        runCatching {
            val srcW = view.width.coerceAtLeast(1)
            val srcH = view.height.coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(srcW, srcH, Bitmap.Config.ARGB_8888)
            view.draw(Canvas(bitmap))
            val scaled = if (srcW != targetW || srcH != targetH) {
                Bitmap.createScaledBitmap(bitmap, targetW, targetH, true).also { bitmap.recycle() }
            } else {
                bitmap
            }
            compositeSurfaceViews(view, scaled, scale, handler) {
                onCaptured(compressJpeg(scaled))
            }
        }.onFailure { err ->
            Log.e(TAG, "Canvas capture failed: ${err.message}")
            onCaptured(null)
        }
    }

    private fun compressJpeg(bitmap: Bitmap): ByteArray {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
        return stream.toByteArray()
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
