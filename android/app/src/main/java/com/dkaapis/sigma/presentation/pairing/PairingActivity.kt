package com.dkaapis.sigma.presentation.pairing

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
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
import com.dkaapis.sigma.presentation.player.ui.SpektakulerAuroraBackgroundView
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlin.math.abs

class PairingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPairingBinding
    private lateinit var viewModel: PairingViewModel
    private lateinit var tokenStorage: TokenStorage
    private lateinit var channelFactory: GrpcChannelFactory

    // Panel state
    private var isPanelOpen = false

    // 2-finger swipe gesture tracking
    private var twoFingerStartY0 = 0f
    private var twoFingerStartY1 = 0f
    private var twoFingerStartX0 = 0f
    private var twoFingerStartX1 = 0f
    private var isTwoFingerTracking = false
    private var gestureTriggered = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Always light appearance for pairing screen regardless of system dark mode
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController.isAppearanceLightStatusBars = true
            insetsController.isAppearanceLightNavigationBars = true
            window.statusBarColor = android.graphics.Color.TRANSPARENT
            window.navigationBarColor = android.graphics.Color.TRANSPARENT
            WindowCompat.setDecorFitsSystemWindows(window, false)
        } catch (_: Throwable) {}

        binding = ActivityPairingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Add aurora animated background — light pastel mode for pairing screen
        val auroraContainer = findViewById<FrameLayout>(R.id.flAuroraContainer)
        val auroraView = SpektakulerAuroraBackgroundView(this, isLightMode = true)
        auroraContainer.addView(auroraView, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))

        tokenStorage = TokenStorage(this)
        channelFactory = GrpcChannelFactory(this)
        val deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        val useCase = RegisterAndPairUseCase(deviceRepo)
        viewModel = PairingViewModel(useCase)

        com.dkaapis.sigma.service.WatchdogService.setPlaybackActive(this, false)

        setupRightPanel()
        setupListeners()
        updateServerInfoText()
        observeState()

        viewModel.startPairing()
    }

    // ── Right Panel ──────────────────────────────────────────────────────────

    private fun setupRightPanel() {
        val panel = binding.root.findViewById<LinearLayout>(R.id.llRightPanel)
        val dim = binding.root.findViewById<View>(R.id.vPanelDim)
        val btnBack = binding.root.findViewById<View>(R.id.btnPanelBack)
        val etHost = binding.root.findViewById<EditText>(R.id.etServerHost)
        val etPort = binding.root.findViewById<EditText>(R.id.etGrpcPort)
        val tvPreview = binding.root.findViewById<TextView>(R.id.tvResolvedPreview)
        val btnSave = binding.root.findViewById<Button>(R.id.btnSave)
        val btnCancel = binding.root.findViewById<Button>(R.id.btnCancel)
        val btnReset = binding.root.findViewById<Button>(R.id.btnResetDefault)

        fun updatePreview() {
            val rawHost = (etHost?.text?.toString() ?: "").trim()
                .removePrefix("http://").removePrefix("https://").trimEnd('/')
            val host = if (rawHost.isEmpty()) "10.20.30.64" else rawHost
            val port = etPort?.text?.toString()?.toIntOrNull() ?: 50051
            tvPreview?.text = "Server Target: $host:$port"
        }

        val watcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) { updatePreview() }
            override fun afterTextChanged(s: Editable?) {}
        }
        etHost?.addTextChangedListener(watcher)
        etPort?.addTextChangedListener(watcher)

        dim?.setOnClickListener { closePanel() }
        btnBack?.setOnClickListener { closePanel() }
        btnCancel?.setOnClickListener { closePanel() }

        btnReset?.setOnClickListener {
            ServerConfig.resetToDefaults(this)
            etHost?.setText(ServerConfig.getHost(this))
            etPort?.setText(ServerConfig.getGrpcPort(this).toString())
            updatePreview()
            Toast.makeText(this, "Konfigurasi di-reset ke nilai default", Toast.LENGTH_SHORT).show()
        }

        btnSave?.setOnClickListener {
            val inputHost = etHost?.text?.toString()?.trim() ?: ""
            if (inputHost.isBlank()) {
                etHost?.error = "Host / IP tidak boleh kosong"
                return@setOnClickListener
            }
            val port = etPort?.text?.toString()?.toIntOrNull() ?: 50051
            ServerConfig.saveConfig(this, inputHost, port)
            updateServerInfoText()

            tokenStorage.clear()
            channelFactory.shutdown()
            channelFactory = GrpcChannelFactory(this)
            val newDeviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
            val newUseCase = RegisterAndPairUseCase(newDeviceRepo)

            setStatusConnecting()
            viewModel.updateUseCase(newUseCase)
            closePanel()

            Toast.makeText(this, "Server disimpan: ${ServerConfig.getHost(this)}:$port", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openPanel() {
        if (isPanelOpen) return
        isPanelOpen = true

        val panel = binding.root.findViewById<LinearLayout>(R.id.llRightPanel)
        val dim = binding.root.findViewById<View>(R.id.vPanelDim)
        val etHost = binding.root.findViewById<EditText>(R.id.etServerHost)
        val etPort = binding.root.findViewById<EditText>(R.id.etGrpcPort)
        val tvPreview = binding.root.findViewById<TextView>(R.id.tvResolvedPreview)

        // Refresh inputs
        etHost?.setText(ServerConfig.getHost(this))
        etPort?.setText(ServerConfig.getGrpcPort(this).toString())
        val rawHost = ServerConfig.getHost(this).trim()
        val port = ServerConfig.getGrpcPort(this)
        tvPreview?.text = "Server Target: $rawHost:$port"

        dim?.visibility = View.VISIBLE
        dim?.alpha = 0f
        panel?.translationX = panel?.width?.toFloat()?.takeIf { it > 0f } ?: 360f * resources.displayMetrics.density

        dim?.animate()?.alpha(1f)?.setDuration(260)?.start()
        panel?.animate()
            ?.translationX(0f)
            ?.setDuration(300)
            ?.setInterpolator(android.view.animation.DecelerateInterpolator(2.0f))
            ?.start()
    }

    private fun closePanel() {
        if (!isPanelOpen) return
        isPanelOpen = false

        hideKeyboard()

        val panel = binding.root.findViewById<LinearLayout>(R.id.llRightPanel)
        val dim = binding.root.findViewById<View>(R.id.vPanelDim)

        val slideOut = panel?.width?.toFloat()?.takeIf { it > 0f }
            ?: 360f * resources.displayMetrics.density

        dim?.animate()?.alpha(0f)?.setDuration(220)
            ?.withEndAction { dim.visibility = View.GONE }?.start()
        panel?.animate()
            ?.translationX(slideOut)
            ?.setDuration(260)
            ?.setInterpolator(android.view.animation.AccelerateInterpolator(2.0f))
            ?.start()
    }

    private fun hideKeyboard() {
        currentFocus?.let { v ->
            val imm = getSystemService(INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.hideSoftInputFromWindow(v.windowToken, 0)
            v.clearFocus()
        }
    }

    // ── Listeners ────────────────────────────────────────────────────────────

    private fun setupListeners() {
        binding.btnReconnect.setOnClickListener {
            binding.btnReconnect.isEnabled = false
            binding.btnReconnect.alpha = 0.6f
            binding.btnReconnect.text = "Menghubungkan..."
            viewModel.startPairing()
        }
        binding.btnServerSettings.setOnClickListener { openPanel() }
        binding.tvServerInfo.setOnClickListener { openPanel() }
    }

    private fun updateServerInfoText() {
        val host = ServerConfig.getHost(this)
        val port = ServerConfig.getGrpcPort(this)
        binding.tvServerInfo.text = "$host:$port"
    }

    // ── Back key closes panel first ───────────────────────────────────────────

    @Deprecated("Use OnBackPressedDispatcher", level = DeprecationLevel.WARNING)
    override fun onBackPressed() {
        if (isPanelOpen) {
            closePanel()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_MENU || keyCode == KeyEvent.KEYCODE_SETTINGS) {
            openPanel()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // ── 2-finger swipe gesture ────────────────────────────────────────────────

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_POINTER_DOWN -> {
                if (ev.pointerCount == 2) {
                    twoFingerStartY0 = ev.getY(0); twoFingerStartY1 = ev.getY(1)
                    twoFingerStartX0 = ev.getX(0); twoFingerStartX1 = ev.getX(1)
                    isTwoFingerTracking = true; gestureTriggered = false
                }
            }
            MotionEvent.ACTION_MOVE -> {
                if (ev.pointerCount >= 2) {
                    if (!isTwoFingerTracking) {
                        twoFingerStartY0 = ev.getY(0); twoFingerStartY1 = ev.getY(1)
                        twoFingerStartX0 = ev.getX(0); twoFingerStartX1 = ev.getX(1)
                        isTwoFingerTracking = true; gestureTriggered = false
                    } else if (!gestureTriggered) {
                        val dy0 = ev.getY(0) - twoFingerStartY0
                        val dy1 = ev.getY(1) - twoFingerStartY1
                        val dx0 = abs(ev.getX(0) - twoFingerStartX0)
                        val dx1 = abs(ev.getX(1) - twoFingerStartX1)
                        val minDist = 90 * resources.displayMetrics.density
                        if (dy0 > minDist && dy1 > minDist && dy0 > dx0 && dy1 > dx1) {
                            gestureTriggered = true
                            openPanel()
                        }
                    }
                } else {
                    isTwoFingerTracking = false
                }
            }
            MotionEvent.ACTION_POINTER_UP -> { if (ev.pointerCount <= 2) isTwoFingerTracking = false }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                isTwoFingerTracking = false; gestureTriggered = false
            }
        }
        return super.dispatchTouchEvent(ev)
    }

    // ── State helpers ─────────────────────────────────────────────────────────

    private fun setStatusConnecting() {
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

    // ── State observer ────────────────────────────────────────────────────────

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
        channelFactory.shutdown()
    }
}
