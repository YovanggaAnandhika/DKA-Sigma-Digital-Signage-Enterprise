package com.dkaapis.sigma.presentation.pairing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dkaapis.sigma.domain.usecase.RegisterAndPairUseCase
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class PairingUiState {
    object Initial : PairingUiState()
    object Registering : PairingUiState()
    data class WaitingForAdmin(val pairingCode: String, val deviceId: String) : PairingUiState()
    object PairedSuccess : PairingUiState()
    data class Error(val message: String) : PairingUiState()
}

class PairingViewModel(
    private val registerAndPairUseCase: RegisterAndPairUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<PairingUiState>(PairingUiState.Initial)
    val uiState: StateFlow<PairingUiState> = _uiState.asStateFlow()

    fun startPairing() {
        if (registerAndPairUseCase.isAlreadyPaired()) {
            _uiState.value = PairingUiState.PairedSuccess
            return
        }

        viewModelScope.launch {
            _uiState.value = PairingUiState.Registering
            val regResult = registerAndPairUseCase.register()
            if (regResult.isSuccess) {
                val pairing = regResult.getOrThrow()
                val code = pairing.pairingCode.ifEmpty { pairing.deviceId }
                _uiState.value = PairingUiState.WaitingForAdmin(code, pairing.deviceId)
                pollPairingStatus(code)
            } else {
                _uiState.value = PairingUiState.Error(regResult.exceptionOrNull()?.message ?: "Gagal registrasi perangkat")
            }
        }
    }

    private fun pollPairingStatus(pairingCode: String) {
        viewModelScope.launch {
            while (true) {
                delay(5_000)
                val statusResult = registerAndPairUseCase.checkStatus(pairingCode)
                if (statusResult.isSuccess && statusResult.getOrNull()?.isSuccess == true) {
                    _uiState.value = PairingUiState.PairedSuccess
                    break
                }
            }
        }
    }
}
