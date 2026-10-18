package com.dkaapis.sigma.data.local

import android.content.Context
import android.os.Environment
import android.os.StatFs
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

class MediaDiskCache(context: Context) {

    private val assetsDir: File = File(context.getExternalFilesDir(null) ?: context.filesDir, "assets").apply {
        if (!exists()) mkdirs()
    }

    fun getAssetFile(mediaId: String): File {
        return File(assetsDir, mediaId)
    }

    fun getPartFile(mediaId: String): File {
        return File(assetsDir, "$mediaId.part")
    }

    fun isAssetCached(mediaId: String): Boolean {
        val file = getAssetFile(mediaId)
        return file.exists() && file.length() > 0
    }

    fun verifyFileSha256(file: File, expectedHash: String): Boolean {
        if (!file.exists() || file.length() == 0L) return false
        if (expectedHash.isBlank()) return true
        val computedHash = calculateSha256(file)
        return computedHash.equals(expectedHash.trim(), ignoreCase = true)
    }

    private fun calculateSha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { fis ->
            val buffer = ByteArray(65536)
            var bytesRead: Int
            while (fis.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    fun cleanOrphanFiles(activeMediaIds: Set<String>) {
        val files = assetsDir.listFiles() ?: return
        for (file in files) {
            val name = file.name
            val id = name.removeSuffix(".part")
            if (!activeMediaIds.contains(id)) {
                file.delete()
            }
        }
    }

    fun getFreeSpaceBytes(): Long {
        val stat = StatFs(assetsDir.path)
        return stat.availableBlocksLong * stat.blockSizeLong
    }

    fun getTotalSpaceBytes(): Long {
        val stat = StatFs(assetsDir.path)
        return stat.blockCountLong * stat.blockSizeLong
    }
}
