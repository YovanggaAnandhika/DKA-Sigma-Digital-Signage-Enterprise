package com.dkaapis.sigma.presentation.player

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.dkaapis.sigma.data.grpc.GrpcChannelFactory
import com.dkaapis.sigma.data.local.ManifestStorage
import com.dkaapis.sigma.data.local.MediaDiskCache
import com.dkaapis.sigma.data.local.TokenStorage
import com.dkaapis.sigma.data.repository.DeviceRepositoryImpl
import com.dkaapis.sigma.data.repository.ManifestRepositoryImpl
import com.dkaapis.sigma.data.repository.MediaStorageRepositoryImpl
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.model.ZoneWidgetType
import com.dkaapis.sigma.domain.usecase.DownloadAndVerifyMediaUseCase
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.domain.usecase.SyncManifestUseCase
import com.dkaapis.sigma.presentation.pairing.PairingActivity
import com.dkaapis.sigma.presentation.player.canvas.SignageCanvasLayout
import com.dkaapis.sigma.presentation.player.canvas.ZoneContainerView
import com.dkaapis.sigma.presentation.renderers.*
import com.dkaapis.sigma.service.PlayerForegroundService
import com.dkaapis.sigma.service.WatchdogService
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class PlayerActivity : AppCompatActivity() {

    private lateinit var viewModel: PlayerViewModel
    private lateinit var storageRepo: MediaStorageRepositoryImpl
    private lateinit var canvasLayout: SignageCanvasLayout
    private lateinit var loadingOverlay: FrameLayout
    private lateinit var loadingText: TextView
    private lateinit var progressBar: ProgressBar

    private val videoRenderers = mutableListOf<VideoZoneRenderer>()
    private val clockRenderers = mutableListOf<ClockZoneRenderer>()

    private val watchdogHandler = Handler(Looper.getMainLooper())
    private val watchdogHeartbeatRunnable = object : Runnable {
        override fun run() {
            // Beri sinyal ke WatchdogService bahwa UI thread aktif dan sehat
            WatchdogService.pingFromPlayer(this@PlayerActivity)
            watchdogHandler.postDelayed(this, 5000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        initDependencies()
        setupViews()
        observeState()

        // Start background stream daemon
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(Intent(this, PlayerForegroundService::class.java))
            } else {
                startService(Intent(this, PlayerForegroundService::class.java))
            }
        } catch (e: Exception) {
            android.util.Log.w("PlayerActivity", "Gagal start PlayerForegroundService: ${e.message}")
        }

        // Start companion watchdog
        try {
            startService(Intent(this, WatchdogService::class.java))
            watchdogHandler.post(watchdogHeartbeatRunnable)
        } catch (e: Exception) {
            android.util.Log.w("PlayerActivity", "Gagal start WatchdogService: ${e.message}")
        }

        viewModel.initializePlayer()
    }

    private fun initDependencies() {
        val tokenStorage = TokenStorage(this)
        val channelFactory = GrpcChannelFactory(this)
        val manifestStorage = ManifestStorage(this)
        val diskCache = MediaDiskCache(this)

        val deviceRepo = DeviceRepositoryImpl(this, tokenStorage, channelFactory)
        val manifestRepo = ManifestRepositoryImpl(manifestStorage, channelFactory)
        storageRepo = MediaStorageRepositoryImpl(diskCache)

        val registerUseCase = RegisterAndPairUseCase(deviceRepo)
        val syncUseCase = SyncManifestUseCase(deviceRepo, manifestRepo)
        val downloadUseCase = DownloadAndVerifyMediaUseCase(storageRepo)

        viewModel = PlayerViewModel(registerUseCase, syncUseCase, downloadUseCase)
    }

    private fun setupViews() {
        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
        }

        canvasLayout = SignageCanvasLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(canvasLayout)

        loadingOverlay = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#99000000"))
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val centerBox = FrameLayout(this).apply {
            val lp = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER
            }
            layoutParams = lp
        }

        progressBar = ProgressBar(this).apply {
            isIndeterminate = true
        }

        loadingText = TextView(this).apply {
            text = "Memulai DKASigma Player..."
            setTextColor(Color.WHITE)
            textSize = 16f
            setPadding(0, 80, 0, 0)
        }

        centerBox.addView(progressBar)
        centerBox.addView(loadingText)
        loadingOverlay.addView(centerBox)
        root.addView(loadingOverlay)

        setContentView(root)
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                when (state) {
                    is PlayerUiState.NotPaired -> {
                        startActivity(Intent(this@PlayerActivity, PairingActivity::class.java))
                        finish()
                    }
                    is PlayerUiState.SyncingManifest -> {
                        loadingOverlay.visibility = View.VISIBLE
                        loadingText.text = state.message
                    }
                    is PlayerUiState.DownloadingAssets -> {
                        loadingOverlay.visibility = View.VISIBLE
                        loadingText.text = "Mengunduh Aset Media (${state.assetIndex}/${state.total}) • ${state.progressPercent}%"
                    }
                    is PlayerUiState.Playing -> {
                        loadingOverlay.visibility = View.GONE
                        renderManifest(state.manifest)
                    }
                    is PlayerUiState.Error -> {
                        loadingOverlay.visibility = View.VISIBLE
                        loadingText.text = "Kendala: ${state.message}"
                    }
                    else -> Unit
                }
            }
        }
    }

    private fun renderManifest(manifest: Manifest) {
        releaseRenderers()
        canvasLayout.removeAllViews()

        canvasLayout.virtualWidth = manifest.canvasWidth
        canvasLayout.virtualHeight = manifest.canvasHeight

        for (zone in manifest.zones) {
            val zoneView = ZoneContainerView(this).apply {
                bindZone(zone)
            }

            val activeBlock = zone.blocks.firstOrNull()
            if (activeBlock != null) {
                when {
                    activeBlock.widgetType == ZoneWidgetType.CLOCK -> {
                        val renderer = ClockZoneRenderer(this)
                        clockRenderers.add(renderer)
                        val view = renderer.createView(zoneView)
                        zoneView.addView(view)
                    }
                    activeBlock.widgetType == ZoneWidgetType.TICKER -> {
                        val renderer = TickerZoneRenderer(this)
                        val view = renderer.createView(zoneView, "Promo Spesial Hari Ini! Diskon Member Hingga 30% di Seluruh Cabang.")
                        zoneView.addView(view)
                    }
                    activeBlock.widgetType == ZoneWidgetType.QUEUE -> {
                        val renderer = QueueZoneRenderer(
                            this,
                            onCallAudioStarted = {
                                // Duck all running videos
                                videoRenderers.forEach { it.setDuckedVolume(true) }
                            },
                            onCallAudioFinished = {
                                // Restore video volume
                                videoRenderers.forEach { it.setDuckedVolume(false) }
                            }
                        )
                        val view = renderer.createView(zoneView)
                        zoneView.addView(view)
                    }
                    activeBlock.widgetType == ZoneWidgetType.WEBVIEW -> {
                        val renderer = WebviewZoneRenderer(this)
                        val view = renderer.createView(zoneView, "https://google.com")
                        zoneView.addView(view)
                    }
                    activeBlock.mediaItemId != null -> {
                        val file = storageRepo.getLocalFileForAsset(activeBlock.mediaItemId)
                        if (file != null) {
                            if (file.name.endsWith(".mp4", ignoreCase = true) || file.extension == "video") {
                                val renderer = VideoZoneRenderer(this)
                                videoRenderers.add(renderer)
                                val view = renderer.createView(zoneView, file, activeBlock.isMuted)
                                zoneView.addView(view)
                            } else {
                                val renderer = ImageZoneRenderer(this)
                                val view = renderer.createView(zoneView, file)
                                zoneView.addView(view)
                            }
                        }
                    }
                }
            }

            canvasLayout.addView(zoneView)
        }
    }

    private fun releaseRenderers() {
        videoRenderers.forEach { it.release() }
        videoRenderers.clear()
        clockRenderers.forEach { it.release() }
        clockRenderers.clear()
    }

    override fun onDestroy() {
        super.onDestroy()
        watchdogHandler.removeCallbacks(watchdogHeartbeatRunnable)
        releaseRenderers()
    }
}
