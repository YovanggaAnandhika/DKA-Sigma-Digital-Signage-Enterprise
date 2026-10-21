# Panduan Arduino Nano USB Queue Button (DKASigma)

Firmware ini digunakan untuk menjadikan **Arduino Nano (Classic ATmega328P)** sebagai tombol fisik pemanggil antrean (Next Call, Recall, Break) yang dihubungkan langsung melalui **kabel USB** ke komputer/laptop petugas loket.

---

## 1. Skema Pengkabelan (Wiring)

Arduino Nano menggunakan resistor internal `INPUT_PULLUP`, sehingga **tidak memerlukan resistor eksternal apa pun**:

| Komponen | Pin Arduino Nano | Kaki Tombol Lainnya | Keterangan |
|---|---|---|---|
| **Pushbutton 1 (Next Call)** | **Pin D2** | **GND** | **Tombol Panggil Berikutnya** |
| Pushbutton 2 (Recall - Opsional) | **Pin D3** | **GND** | Tombol Panggil Ulang |
| Pushbutton 3 (Break - Opsional) | **Pin D4** | **GND** | Tombol Toggle Istirahat |
| Onboard LED Indikator | **Pin D13** | (Internal Board) | Berkedip saat tombol ditekan & ACK |

> 💡 **Cara pasang pushbutton**:
> Cukup hubungkan satu kaki pushbutton ke **Pin D2**, dan kaki satunya lagi ke pin **GND** pada Arduino Nano.

---

## 2. Pengaturan di Arduino IDE

1. Sambungkan Arduino Nano ke komputer menggunakan kabel USB (Mini-USB).
2. Buka Arduino IDE, lalu buka berkas: `iot/arduino_nano_queue_button/arduino_nano_queue_button.ino`.
3. Buka menu **Tools**:
   - **Board**: `Arduino AVR Boards` $\rightarrow$ **Arduino Nano**
   - **Processor**: 
     - Coba pilih **ATmega328P** (untuk Arduino Nano baru), ATAU
     - Pilih **ATmega328P (Old Bootloader)** jika Arduino Nano clone (CH340) gagal upload.
   - **Port**: Pilih port USB yang terdeteksi (misal: `/dev/cu.usbserial-xxx` di Mac atau `COM3` di Windows).
4. Klik tombol **Upload** (ikon panah ke kanan `➔` atau `Cmd + U`).
5. **Zero Library**: Sketch ini **tidak memerlukan library tambahan apa pun** (100% menggunakan library standar Arduino AVR).

---

## 3. Integrasi ke Dashboard Web DKASigma

Di halaman **Konsol Pemanggil Loket** (`Studio` $\rightarrow$ `Antrean` $\rightarrow$ `Kontrol Pemanggil`):
1. Klik tombol **"🔌 Hubungkan Tombol USB (Arduino Nano)"**.
2. Browser akan memunculkan dialog daftar port serial USB.
3. Pilih port Arduino Nano Anda dan klik **Connect**.
4. Tekan tombol fisik di Pin D2: antrean otomatis memanggil nomor berikutnya!
