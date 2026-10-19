package com.dkaapis.sigma.presentation.player.canvas

import com.dkaapis.sigma.data.repository.MediaStorageRepositoryImpl
import com.dkaapis.sigma.domain.model.LayerZone
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.MediaType
import com.dkaapis.sigma.presentation.renderers.VideoPlaylistItem
import java.io.File
import java.io.FileInputStream
import java.nio.charset.StandardCharsets

/**
 * Penyelesai media (video / gambar) untuk blok konten zona signage
 */
class ZoneMediaResolver {

    fun resolveMedia(
        zone: LayerZone,
        manifest: Manifest,
        storageRepo: MediaStorageRepositoryImpl
    ): Pair<List<VideoPlaylistItem>, File?> {
        val videoItems = mutableListOf<VideoPlaylistItem>()
        var firstImageFile: File? = null

        for (block in zone.blocks) {
            if (block.playlistItems.isNotEmpty()) {
                for (item in block.playlistItems.sortedBy { it.position }) {
                    val mediaId = item.mediaItemId
                    val file = storageRepo.getLocalFileForAsset(mediaId) ?: continue
                    val asset = manifest.requiredAssets.find { it.mediaId == mediaId }
                    val isVideo = asset?.localFilename?.endsWith(".mp4", ignoreCase = true) == true
                        || asset?.url?.endsWith(".mp4", ignoreCase = true) == true
                        || asset?.mediaType == MediaType.VIDEO
                        || isVideoFile(file)

                    if (isVideo) {
                        videoItems.add(
                            VideoPlaylistItem(
                                file = file,
                                durationSeconds = item.durationSeconds,
                                isMuted = item.isMuted || block.isMuted,
                                mediaId = mediaId,
                                mediaName = asset?.localFilename ?: file.name,
                                volumeLevel = item.volumeLevel
                            )
                        )
                    } else if (firstImageFile == null) {
                        firstImageFile = file
                    }
                }
            } else {
                val mediaId = block.mediaItemId ?: continue
                val file = storageRepo.getLocalFileForAsset(mediaId) ?: continue
                val asset = manifest.requiredAssets.find { it.mediaId == mediaId }
                val isVideo = asset?.localFilename?.endsWith(".mp4", ignoreCase = true) == true
                    || asset?.url?.endsWith(".mp4", ignoreCase = true) == true
                    || asset?.mediaType == MediaType.VIDEO
                    || isVideoFile(file)

                if (isVideo) {
                    videoItems.add(
                        VideoPlaylistItem(
                            file = file,
                            durationSeconds = block.durationSeconds,
                            isMuted = block.isMuted,
                            mediaId = mediaId,
                            mediaName = asset?.localFilename ?: file.name,
                            volumeLevel = block.volumeLevel
                        )
                    )
                } else if (firstImageFile == null) {
                    firstImageFile = file
                }
            }
        }

        return Pair(videoItems, firstImageFile)
    }

    fun isVideoFile(file: File): Boolean {
        if (file.name.endsWith(".mp4", ignoreCase = true) || file.extension.equals("video", ignoreCase = true)) {
            return true
        }
        return runCatching {
            if (file.length() > 12) {
                FileInputStream(file).use { fis ->
                    val header = ByteArray(12)
                    if (fis.read(header) == 12) {
                        val signature = String(header, 4, 4, StandardCharsets.ISO_8859_1)
                        signature == "ftyp" || signature == "moov"
                    } else false
                }
            } else false
        }.getOrDefault(false)
    }
}
