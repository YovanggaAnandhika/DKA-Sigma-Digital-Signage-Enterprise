package com.dkaapis.sigma.data.repository.mapper

import com.dkaapis.sigma.domain.model.LayerBlock
import com.dkaapis.sigma.domain.model.LayerPlaylistItem
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaAsset
import com.dkaapis.sigma.domain.model.MediaType
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import signage.distribution.v1.manifest.ManifestCommon

/**
 * Pemeta Protobuf CompiledManifest gRPC ke Entity Domain Manifest
 */
class ManifestProtoMapper {

    fun mapToDomain(proto: ManifestCommon.CompiledManifest, baseUrl: String): Manifest {
        val layout = proto.layout
        val zonesList = mutableListOf<LayerZone>()

        for ((i, layer) in layout.layersList.withIndex()) {
            val blocksList = mutableListOf<LayerBlock>()
            for ((j, block) in layer.blocksList.withIndex()) {
                val hasQueue = block.hasQueueId() && block.queueId.isNotBlank()
                val hasClock = block.hasClockId() && block.clockId.isNotBlank()
                val hasTicker = block.hasTickerId() && block.tickerId.isNotBlank()
                val hasWebview = block.hasWebviewId() && block.webviewId.isNotBlank()

                val wType = when {
                    hasQueue -> ZoneWidgetType.QUEUE
                    hasClock -> ZoneWidgetType.CLOCK
                    hasTicker -> ZoneWidgetType.TICKER
                    hasWebview -> ZoneWidgetType.WEBVIEW
                    else -> ZoneWidgetType.NONE
                }

                val playlistItems = mutableListOf<LayerPlaylistItem>()
                if (block.hasPlaylist()) {
                    for ((k, item) in block.playlist.itemsList.withIndex()) {
                        playlistItems.add(
                            LayerPlaylistItem(
                                id = item.id.ifEmpty { "pl-item-$k" },
                                mediaItemId = item.mediaItemId,
                                position = item.position,
                                durationSeconds = item.durationSeconds,
                                isMuted = item.isMuted,
                                volumeLevel = 100
                            )
                        )
                    }
                }

                blocksList.add(
                    LayerBlock(
                        id = block.id.ifEmpty { "blk-$j" },
                        mediaItemId = block.mediaItemId.takeIf { it.isNotBlank() },
                        playlistId = block.playlistId.takeIf { it.isNotBlank() },
                        widgetType = wType,
                        widgetDataJson = if (block.hasWidgetDataJson()) block.widgetDataJson else null,
                        startTimeSeconds = block.startTimeSeconds,
                        durationSeconds = block.durationSeconds,
                        isMuted = block.isMuted,
                        volumeLevel = block.volumeLevel,
                        playlistItems = playlistItems
                    )
                )
            }

            zonesList.add(
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
                    blocks = blocksList,
                    isLocked = false
                )
            )
        }

        val assetsList = mutableListOf<MediaAsset>()
        for ((i, asset) in proto.requiredAssetsList.withIndex()) {
            var rawUrl = asset.url
            if (rawUrl.startsWith("/")) {
                val trimmedBase = baseUrl.trimEnd('/')
                rawUrl = "$trimmedBase$rawUrl"
            }

            assetsList.add(
                MediaAsset(
                    mediaId = asset.mediaId,
                    url = rawUrl,
                    sha256Hash = asset.sha256Hash,
                    fileSizeBytes = asset.fileSizeBytes,
                    localFilename = asset.localFilename.ifEmpty { "media_$i" },
                    mediaType = MediaType.fromInt(asset.mediaTypeValue),
                    durationSeconds = 10
                )
            )
        }

        return Manifest(
            manifestId = proto.manifestId,
            deviceId = proto.deviceId,
            versionHash = proto.versionHash,
            layoutId = layout.id,
            layoutName = layout.name.ifEmpty { "Layout Default" },
            canvasWidth = layout.canvasWidth,
            canvasHeight = layout.canvasHeight,
            zones = zonesList,
            requiredAssets = assetsList,
            totalDownloadSizeBytes = proto.totalDownloadSizeBytes,
            generatedAt = proto.generatedAt
        )
    }
}
