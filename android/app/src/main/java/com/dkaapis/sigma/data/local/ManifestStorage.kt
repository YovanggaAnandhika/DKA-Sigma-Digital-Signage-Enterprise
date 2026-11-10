package com.dkaapis.sigma.data.local

import android.content.Context
import java.io.File
import java.io.FileOutputStream

class ManifestStorage(context: Context) {

    private val manifestDir: File = File(context.filesDir, "manifest").apply {
        if (!exists()) mkdirs()
    }
    private val activeManifestFile: File = File(manifestDir, "manifest.active.pb")

    @Synchronized
    fun saveManifest(bytes: ByteArray): Boolean {
        val tempFile = File(manifestDir, "manifest.tmp.pb")
        return try {
            FileOutputStream(tempFile).use { fos ->
                fos.write(bytes)
                fos.flush()
            }
            tempFile.renameTo(activeManifestFile)
        } catch (e: Exception) {
            tempFile.delete()
            false
        }
    }

    @Synchronized
    fun getActiveManifest(): ByteArray? {
        if (!activeManifestFile.exists()) return null
        return try {
            activeManifestFile.readBytes()
        } catch (e: Exception) {
            null
        }
    }

    @Synchronized
    fun clear() {
        if (activeManifestFile.exists()) {
            activeManifestFile.delete()
        }
    }
}
