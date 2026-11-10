package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil.load
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.presentation.renderers.glass.LiveStreamGlassOverlay
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.webrtc.AudioTrack
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.MediaStreamTrack
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.RtpTransceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoTrack
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.TimeUnit

/**
 * Pure MediaMTX Single-URL Live Stream Zone Renderer for Android Player.
 * Mendukung HLS (.m3u8), RTSP, dan fallback poster gambar saat siaran nonaktif/buffering.
 */
class LiveStreamZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var posterView: ImageView? = null
    private var webRtcView: SurfaceViewRenderer? = null
    private var glassOverlay: LiveStreamGlassOverlay? = null
    @Volatile private var peerConnection: PeerConnection? = null
    @Volatile private var remoteVideoTrack: VideoTrack? = null
    @Volatile private var remoteAudioTrack: AudioTrack? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val connectionScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var connectionJob: kotlinx.coroutines.Job? = null
    private var fallbackRunnable: Runnable? = null
    private var reconnectRunnable: Runnable? = null
    @Volatile private var released = false
    private var isDucked = false
    private var isMuted = true
    private var playbackPaused = false

    @SuppressLint("UnsafeOptInUsageError")
    fun createView(parent: ViewGroup, payload: LiveStreamConfigPayload): View {
        this.isMuted = payload.isMuted
        val container = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(0xFF0F172A.toInt())
        }

        val resolvedPosterUrl = resolveUrl(payload.posterImageUrl)
        val poster = ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.CENTER_CROP
            if (resolvedPosterUrl.isNotBlank()) {
                load(resolvedPosterUrl) {
                    crossfade(300)
                }
            }
        }
        posterView = poster
        container.addView(poster)

        val rawTarget = payload.effectivePlaybackUrl.ifBlank { payload.sourceUrl }
        val targetUrl = resolveUrl(rawTarget)

        val overlay = LiveStreamGlassOverlay(context)
        glassOverlay = overlay

        if (!payload.isRelayActive) {
            overlay.setIdle(payload.name)
            container.addView(overlay)
            Log.i(TAG, "Live stream relay is inactive (stream=${payload.streamId})")
            return container
        }

        overlay.setBuffering(payload.name)

        if (payload.streamMode == "SERVER_HOSTED_HLS" && payload.streamId.isNotBlank()) {
            startWhepPlayback(container, targetUrl, payload)
        } else if (targetUrl.isNotBlank()) {
            startHlsPlayback(container, targetUrl, payload)
        } else {
            overlay.setOffline(payload.name, "URL siaran tidak tersedia")
            Log.w(TAG, "Live stream has no playback URL (stream=${payload.streamId})")
        }

        container.addView(overlay)
        return container
    }

    private fun startWhepPlayback(
        container: FrameLayout,
        hlsFallbackUrl: String,
        payload: LiveStreamConfigPayload
    ) {
        try {
            val resources = LiveWebRtcRuntime.get(context)
            val renderer = SurfaceViewRenderer(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                // Multi-surface zero-copy: Overlay on top of underlying video SurfaceView to prevent SurfaceFlinger thrashing
                setZOrderMediaOverlay(true)
                init(resources.eglBase.eglBaseContext, object : org.webrtc.RendererCommon.RendererEvents {
                    override fun onFirstFrameRendered() {
                        mainHandler.post {
                            if (!released) {
                                fallbackRunnable?.let(mainHandler::removeCallbacks)
                                posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                                glassOverlay?.setLive(isLowLatency = true)
                            }
                        }
                    }

                    override fun onFrameResolutionChanged(width: Int, height: Int, rotation: Int) = Unit
                })
                setScalingType(org.webrtc.RendererCommon.ScalingType.SCALE_ASPECT_FILL)
            }
            webRtcView = renderer
            container.addView(renderer)

            val isLowRamDevice =
                context.getSystemService(ActivityManager::class.java)?.isLowRamDevice == true
            val mode = if (payload.lowLatencyMode || isLowRamDevice) "ll" else "hd"
            val endpoint = resolveUrl("/streams/${Uri.encode(payload.streamId)}/whep?mode=$mode")
            Log.i(TAG, "Starting WebRTC live stream (stream=${payload.streamId})")
            fallbackRunnable = Runnable {
                fallbackToHls(container, hlsFallbackUrl, payload, "WHEP connection timed out")
            }.also { mainHandler.postDelayed(it, WHEP_CONNECT_TIMEOUT_MS) }

            connectionJob = connectionScope.launch {
                try {
                    connectWhep(endpoint, container, renderer, hlsFallbackUrl, payload)
                } catch (error: CancellationException) {
                    throw error
                } catch (error: Exception) {
                    Log.e(TAG, "WHEP connection failed for stream=${payload.streamId}: ${error.message}", error)
                    mainHandler.post {
                        fallbackToHls(container, hlsFallbackUrl, payload, "WHEP signaling failed")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize WebRTC for stream=${payload.streamId}: ${e.message}", e)
            fallbackToHls(container, hlsFallbackUrl, payload, "WebRTC initialization failed")
        }
    }

    private suspend fun connectWhep(
        endpoint: String,
        container: FrameLayout,
        renderer: SurfaceViewRenderer,
        hlsFallbackUrl: String,
        payload: LiveStreamConfigPayload
    ) {
        val iceGatheringComplete = CompletableDeferred<Unit>()
        val observer = object : PeerConnection.Observer {
            override fun onSignalingChange(state: PeerConnection.SignalingState) = Unit

            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState) {
                Log.i(TAG, "WebRTC ICE state stream=${payload.streamId}: $state")
                if (state == PeerConnection.IceConnectionState.CONNECTED || state == PeerConnection.IceConnectionState.COMPLETED) {
                    mainHandler.post {
                        fallbackRunnable?.let(mainHandler::removeCallbacks)
                    }
                }
                if (state == PeerConnection.IceConnectionState.FAILED) {
                    mainHandler.post {
                        fallbackToHls(container, hlsFallbackUrl, payload, "WebRTC ICE connection failed")
                    }
                }
            }

            override fun onIceConnectionReceivingChange(receiving: Boolean) = Unit

            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState) {
                if (state == PeerConnection.IceGatheringState.COMPLETE) {
                    iceGatheringComplete.complete(Unit)
                }
            }

            override fun onIceCandidate(candidate: IceCandidate) = Unit
            override fun onIceCandidatesRemoved(candidates: Array<IceCandidate>) = Unit
            override fun onAddStream(stream: MediaStream) = Unit
            override fun onRemoveStream(stream: MediaStream) = Unit
            override fun onDataChannel(channel: org.webrtc.DataChannel) = Unit
            override fun onRenegotiationNeeded() = Unit
            override fun onAddTrack(receiver: RtpReceiver, streams: Array<MediaStream>) = Unit

            override fun onTrack(transceiver: RtpTransceiver) {
                when (val track = transceiver.receiver.track()) {
                    is VideoTrack -> {
                        remoteVideoTrack = track
                        track.setEnabled(!playbackPaused)
                        mainHandler.post {
                            if (!released) track.addSink(renderer)
                        }
                    }
                    is AudioTrack -> {
                        remoteAudioTrack = track
                        updateRemoteAudioTrack()
                    }
                }
            }
        }

        val config = PeerConnection.RTCConfiguration(emptyList()).apply {
            bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
        }
        val peer = LiveWebRtcRuntime.get(context).factory.createPeerConnection(config, observer)
            ?: error("Unable to create WebRTC peer connection")
        peerConnection = peer
        peer.addTransceiver(
            MediaStreamTrack.MediaType.MEDIA_TYPE_VIDEO,
            RtpTransceiver.RtpTransceiverInit(RtpTransceiver.RtpTransceiverDirection.RECV_ONLY)
        )
        peer.addTransceiver(
            MediaStreamTrack.MediaType.MEDIA_TYPE_AUDIO,
            RtpTransceiver.RtpTransceiverInit(RtpTransceiver.RtpTransceiverDirection.RECV_ONLY)
        )

        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
        }
        val offer = createOffer(peer, constraints)
        setLocalDescription(peer, offer)
        if (peer.iceGatheringState() != PeerConnection.IceGatheringState.COMPLETE) {
            withTimeoutOrNull(ICE_GATHER_TIMEOUT_MS) { iceGatheringComplete.await() }
        }
        val localOffer = peer.localDescription ?: error("WebRTC local offer was not created")
        Log.i(TAG, "Local SDP offer length: ${localOffer.description.length}")
        val request = Request.Builder()
            .url(endpoint)
            .header("Accept", "application/sdp")
            .post(localOffer.description.toRequestBody("application/sdp".toMediaType()))
            .build()

        val answerText = execute(request).use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) error("WHEP request failed with HTTP ${response.code}: $body")
            body.takeIf { it.isNotBlank() } ?: error("WHEP response has no SDP answer")
        }
        Log.i(TAG, "Received SDP answer length: ${answerText.length}")
        setRemoteDescription(peer, SessionDescription(SessionDescription.Type.ANSWER, answerText))
    }

    private fun fallbackToHls(
        container: FrameLayout,
        hlsUrl: String,
        payload: LiveStreamConfigPayload,
        reason: String
    ) {
        if (released || exoPlayer != null || hlsUrl.isBlank()) return
        Log.w(TAG, "$reason; falling back to HLS for stream=${payload.streamId}")
        glassOverlay?.setBuffering(payload.name)
        fallbackRunnable?.let(mainHandler::removeCallbacks)
        connectionJob?.cancel()
        closePeerConnection()
        webRtcView?.let { renderer ->
            remoteVideoTrack?.removeSink(renderer)
            renderer.visibility = View.GONE
        }
        startHlsPlayback(container, hlsUrl, payload)
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun startHlsPlayback(
        container: FrameLayout,
        targetUrl: String,
        payload: LiveStreamConfigPayload
    ) {
        if (targetUrl.isBlank()) {
            Log.w(TAG, "No HLS/RTSP fallback URL for stream=${payload.streamId}")
            return
        }
        try {
            val targetUri = Uri.parse(targetUrl)
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(1_500, 8_000, 500, 1_000)
                .build()
            val player = ExoPlayer.Builder(context)
                .setLoadControl(loadControl)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    val mediaBuilder = MediaItem.Builder().setUri(targetUri)
                    val liveConfig = MediaItem.LiveConfiguration.Builder()
                        .setTargetOffsetMs(1_500L)
                        .setMinPlaybackSpeed(1.0f)
                        .setMaxPlaybackSpeed(1.15f)
                        .setMinOffsetMs(500L)
                        .setMaxOffsetMs(4_000L)
                        .build()
                    mediaBuilder.setLiveConfiguration(liveConfig)
                    setMediaItem(mediaBuilder.build())
                    volume = currentAudioVolume()
                    playWhenReady = !playbackPaused

                    addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() {
                            if (!released) {
                                posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                                glassOverlay?.setLive(isLowLatency = false)
                            }
                        }

                        override fun onPlaybackStateChanged(playbackState: Int) {
                            if (released) return
                            when (playbackState) {
                                Player.STATE_BUFFERING -> glassOverlay?.setBuffering(payload.name)
                                Player.STATE_READY -> if (isPlaying) glassOverlay?.setLive(isLowLatency = false)
                                Player.STATE_ENDED, Player.STATE_IDLE -> glassOverlay?.setOffline(payload.name)
                            }
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            Log.w(TAG, "HLS/RTSP playback error stream=${payload.streamId}: ${error.message} (code: ${error.errorCode})")
                            if (released) return
                            posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()
                            glassOverlay?.setOffline(payload.name, "Menghubungkan ulang...")

                            if (payload.autoReconnect) {
                                reconnectRunnable?.let(mainHandler::removeCallbacks)
                                val runnable = Runnable {
                                    if (!released && exoPlayer != null) {
                                        Log.i(TAG, "Reconnecting stream=${payload.streamId}")
                                        exoPlayer?.seekToDefaultPosition()
                                        exoPlayer?.prepare()
                                        exoPlayer?.play()
                                    }
                                }
                                reconnectRunnable = runnable
                                mainHandler.postDelayed(runnable, 2_000L)
                            }
                        }
                    })

                    prepare()
                }
            exoPlayer = player

            playerView = PlayerView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                (videoSurfaceView as? android.view.SurfaceView)?.setZOrderMediaOverlay(true)
                this.player = player
            }
            container.addView(playerView)
        } catch (error: Exception) {
            Log.e(TAG, "Failed to initialize ExoPlayer for stream=${payload.streamId}: ${error.message}", error)
        }
    }

    private suspend fun createOffer(peer: PeerConnection, constraints: MediaConstraints): SessionDescription =
        suspendCancellableCoroutine { continuation ->
            peer.createOffer(object : SdpObserver {
                override fun onCreateSuccess(description: SessionDescription) {
                    if (continuation.isActive) continuation.resume(description)
                }

                override fun onSetSuccess() = Unit
                override fun onCreateFailure(error: String) {
                    if (continuation.isActive) continuation.resumeWithException(IllegalStateException(error))
                }

                override fun onSetFailure(error: String) = Unit
            }, constraints)
        }

    private suspend fun setLocalDescription(peer: PeerConnection, description: SessionDescription) {
        suspendCancellableCoroutine { continuation ->
            peer.setLocalDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    if (continuation.isActive) continuation.resume(Unit)
                }

                override fun onCreateSuccess(description: SessionDescription) = Unit
                override fun onCreateFailure(error: String) = Unit
                override fun onSetFailure(error: String) {
                    if (continuation.isActive) continuation.resumeWithException(IllegalStateException(error))
                }
            }, description)
        }
    }

    private suspend fun setRemoteDescription(peer: PeerConnection, description: SessionDescription) {
        suspendCancellableCoroutine { continuation ->
            peer.setRemoteDescription(object : SdpObserver {
                override fun onSetSuccess() {
                    if (continuation.isActive) continuation.resume(Unit)
                }

                override fun onCreateSuccess(description: SessionDescription) = Unit
                override fun onCreateFailure(error: String) = Unit
                override fun onSetFailure(error: String) {
                    if (continuation.isActive) continuation.resumeWithException(IllegalStateException(error))
                }
            }, description)
        }
    }

    private suspend fun execute(request: Request): Response =
        suspendCancellableCoroutine { continuation ->
            val call = HTTP_CLIENT.newCall(request)
            continuation.invokeOnCancellation { call.cancel() }
            call.enqueue(object : Callback {
                override fun onFailure(call: Call, error: java.io.IOException) {
                    if (continuation.isActive) continuation.resumeWithException(error)
                }

                override fun onResponse(call: Call, response: Response) {
                    if (continuation.isActive) continuation.resume(response) else response.close()
                }
            })
        }

    private fun closePeerConnection() {
        val peer = peerConnection ?: return
        peerConnection = null
        remoteVideoTrack?.let { track -> webRtcView?.let(track::removeSink) }
        remoteVideoTrack = null
        remoteAudioTrack = null
        peer.close()
        peer.dispose()
    }

    private fun currentAudioVolume(): Float =
        if (isMuted) 0f else if (isDucked) 0.15f else 1f

    private fun updateRemoteAudioTrack() {
        remoteAudioTrack?.setVolume(currentAudioVolume().toDouble())
        remoteAudioTrack?.setEnabled(!playbackPaused)
    }

    private fun resolveUrl(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isBlank()) return ""
        if (trimmed.startsWith("/")) {
            val scheme = if (ServerConfig.isTls(context)) "https" else "http"
            val host = ServerConfig.getHost(context)
            return "$scheme://$host$trimmed"
        }
        return trimmed
    }

    fun setDuckedVolume(ducked: Boolean) {
        this.isDucked = ducked
        exoPlayer?.volume = currentAudioVolume()
        updateRemoteAudioTrack()
    }

    fun pause() {
        playbackPaused = true
        exoPlayer?.pause()
        remoteVideoTrack?.setEnabled(false)
        remoteAudioTrack?.setEnabled(false)
    }

    fun resume() {
        playbackPaused = false
        exoPlayer?.play()
        remoteVideoTrack?.setEnabled(true)
        updateRemoteAudioTrack()
    }

    fun release() {
        released = true
        mainHandler.removeCallbacksAndMessages(null)
        connectionJob?.cancel()
        connectionScope.cancel()
        closePeerConnection()
        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null
        webRtcView?.let { renderer ->
            remoteVideoTrack?.removeSink(renderer)
            renderer.release()
        }
        webRtcView = null
        posterView = null
        glassOverlay?.hideAll()
        glassOverlay = null
    }

    companion object {
        private const val TAG = "LiveStreamZoneRenderer"
        private const val ICE_GATHER_TIMEOUT_MS = 1200L
        private const val WHEP_CONNECT_TIMEOUT_MS = 15_000L
        private val HTTP_CLIENT = OkHttpClient.Builder()
            .callTimeout(15, TimeUnit.SECONDS)
            .build()
    }
}

private object LiveWebRtcRuntime {
    data class Resources(
        val factory: PeerConnectionFactory,
        val eglBase: EglBase
    )

    @Volatile private var resources: Resources? = null

    fun get(context: Context): Resources = resources ?: synchronized(this) {
        resources ?: run {
            PeerConnectionFactory.initialize(
                PeerConnectionFactory.InitializationOptions.builder(context.applicationContext)
                    .createInitializationOptions()
            )
            val eglBase = EglBase.create()
            val factory = PeerConnectionFactory.builder()
                .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase.eglBaseContext))
                .createPeerConnectionFactory()
            Resources(factory, eglBase).also { resources = it }
        }
    }
}
