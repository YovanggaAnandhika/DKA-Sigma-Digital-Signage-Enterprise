package com.dkaapis.sigma.domain.model

sealed class DownloadState {
    data class Verifying(val assetIndex: Int, val totalAssets: Int, val filename: String) : DownloadState()
    data class Progress(
        val assetIndex: Int,
        val totalAssets: Int,
        val percent: Int,
        val downloadedBytes: Long = 0L,
        val totalBytes: Long = 0L,
        val currentFileName: String = ""
    ) : DownloadState()
    data class AssetComplete(val asset: MediaAsset) : DownloadState()
    data class AllComplete(val manifest: Manifest) : DownloadState()
    data class Error(val asset: MediaAsset, val message: String) : DownloadState()
}
