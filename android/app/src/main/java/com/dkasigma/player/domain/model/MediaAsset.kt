package com.dkasigma.player.domain.model

enum class MediaType(val rawValue: Int) {
    UNSPECIFIED(0),
    IMAGE(1),
    VIDEO(2),
    WEB(3);

    companion object {
        fun fromInt(value: Int): MediaType = entries.find { it.rawValue == value } ?: UNSPECIFIED
    }
}

data class MediaAsset(
    val mediaId: String,
    val url: String,
    val sha256Hash: String,
    val fileSizeBytes: Long,
    val localFilename: String,
    val mediaType: MediaType = MediaType.IMAGE,
    val durationSeconds: Int = 10,
    val isCached: Boolean = false,
    val localPath: String? = null
)
