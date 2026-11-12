package com.dkaapis.sigma

import com.dkaapis.sigma.data.repository.AppUpdateRepositoryImpl
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppUpdateRepositoryTest {
    @Test
    fun onlyAcceptsLocalAssetPathsForApkDownloads() {
        assertTrue(AppUpdateRepositoryImpl.isAllowedApkPath("/api/assets/1234_player-v2.apk"))
        assertFalse(AppUpdateRepositoryImpl.isAllowedApkPath("https://example.com/player.apk"))
        assertFalse(AppUpdateRepositoryImpl.isAllowedApkPath("/api/assets/../secrets.apk"))
        assertFalse(AppUpdateRepositoryImpl.isAllowedApkPath("/api/assets/player.apk?redirect=example.com"))
    }
}
