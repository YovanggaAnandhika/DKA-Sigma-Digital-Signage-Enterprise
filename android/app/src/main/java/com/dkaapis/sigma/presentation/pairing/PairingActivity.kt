package com.dkaapis.sigma.presentation.pairing

import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import com.dkaapis.sigma.R
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ServerConfig
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.databinding.ActivityPairingBinding
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.presentation.player.PlayerActivity
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlin.math.abs

class PairingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPairingBinding
    private lateinit var viewModel: PairingViewModel
    private lateinit var tokenStorage: TokenStorage
    private lateinit var channelFactory: GrpcChannelFactory

    // 2-finger swipe down gesture tracking
    private var twoFingerStartY0 = 0f
    private var twoFingerStartY1 = 0f
    private var twoFingerStartX0 = 0f
    private var twoFingerStartX1 = 0f
    private var isTwoFingerTracking = false
    private var gestureTriggered = false
    private var serverConfigDialog: BottomSheetDialog? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        } catch (_: Throwable) {}

        // Theme-adaptive appearance for system bars (handles both dark & light modes)
        try {
            val isNightMode = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController.isAppearanceLightStatusBars = !isNightMode
            insetsController.isAppearanceLightNavigationBars = !isNightMode
            val bgColor = ContextCompat.getColor(this, R.color.screen_bg)
            window.statusBarColor = bgColor
            window.navigationBarColor = bgColor
        } catch (_: Throwable) {}

        binding = ActivityPairingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenStorage = TokenStorage(this)
        channelFactory = GrpcChannelFactory(this)
        val deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        val useCase = RegisterAndPairUseCase(deviceRepo)
        viewModel = PairingViewModel(useCase)

        com.dkaapis.sigma.service.WatchdogService.setPlaybackActive(this, false)

        setupListeners()
        updateServerInfoText()
        observeState()

        viewModel.startPairing()
    }

    private fun setupListeners() {
        binding.btnReconnect.setOnClickListener {
            binding.btnReconnect.isEnabled = false
            binding.btnReconnect.alpha = 0.6f
            binding.btnReconnect.text = "Menghubungkan..."
            viewModel.startPairing()
        }

        binding.btnServerSettings.setOnClickListener {
            showServerConfigBottomSheet()
        }

        binding.tvServerInfo.setOnClickListener {
            showServerConfigBottomSheet()
        }
    }

    private fun updateServerInfoText() {
        val host = ServerConfig.getHost(this)
        val port = ServerConfig.getGrpcPort(this)
        binding.tvServerInfo.text = "Server: $host:$port • Geser 2 jari ke bawah untuk ubah"
    }

    private fun formatHumanErrorMessage(rawMessage: String): String {
        val lower = rawMessage.lowercase()
        return when {
            lower.contains("unavailable") || lower.contains("connection refused") || lower.contains("failed to connect") ->
                "Tidak dapat terhubung ke server layar saat ini.\nPastikan server aktif dan perangkat berada dalam jaringan yang sama."
            lower.contains("deadline_exceeded") || lower.contains("timeout") ->
                "Waktu koneksi ke server habis.\nPeriksa stabilitas sinyal Wi-Fi atau jaringan lokal."
            lower.contains("unauthenticated") || lower.contains("permission_denied") ->
                "Otorisasi perangkat belum disetujui.\nSilakan setujui perangkat ini di CMS Studio."
            lower.contains("not_found") ->
                "Alamat server tidak ditemukan.\nPeriksa kembali konfigurasi host dan port di pengaturan server."
            else -> {
                val cleaned = rawMessage
                    .replace(Regex("(?i)io\\.grpc\\.[a-zA-Z0-9_.]+:?"), "")
                    .replace(Regex("(?i)StatusRuntimeException:?"), "")
                    .replace(Regex("(?i)grpc"), "server")
                    .replace(Regex("(?i)unavailable"), "tidak tersedia")
                    .trim()
                if (cleaned.isNotBlank()) cleaned else "Terjadi kendala saat menghubungkan ke server layar."
            }
        }
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_POINTER_DOWN -> {
                if (ev.pointerCount == 2) {
                    twoFingerStartY0 = ev.getY(0)
                    twoFingerStartY1 = ev.getY(1)
                    twoFingerStartX0 = ev.getX(0)
                    twoFingerStartX1 = ev.getX(1)
                    isTwoFingerTracking = true
                    gestureTriggered = false
                }
            }
            MotionEvent.ACTION_MOVE -> {
                if (ev.pointerCount >= 2) {
                    if (!isTwoFingerTracking) {
                        twoFingerStartY0 = ev.getY(0)
                        twoFingerStartY1 = ev.getY(1)
                        twoFingerStartX0 = ev.getX(0)
                        twoFingerStartX1 = ev.getX(1)
                        isTwoFingerTracking = true
                        gestureTriggered = false
                    } else if (!gestureTriggered) {
                        val dy0 = ev.getY(0) - twoFingerStartY0
                        val dy1 = ev.getY(1) - twoFingerStartY1
                        val dx0 = abs(ev.getX(0) - twoFingerStartX0)
                        val dx1 = abs(ev.getX(1) - twoFingerStartX1)
                        val minDistance = 90 * resources.displayMetrics.density

                        if (dy0 > minDistance && dy1 > minDistance && dy0 > dx0 && dy1 > dx1) {
                            gestureTriggered = true
                            showServerConfigBottomSheet()
                        }
                    }
                } else {
                    isTwoFingerTracking = false
                }
            }
            MotionEvent.ACTION_POINTER_UP -> {
                if (ev.pointerCount <= 2) {
                    isTwoFingerTracking = false
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                isTwoFingerTracking = false
                gestureTriggered = false
            }
        }
        return super.dispatchTouchEvent(ev)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_MENU || keyCode == KeyEvent.KEYCODE_SETTINGS) {
            showServerConfigBottomSheet()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun showServerConfigBottomSheet() {
        if (serverConfigDialog?.isShowing == true) return

        val dialog = BottomSheetDialog(this).apply {
            setContentView(R.layout.bottom_sheet_server_config)
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

                    val displayMetrics = resources.displayMetrics
                    val isLandscape = displayMetrics.widthPixels > displayMetrics.heightPixels
                    val lp = bottomSheet.layoutParams
                    if (isLandscape) {
                        val targetWidth = minOf(
                            displayMetrics.widthPixels - (48 * displayMetrics.density).toInt(),
                            (560 * displayMetrics.density).toInt()
                        )
                        lp.width = targetWidth
                        if (lp is CoordinatorLayout.LayoutParams) {
                            lp.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                        }
                        bottomSheet.layoutParams = lp
                    }
                }
            }
            setOnDismissListener {
                gestureTriggered = false
                isTwoFingerTracking = false
                serverConfigDialog = null
            }
        }
        serverConfigDialog = dialog

        val etHost = dialog.findViewById<EditText>(R.id.etServerHost) ?: return
        val etGrpcPort = dialog.findViewById<EditText>(R.id.etGrpcPort) ?: return
        val tvPreview = dialog.findViewById<TextView>(R.id.tvResolvedPreview) ?: return
        val btnSave = dialog.findViewById<Button>(R.id.btnSave) ?: return
        val btnCancel = dialog.findViewById<Button>(R.id.btnCancel) ?: return
        val btnReset = dialog.findViewById<Button>(R.id.btnResetDefault) ?: return

        fun refreshInputs() {
            etHost.setText(ServerConfig.getHost(this))
            etGrpcPort.setText(ServerConfig.getGrpcPort(this).toString())
        }

        fun updatePreview() {
            val rawHost = etHost.text.toString().trim()
                .removePrefix("http://")
                .removePrefix("https://")
                .trimEnd('/')
            val host = if (rawHost.isEmpty()) "192.168.1.46" else rawHost
            val port = etGrpcPort.text.toString().toIntOrNull() ?: 50051
            tvPreview.text = "Server Target: $host:$port"
        }

        refreshInputs()
        updatePreview()

        val watcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                updatePreview()
            }
            override fun afterTextChanged(s: Editable?) {}
        }
        etHost.addTextChangedListener(watcher)
        etGrpcPort.addTextChangedListener(watcher)

        btnReset.setOnClickListener {
            ServerConfig.resetToDefaults(this)
            refreshInputs()
            updatePreview()
            Toast.makeText(this, "Konfigurasi di-reset ke nilai default", Toast.LENGTH_SHORT).show()
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
        }

        btnSave.setOnClickListener {
            val inputHost = etHost.text.toString().trim()
            if (inputHost.isBlank()) {
                etHost.error = "Host / IP tidak boleh kosong"
                return@setOnClickListener
            }

            val port = etGrpcPort.text.toString().toIntOrNull() ?: 50051

            ServerConfig.saveConfig(this, inputHost, port, 80)
            updateServerInfoText()

            // Reset credentials so the device pairs cleanly with the new server
            tokenStorage.clear()
            channelFactory.shutdown()

            // Reconstruct dependencies with new host/port
            channelFactory = GrpcChannelFactory(this)
            val newDeviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
            val newUseCase = RegisterAndPairUseCase(newDeviceRepo)

            binding.llStatusPill.setBackgroundResource(R.drawable.bg_status_pill_connecting)
            binding.vStatusLed.setBackgroundResource(R.drawable.led_dot_connecting)
            binding.tvStatusCode.text = "MENGHUBUNGKAN..."
            binding.tvStatusCode.setTextColor(ContextCompat.getColor(this, R.color.status_connecting_text))

            binding.tvPairingCode.visibility = View.GONE
            binding.pbConnecting.visibility = View.VISIBLE
            binding.tvStatusMessage.setTextColor(ContextCompat.getColor(this, R.color.text_sub))
            binding.tvStatusMessage.text = "Menghubungkan ke ${ServerConfig.getHost(this)}..."

            binding.btnReconnect.isEnabled = false
            binding.btnReconnect.alpha = 0.6f
            binding.btnReconnect.text = "Menghubungkan..."

            viewModel.updateUseCase(newUseCase)
            dialog.dismiss()

            Toast.makeText(
                this,
                "Server disimpan: ${ServerConfig.getHost(this)}:$port",
                Toast.LENGTH_SHORT
            ).show()
        }

        dialog.show()
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                when (state) {
                    is PairingUiState.Initial, is PairingUiState.Registering -> {
                        binding.llStatusPill.setBackgroundResource(R.drawable.bg_status_pill_connecting)
                        binding.vStatusLed.setBackgroundResource(R.drawable.led_dot_connecting)
                        binding.tvStatusCode.text = "MENGHUBUNGKAN..."
                        binding.tvStatusCode.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.status_connecting_text))

                        binding.tvPairingCode.visibility = View.GONE
                        binding.pbConnecting.visibility = View.VISIBLE
                        binding.tvStatusMessage.text = "Menghubungkan dan mendaftarkan perangkat ke server..."
                        binding.tvStatusMessage.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.text_sub))

                        binding.btnReconnect.isEnabled = false
                        binding.btnReconnect.alpha = 0.6f
                        binding.btnReconnect.text = "Menghubungkan..."
                    }
                    is PairingUiState.WaitingForAdmin -> {
                        binding.llStatusPill.setBackgroundResource(R.drawable.bg_status_pill_waiting)
                        binding.vStatusLed.setBackgroundResource(R.drawable.led_dot_waiting)
                        binding.tvStatusCode.text = "MENUNGGU PERSETUJUAN"
                        binding.tvStatusCode.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.status_waiting_text))

                        val displayCode = state.pairingCode.ifBlank { state.deviceId }
                        if (displayCode.isNotBlank()) {
                            binding.tvPairingCode.visibility = View.VISIBLE
                            binding.tvPairingCode.text = displayCode
                        } else {
                            binding.tvPairingCode.visibility = View.GONE
                        }

                        binding.pbConnecting.visibility = View.VISIBLE
                        binding.tvStatusMessage.text = "Layar terdaftar di CMS Studio.\nSilakan setujui perangkat ini di dashboard admin."
                        binding.tvStatusMessage.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.text_sub))

                        binding.btnReconnect.isEnabled = true
                        binding.btnReconnect.alpha = 1.0f
                        binding.btnReconnect.text = "Periksa Status"
                    }
                    is PairingUiState.PairedSuccess -> {
                        binding.llStatusPill.setBackgroundResource(R.drawable.bg_status_pill_success)
                        binding.vStatusLed.setBackgroundResource(R.drawable.led_dot_success)
                        binding.tvStatusCode.text = "TERHUBUNG"
                        binding.tvStatusCode.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.status_success_text))

                        binding.tvPairingCode.visibility = View.GONE
                        binding.pbConnecting.visibility = View.GONE
                        binding.tvStatusMessage.text = "Perangkat berhasil disetujui! Membuka tampilan player..."
                        binding.tvStatusMessage.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.status_success_text))

                        startActivity(Intent(this@PairingActivity, PlayerActivity::class.java))
                        finish()
                    }
                    is PairingUiState.Error -> {
                        binding.llStatusPill.setBackgroundResource(R.drawable.bg_status_pill_offline)
                        binding.vStatusLed.setBackgroundResource(R.drawable.led_dot_offline)
                        binding.tvStatusCode.text = "OFFLINE"
                        binding.tvStatusCode.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.status_offline_text))

                        binding.tvPairingCode.visibility = View.GONE
                        binding.pbConnecting.visibility = View.GONE
                        binding.tvStatusMessage.text = formatHumanErrorMessage(state.message)
                        binding.tvStatusMessage.setTextColor(ContextCompat.getColor(this@PairingActivity, R.color.text_sub))

                        binding.btnReconnect.isEnabled = true
                        binding.btnReconnect.alpha = 1.0f
                        binding.btnReconnect.text = "Hubungkan Ulang"
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serverConfigDialog?.dismiss()
        channelFactory.shutdown()
    }
}
