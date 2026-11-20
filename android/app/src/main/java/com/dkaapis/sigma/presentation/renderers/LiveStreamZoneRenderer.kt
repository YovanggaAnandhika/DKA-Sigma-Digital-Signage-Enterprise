package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.net.toUri
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLivePlaybackSpeedControl
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.rtsp.RtspMediaSource
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil.load
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.presentation.renderers.glass.LiveStreamGlassOverlay
import com.dkaapis.sigma.presentation.renderers.model.LiveStreamConfigPayload
import com.dkaapis.sigma.presentation.util.DeviceCapabilityHelper
import org.webrtc.AudioTrack
import org.webrtc.DataChannel
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.MediaStreamTrack
import org.webrtc.PeerConnection
import org.webrtc.RendererCommon
import org.webrtc.RtpReceiver
import org.webrtc.RtpTransceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoTrack
import signage.components.v1.live_stream.LiveStreamCommon
import signage.components.v1.live_stream.LiveStreamServiceGrpc
import signage.distribution.v1.stream.StreamCommon
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Unified Low-Latency Live Stream Zone Renderer for Android Player:
 * - Server SFU streams (WHIP / RTSP Server Relay): Native WebRTC WHEP over UDP (gRPC signaling + UDP 8189 media).
 * - YouTube Live & Web Embed: Managed hardware WebView (YouTube IFrame API / embed URL).
 * - External HLS (.m3u8) & Direct LAN RTSP: Media3 ExoPlayer with SurfaceView overlay.
 */
class LiveStreamZoneRenderer(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var webRtcRenderer: SurfaceViewRenderer? = null
    private var webView: WebView? = null
    private var peerConnection: PeerConnection? = null
    private var remoteVideoTrack: VideoTrack? = null
    private var remoteAudioTrack: AudioTrack? = null
    private var activeWhepSessionId: String = ""
    private val signalingExecutor = Executors.newSingleThreadExecutor()

    private var posterView: ImageView? = null
    private var glassOverlay: LiveStreamGlassOverlay? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var reconnectRunnable: Runnable? = null
    private var bufferingDebounceRunnable: Runnable? = null

    @Volatile private var released = false
    @Volatile private var useRtpTcp = false
    @Volatile private var isStreamOffline = true
    @Volatile private var hasRenderedFirstFrame = false
    @Volatile private var lastError: String = ""
    @Volatile private var webrtcWidth = 0
    @Volatile private var webrtcHeight = 0

    private var isDucked = false
    private var isMuted = true
    private var playbackPaused = false
    private var activePlaybackUrl: String = ""
    private var streamId: String = ""
    private var streamName: String = ""
    private var activePayload: LiveStreamConfigPayload? = null
    private var activeEngine: RenderEngine = RenderEngine.NONE
    private val connectGeneration = AtomicInteger(0)

    private enum class RenderEngine {
        NONE, WEBRTC_UDP, YOUTUBE, EMBED, EXOPLAYER
    }

    @SuppressLint("UnsafeOptInUsageError")
    fun diagnostics(): StreamCommon.ZoneDiagnostics {
        val state = when {
            released -> "IDLE"
            isStreamOffline -> if (lastError.isNotEmpty()) "ERROR" else "OFFLINE"
            hasRenderedFirstFrame -> "PLAYING"
            else -> "BUFFERING"
        }

        return when (activeEngine) {
            RenderEngine.WEBRTC_UDP -> StreamCommon.ZoneDiagnostics.newBuilder()
                .setZoneId(streamId)
                .setMediaId(streamId)
                .setKind("LIVE")
                .setMediaName(streamName)
                .setState(state)
                .setTransport("WEBRTC/UDP")
                .setCodec("video/avc")
                .setResolution(if (webrtcWidth > 0 && webrtcHeight > 0) "${webrtcWidth}x${webrtcHeight}" else "")
                .setLastError(lastError)
                .setPlaybackState(state)
                .build()

            RenderEngine.YOUTUBE, RenderEngine.EMBED -> StreamCommon.ZoneDiagnostics.newBuilder()
                .setZoneId(streamId)
                .setMediaId(streamId)
                .setKind("LIVE")
                .setMediaName(streamName)
                .setState(state)
                .setTransport(if (activeEngine == RenderEngine.YOUTUBE) "YOUTUBE" else "EMBED")
                .setLastError(lastError)
                .setPlaybackState(state)
                .build()

            else -> {
                val format = exoPlayer?.videoFormat
                val exoState = when {
                    released -> "IDLE"
                    isStreamOffline -> if (lastError.isNotEmpty()) "ERROR" else "OFFLINE"
                    exoPlayer?.isPlaying == true -> "PLAYING"
                    else -> "BUFFERING"
                }
                val playbackState = when (exoPlayer?.playbackState) {
                    Player.STATE_IDLE -> "IDLE"
                    Player.STATE_BUFFERING -> "BUFFERING"
                    Player.STATE_READY -> if (exoPlayer?.isPlaying == true) "PLAYING" else "READY"
                    Player.STATE_ENDED -> "ENDED"
                    else -> "UNKNOWN"
                }
                StreamCommon.ZoneDiagnostics.newBuilder()
                    .setZoneId(streamId)
                    .setMediaId(streamId)
                    .setKind("LIVE")
                    .setMediaName(streamName)
                    .setState(exoState)
                    .setTransport(
                        if (activePlaybackUrl.startsWith("rtsp", ignoreCase = true)) {
                            if (useRtpTcp) "RTSP/TCP" else "RTSP/UDP"
                        } else {
                            "HLS"
                        }
                    )
                    .setCodec(format?.sampleMimeType.orEmpty())
                    .setResolution(if (format != null && format.width > 0) "${format.width}x${format.height}" else "")
                    .setBitrateKbps(if (format != null && format.bitrate > 0) format.bitrate / 1000 else 0)
                    .setDroppedFrames(exoPlayer?.videoDecoderCounters?.droppedBufferCount ?: 0)
                    .setLastError(lastError)
                    .setBufferedDurationMs(exoPlayer?.totalBufferedDuration?.coerceAtLeast(0L) ?: 0L)
                    .setPlaybackState(playbackState)
                    .build()
            }
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    fun createView(parent: ViewGroup, payload: LiveStreamConfigPayload): View {
        this.isMuted = payload.isMuted
        this.streamId = payload.streamId
        this.streamName = payload.name
        this.activePayload = payload
        this.useRtpTcp = false

        val container = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.TRANSPARENT)
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

        val overlay = LiveStreamGlassOverlay(context)
        glassOverlay = overlay

        val sourceType = payload.sourceType.uppercase()
        val rawTarget = payload.effectivePlaybackUrl.ifBlank { payload.sourceUrl }

        if (!payload.isRelayActive && payload.streamMode == "SERVER_HOSTED_HLS") {
            overlay.setIdle(payload.name)
            container.addView(overlay)
            Log.i(TAG, "Live stream relay is inactive (stream=${payload.streamId})")
            return container
        }

        when {
            sourceType == "YOUTUBE" -> {
                activeEngine = RenderEngine.YOUTUBE
                startYouTubePlayback(container, payload, rawTarget)
            }
            sourceType == "EMBED" -> {
                activeEngine = RenderEngine.EMBED
                startEmbedPlayback(container, payload, rawTarget)
            }
            isServerWebRtcStream(payload, sourceType, rawTarget) -> {
                activeEngine = RenderEngine.WEBRTC_UDP
                overlay.setOffline(payload.name, "Menunggu siaran dimulai dari OBS Studio / encoder.")
                startWebRtcPlayback(container, payload)
            }
            else -> {
                activeEngine = RenderEngine.EXOPLAYER
                val targetUrl = resolveUrl(rawTarget)
                if (targetUrl.isNotBlank()) {
                    overlay.setBuffering(payload.name)
                    startExoPlayback(container, targetUrl, payload)
                } else {
                    overlay.setOffline(payload.name, "URL siaran tidak tersedia")
                }
            }
        }

        container.addView(overlay)
        overlay.bringToFront()
        return container
    }

    private fun isServerWebRtcStream(
        payload: LiveStreamConfigPayload,
        sourceType: String,
        rawTarget: String
    ): Boolean {
        if (payload.streamId.isBlank()) return false
        if (payload.streamMode == "SERVER_HOSTED_HLS") {
            return sourceType == "WHIP" || sourceType == "RTSP" || sourceType == "RTMP" || rawTarget.startsWith("/streams/")
        }
        return rawTarget.startsWith("/streams/")
    }

    // =========================================================================
    // 1. Native WebRTC WHEP over UDP (str0m SFU on port 8189/udp)
    // =========================================================================

    private fun startWebRtcPlayback(container: FrameLayout, payload: LiveStreamConfigPayload) {
        val runtime = SharedWebRtcRuntime.get(context)
        val renderer = SurfaceViewRenderer(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            init(runtime.eglBase.eglBaseContext, object : RendererCommon.RendererEvents {
                override fun onFirstFrameRendered() {
                    mainHandler.post {
                        if (!released) {
                            hasRenderedFirstFrame = true
                            isStreamOffline = false
                            lastError = ""
                            reconnectRunnable?.let(mainHandler::removeCallbacks)
                            posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                            glassOverlay?.setLive(isLowLatency = true, badgeLabel = "LIVE • UDP")
                        }
                    }
                }

                override fun onFrameResolutionChanged(videoWidth: Int, videoHeight: Int, rotation: Int) {
                    webrtcWidth = videoWidth
                    webrtcHeight = videoHeight
                }
            })
            setZOrderMediaOverlay(true)
            setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
            setEnableHardwareScaler(true)
        }
        webRtcRenderer = renderer
        container.addView(renderer)
        glassOverlay?.bringToFront()

        connectWebRtcSession(payload)
    }

    private fun connectWebRtcSession(payload: LiveStreamConfigPayload) {
        if (released || playbackPaused) return
        val generation = connectGeneration.incrementAndGet()

        signalingExecutor.execute {
            if (released || generation != connectGeneration.get()) return@execute
            closeActiveWebRtcPeer(notifyServer = true)

            try {
                val runtime = SharedWebRtcRuntime.get(context)
                val rtcConfig = PeerConnection.RTCConfiguration(emptyList()).apply {
                    sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
                    bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
                }
                val iceDoneLatch = CountDownLatch(1)

                val pc = runtime.peerConnectionFactory.createPeerConnection(
                    rtcConfig,
                    object : PeerConnection.Observer {
                        override fun onSignalingChange(state: PeerConnection.SignalingState?) {}

                        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
                            when (state) {
                                PeerConnection.IceConnectionState.DISCONNECTED,
                                PeerConnection.IceConnectionState.FAILED,
                                PeerConnection.IceConnectionState.CLOSED -> {
                                    mainHandler.post {
                                        if (!released && generation == connectGeneration.get()) {
                                            markWebRtcOffline(
                                                payload,
                                                "Menunggu siaran dimulai dari OBS Studio / encoder."
                                            )
                                        }
                                    }
                                }
                                else -> {}
                            }
                        }

                        override fun onIceConnectionReceivingChange(receiving: Boolean) {}

                        override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {
                            if (state == PeerConnection.IceGatheringState.COMPLETE) {
                                iceDoneLatch.countDown()
                            }
                        }

                        override fun onIceCandidate(candidate: IceCandidate?) {}
                        override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
                        override fun onAddStream(stream: MediaStream?) {}
                        override fun onRemoveStream(stream: MediaStream?) {}
                        override fun onDataChannel(dc: DataChannel?) {}
                        override fun onRenegotiationNeeded() {}
                        override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}

                        override fun onTrack(transceiver: RtpTransceiver?) {
                            val track = transceiver?.receiver?.track() ?: return
                            if (track is VideoTrack) {
                                remoteVideoTrack = track
                                mainHandler.post {
                                    if (!released && generation == connectGeneration.get()) {
                                        webRtcRenderer?.let { track.addSink(it) }
                                    }
                                }
                            } else if (track is AudioTrack) {
                                remoteAudioTrack = track
                                applyWebRtcAudioVolume()
                            }
                        }
                    }
                ) ?: throw IllegalStateException("Unable to create PeerConnection")

                peerConnection = pc

                pc.addTransceiver(
                    MediaStreamTrack.MediaType.MEDIA_TYPE_VIDEO,
                    RtpTransceiver.RtpTransceiverInit(RtpTransceiver.RtpTransceiverDirection.RECV_ONLY)
                )
                pc.addTransceiver(
                    MediaStreamTrack.MediaType.MEDIA_TYPE_AUDIO,
                    RtpTransceiver.RtpTransceiverInit(RtpTransceiver.RtpTransceiverDirection.RECV_ONLY)
                )

                val offerSdp = awaitCreateOffer(pc)
                awaitSetLocalDescription(pc, offerSdp)
                iceDoneLatch.await(250, TimeUnit.MILLISECONDS)

                val localSdpText = pc.localDescription?.description ?: offerSdp.description
                val stub = LiveStreamServiceGrpc.newBlockingStub(
                    GrpcChannelFactory(context).getChannel()
                ).withDeadlineAfter(5, TimeUnit.SECONDS)

                val response = stub.negotiateWhep(
                    LiveStreamCommon.NegotiateWhepRequest.newBuilder()
                        .setStreamId(payload.streamId)
                        .setSdpOffer(localSdpText)
                        .build()
                )

                if (released || generation != connectGeneration.get()) {
                    closeSessionOnServerAsync(response.sessionId)
                    closeActiveWebRtcPeer(notifyServer = false)
                    return@execute
                }

                activeWhepSessionId = response.sessionId
                val answer = SessionDescription(SessionDescription.Type.ANSWER, response.sdpAnswer)
                awaitSetRemoteDescription(pc, answer)
            } catch (e: Exception) {
                val msg = e.message.orEmpty()
                lastError = msg
                Log.w(TAG, "WHEP UDP connect skipped/failed for stream=${payload.streamId}: $msg")
                mainHandler.post {
                    if (!released && generation == connectGeneration.get()) {
                        markWebRtcOffline(payload, "Menunggu siaran dimulai dari OBS Studio / encoder.")
                    }
                }
            }
        }
    }

    private fun awaitCreateOffer(pc: PeerConnection): SessionDescription {
        val latch = CountDownLatch(1)
        var result: SessionDescription? = null
        var errorMsg: String? = null
        pc.createOffer(object : SdpObserver {
            override fun onCreateSuccess(sdp: SessionDescription?) {
                result = sdp
                latch.countDown()
            }
            override fun onSetSuccess() {}
            override fun onCreateFailure(err: String?) {
                errorMsg = err
                latch.countDown()
            }
            override fun onSetFailure(err: String?) {}
        }, MediaConstraints())
        if (!latch.await(3, TimeUnit.SECONDS)) {
            throw IllegalStateException("createOffer timeout")
        }
        return result ?: throw IllegalStateException(errorMsg ?: "createOffer failed")
    }

    private fun awaitSetLocalDescription(pc: PeerConnection, sdp: SessionDescription) {
        val latch = CountDownLatch(1)
        var errorMsg: String? = null
        pc.setLocalDescription(object : SdpObserver {
            override fun onCreateSuccess(p0: SessionDescription?) {}
            override fun onSetSuccess() { latch.countDown() }
            override fun onCreateFailure(err: String?) {}
            override fun onSetFailure(err: String?) {
                errorMsg = err
                latch.countDown()
            }
        }, sdp)
        if (!latch.await(3, TimeUnit.SECONDS) || errorMsg != null) {
            throw IllegalStateException(errorMsg ?: "setLocalDescription failed")
        }
    }

    private fun awaitSetRemoteDescription(pc: PeerConnection, sdp: SessionDescription) {
        val latch = CountDownLatch(1)
        var errorMsg: String? = null
        pc.setRemoteDescription(object : SdpObserver {
            override fun onCreateSuccess(p0: SessionDescription?) {}
            override fun onSetSuccess() { latch.countDown() }
            override fun onCreateFailure(err: String?) {}
            override fun onSetFailure(err: String?) {
                errorMsg = err
                latch.countDown()
            }
        }, sdp)
        if (!latch.await(3, TimeUnit.SECONDS) || errorMsg != null) {
            throw IllegalStateException(errorMsg ?: "setRemoteDescription failed")
        }
    }

    private fun markWebRtcOffline(payload: LiveStreamConfigPayload, note: String) {
        if (released) return
        val wasRendered = hasRenderedFirstFrame
        hasRenderedFirstFrame = false
        isStreamOffline = true
        if (wasRendered) {
            posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()
        }
        glassOverlay?.setOffline(payload.name, note)
        signalingExecutor.execute { closeActiveWebRtcPeer(notifyServer = true) }
        scheduleWebRtcReconnect(payload, delayMs = 2_500L)
    }

    private fun scheduleWebRtcReconnect(payload: LiveStreamConfigPayload, delayMs: Long) {
        if (released || !payload.autoReconnect) return
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        val task = Runnable {
            if (!released && isStreamOffline && activeEngine == RenderEngine.WEBRTC_UDP) {
                connectWebRtcSession(payload)
            }
        }
        reconnectRunnable = task
        mainHandler.postDelayed(task, delayMs)
    }

    private fun closeActiveWebRtcPeer(notifyServer: Boolean) {
        val renderer = webRtcRenderer
        remoteVideoTrack?.let { track ->
            if (renderer != null) {
                runCatching { track.removeSink(renderer) }
            }
        }
        remoteVideoTrack = null
        remoteAudioTrack = null
        runCatching {
            peerConnection?.dispose()
        }
        peerConnection = null
        val sid = activeWhepSessionId
        activeWhepSessionId = ""
        if (notifyServer && sid.isNotBlank()) {
            closeSessionOnServerAsync(sid)
        }
    }

    private fun closeSessionOnServerAsync(sessionId: String) {
        if (sessionId.isBlank()) return
        runCatching {
            val stub = LiveStreamServiceGrpc.newBlockingStub(
                GrpcChannelFactory(context).getChannel()
            ).withDeadlineAfter(2, TimeUnit.SECONDS)
            stub.closeWhepSession(
                LiveStreamCommon.CloseWhepSessionRequest.newBuilder()
                    .setSessionId(sessionId)
                    .build()
            )
        }
    }

    private fun applyWebRtcAudioVolume() {
        val track = remoteAudioTrack ?: return
        runCatching {
            track.setEnabled(!isMuted)
            track.setVolume(if (isMuted) 0.0 else if (isDucked) 0.15 else 1.0)
        }
    }

    // =========================================================================
    // 2. YouTube Live & Web Live Embed (Managed WebView)
    // =========================================================================

    @SuppressLint("SetJavaScriptEnabled")
    private fun startYouTubePlayback(
        container: FrameLayout,
        payload: LiveStreamConfigPayload,
        rawUrl: String
    ) {
        val target = YouTubeLiveUrlParser.parse(rawUrl)
        if (target == null) {
            lastError = "Invalid YouTube Live URL"
            glassOverlay?.setOffline(payload.name, "URL YouTube Live tidak valid.")
            return
        }

        val volumePercent = (currentAudioVolume() * 100).toInt()
        val html = YouTubeLiveUrlParser.buildIframePlayerHtml(target, isMuted, volumePercent)

        glassOverlay?.setBuffering(payload.name)
        val view = WebView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.BLACK)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            webChromeClient = WebChromeClient()
            addJavascriptInterface(object {
                @JavascriptInterface
                fun onPlaying() {
                    mainHandler.post {
                        if (!released) {
                            hasRenderedFirstFrame = true
                            isStreamOffline = false
                            lastError = ""
                            posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                            glassOverlay?.setLive(isLowLatency = false, badgeLabel = "LIVE • YOUTUBE")
                        }
                    }
                }

                @JavascriptInterface
                fun onError(code: Int) {
                    mainHandler.post {
                        if (!released) {
                            lastError = "YouTube player error ($code)"
                            isStreamOffline = true
                            glassOverlay?.setOffline(payload.name, "Siaran YouTube tidak aktif / memuat ulang...")
                            if (payload.autoReconnect) {
                                reconnectRunnable?.let(mainHandler::removeCallbacks)
                                val retry = Runnable {
                                    if (!released) {
                                        webView?.loadDataWithBaseURL(
                                            "https://www.youtube.com",
                                            html,
                                            "text/html",
                                            "UTF-8",
                                            null
                                        )
                                    }
                                }
                                reconnectRunnable = retry
                                mainHandler.postDelayed(retry, 5_000L)
                            }
                        }
                    }
                }
            }, "SigmaYtBridge")
            loadDataWithBaseURL("https://www.youtube.com", html, "text/html", "UTF-8", null)
        }
        webView = view
        container.addView(view)
        glassOverlay?.bringToFront()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun startEmbedPlayback(
        container: FrameLayout,
        payload: LiveStreamConfigPayload,
        rawUrl: String
    ) {
        val target = rawUrl.trim()
        if (target.isBlank()) {
            glassOverlay?.setOffline(payload.name, "URL Web Embed tidak tersedia.")
            return
        }

        glassOverlay?.setBuffering(payload.name)
        val view = WebView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.BLACK)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    mainHandler.post {
                        if (!released) {
                            hasRenderedFirstFrame = true
                            isStreamOffline = false
                            lastError = ""
                            posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                            glassOverlay?.setLive(isLowLatency = false, badgeLabel = "LIVE • EMBED")
                        }
                    }
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    if (request?.isForMainFrame == true) {
                        mainHandler.post {
                            if (!released) {
                                lastError = error?.description?.toString().orEmpty()
                                isStreamOffline = true
                                glassOverlay?.setOffline(payload.name, "Gagal memuat halaman siaran embed.")
                            }
                        }
                    }
                }
            }
            loadUrl(target)
        }
        webView = view
        container.addView(view)
        glassOverlay?.bringToFront()
    }

    // =========================================================================
    // 3. External HLS (.m3u8) & Direct LAN RTSP (Media3 ExoPlayer)
    // =========================================================================

    @SuppressLint("UnsafeOptInUsageError")
    private fun startExoPlayback(
        container: FrameLayout,
        targetUrl: String,
        payload: LiveStreamConfigPayload
    ) {
        this.activePlaybackUrl = targetUrl
        try {
            val targetUri = targetUrl.toUri()
            val isRtsp = targetUri.scheme.equals("rtsp", ignoreCase = true)
            val isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
            val targetBufferBytes = if (isLowSpec) 6 * 1024 * 1024 else 24 * 1024 * 1024
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    if (isRtsp) (if (isLowSpec) 750 else 800) else 1_500,
                    if (isRtsp) (if (isLowSpec) 2_000 else 2_500) else 4_000,
                    if (isRtsp) (if (isLowSpec) 350 else 200) else 300,
                    if (isRtsp) (if (isLowSpec) 500 else 350) else 600
                )
                .setTargetBufferBytes(targetBufferBytes)
                .setBackBuffer(0, false)
                .setPrioritizeTimeOverSizeThresholds(true)
                .build()

            val renderersFactory = DefaultRenderersFactory(context).apply {
                setEnableDecoderFallback(true)
                setExtensionRendererMode(
                    if (isLowSpec) DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF
                    else DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON
                )
            }

            val badgeLabel = if (isRtsp) "LIVE • RTSP" else "LIVE • HLS"

            val player = ExoPlayer.Builder(context, renderersFactory)
                .setLoadControl(loadControl)
                .setLivePlaybackSpeedControl(
                    DefaultLivePlaybackSpeedControl.Builder()
                        .setFallbackMinPlaybackSpeed(0.97f)
                        .setFallbackMaxPlaybackSpeed(1.03f)
                        .build()
                )
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    videoScalingMode = C.VIDEO_SCALING_MODE_SCALE_TO_FIT_WITH_CROPPING
                    val mediaItem = MediaItem.Builder()
                        .setUri(targetUri)
                        .setLiveConfiguration(liveConfiguration(isRtsp, isLowSpec))
                        .build()

                    if (isRtsp) {
                        setMediaSource(createRtspMediaSource(mediaItem))
                    } else {
                        setMediaItem(mediaItem)
                    }
                    volume = currentAudioVolume()
                    playWhenReady = !playbackPaused

                    addListener(object : Player.Listener {
                        override fun onRenderedFirstFrame() {
                            if (!released) {
                                hasRenderedFirstFrame = true
                                lastError = ""
                                isStreamOffline = false
                                reconnectRunnable?.let(mainHandler::removeCallbacks)
                                bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                posterView?.animate()?.alpha(0f)?.setDuration(250)?.start()
                                glassOverlay?.setLive(isLowLatency = false, badgeLabel = badgeLabel)
                            }
                        }

                        override fun onPlaybackStateChanged(playbackState: Int) {
                            if (released) return
                            when (playbackState) {
                                Player.STATE_BUFFERING -> {
                                    if (!isStreamOffline) {
                                        if (!hasRenderedFirstFrame) {
                                            glassOverlay?.setBuffering(payload.name)
                                        } else {
                                            bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                            val debounceTask = Runnable {
                                                if (!released && !isStreamOffline) {
                                                    glassOverlay?.setBuffering(payload.name)
                                                }
                                            }
                                            bufferingDebounceRunnable = debounceTask
                                            mainHandler.postDelayed(debounceTask, 1_200L)
                                        }
                                    }
                                }
                                Player.STATE_READY -> {
                                    bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                    if (isPlaying) {
                                        isStreamOffline = false
                                        reconnectRunnable?.let(mainHandler::removeCallbacks)
                                        glassOverlay?.setLive(isLowLatency = false, badgeLabel = badgeLabel)
                                    }
                                }
                                Player.STATE_ENDED, Player.STATE_IDLE -> {
                                    bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                    isStreamOffline = true
                                    glassOverlay?.setOffline(payload.name)
                                    scheduleExoReconnect(payload, delayMs = 2_000L)
                                }
                            }
                        }

                        override fun onPlayerError(error: PlaybackException) {
                            Log.w(TAG, "HLS/RTSP playback error stream=${payload.streamId}: ${error.message}")
                            lastError = "${error.errorCodeName} (${error.errorCode})"
                            if (!released) {
                                bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
                                hasRenderedFirstFrame = false
                                isStreamOffline = true
                                if (activePlaybackUrl.startsWith("rtsp://", ignoreCase = true) && !useRtpTcp) {
                                    useRtpTcp = true
                                }
                                posterView?.animate()?.alpha(1f)?.setDuration(200)?.start()
                                glassOverlay?.setOffline(payload.name, "Menunggu sumber siaran tersedia kembali.")
                                scheduleExoReconnect(payload, delayMs = 2_000L)
                            }
                        }
                    })

                    prepare()
                }
            exoPlayer = player

            playerView = (android.view.LayoutInflater.from(context)
                .inflate(com.dkaapis.sigma.R.layout.item_video_player, container, false) as PlayerView).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FILL
                (videoSurfaceView as? android.view.SurfaceView)?.setZOrderMediaOverlay(true)
                this.player = player
            }
            container.addView(playerView)
            glassOverlay?.bringToFront()
        } catch (error: Exception) {
            Log.e(TAG, "Failed to initialize ExoPlayer for stream=${payload.streamId}: ${error.message}", error)
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun scheduleExoReconnect(payload: LiveStreamConfigPayload, delayMs: Long = 3_000L) {
        if (released || !payload.autoReconnect) return
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        val runnable = Runnable {
            if (!released && exoPlayer != null && isStreamOffline && activeEngine == RenderEngine.EXOPLAYER) {
                try {
                    val targetUri = activePlaybackUrl.toUri()
                    val isRtsp = targetUri.scheme.equals("rtsp", ignoreCase = true)
                    val isLowSpec = DeviceCapabilityHelper.isLowSpecDevice(context)
                    val mediaItem = MediaItem.Builder()
                        .setUri(targetUri)
                        .setLiveConfiguration(liveConfiguration(isRtsp, isLowSpec))
                        .build()
                    if (isRtsp) {
                        exoPlayer?.setMediaSource(createRtspMediaSource(mediaItem))
                    } else {
                        exoPlayer?.seekToDefaultPosition()
                    }
                    exoPlayer?.prepare()
                    exoPlayer?.play()
                } catch (e: Exception) {
                    Log.w(TAG, "ExoPlayer reconnect attempt error: ${e.message}")
                }
                scheduleExoReconnect(payload, delayMs = 3_500L)
            }
        }
        reconnectRunnable = runnable
        mainHandler.postDelayed(runnable, delayMs)
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun createRtspMediaSource(mediaItem: MediaItem) =
        RtspMediaSource.Factory()
            .setForceUseRtpTcp(useRtpTcp)
            .setTimeoutMs(8_000L)
            .createMediaSource(mediaItem)

    private fun liveConfiguration(isRtsp: Boolean, isLowSpec: Boolean) =
        MediaItem.LiveConfiguration.Builder()
            .setTargetOffsetMs(if (isRtsp) (if (isLowSpec) 500L else 50L) else 1_500L)
            .setMinPlaybackSpeed(if (isRtsp && isLowSpec) 0.97f else 1.0f)
            .setMaxPlaybackSpeed(if (isRtsp && isLowSpec) 1.03f else if (isRtsp) 1.25f else 1.15f)
            .build()

    private fun currentAudioVolume(): Float =
        if (isMuted) 0f else if (isDucked) 0.15f else 1f

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
        applyWebRtcAudioVolume()
        val volPercent = (currentAudioVolume() * 100).toInt()
        webView?.post {
            webView?.evaluateJavascript(
                "if (window.sigmaSetAudio) window.sigmaSetAudio($isMuted, $volPercent);",
                null
            )
        }
    }

    fun pause() {
        playbackPaused = true
        exoPlayer?.pause()
        remoteAudioTrack?.setEnabled(false)
        webView?.onPause()
    }

    fun resume() {
        playbackPaused = false
        exoPlayer?.play()
        applyWebRtcAudioVolume()
        webView?.onResume()
        if (activeEngine == RenderEngine.WEBRTC_UDP && isStreamOffline && peerConnection == null) {
            activePayload?.let { connectWebRtcSession(it) }
        }
    }

    fun release() {
        released = true
        connectGeneration.incrementAndGet()
        bufferingDebounceRunnable?.let(mainHandler::removeCallbacks)
        bufferingDebounceRunnable = null
        reconnectRunnable?.let(mainHandler::removeCallbacks)
        reconnectRunnable = null
        mainHandler.removeCallbacksAndMessages(null)

        val renderer = webRtcRenderer
        signalingExecutor.execute {
            closeActiveWebRtcPeer(notifyServer = true)
            mainHandler.post {
                runCatching { renderer?.release() }
            }
            signalingExecutor.shutdown()
        }
        webRtcRenderer = null

        exoPlayer?.release()
        exoPlayer = null
        playerView?.player = null
        playerView = null

        webView?.apply {
            stopLoading()
            loadUrl("about:blank")
            removeAllViews()
            destroy()
        }
        webView = null

        posterView = null
        glassOverlay?.hideAll()
        glassOverlay = null
        activePayload = null
    }

    companion object {
        private const val TAG = "LiveStreamZoneRenderer"
    }
}
