# Arsitektur & Spesifikasi IoT Queue Button (Cloud MQTT Auto-Setup)

Dokumen ini mendefinisikan arsitektur, firmware, dan alur integrasi tombol antrean ESP32 IoT pada ekosistem HNDSigma Digital Signage.

## 1. Prinsip & Keputusan Arsitektur

- **Cloud MQTT Terpusat:** Broker MQTT beroperasi di cloud (bukan server lokal di lokasi/LAN). Semua perangkat ESP32 dan backend signage terhubung langsung ke broker cloud ini.
- **Auto-Setup di Firmware (`.ino`):** Endpoint host broker cloud, port MQTT, dan topik dasar telah ditanam secara default (*auto-setup*) di dalam skrip firmware `.ino`. Perangkat tidak memerlukan kompilasi khusus per lokasi toko dan **tidak memerlukan protokol discovery LAN (mDNS / UDP 5353 / local alias discovery)**.
- **Koneksi Keluar Murni (Outbound Only):** ESP32 hanya membuka koneksi keluar (outbound TCP/TLS) ke broker cloud. Tidak diperlukan pembukaan port masuk (*port forwarding*) di router lokasi/toko.
- **Penyediaan Wi-Fi (Wi-Fi Provisioning):** Pengguna hanya perlu menyambungkan ESP32 ke Wi-Fi toko melalui Captive Portal mandiri (atau kredensial yang tersimpan). Setelah Wi-Fi tersambung, ESP32 langsung terhubung ke cloud MQTT.

---

## 2. Alur Pengguna dan Perangkat

### A. Boot Awal & Provisioning Wi-Fi
1. Pada saat pertama kali dinyalakan atau setelah reset, ESP32 mendeteksi tidak adanya konfigurasi Wi-Fi.
2. ESP32 mengaktifkan mode Access Point (AP) dengan Captive Portal (misalnya `HNDSigma-Button-Setup`).
3. Teknisi/installer menghubungkan ponsel ke AP, memilih SSID Wi-Fi toko, dan memasukkan password.
4. Kredensial Wi-Fi disimpan ke Non-Volatile Storage (NVS/EEPROM).
5. Setelah Wi-Fi tersambung, AP dinonaktifkan otomatis.

### B. Auto-Connect Cloud MQTT & Registrasi
1. Menggunakan konfigurasi cloud default dari `.ino`, ESP32 otomatis tersambung ke Cloud MQTT Broker.
2. ESP32 memublikasikan paket telemetri registrasi awal ke topik:
   `dka/iot/<device_uid>/telemetry`
3. Backend signage menerima pesan telemetri, mencatat perangkat baru ke tabel `iot_devices` dengan status awal `is_approved = false` dan `last_seen_at = NOW()`.
4. Perangkat muncul di CMS Dashboard (*Menu Chip / IoT Devices*) sebagai perangkat baru yang menunggu persetujuan (*Pending Approval*).

### C. Persetujuan Admin & Binding Antrean
1. Admin di CMS Dashboard menyetujui perangkat dan menautkannya (*binding*) ke sektor antrean tertentu (`components_queue_iot_bindings`).
2. Backend menandai `is_approved = true`.

### D. Operasi Normal (Pemanggilan Antrean)
1. Petugas menekan tombol fisik antrean pada perangkat ESP32.
2. Firmware melakukan interrupt debouncing (hardware & software filter 200ms) untuk mencegah penekanan ganda yang tidak disengaja.
3. ESP32 mengirim payload aksi ke topik:
   `dka/iot/<device_uid>/action`
   ```json
   {
     "device_uid": "ESP32-QUEUE-XXXX",
     "action": "trigger",
     "button_index": 1,
     "timestamp": 1793980000
   }
   ```
4. Backend IoT worker menerima event aksi, memvalidasi status `is_approved`, menaikkan nomor antrean di sektor terkait, dan membroadcast perubahan melalui gRPC stream ke display player Android.
5. Display player membunyikan chime audio dan memperbarui angka antrean di layar.

---

## 3. Topik MQTT & Kontrak Data

| Arah | Topik MQTT | Format Payload | Deskripsi |
|---|---|:---:|---|
| ESP32 → Cloud | `dka/iot/<device_uid>/telemetry` | JSON | Heartbeat berkala (tiap 60 detik), status Wi-Fi (RSSI), uptime firmware, dan versi software. |
| ESP32 → Cloud | `dka/iot/<device_uid>/action` | JSON | Event penekanan tombol fisik (trigger antrean). |
| Cloud → ESP32 | `dka/iot/<device_uid>/ack` | JSON | Konfirmasi penerimaan aksi dari backend (opsional: kontrol LED indikator). |
| Cloud → ESP32 | `dka/iot/<device_uid>/reset` | JSON | Perintah unbind / reset pairing dari CMS dashboard. |

---

## 4. Reset & Pemeliharaan

- **Reset Wi-Fi Lokal:** Menahan tombol BOOT pada ESP32 selama **> 15 detik** akan menghapus kredensial Wi-Fi dari NVS dan me-reboot perangkat kembali ke mode Access Point Captive Portal.
- **Unbind dari Dashboard:** Admin dapat memutuskan tautan perangkat dari CMS Dashboard. Backend mengirimkan pesan reset ke topik `dka/iot/<device_uid>/reset` dan mencabut relasi binding antrean di database.

---

## 5. Status Implementasi Saat Ini

- [x] **Firmware ESP32 (`iot/esp32_queue_button/`)**: Auto-setup cloud broker, captive portal fallback Wi-Fi, MQTT client, interrupt debouncing, dan penyimpanan NVS.
- [x] **Driver Arduino Nano USB-Serial (`iot/arduino_nano_queue_button/`)**: Alternatif koneksi direct cable serial ke Android TV box tanpa Wi-Fi.
- [x] **Backend Rust MQTT Worker**: Menangani parsing payload telemetri dan aksi tombol, persistensi ke `iot_devices`, serta relasi binding antrean `components_queue_iot_bindings`.
- [x] **Frontend CMS UI**: Tampilan manajemen perangkat IoT pada menu Chip/IoT, approval switch, dan penautan antrean.

