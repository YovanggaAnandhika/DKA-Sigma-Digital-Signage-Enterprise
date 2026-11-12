package com.dkaapis.sigma.service

import android.app.PendingIntent
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import com.dkaapis.sigma.receiver.AppUpdateInstallReceiver
import java.io.File
import java.io.FileInputStream

class AppUpdateInstaller(private val context: Context) {
    fun isDeviceOwner(): Boolean {
        val policyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return policyManager.isDeviceOwnerApp(context.packageName)
    }

    fun install(apkFile: File) {
        val packageInstaller = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setAppPackageName(context.packageName)
            setSize(apkFile.length())
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && isDeviceOwner()) {
                setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
            }
            // shortcut: silent OTA needs Android 12+, revisit only if older device-owner devices require it.
        }
        var sessionId: Int? = null
        var committed = false
        try {
            val createdSessionId = packageInstaller.createSession(params)
            sessionId = createdSessionId
            packageInstaller.openSession(createdSessionId).use { session ->
                FileInputStream(apkFile).use { input ->
                    session.openWrite("base.apk", 0, apkFile.length()).use { output ->
                        input.copyTo(output)
                        session.fsync(output)
                    }
                }

                val callback = Intent(context, AppUpdateInstallReceiver::class.java)
                    .putExtra(AppUpdateInstallReceiver.EXTRA_APK_PATH, apkFile.absolutePath)
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
                val pendingIntent = PendingIntent.getBroadcast(context, createdSessionId, callback, flags)
                session.commit(pendingIntent.intentSender)
                committed = true
            }
        } catch (error: Exception) {
            sessionId?.let(packageInstaller::abandonSession)
            throw error
        } finally {
            if (!committed) apkFile.delete()
        }
    }
}
