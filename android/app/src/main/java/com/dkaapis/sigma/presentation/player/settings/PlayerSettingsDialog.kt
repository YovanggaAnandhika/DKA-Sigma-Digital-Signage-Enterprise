package com.dkaapis.sigma.presentation.player.settings

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.appcompat.widget.SwitchCompat
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.dkaapis.sigma.R
import com.dkaapis.sigma.domain.model.AppUpdate
import com.dkaapis.sigma.presentation.common.createExpandedSheet
import com.dkaapis.sigma.presentation.player.settings.model.PlayerSettingsPayload
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

/**
 * Controller BottomSheetDialog pengaturan player signage.
 * Menangani tampilan status perangkat, switch telemetri, dan aksi unbind perangkat.
 */
class PlayerSettingsDialog(
    private val context: Context
) {
    private var activeDialog: BottomSheetDialog? = null
    private var availableAppUpdate: AppUpdate? = null
    private var onAppUpdateRequested: (AppUpdate) -> Unit = {}

    fun isShowing(): Boolean = activeDialog?.isShowing == true

    fun dismiss() {
        activeDialog?.dismiss()
        activeDialog = null
    }

    fun show(payload: PlayerSettingsPayload) {
        if (isShowing()) return

        availableAppUpdate = payload.availableAppUpdate
        onAppUpdateRequested = payload.onAppUpdateRequested
        val dialog = createExpandedSheet(
            context, R.layout.bottom_sheet_player_settings,
            landscapeMaxDp = 580, portraitMaxDp = 480, heightFraction = 0.92f to 0.85f
        ).apply { setOnDismissListener { activeDialog = null } }
        activeDialog = dialog

        dialog.findViewById<TextView>(R.id.tvSettingsDeviceId)?.text =
            "ID Layar: ${payload.deviceId.ifBlank { "(Belum terdaftar)" }}"

        dialog.findViewById<TextView>(R.id.tvSettingsServerUrl)?.text =
            "Server: ${payload.serverHost}:${payload.serverGrpcPort}"

        bindAppUpdate(dialog)

        dialog.findViewById<SwitchCompat>(R.id.switchProgressUpload)?.apply {
            isChecked = payload.isProgressUploadEnabled
            setOnCheckedChangeListener { _, isChecked ->
                payload.onProgressUploadToggled(isChecked)
            }
        }

        val btnAccessibility = dialog.findViewById<Button>(R.id.btnOpenAccessibilitySettings)
        btnAccessibility?.visibility = if (payload.isKioskModeEnabled) View.VISIBLE else View.GONE

        dialog.findViewById<SwitchCompat>(R.id.switchKioskMode)?.apply {
            isChecked = payload.isKioskModeEnabled
            setOnCheckedChangeListener { _, isChecked ->
                payload.onKioskModeToggled(isChecked)
                btnAccessibility?.visibility = if (isChecked) View.VISIBLE else View.GONE
            }
        }

        btnAccessibility?.setOnClickListener {
            runCatching {
                val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            }
        }

        dialog.findViewById<Button>(R.id.btnSleepScreenNow)?.setOnClickListener {
            dialog.dismiss()
            payload.onScreenSleepRequested()
        }

        dialog.findViewById<Button>(R.id.btnExitApp)?.setOnClickListener {
            dialog.dismiss()
            payload.onExitAppRequested()
        }

        dialog.findViewById<Button>(R.id.btnDismissSettings)?.setOnClickListener {
            dialog.dismiss()
        }

        dialog.findViewById<Button>(R.id.btnUnbindDevice)?.setOnClickListener {
            showUnbindConfirmation {
                dialog.dismiss()
                payload.onUnbindRequested()
            }
        }

        dialog.show()
    }

    fun updateAvailableAppUpdate(update: AppUpdate?) {
        availableAppUpdate = update
        activeDialog?.let(::bindAppUpdate)
    }

    private fun bindAppUpdate(dialog: BottomSheetDialog) {
        val card = dialog.findViewById<View>(R.id.cardAppUpdate) ?: return
        val update = availableAppUpdate
        if (update == null || update.isForceUpdate) {
            card.visibility = View.GONE
            return
        }

        card.visibility = View.VISIBLE
        dialog.findViewById<TextView>(R.id.tvSettingsAppUpdateVersion)?.text =
            context.getString(
                R.string.settings_app_update_version,
                update.versionName,
                update.versionCode
            )
        dialog.findViewById<TextView>(R.id.tvSettingsAppUpdateNotes)?.text =
            update.releaseNotes.ifBlank { context.getString(R.string.settings_app_update_default_notes) }
        dialog.findViewById<Button>(R.id.btnSettingsAppUpdate)?.setOnClickListener {
            val selectedUpdate = availableAppUpdate ?: return@setOnClickListener
            dialog.dismiss()
            onAppUpdateRequested(selectedUpdate)
        }
    }

    private fun showUnbindConfirmation(onConfirmed: () -> Unit) {
        AlertDialog.Builder(context)
            .setTitle("Putus Hubungan Layar?")
            .setMessage("Layar ini akan diputuskan dari CMS Studio dan kembali ke mode pairing awal. Seluruh kredensial pairing lokal akan dihapus.")
            .setPositiveButton("Putus Hubungan") { _, _ -> onConfirmed() }
            .setNegativeButton("Batal", null)
            .show()
    }
}
