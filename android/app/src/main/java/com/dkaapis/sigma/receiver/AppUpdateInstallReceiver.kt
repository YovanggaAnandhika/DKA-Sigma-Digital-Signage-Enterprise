package com.dkaapis.sigma.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.util.Log
import android.widget.Toast
import com.dkaapis.sigma.presentation.player.PlayerActivity
import java.io.File

class AppUpdateInstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
        when (status) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                val confirmationIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(Intent.EXTRA_INTENT)
                }
                confirmationIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                if (confirmationIntent != null) context.startActivity(confirmationIntent)
            }
            PackageInstaller.STATUS_SUCCESS -> {
                onInstallSuccess(context, intent)
            }
            else -> {
                val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE).orEmpty()
                onInstallFailure(context, intent, status, message)
            }
        }
    }

    private fun onInstallSuccess(context: Context, intent: Intent) {
        Log.i(TAG, "OTA APK berhasil dipasang")
        intent.getStringExtra(EXTRA_APK_PATH)?.let { File(it).delete() }
        context.startActivity(
            Intent(context, PlayerActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        )
    }

    private fun onInstallFailure(context: Context, intent: Intent, status: Int, message: String) {
        Log.e(TAG, "Pemasangan OTA gagal (status=$status): $message")
        intent.getStringExtra(EXTRA_APK_PATH)?.let { File(it).delete() }
        Toast.makeText(context, "Pembaruan aplikasi gagal dipasang: $message", Toast.LENGTH_LONG).show()
    }

    companion object {
        const val EXTRA_APK_PATH = "apk_path"
        private const val TAG = "AppUpdateInstaller"
    }
}
