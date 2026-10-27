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

    fun dismiss() {
        activeDialog?.dismiss()
        activeDialog = null
    }

    fun show(payload: PlayerSettingsPayload) {
        if (isShowing()) return

        val dialog = BottomSheetDialog(context).apply {
            setContentView(R.layout.bottom_sheet_player_settings)
            window?.setBackgroundDrawableResource(android.R.color.transparent)
            window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
            behavior.state = BottomSheetBehavior.STATE_EXPANDED
            behavior.skipCollapsed = true
            setOnShowListener {
                val bottomSheet = findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)
                if (bottomSheet != null) {
                    bottomSheet.setBackgroundColor(Color.TRANSPARENT)
                    val b = BottomSheetBehavior.from(bottomSheet)
                    b.state = BottomSheetBehavior.STATE_EXPANDED
                    b.skipCollapsed = true

                    val displayMetrics = context.resources.displayMetrics
                    val isLandscape = displayMetrics.widthPixels > displayMetrics.heightPixels
                    val lp = bottomSheet.layoutParams
                    val targetHeight = (displayMetrics.heightPixels * (if (isLandscape) 0.92f else 0.85f)).toInt()
                    if (isLandscape) {
                        val targetWidth = minOf(
                            displayMetrics.widthPixels - (48 * displayMetrics.density).toInt(),
                            (580 * displayMetrics.density).toInt()
                        )
                        lp.width = targetWidth
                    } else {
                        val targetWidth = minOf(
                            displayMetrics.widthPixels - (32 * displayMetrics.density).toInt(),
                            (480 * displayMetrics.density).toInt()
                        )
                        lp.width = targetWidth
                    }
                    lp.height = targetHeight
                    if (lp is CoordinatorLayout.LayoutParams) {
                        lp.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                    }
                    bottomSheet.layoutParams = lp
                }
            }
            setOnDismissListener { activeDialog = null }
        }
        activeDialog = dialog

        dialog.findViewById<TextView>(R.id.tvSettingsDeviceId)?.text =
            "ID Layar: ${payload.deviceId.ifBlank { "(Belum terdaftar)" }}"

        dialog.findViewById<TextView>(R.id.tvSettingsServerUrl)?.text =
            "Server: ${payload.serverHost}:${payload.serverGrpcPort}"

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

    private fun showUnbindConfirmation(onConfirmed: () -> Unit) {
        AlertDialog.Builder(context)
            .setTitle("Putus Hubungan Layar?")
            .setMessage("Layar ini akan diputuskan dari CMS Studio dan kembali ke mode pairing awal. Seluruh kredensial pairing lokal akan dihapus.")
            .setPositiveButton("Putus Hubungan") { _, _ -> onConfirmed() }
            .setNegativeButton("Batal", null)
            .show()
    }
}
