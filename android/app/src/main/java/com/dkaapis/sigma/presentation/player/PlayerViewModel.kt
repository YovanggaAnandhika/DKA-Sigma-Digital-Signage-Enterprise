package com.dkaapis.sigma.presentation.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dkaapis.sigma.domain.model.Manifest
import com.dkaapis.sigma.domain.usecase.DownloadAndVerifyMediaUseCase
import com.dkaapis.sigma.domain.usecase.DownloadState
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import com.dkaapis.sigma.domain.usecase.SyncManifestUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

sealed class PlayerUiState {
    object CheckingPairing : PlayerUiState()
    object NotPaired : PlayerUiState()
    data class SyncingManifest(val message: String) : PlayerUiState()
    data class DownloadingAssets(val progressPercent: Int, val assetIndex: Int, val total: Int) : PlayerUiState()
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

    fun initializePlayer() {
        if (!registerAndPairUseCase.isAlreadyPaired()) {
            _uiState.value = PlayerUiState.NotPaired
            return
        }

        syncManifest()
    }

    fun syncManifest() {
        viewModelScope.launch {
            _uiState.value = PlayerUiState.SyncingManifest("Mengambil jadwal manifest...")
            val result = syncManifestUseCase.execute()
            if (result.isSuccess) {
                val manifest = result.getOrNull()
                if (manifest != null) {
                    downloadAssetsAndPlay(manifest)
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
        }
    }

    private fun downloadAssetsAndPlay(manifest: Manifest) {
        viewModelScope.launch {
            downloadUseCase.execute(manifest).collectLatest { downloadState ->
                when (downloadState) {
                    is DownloadState.Progress -> {
                        _uiState.value = PlayerUiState.DownloadingAssets(
                            downloadState.percent,
                            downloadState.assetIndex,
                            downloadState.totalAssets
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
        }
    }
}
