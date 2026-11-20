package com.dkaapis.sigma.presentation.renderers

import android.content.Context
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.PeerConnectionFactory

/**
 * Singleton WebRTC runtime so low-RAM Android TVs reuse one EglBase and PeerConnectionFactory
 * across zone and manifest reloads without leaking native threads or OpenGL contexts.
 */
object SharedWebRtcRuntime {
    data class Holder(
        val eglBase: EglBase,
        val peerConnectionFactory: PeerConnectionFactory
    )

    @Volatile
    private var holder: Holder? = null

    @Synchronized
    fun get(context: Context): Holder {
        holder?.let { return it }
        val appContext = context.applicationContext
        val eglBase = EglBase.create()
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(appContext)
                .createInitializationOptions()
        )
        val decoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)
        val encoderFactory = DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true)
        val factory = PeerConnectionFactory.builder()
            .setVideoDecoderFactory(decoderFactory)
            .setVideoEncoderFactory(encoderFactory)
            .createPeerConnectionFactory()

        return Holder(eglBase, factory).also { holder = it }
    }
}
