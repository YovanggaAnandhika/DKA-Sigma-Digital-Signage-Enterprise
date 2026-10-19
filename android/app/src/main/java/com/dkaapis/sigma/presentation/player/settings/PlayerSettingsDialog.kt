package com.dkaapis.sigma.presentation.player.settings

import android.app.AlertDialog
import android.content.Context
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.widget.SwitchCompat
import com.dkaapis.sigma.R
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

    fun isShowing(): Boolean = activeDialog?.isShowing == true

    fun show(payload: PlayerSettingsPayload) {
        if (isShowing()) return

        val dialog = BottomSheetDialog(context).apply {
            setContentView(R.layout.bottom_sheet_player_settings)
            window?.setBackgroundDrawableResource(android.R.color.transparent)
            window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
            behavior.state = BottomSheetBehavior.STATE_EXPANDED
            behavior.skipCollapsed = true
            setOnDismissListener { activeDialog = null }
        }
        activeDialog = dialog

        dialog.findViewById<TextView>(R.id.tvSettingsDeviceId)?.text =
            "ID Layar: ${payload.deviceId.ifBlank { "(Belum terdaftar)" }}"

        dialog.findViewById<TextView>(R.id.tvSettingsServerUrl)?.text =
            "Endpoint: ${payload.serverHost}:${payload.serverGrpcPort}"

        dialog.findViewById<SwitchCompat>(R.id.switchProgressUpload)?.apply {
            isChecked = payload.isProgressUploadEnabled
            setOnCheckedChangeListener { _, isChecked ->
                payload.onProgressUploadToggled(isChecked)
            }
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

    private fun showUnbindConfirmation(onConfirmed: () -> Unit) {
        AlertDialog.Builder(context)
            .setTitle("Putus Hubungan Layar?")
            .setMessage("Layar ini akan diputuskan dari CMS Studio dan kembali ke mode pairing awal. Seluruh kredensial pairing lokal akan dihapus.")
            .setPositiveButton("Ya, Putus Hubungan") { _, _ -> onConfirmed() }
            .setNegativeButton("Batal", null)
            .show()
    }
}
