package com.dkaapis.sigma.data.repository.mapper

import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.LayerPlaylistItem
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.model.MediaType
import com.dkaapis.sigma.domain.model.PowerSchedule
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import signage.distribution.v1.manifest.ManifestCommon

/**
 * Pemeta Protobuf CompiledManifest gRPC ke Entity Domain Manifest.
 * Ditulis secara fungsional dan deklaratif tanpa tumpukan variabel lokal.
 */
class ManifestProtoMapper {

    fun mapToDomain(proto: ManifestCommon.CompiledManifest, baseUrl: String = ""): Manifest = with(proto) {
        val trimmedBase = baseUrl.trimEnd('/')
        Manifest(
            manifestId = manifestId,
            deviceId = deviceId,
            versionHash = versionHash,
            layoutId = layout.id,
            layoutName = layout.name.ifEmpty { "Layout Default" },
            canvasWidth = layout.canvasWidth,
            canvasHeight = layout.canvasHeight,
            zones = layout.layersList.mapIndexed { i, layer ->
                LayerZone(
                    id = layer.id.ifEmpty { "zone-$i" },
                    name = layer.name.ifEmpty { "Layer $i" },
                    x = layer.x,
                    y = layer.y,
                    width = layer.width,
                    height = layer.height,
                    zIndex = layer.zIndex,
                    backgroundColor = layer.backgroundColor.takeIf { it.isNotBlank() },
                    opacity = layer.opacity,
                    overlayColor = layer.overlayColor.takeIf { it.isNotBlank() },
                    overlayOpacity = layer.overlayOpacity,
                    borderRadius = layer.borderRadius,
                    borderColor = layer.borderColor.takeIf { it.isNotBlank() },
                    borderWidth = layer.borderWidth,
                    blocks = layer.blocksList.mapIndexed { j, block ->
                        LayerBlock(
                            id = block.id.ifEmpty { "blk-$j" },
                            mediaItemId = block.mediaItemId.takeIf { it.isNotBlank() },
                            playlistId = block.playlistId.takeIf { it.isNotBlank() },
                            widgetType = when {
                                block.hasQueueId() && block.queueId.isNotBlank() -> ZoneWidgetType.QUEUE
                                block.hasClockId() && block.clockId.isNotBlank() -> ZoneWidgetType.CLOCK
                                block.hasTickerId() && block.tickerId.isNotBlank() -> ZoneWidgetType.TICKER
                                block.hasWebviewId() && block.webviewId.isNotBlank() -> ZoneWidgetType.WEBVIEW
                                else -> ZoneWidgetType.NONE
                            },
                            widgetDataJson = if (block.hasWidgetDataJson()) block.widgetDataJson else null,
                            startTimeSeconds = block.startTimeSeconds,
                            durationSeconds = block.durationSeconds,
                            isMuted = block.isMuted,
                            volumeLevel = block.volumeLevel,
                            playlistItems = if (block.hasPlaylist()) {
                                block.playlist.itemsList.mapIndexed { k, item ->
                                    LayerPlaylistItem(
                                        id = item.id.ifEmpty { "pl-item-$k" },
                                        mediaItemId = item.mediaItemId,
                                        position = item.position,
                                        durationSeconds = item.durationSeconds,
                                        isMuted = item.isMuted,
                                        volumeLevel = 100
                                    )
                                }
                            } else emptyList()
                        )
                    },
                    isLocked = false
                )
            },
            requiredAssets = requiredAssetsList.mapIndexed { i, asset ->
                val rawUrl = asset.url
                val resolvedUrl = if (trimmedBase.isNotEmpty() && rawUrl.startsWith("/")) "$trimmedBase$rawUrl" else rawUrl
                MediaAsset(
                    mediaId = asset.mediaId,
                    url = resolvedUrl,
                    sha256Hash = asset.sha256Hash,
                    fileSizeBytes = asset.fileSizeBytes,
                    localFilename = asset.localFilename.ifEmpty { "media_$i" },
                    mediaType = MediaType.fromInt(asset.mediaTypeValue),
                    durationSeconds = 10
                )
            },
            totalDownloadSizeBytes = totalDownloadSizeBytes,
            powerSchedule = if (hasPowerSchedule()) {
                PowerSchedule(
                    enabled = powerSchedule.enabled,
                    sleepTime = powerSchedule.sleepTime.ifBlank { "22:00:00" },
                    wakeTime = powerSchedule.wakeTime.ifBlank { "06:00:00" }
                )
            } else null,
            isCanary = isCanary,
            generatedAt = generatedAt
        )
    }
}
