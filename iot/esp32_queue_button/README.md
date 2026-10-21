# Panduan Flashing & Wiring: NodeMCU ESP32 IoT Queue Controller

Firmware ini digunakan untuk menghubungkan modul **NodeMCU ESP32 (ESP-WROOM-32)** sebagai tombol fisik antrean (Tombol Karcis Masuk atau Remote Pemanggil Loket) yang terhubung ke platform **DKASigma Digital Signage Enterprise** melalui protokol **MQTT**.

---

## 1. Persiapan Arduino IDE

### A. Install Board ESP32
1. Buka Arduino IDE.
2. Masuk ke menu **File > Preferences**.
3. Pada kolom *Additional Boards Manager URLs*, tambahkan URL berikut:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Buka **Tools > Board > Boards Manager...**, cari `esp32` oleh *Espressif Systems*, lalu klik **Install**.
5. Pilih Board: **Tools > Board > ESP32 Arduino > NodeMCU-32S** (atau *ESP32 Dev Module*).

### B. Install Library yang Dibutuhkan
Buka **Tools > Manage Libraries...** (atau shortcut `Ctrl+Shift+I` / `Cmd+Shift+I`), lalu cari dan install:
1. **PubSubClient** (oleh *Nick O'Leary*)
2. **ArduinoJson** (oleh *Benoit Blanchon* - versi 6.x atau 7.x)

---

## 2. Skema Wiring & Pinout Tombol Fisik

Firmware ini menggunakan mode `INPUT_PULLUP` internal ESP32. Artinya:
- Setiap tombol pushbutton cukup dihubungkan langsung antara **Pin GPIO** ke **GND** (Ground).
- **TIDAK memerlukan resistor eksternal.**

```
   NodeMCU ESP32                Pushbutton Fisik
  +---------------+           +-----------------+
  |       GPIO 13 | <=======> | Kaki 1          |
  |               |           |                 |
  |           GND | <=======> | Kaki 2          |
  +---------------+           +-----------------+
```

### Rekomendasi Pin Default:
| Pin GPIO | Label Default | Rekomendasi Fungsi | Keterangan |
|---|---|---|---|
| **GPIO 13** | Tombol 1 | **Panggil Berikutnya (Call Next)** / **Ambil Karcis** | Pushbutton ke GND |
| **GPIO 12** | Tombol 2 | **Panggil Ulang (Recall)** | Pushbutton ke GND |
| **GPIO 14** | Tombol 3 | **Istirahat Loket (Break)** | Pushbutton ke GND |
| **GPIO 27** | Tombol 4 | **Tutup Loket (Close/Lock)** | Pushbutton ke GND |
| **GPIO 26** | Tombol 5 | **Panggilan Sebelumnya (Prev)** | Pushbutton ke GND |
| **GPIO 2**  | Onboard LED | Indikator Status & ACK | Built-in Blue LED |
| **GPIO 4**  | Buzzer (Opsional) | Nada Konfirmasi | Buzzer piezo ke GND |

> [!TIP]
> Anda dapat menambah atau memetakan ulang tombol pin GPIO kapan saja secara dinamis langsung dari web dashboard DKASigma pada tab **"Perangkat IoT / Tombol"** tanpa perlu mengedit atau meng-upload ulang kode Arduino!

---

## 3. Langkah Konfigurasi & Upload

1. Buka file `esp32_queue_button.ino` di Arduino IDE.
2. Ubah variabel Wi-Fi dan MQTT di bagian atas:
   ```cpp
   const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
   const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

   // IP Komputer / Server yang menjalankan Docker DKASigma
   const char* MQTT_SERVER   = "192.168.1.100";
   const int   MQTT_PORT     = 1883;
   ```
3. Hubungkan ESP32 ke komputer via kabel Micro USB / Type-C.
4. Pilih port COM yang sesuai di **Tools > Port**.
5. Klik tombol **Upload** (panah kanan).

---

## 4. Cara Pairing ke Antrean di Web Dashboard

1. Buka **Serial Monitor** di Arduino IDE dengan baud rate `115200`.
2. Saat ESP32 menyala, layar Serial Monitor akan mencetak informasi:
   ```
   =================================================
      DKASigma Digital Signage - IoT Controller    
      DEVICE UID : ESP32_3C61054A2B1C
      (Salin UID ini ke tab 'Perangkat IoT' di Web)
   =================================================
   ```
3. Buka browser ke CMS DKASigma: Masuk ke menu antrean Anda, lalu klik tab baru **"Perangkat IoT / Tombol"**.
4. Klik **"+ Pasangkan NodeMCU ESP32"**:
   - Masukkan Device UID yang tampil di Serial Monitor (misal: `ESP32_3C61054A2B1C`).
   - Pilih peran: *Remote Loket* (pilih nomor loket sasaran) atau *Tombol Karcis*.
   - Sesuaikan konfigurasi tombol pin GPIO (atau gunakan tombol preset cepat).
   - Klik **Simpan Perangkat**.
5. Tekan tombol fisik pada ESP32:
   - LED onboard akan berkedip 2x sebagai tanda aksi berhasil diterima server.
   - Layar antrean dan loket pemanggil akan langsung ter-update secara realtime!
