package com.dkaapis.sigma.domain.model

data class AppUpdate(
    val id: String,
    val versionCode: Int,
    val versionName: String,
    val apkFileUrl: String,
    val fileSizeBytes: Long,
    val sha256Hash: String,
    val releaseNotes: String,
    val isForceUpdate: Boolean
)
