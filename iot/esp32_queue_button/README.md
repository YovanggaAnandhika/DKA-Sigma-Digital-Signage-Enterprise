# Panduan Flashing & Wiring: NodeMCU ESP32 IoT Queue Controller

Firmware ini digunakan untuk menghubungkan modul **NodeMCU ESP32 (ESP-WROOM-32)** sebagai tombol fisik antrean (Tombol Karcis Masuk atau Remote Pemanggil Loket) yang terhubung ke platform **HNDSigma Digital Signage Enterprise** melalui protokol **MQTT**.

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
> Anda dapat memetakan ulang tombol GPIO dari menu **Perangkat IoT** tanpa perlu mengedit atau meng-upload ulang kode Arduino.

### Indikator LED GPIO 2

| Pola | Status |
|---|---|
| Kedip cepat | Wi-Fi belum tersambung |
| Satu kedip lambat | Wi-Fi tersambung, MQTT belum tersambung |
| Tiga kedip cepat berulang | BOOT ditahan untuk reset atau reset menunggu respons |
| Tiga kedip berulang sekitar 2 detik, lalu kedip ganda lambat | Reset selesai; perangkat masuk mode pairing |
| Kedip ganda lambat | Mode pairing/setup aktif |
| Heartbeat redup | Wi-Fi dan MQTT tersambung |

Heartbeat memakai PWM agar cahaya lebih lembut. Atur `STATUS_LED_HEARTBEAT_BRIGHTNESS`
(0–255) untuk kecerahan dan `STATUS_LED_HEARTBEAT_PERIOD_MS` untuk tempo.

---

## 3. Upload Firmware

1. Buka file `esp32_queue_button.ino` di Arduino IDE.
2. Hubungkan ESP32 ke komputer via kabel Micro USB / Type-C.
3. Pilih port COM yang sesuai di **Tools > Port**.
4. Klik tombol **Upload** (panah kanan).

Tidak perlu mengubah atau mengompilasi SSID, password Wi-Fi, atau alamat broker
di source code.

---

## 4. Setup Wi-Fi dan Broker dari Ponsel

1. Nyalakan ESP32 yang belum dikonfigurasi. Perangkat membuat Wi-Fi setup
   terbuka dengan nama `DKASigma-Setup-<6 karakter MAC terakhir>`.
2. Sambungkan ponsel ke Wi-Fi tersebut. Jika halaman captive portal tidak muncul,
   buka `http://192.168.4.1/`.
3. Tekan **Pindai**, pilih SSID Wi-Fi (hanya jaringan 2.4 GHz), lalu masukkan
   password Wi-Fi.
4. Isi hostname/IP broker MQTT dan port. Isi username/password MQTT jika broker
   memerlukannya. Endpoint broker masih dikonfigurasi manual pada tahap ini;
   discovery cloud akan dikerjakan terpisah.
5. Tekan **Simpan dan sambungkan**. Jika Wi-Fi berhasil tersambung, access point
   setup langsung mati. ESP32 menyimpan konfigurasi dan mulai mencoba koneksi
   MQTT. Jika koneksi Wi-Fi gagal, portal tetap tersedia untuk mencoba kembali.

> **Peringatan keamanan:** Wi-Fi setup sengaja terbuka sesuai pilihan deployment.
> Siapa pun di dekat perangkat dapat bergabung dan mengubah konfigurasi. Form
> lokal memakai HTTP, sehingga password Wi-Fi tidak dienkripsi saat dikirim ke
> ESP32. Lakukan setup di lokasi terkontrol dan jangan biarkan perangkat dalam
> mode setup tanpa pengawasan.
>
> Firmware saat ini juga menggunakan MQTT TCP tanpa TLS. Jangan kirim kredensial
> melalui broker yang terbuka di internet; gunakan hanya pada jaringan tepercaya
> atau VPN sampai dukungan TLS tersedia.

### Reset pairing dan penghapusan perangkat

Hapus perangkat dari dashboard atau tahan tombol **BOOT selama 5 detik**.
Keduanya mencoba handshake dengan backend. Jika BOOT ditekan, firmware menunggu
ACK hingga 10 detik; setelah itu reset lokal tetap dilanjutkan walaupun server
offline atau gagal menghapus record. Firmware menghapus Wi-Fi dan endpoint MQTT
tersimpan lalu membuka AP setup. Dalam kondisi tersebut record server tetap ada
dan perlu Anda hapus manual dari dashboard IoT nanti.

Penghapusan dari dashboard tetap menunggu konfirmasi backend sebelum menghapus
record. Jika perangkat/server tidak merespons, penghapusan dashboard gagal dan
konfigurasi perangkat tidak diubah. Untuk server yang sedang mati, tahan BOOT
selama 5 detik secara fisik; setelah server pulih, hapus record yang tertinggal
secara manual.

Reset ini hanya melepas record pada server signage yang sedang dikonfigurasi.
Registry kepemilikan lintas-server/cloud belum tersedia, sehingga ini belum
menjamin lock global jika beberapa server terpisah memakai broker berbeda.

Reset pairing aktif setiap saat. MQTT username/password opsional; jika
dikonfigurasi backend menggunakannya, jika tidak koneksi memakai broker anonymous.

---

## 5. Persetujuan Perangkat dan Binding Queue

1. Buka **Serial Monitor** di Arduino IDE dengan baud rate `115200`.
2. Setelah Wi-Fi tersambung, layar Serial Monitor akan mencetak informasi:
   ```
   =================================================
      HNDSigma Digital Signage - IoT Controller    
      DEVICE UID : ESP32_3C61054A2B1C
   =================================================
   ```
3. Perangkat yang mengirim pesan MQTT akan muncul di menu **Perangkat IoT**
   dengan status menunggu persetujuan.
4. Setujui perangkat tersebut, lalu atur nama dan mapping pin GPIO beserta aksinya di menu **Perangkat IoT**.
5. Buka editor queue yang dituju, pilih tab **IoT Binding**, lalu ikat perangkat ke queue. Pilih loket jika mapping pin menggunakan aksi loket.
6. Tekan tombol fisik pada ESP32:
   - LED onboard akan berkedip 2x sebagai tanda aksi berhasil diterima server.
   - Aksi dijalankan untuk setiap queue yang terikat ke perangkat.
