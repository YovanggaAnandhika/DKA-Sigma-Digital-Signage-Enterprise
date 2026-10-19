package com.dkaapis.sigma.presentation.pairing

import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.graphics.Typeface
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
import android.widget.LinearLayout
import android.widget.ProgressBar
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
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.presentation.player.PlayerActivity
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlin.math.abs

class PairingActivity : AppCompatActivity() {

    private lateinit var viewModel: PairingViewModel
    private lateinit var tokenStorage: TokenStorage
    private lateinit var channelFactory: GrpcChannelFactory
    private lateinit var codeTextView: TextView
    private lateinit var statusTextView: TextView
    private lateinit var serverInfoTextView: TextView
    private lateinit var progressBar: ProgressBar

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
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        } catch (_: Throwable) {}

        // Light mode appearance for system bars
        try {
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController.isAppearanceLightStatusBars = true
            insetsController.isAppearanceLightNavigationBars = true
            window.statusBarColor = Color.parseColor("#f8fafc")
            window.navigationBarColor = Color.parseColor("#f8fafc")
        } catch (_: Throwable) {}

        tokenStorage = TokenStorage(this)
        channelFactory = GrpcChannelFactory(this)
        val deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        val useCase = RegisterAndPairUseCase(deviceRepo)
        viewModel = PairingViewModel(useCase)

        com.dkaapis.sigma.service.WatchdogService.setPlaybackActive(this, false)

        // Light Mode Root Layout
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#f8fafc"))
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "DKASigma Digital Signage"
            textSize = 34f
            setTextColor(Color.parseColor("#0f172a"))
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }

        val subtitle = TextView(this).apply {
            text = "Masukkan kode berikut pada CMS Studio untuk menghubungkan layar:"
            textSize = 17f
            setTextColor(Color.parseColor("#475569"))
            gravity = Gravity.CENTER
            setPadding(0, 12, 0, 24)
        }

        codeTextView = TextView(this).apply {
            text = "--- ---"
            textSize = 60f
            setTextColor(Color.parseColor("#0284c7"))
            typeface = Typeface.MONOSPACE
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(56, 20, 56, 20)
            background = ContextCompat.getDrawable(this@PairingActivity, R.drawable.bg_pairing_code_card)
        }

        progressBar = ProgressBar(this).apply {
            isIndeterminate = true
            setPadding(0, 20, 0, 12)
        }

        statusTextView = TextView(this).apply {
            text = "Menghubungkan ke server..."
            textSize = 15f
            setTextColor(Color.parseColor("#64748b"))
            gravity = Gravity.CENTER
            setPadding(0, 4, 0, 16)
        }

        serverInfoTextView = TextView(this).apply {
            textSize = 12f
            setTextColor(Color.parseColor("#94a3b8"))
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = true
            setPadding(24, 10, 24, 10)
            setOnClickListener {
                showServerConfigBottomSheet()
            }
        }
        updateServerInfoText()

        root.addView(title)
        root.addView(subtitle)
        root.addView(codeTextView)
        root.addView(progressBar)
        root.addView(statusTextView)
        root.addView(serverInfoTextView)

        setContentView(root)
        observeState()
        viewModel.startPairing()
    }

    private fun updateServerInfoText() {
        val host = ServerConfig.getHost(this)
        val httpPort = ServerConfig.getHttpPort(this)
        val grpcPort = ServerConfig.getGrpcPort(this)
        serverInfoTextView.text = "Server: $host:$httpPort (gRPC :$grpcPort) • Geser 2 jari ke bawah untuk ubah"
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

                        // Gesture: both fingers move downward past threshold, more vertical than horizontal
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
            setOnDismissListener {
                gestureTriggered = false
                isTwoFingerTracking = false
                serverConfigDialog = null
            }
        }
        serverConfigDialog = dialog

        val etHost = dialog.findViewById<EditText>(R.id.etServerHost) ?: return
        val etHttpPort = dialog.findViewById<EditText>(R.id.etHttpPort) ?: return
        val etGrpcPort = dialog.findViewById<EditText>(R.id.etGrpcPort) ?: return
        val tvPreview = dialog.findViewById<TextView>(R.id.tvResolvedPreview) ?: return
        val btnSave = dialog.findViewById<Button>(R.id.btnSave) ?: return
        val btnCancel = dialog.findViewById<Button>(R.id.btnCancel) ?: return
        val btnReset = dialog.findViewById<Button>(R.id.btnResetDefault) ?: return

        fun refreshInputs() {
            etHost.setText(ServerConfig.getHost(this))
            etHttpPort.setText(ServerConfig.getHttpPort(this).toString())
            etGrpcPort.setText(ServerConfig.getGrpcPort(this).toString())
        }

        fun updatePreview() {
            val rawHost = etHost.text.toString().trim()
                .removePrefix("http://")
                .removePrefix("https://")
                .trimEnd('/')
            val host = if (rawHost.isEmpty()) "192.168.1.46" else rawHost
            val httpPort = etHttpPort.text.toString().toIntOrNull() ?: 80
            val grpcPort = etGrpcPort.text.toString().toIntOrNull() ?: 50051
            tvPreview.text = "Target: http://$host:$httpPort | gRPC :$grpcPort"
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
        etHttpPort.addTextChangedListener(watcher)
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

            val httpPort = etHttpPort.text.toString().toIntOrNull() ?: 80
            val grpcPort = etGrpcPort.text.toString().toIntOrNull() ?: 50051

            ServerConfig.saveConfig(this, inputHost, grpcPort, httpPort)
            updateServerInfoText()

            // Reset credentials so the device pairs cleanly with the new server
            tokenStorage.clear()
            channelFactory.shutdown()

            // Reconstruct dependencies with new host/port
            channelFactory = GrpcChannelFactory(this)
            val newDeviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
            val newUseCase = RegisterAndPairUseCase(newDeviceRepo)

            codeTextView.text = "--- ---"
            statusTextView.text = "Menghubungkan ke ${ServerConfig.getHost(this)}..."
            progressBar.visibility = View.VISIBLE

            viewModel.updateUseCase(newUseCase)
            dialog.dismiss()

            Toast.makeText(
                this,
                "Server disimpan: ${ServerConfig.getHost(this)}:$httpPort",
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
                        progressBar.visibility = View.VISIBLE
                        statusTextView.text = "Mendaftarkan perangkat ke server..."
                    }
                    is PairingUiState.WaitingForAdmin -> {
                        progressBar.visibility = View.VISIBLE
                        codeTextView.text = state.pairingCode.uppercase()
                        statusTextView.text = "Layar terdaftar! Menunggu persetujuan admin CMS..."
                    }
                    is PairingUiState.PairedSuccess -> {
                        progressBar.visibility = View.GONE
                        statusTextView.text = "Perangkat berhasil dihubungkan! Membuka player..."
                        startActivity(Intent(this@PairingActivity, PlayerActivity::class.java))
                        finish()
                    }
                    is PairingUiState.Error -> {
                        progressBar.visibility = View.GONE
                        statusTextView.text = "Gagal: ${state.message}\n(Geser 2 jari ke bawah untuk ganti host)"
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
