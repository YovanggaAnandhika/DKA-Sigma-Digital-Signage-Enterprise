package com.dkaapis.sigma.presentation.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.usecase.DownloadAndVerifyMediaUseCase
import com.dkaapis.sigma.domain.usecase.DownloadState
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.domain.usecase.SyncManifestUseCase
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

sealed class PlayerUiState {
    object CheckingPairing : PlayerUiState()
    object NotPaired : PlayerUiState()
    data class SyncingManifest(val message: String) : PlayerUiState()
    data class DownloadingAssets(
        val progressPercent: Int,
        val assetIndex: Int,
        val total: Int,
        val downloadedBytes: Long = 0L,
        val totalBytes: Long = 0L,
        val currentFileName: String = ""
    ) : PlayerUiState()
    data class Playing(val manifest: Manifest) : PlayerUiState()
    data class Error(val message: String) : PlayerUiState()
}

class PlayerViewModel(
    private val registerAndPairUseCase: RegisterAndPairUseCase,
    private val syncManifestUseCase: SyncManifestUseCase,
    private val downloadUseCase: DownloadAndVerifyMediaUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<PlayerUiState>(PlayerUiState.CheckingPairing)
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    private var activeManifest: Manifest? = null
    private var syncJob: Job? = null

    fun getActiveManifestHash(): String = activeManifest?.versionHash ?: ""

    fun onDeviceUnpaired() {
        syncJob?.cancel()
        activeManifest = null
        _uiState.value = PlayerUiState.NotPaired
    }

    fun initializePlayer() {
        if (!registerAndPairUseCase.isAlreadyPaired()) {
            _uiState.value = PlayerUiState.NotPaired
            return
        }

        syncManifest()
    }

    fun syncManifest(force: Boolean = false) {
        if (!force && syncJob?.isActive == true) {
            return
        }

        syncJob?.cancel()
        syncJob = viewModelScope.launch {
            try {
                _uiState.value = PlayerUiState.SyncingManifest("Mengambil jadwal manifest...")
                val result = syncManifestUseCase.execute()
                if (result.isSuccess) {
                    val manifest = result.getOrNull()
                    if (manifest != null) {
                        downloadUseCase.execute(manifest).collectLatest { downloadState ->
                            when (downloadState) {
                                is DownloadState.Verifying -> {
                                    _uiState.value = PlayerUiState.SyncingManifest(
                                        "Memeriksa chunk lokal (${downloadState.assetIndex}/${downloadState.totalAssets}): ${downloadState.filename}"
                                    )
                                }
                                is DownloadState.Progress -> {
                                    _uiState.value = PlayerUiState.DownloadingAssets(
                                        progressPercent = downloadState.percent,
                                        assetIndex = downloadState.assetIndex,
                                        total = downloadState.totalAssets,
                                        downloadedBytes = downloadState.downloadedBytes,
                                        totalBytes = downloadState.totalBytes,
                                        currentFileName = downloadState.currentFileName
                                    )
                                }
                                is DownloadState.AssetComplete -> {
                                    // Aset selesai diunduh & lolos SHA-256
                                }
                                is DownloadState.AllComplete -> {
                                    // 100% Media terverifikasi -> Atomic Switch Layout
                                    activeManifest = downloadState.manifest
                                    _uiState.value = PlayerUiState.Playing(downloadState.manifest)
                                }
                                is DownloadState.Error -> {
                                    _uiState.value = PlayerUiState.Error(downloadState.message)
                                }
                            }
                        }
                    } else {
                        _uiState.value = PlayerUiState.Error("Manifest kosong dari server")
                    }
                } else {
                    val err = result.exceptionOrNull()
                    if (err is IllegalStateException || !registerAndPairUseCase.isAlreadyPaired()) {
                        _uiState.value = PlayerUiState.NotPaired
                    } else {
                        _uiState.value = PlayerUiState.Error(err?.message ?: "Gagal sinkronisasi")
                    }
                }
            } catch (e: Exception) {
                if (e !is CancellationException) {
                    _uiState.value = PlayerUiState.Error(e.message ?: "Gagal sinkronisasi")
                }
            }
        }
    }
}
