package com.dkaapis.sigma.service

import android.app.PendingIntent
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import com.dkaapis.sigma.receiver.AppUpdateInstallReceiver
import com.dkaapis.sigma.receiver.SignageDeviceAdminReceiver
import java.io.File
import java.io.FileInputStream

class AppUpdateInstaller(private val context: Context) {
    fun isDeviceOwner(): Boolean {
        val policyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return policyManager.isDeviceOwnerApp(context.packageName)
    }

    fun install(apkFile: File) {
        if (isDeviceOwner()) {
            installAsDeviceOwner(apkFile)
            return
        }

        val packageInstaller = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setAppPackageName(context.packageName)
            setSize(apkFile.length())
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

    @Suppress("DEPRECATION")
    private fun installAsDeviceOwner(apkFile: File) {
        val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(context, SignageDeviceAdminReceiver::class.java)
        val callback = Intent(context, AppUpdateInstallReceiver::class.java)
            .putExtra(AppUpdateInstallReceiver.EXTRA_APK_PATH, apkFile.absolutePath)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
        val callbackIntent = PendingIntent.getBroadcast(context, apkFile.hashCode(), callback, flags)

        try {
            devicePolicyManager.installPackage(admin, Uri.fromFile(apkFile), callbackIntent.intentSender)
        } catch (error: Exception) {
            apkFile.delete()
            throw error
        }
    }
}
