package com.dkaapis.sigma.presentation.pairing

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.presentation.player.PlayerActivity
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class PairingActivity : AppCompatActivity() {

    private lateinit var viewModel: PairingViewModel
    private lateinit var codeTextView: TextView
    private lateinit var statusTextView: TextView
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val tokenStorage = TokenStorage(this)
        val channelFactory = GrpcChannelFactory(this)
        val deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        val useCase = RegisterAndPairUseCase(deviceRepo)
        viewModel = PairingViewModel(useCase)

        com.dkaapis.sigma.service.WatchdogService.setPlaybackActive(this, false)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#020617"))
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "DKASigma Digital Signage"
            textSize = 36f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }

        val subtitle = TextView(this).apply {
            text = "Masukkan kode ini pada CMS Studio untuk menghubungkan layar:"
            textSize = 18f
            setTextColor(Color.parseColor("#94a3b8"))
            gravity = Gravity.CENTER
            setPadding(0, 16, 0, 32)
        }

        codeTextView = TextView(this).apply {
            text = "--- ---"
            textSize = 64f
            setTextColor(Color.parseColor("#38bdf8"))
            typeface = Typeface.MONOSPACE
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(48, 24, 48, 24)
            setBackgroundColor(Color.parseColor("#0f172a"))
        }

        progressBar = ProgressBar(this).apply {
            isIndeterminate = true
        }

        statusTextView = TextView(this).apply {
            text = "Menghubungkan ke server..."
            textSize = 14f
            setTextColor(Color.parseColor("#64748b"))
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 0)
        }

        root.addView(title)
        root.addView(subtitle)
        root.addView(codeTextView)
        root.addView(progressBar)
        root.addView(statusTextView)

        setContentView(root)
        observeState()
        viewModel.startPairing()
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                when (state) {
                    is PairingUiState.Initial, is PairingUiState.Registering -> {
                        progressBar.visibility = android.view.View.VISIBLE
                        statusTextView.text = "Mendaftarkan perangkat ke server..."
                    }
                    is PairingUiState.WaitingForAdmin -> {
                        progressBar.visibility = android.view.View.VISIBLE
                        codeTextView.text = state.pairingCode
                        statusTextView.text = "Layar terdaftar! Menunggu persetujuan admin CMS..."
                    }
                    is PairingUiState.PairedSuccess -> {
                        progressBar.visibility = android.view.View.GONE
                        statusTextView.text = "Perangkat berhasil dihubungkan! Membuka player..."
                        startActivity(Intent(this@PairingActivity, PlayerActivity::class.java))
                        finish()
                    }
                    is PairingUiState.Error -> {
                        progressBar.visibility = android.view.View.GONE
                        statusTextView.text = "Gagal: ${state.message}"
                    }
                }
            }
        }
    }
}
