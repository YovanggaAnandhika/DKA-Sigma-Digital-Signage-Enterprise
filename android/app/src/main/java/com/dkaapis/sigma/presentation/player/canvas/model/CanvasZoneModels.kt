package com.dkaapis.sigma.presentation.player.canvas.model

import android.app.Activity
import com.dkaapis.sigma.data.repository.MediaStorageRepositoryImpl
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.presentation.player.canvas.SignageCanvasLayout
import com.dkaapis.sigma.presentation.renderers.QueueZoneRenderer

/**
 * Payload parameter konteks render zona canvas signage
 */
data class ZoneRenderContextPayload(
    val activity: Activity,
    val canvasLayout: SignageCanvasLayout,
    val manifest: Manifest,
    val storageRepo: MediaStorageRepositoryImpl,
    val onQueueReady: (renderer: QueueZoneRenderer, queueId: String, widgetDataJson: String?) -> Unit,
    val onDuckingChanged: (isDucked: Boolean) -> Unit,
    val onQueueTapNext: (ticketNum: String, counterNm: String) -> Unit
)
