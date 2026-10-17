package com.dkasigma.player.data.local

import android.content.Context
import com.dkasigma.player.domain.model.Manifest
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class ManifestStorage(context: Context) {

    private val manifestDir: File = File(context.filesDir, "manifest").apply {
        if (!exists()) mkdirs()
    }
    private val activeManifestFile: File = File(manifestDir, "manifest.active.json")

    @Synchronized
    fun saveManifest(manifestJsonString: String): Boolean {
        val tempFile = File(manifestDir, "manifest.tmp.json")
        return try {
            FileOutputStream(tempFile).use { fos ->
                fos.write(manifestJsonString.toByteArray(Charsets.UTF_8))
                fos.flush()
            }
            tempFile.renameTo(activeManifestFile)
        } catch (e: Exception) {
            tempFile.delete()
            false
        }
    }

    @Synchronized
    fun getActiveManifestJson(): String? {
        if (!activeManifestFile.exists()) return null
        return try {
            activeManifestFile.readText(Charsets.UTF_8)
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
