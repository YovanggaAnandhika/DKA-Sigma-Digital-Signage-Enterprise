# Android Player Protocol & Integration Guide (gRPC)

Dokumen ini adalah panduan teknis bagi developer aplikasi Android Display untuk terintegrasi dengan **OmniSign Backend (Rust)** melalui protocol **gRPC**.

---

## 1. Proto Contract Imports

Aplikasi Android mengimpor Protobuf dari folder `backend/proto/`:
- `common/v1/types.proto`
- `hardware/v1/device/device.proto` & `device.common.proto`
- `distribution/v1/manifest/manifest.proto` & `manifest.common.proto`
- `distribution/v1/stream/stream.proto` & `stream.common.proto`
- `distribution/v1/canary/canary.proto` & `canary.common.proto`

---

## 2. Boot & Device Pairing Flow

```
[Android TV / Tablet Boot]
        │
        ▼
Cek Token Tersimpan di EncryptedSharedPreferences?
        ├── [Ya] ──► Mulai gRPC Bidirectional Stream & Download Manifest
        └── [Tidak]
                │
                ▼
      Panggil `RegisterDevice()` via gRPC
                │
                ▼
      Dapatkan `pairing_code` (e.g. "XR8-992")
                │
                ▼
      Tampilkan Pairing Code di Layar TV Toko
                │
                ▼
      [Admin CMS memasukkan kode di Backoffice Next.js]
                │
                ▼
      Player polling status atau menerima notifikasi gRPC `device_token`
                │
                ▼
      Simpan `device_token` secara permanen
```

### Request Contoh Android:
```kotlin
val stub = DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channel)

val response = stub.registerDevice(
    registerDeviceRequest {
        macAddress = getMacAddress()
        appVersion = "1.0.0"
        androidVersion = Build.VERSION.RELEASE
        screenWidth = 1920
        screenHeight = 1080
        orientation = DeviceOrientation.ORIENTATION_LANDSCAPE
    }
)

displayOnScreen("PAIRING CODE: ${response.pairingCode}")
```

---

## 3. Offline-First Asset Caching Algorithm

Agar layar promosi toko retail tetap berputar mulus tanpa koneksi internet yang stabil:

1. Player memanggil `ManifestService.GetActiveManifest(deviceId, currentHash)`.
2. Jika respons `is_up_to_date == true`, player tetap memutar manifest saat ini.
3. Jika terdapat manifest baru:
   - Baca daftar `required_assets`.
   - Untuk setiap file media (video/gambar), cek apakah file sudah ada di penyimpanan lokal:
     - Lokasi: `/storage/emulated/0/Android/data/com.signage.player/cache/assets/{media_id}`
     - Validasi `sha256_hash` lokal vs server.
   - Unduh asset yang belum ada menggunakan HTTP Byte-Range download (didukung oleh backend Rust).
4. Setelah **100% asset terunduh dan terverifikasi utuh**:
   - Ganti referensi layout visual secara atomic (seamless cross-fade tanpa layar hitam/blank).

---

## 4. Real-time Bi-directional Streaming (`DisplayStream`)

Android Display menjaga koneksi stream HTTP/2 gRPC terbuka:

```kotlin
val streamStub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channel)

val clientRequests = flow {
    while (true) {
        emit(
            streamClientMessage {
                deviceId = savedDeviceId
                timestamp = System.currentTimeMillis()
                ping = heartbeatPing {
                    memoryPercent = getMemoryUsagePercent()
                    storageFreeBytes = getFreeDiskSpace()
                    currentPlayingMediaId = activeMediaId
                }
            }
        )
        delay(30_000) // Kirim telemetry setiap 30 detik
    }
}

streamStub.displayStream(clientRequests).collect { serverCommand ->
    when (serverCommand.commandType) {
        ServerCommandType.COMMAND_RELOAD_MANIFEST -> {
            // Segera sinkronisasi jadwal/layout baru
            fetchNewManifest()
        }
        ServerCommandType.COMMAND_CAPTURE_SCREENSHOT -> {
            // Ambil screenshot layar & kirim balik ke server
            val screenshotBytes = captureScreen()
            sendScreenshotAck(serverCommand.messageId, screenshotBytes)
        }
        ServerCommandType.COMMAND_EMERGENCY_BROADCAST -> {
            // Tampilkan pesan darurat di atas semua zona
            showEmergencyBanner(serverCommand.payloadJson)
        }
        ServerCommandType.COMMAND_REBOOT_PLAYER -> {
            restartApp()
        }
        else -> Unit
    }
}
```

---

## 5. Multi-Zone Native Rendering

1. Resolusi kanvas disesuaikan dengan `canvas_width` dan `canvas_height` dari manifest.
2. Setiap `Zone` dirender sebagai `FrameLayout` / `ViewGroup` dengan koordinat absolut `(x, y, width, height)` dan `z_index`.
3. Di dalam setiap zona:
   - Jika tipe media adalah Video: Gunakan `ExoPlayer` (Media3) dengan looping dan hardware acceleration.
   - Jika tipe media adalah Playlist: Gunakan `Timer` untuk memicu pergantian slide (`AlphaAnimation` atau `SlideAnimation`) sesuai `duration_seconds` yang ditentukan di CMS.
