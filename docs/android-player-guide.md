# Android Player Protocol & Integration Guide (gRPC)

Dokumen ini adalah panduan teknis bagi developer aplikasi Android Display untuk terintegrasi dengan **DKASigma Backend (Rust)** melalui protocol **gRPC**.

---

## 1. Proto Contract Imports

Aplikasi Android memakai salinan Protobuf di `android/app/src/main/proto/` yang mencerminkan `backend/proto/` (package `com.dkaapis.sigma`, di-generate saat build via plugin Protobuf). Kontrak yang relevan untuk player:
- `common/v1/types.proto`
- `hardware/v1/device/device.proto` & `device.common.proto`
- `distribution/v1/manifest/manifest.proto` & `manifest.common.proto`
- `distribution/v1/stream/stream.proto` & `stream.common.proto`
- `distribution/v1/canary/canary.proto` & `canary.common.proto`

Setiap perubahan kontrak harus dilakukan di `backend/proto/` lalu disalin/di-mirror ke folder Android tersebut.

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

### Request Contoh Android (sesuai `DeviceRepositoryImpl.kt`):
```kotlin
import signage.hardware.v1.device.DeviceCommon
import signage.hardware.v1.device.DeviceServiceGrpcKt

val stub = DeviceServiceGrpcKt.DeviceServiceCoroutineStub(channel)

val request = DeviceCommon.RegisterDeviceRequest.newBuilder()
    .setDeviceName("Android Display")
    .setMacAddress(getMacAddress())
    .setAppVersion("1.0.0")
    .setAndroidVersion(Build.VERSION.RELEASE.orEmpty())
    .setScreenWidth(1920)
    .setScreenHeight(1080)
    .setOrientation(DeviceCommon.DeviceOrientation.ORIENTATION_LANDSCAPE)
    .build()

val response = stub.registerDevice(request)
displayOnScreen("PAIRING CODE: ${response.pairingCode.uppercase()}")
```

Token perangkat disimpan di `EncryptedSharedPreferences` (`dkasigma_secure_prefs`, key `device_id` & `device_token`) melalui `TokenStorage`, dengan fallback ke `SharedPreferences` biasa bila Keystore tidak tersedia.

---

## 3. Offline-First Asset Caching Algorithm

Agar layar promosi toko retail tetap berputar mulus tanpa koneksi internet yang stabil:

1. Player memanggil `ManifestService.GetActiveManifest(deviceId, currentHash)`.
2. Jika respons `is_up_to_date == true`, player tetap memutar manifest saat ini.
3. Jika terdapat manifest baru:
   - Baca daftar `required_assets`.
   - Untuk setiap file media (video/gambar), cek apakah file sudah ada di penyimpanan lokal:
     - Lokasi: `getExternalFilesDir(null)/assets/{media_id}` — pada perangkat umum menjadi `/storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/{media_id}`
     - File parsial memakai akhiran `.part`.
     - Validasi `sha256_hash` lokal vs server (`MediaDiskCache.verifyFileSha256`).
   - Unduh asset yang belum ada menggunakan HTTP Byte-Range download (didukung oleh backend Rust).
4. Setelah **100% asset terunduh dan terverifikasi utuh**:
   - Ganti referensi layout visual secara atomic (seamless cross-fade tanpa layar hitam/blank).

---

## 4. Real-time Bi-directional Streaming (`DisplayStream`)

Protokol: `StreamService.DisplayStream(stream StreamClientMessage) returns (stream StreamServerMessage)`. Setiap pesan klien wajib membawa `device_id` dan `device_token`; payload `oneof` berisi `ping`, `command_ack`, atau `screenshot`.

```kotlin
val streamStub = StreamServiceGrpcKt.StreamServiceCoroutineStub(channel)

val clientRequests = flow {
    while (true) {
        emit(
            streamClientMessage {
                deviceId = savedDeviceId
                deviceToken = savedDeviceToken
                timestamp = System.currentTimeMillis()
                ping = heartbeatPing {
                    memoryPercent = getMemoryUsagePercent()
                    storageFreeBytes = getFreeDiskSpace()
                    currentPlayingMediaId = activeMediaId
                }
            }
        )
        delay(30_000) // Telemetry setiap 30 detik
    }
}

streamStub.displayStream(clientRequests).collect { message ->
    when (message.commandType) {
        ServerCommandType.RELOAD_MANIFEST -> fetchNewManifest()
        ServerCommandType.CAPTURE_SCREENSHOT -> captureAndUploadScreenshot(message.messageId)
        ServerCommandType.EMERGENCY_BROADCAST -> showEmergencyBanner(message.payloadJson)
        ServerCommandType.REBOOT_PLAYER -> restartApp()
        ServerCommandType.CLEAR_CACHE -> clearMediaCache()
        else -> Unit
    }
}
```

> **Status implementasi:** `StreamRepositoryImpl.openDisplayStream()` di aplikasi Android saat ini masih berupa placeholder (loop delay/reconnect tanpa memanggil stub gRPC). Implementasi nyata mengikuti kontrak di atas.

Nilai enum di Protobuf memakai prefiks `COMMAND_*` (contoh `COMMAND_RELOAD_MANIFEST`); model domain Kotlin memetakannya menjadi `RELOAD_MANIFEST`, dst.

---

## 5. Multi-Zone Native Rendering

1. Resolusi kanvas disesuaikan dengan `canvas_width` dan `canvas_height` dari manifest.
2. Setiap layer/zona dirender sebagai `FrameLayout` / `ViewGroup` dengan koordinat absolut `(x, y, width, height)` dan `z_index`.
3. Renderer berada di `presentation/renderers/` (mis. `VideoZoneRenderer.kt`, `QueueZoneRenderer.kt`):
   - Video: `ExoPlayer` (Media3) dengan looping dan hardware acceleration.
   - Playlist/gambar: pergantian slide sesuai `duration_seconds` dari CMS.
   - Queue display: komponen khusus di `presentation/renderers/queue/`.
