# Naskah & Storyboard Video Ilustrasi: HNDSigma Digital Signage Enterprise
### Panduan Produksi Video Promo Modular (Spesifik Tampilan UI, Fitur Aplikasi & Desain Audio Jernih)

Dokumen ini berisi panduan produksi video animasi / demonstrasi visual produk **HNDSigma**. Setiap scene dirancang berdurasi **~20 detik** dengan pendekatan **non-teknis, realistis, dan membedah antarmuka (UI) aplikasi HNDSigma secara nyata**, mulai dari Dashboard Web Next.js, Android Player (Media3), hingga tombol fisik antrean IoT.

---

## 🎙️ Standar Suara Narator & Desain Audio (Audio Architecture)

### 1. Karakter Suara Narator (Voice Over Talent)
- **Gender**: **Perempuan (Female Voice)**.
- **Karakter & Vibe**: Hangat, ramah, profesional, percaya diri, dan artikulatif (*warm corporate, approachable, natural Indonesian accent*).
- **Tempo Bicara**: Teratur dan santai (~120–130 kata per menit), memberikan ruang jeda napas alami 1–1.5 detik antar kalimat agar tidak terburu-buru dan penonton dapat mencerna pesan dengan rileks.
- **Diksi**: Bahasa Indonesia baku percakapan yang santun, bebas istilah teknis yang memusingkan, dan bernada solutif.

### 2. Aturan Bebas Bottleneck & Anti-Pengulangan (No Audio Bottleneck, No Collision, No Duplication)
- **Zero Audio Bottleneck (Pemisahan Frekuensi & Ducking Otomatis)**:
  - Musik latar (*BGM*) otomatis meredup secara halus (*smooth ducking* turun -18 dB) saat narator perempuan berbicara atau saat suara panggilan antrean berbunyi.
  - Vokal narator diposisikan dominan di frekuensi tengah (rentang 1 kHz – 3.5 kHz) tanpa tabrakan dengan instrumen latar, menghasilkan audio yang jernih, renyah, dan tidak mendengung (*no muddy sound*).
- **Smart Queue & Debounce (Tanpa Suara Menumpuk atau Berulang Ganda)**:
  - Pada sistem antrean toko, diterapkan logika *Smart Audio FIFO Queue*: jika 3 kasir memanggil nomor hampir bersamaan, audio panggilan tidak saling tindih atau terputus kasar (*no clipping/collision*), melainkan dimainkan bergantian dengan jeda alami 1.5 detik.
  - Fitur *debounce* menyaring tombol yang tak sengaja tertekan berkali-kali oleh kasir, mencegah pengulangan suara chime ganda yang bising (*no repetitive spam loop*).
- **Naskah Bebas Repetisi Monoton**:
  - Setiap scene memiliki sudut pandang, kosakata, dan pesan fokus yang berbeda. Tidak ada frasa pembuka yang diulang-ulang di setiap scene agar penonton tetap terpikat dari detik pertama hingga akhir.

---

## Ringkasan 12 Scene & Alur Aplikasi

| No. Scene | Fitur & Halaman UI Aplikasi | Durasi | Karakter Emosi Vokal Perempuan |
|---|---|:---:|---|
| **Scene 01** | *Problem Hook*: Layar Manual vs Tuntutan Ritel | 20 Detik | Simpatik, menggugah rasa penasaran |
| **Scene 02** | Dashboard Ringkasan & UI HDR+ (`/`) | 20 Detik | Antusias, segar, dan meyakinkan |
| **Scene 03** | Pustaka Media & Offline Player (`/studio/media`) | 20 Detik | Tenang, mantap, memberikan rasa aman |
| **Scene 04** | Studio Tata Letak Multi-Zona (`/studio/layouts`) | 20 Detik | Inspiratif, ekspresif, dan berkelas |
| **Scene 05** | Modul Chip IoT & Tombol Meja Kasir (`/hardware/iot`) | 20 Detik | Ringkas, dinamis, menonjolkan kepraktisan |
| **Scene 06** | Audio Chime & Panggilan Suara TTS Bahasa Indonesia | 20 Detik | Lembut, santun, dan menenangkan |
| **Scene 07** | Kalender Rundown Operasional (`/studio/schedules`) | 20 Detik | Teratur, terstruktur, dan bertenaga |
| **Scene 08** | Multi-Tenancy Korporasi & Cabang (`/iam/identity`) | 20 Detik | Profesional, berwibawa skala enterprise |
| **Scene 09** | Siaran Darurat / Pengumuman Cepat (*Emergency Modal*) | 20 Detik | Tegas, sigap, dan responsif |
| **Scene 10** | Pantauan Layar Langsung (*Live Screenshot Telemetry*) | 20 Detik | Informatif, transparan, dan cermat |
| **Scene 11** | Pembaruan APK OTA & Fleet Rollout (`/system/apk`) | 20 Detik | Solutif, santai, menonjolkan kenyamanan |
| **Scene 12** | Solusi Terpadu & Call to Action (CTA) | 20 Detik | Hangat, mengajak, dan penuh optimisme |

---

## Naskah Rinci Per Scene (~20 Detik per Scene)

---

### Scene 01: Masalah Lama — Flashdisk dan Layar Mati
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Setting*: Toko ritel atau restoran cepat saji yang sedang ramai.
  - *Aksi Kamera*: Kamera menyorot staf toko menaiki tangga lipat dengan cemas, berusaha mencolokkan flashdisk ke balik TV gantung di atas kasir.
  - *Layar TV Bermasalah*: Lampu modem toko berkedip merah (koneksi putus); layar TV di sebelahnya mendadak berubah menjadi layar biru kaku bertuliskan *"No Signal / Loading..."*. Pelanggan di antrean menatap heran.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Simpatik, sedikit heran di awal, lalu mengajak penonton mencari solusi.
- **Voice Over (VO)**:
  > *"Masih harus naik tangga cuma buat ganti promo di TV? Atau sering cemas saat internet toko mati dan layar tiba-tiba jadi hitam tak berguna? Mari tinggalkan kerepotan itu hari ini."*
- **Desain Audio & SFX**:
  - Efek suara derit tangga lipat halus, disusul bunyi eror *"beep-boop"* singkat. Musik latar bertempo lambat dengan nada minor.
- **Teks On-Screen (Tipografi Bersih)**:
  - `Masih Repot Colok Flashdisk?`
  - `Layar Toko Sering Blank & Error?`

---

### Scene 02: Solusi Modern — Dashboard Ringkasan HNDSigma
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Setting*: Layar laptop modern menampilkan Dashboard HNDSigma (`/`).
  - *Elemen UI Aplikasi*:
    - Sidebar menu sebelah kiri dengan ikon gradien warna-warni (*Ringkasan, Rundown, Player, Chip IoT, Tata Letak, Pustaka, Identitas*).
    - Kartu metrik di bagian atas: `Total Layar Terpasang: 120`, `Layar Online: 118` (lampu hijau menyala stabil), `Penyimpanan: 45%`.
    - Kursor bergerak halus ke profil sudut kanan atas bertuliskan *Master Signage Admin* dengan toggle mode gelap/terang HDR+.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Antusias, ceria, memperkenalkan solusi dengan ramah dan percaya diri.
- **Voice Over (VO)**:
  > *"Inilah HNDSigma. Pusat kendali digital signage modern yang menyatukan seluruh display toko Anda dalam satu tampilan cerdas, rapi, dan sangat mudah dioperasikan siapa saja."*
- **Desain Audio & SFX**:
  - Transisi desir halus (*whoosh*), musik beralih seketika menjadi melodi instrumen modern bernada mayor yang cerah dan menyejukkan.
- **Teks On-Screen**:
  - `HNDSigma Enterprise CMS`
  - `Pantau Ratusan Layar dalam Satu Dashboard`

---

### Scene 03: Pustaka Media Cerdas & Anti Layar Hitam (Offline-First)
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Halaman `Pustaka Media` (`/studio/media`). Kursor mouse menarik berkas video promosi makanan 4K ke kotak unggah. Proses unggah selesai cepat dengan badge hijau menyala: `Integritas SHA-256 Terverifikasi`.
  - *Layar Terbelah (Split-Screen)*:
    - Kiri: Kabel jaringan internet di toko sengaja dicabut teknisi (simulasi offline total).
    - Kanan: TV player Android di toko tetap lancar memutar video promosi beresolusi tinggi tanpa buffering, tanpa patah-patah.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Menenangkan, tegas, meyakinkan penonton tentang keandalan sistem.
- **Voice Over (VO)**:
  > *"Tarik dan lepas video promosi Anda dalam sekejap. Seluruh konten tersimpan aman di perangkat layar. Mau jaringan internet terputus seharian pun, promosi toko Anda tetap berputar sempurna!"*
- **Desain Audio & SFX**:
  - Bunyi klik *drag-and-drop* lembut, disusul denting nada berhasil (*clean positive chime*). Musik latar di-ducking -18 dB agar vokal tetap renyah di telinga.
- **Teks On-Screen**:
  - `Pustaka Media Drag-and-Drop`
  - `100% Offline-First • Nol Buffering • Bebas Layar Hitam`

---

### Scene 04: Studio Tata Letak — Desain Multi-Zona Tanpa Batas
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Halaman `Editor Tata Letak Multi-Zona` (`/studio/layouts`).
  - *Aksi Kanvas*:
    - Kursor menggeser zona video promosi di area utama kanvas 16:9.
    - Menambahkan widget kanan atas: `Jam Digital Kaca Modern` (*glassmorphism design*).
    - Menambahkan zona bawah: komponen `Running Text` bertuliskan *"Spesial Hari Ini: Diskon Member 20%"*.
    - Menambahkan widget kanan bawah: kartu dinamis `Nomor Antrean Kasir`.
    - Menekan tombol *"Simpan & Publikasikan"*, langsung memunculkan pratinjau TV yang memukau.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Inspiratif, mengalir alami, memamerkan keindahan visual kanvas.
- **Voice Over (VO)**:
  > *"Bebaskan kreativitas Anda. Susun zona video promo, jam dinding elegan, teks pengumuman berjalan, hingga nomor antrean dalam satu layar yang memikat pandangan pengunjung Anda."*
- **Desain Audio & SFX**:
  - Efek snap lembut saat elemen menempel rapi di kanvas (*soft magnetic snap*). Musik latar mengalir elegan tanpa vokal pengiring.
- **Teks On-Screen**:
  - `Editor Tata Letak Multi-Zona Bebas Atur`
  - `Video Promo + Jam + Running Text + Antrean`

---

### Scene 05: Integrasi IoT — Tombol Panggil Meja Kasir Sekali Pencet
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Setting*: Meja kasir ritel atau meja teller bank.
  - *Aksi Lapangan*: Kasir selesai melayani pelanggan. Tangannya cukup menekan satu tombol fisik nirkabel mungil (*ESP32 IoT Button*) di sudut meja tanpa menyentuh keyboard komputer.
  - *Elemen UI Aplikasi*: Menu `Chip (IoT)` (`/hardware/iot/devices`) mencatat event tombol secara instan di bawah 0.1 detik.
  - Layar TV toko langsung merespon pergantian nomor antrean dengan transisi angka yang mulus.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Lugas, energik, menonjolkan kecepatan respon dan kepraktisan.
- **Voice Over (VO)**:
  > *"Panggil pelanggan berikutnya semudah menekan satu tombol praktis di meja kasir. Terhubung nirkabel, merespon kilat di bawah nol koma satu detik, tanpa mengganggu komputer kasir."*
- **Desain Audio & SFX**:
  - Suara *klik* tombol taktil yang renyah (*crisp tactile click*). Tidak ada suara terpotong atau tumpang-tindih.
- **Teks On-Screen**:
  - `Tombol Antrean Fisik Pintar (ESP32 IoT)`
  - `Respon Panggilan Kilat < 0.1 Detik`

---

### Scene 06: Audio Bebas Bottleneck & Panggilan Suara Santun
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Setting*: Ruang tunggu toko / klinik yang nyaman dan tertib.
  - *Aksi Pengunjung*: Pelanggan duduk santai. Terdengar denting lonceng merdu.
  - *Karakter Audio Lapangan (In-Store Audio)*:
    - Denting lonceng ramah (*melodic chime*).
    - Suara perempuan otomatis (TTS Indonesia) yang lembut dan jernih: *"Nomor antrean B-05, silakan menuju Meja Dua"*.
    - Volume video iklan di TV otomatis meredup anggun (*audio ducking* -18 dB) saat panggilan berbunyi, lalu naik kembali perlahan tanpa hentakan kasar.
    - *Anti-Bottleneck Showcase*: Grafis visual singkat menunjukkan jika kasir memanggil beruntun, sistem mengantrekan audio secara teratur dengan jeda alami 1.5 detik tanpa tabrakan suara.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Menyejukkan, ramah, dan santun.
- **Voice Over (VO)**:
  > *"Denting lonceng merdu dan suara panggilan otomatis yang santun menyapa pelanggan dengan nyaman. Dilengkapi antrean audio cerdas bebas tabrakan suara, ruang tunggu Anda selalu tertib dan tenang."*
- **Desain Audio & SFX**:
  - Nada lonceng perbankan (*melodic chime*) disusul suara santun: *"Nomor antrean B-05, silakan menuju Meja Dua"*. BGM diturunkan otomatis secara seimbang.
- **Teks On-Screen**:
  - `Panggilan Suara TTS Bahasa Indonesia Jernih`
  - `Antrean Audio Cerdas: Nol Tabrakan Suara • Nol Bising`

---

### Scene 07: Rundown Operasional — Atur Jam Tayang & Push ke 100 Cabang
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Halaman `Rundown Operasional` (`/studio/schedules/calendar`).
  - *Aksi Kalender*:
    - Admin meninjau blok jadwal tayang: *Menu Sarapan (Pukul 07.00)*, *Menu Siang (Pukul 11.00)*, dan *Paket Sore Santai (Pukul 17.00)*.
    - Admin membuka form penetapan jadwal (`/assign`), memilih target *"Kelompok: Seluruh Toko Jabodetabek (50 Layar)"*, lalu menekan tombol *"Terapkan"*.
    - Seluruh jadwal terdistribusi seketika ke ratusan player.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Rapi, meyakinkan, menonjolkan efisiensi waktu manajemen.
- **Voice Over (VO)**:
  > *"Atur promo sarapan di pagi hari dan menu spesial di siang hari secara otomatis. Cukup jadwalkan pada kalender, lalu kirim serentak ke puluhan hingga ratusan layar cabang dalam beberapa detik saja."*
- **Desain Audio & SFX**:
  - Efek suara swipe kalender interaktif yang halus (*subtle swoosh*), diakhiri bunyi *ping* lembut tanda sukses terkirim.
- **Teks On-Screen**:
  - `Kalender Rundown Operasional Terjadwal`
  - `Menu Berganti Otomatis Mengikuti Waktu`

---

### Scene 08: Multi-Tenancy — Kendali Banyak Cabang dari Satu Akun Pusat
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Menu `Identitas` (`/iam/identity`).
  - *Aksi UI*:
    - Kursor memilih dropdown perusahaan: *"PT Retail Sejahtera Nusantara"*.
    - Tampil daftar cabang rapi: *Cabang Jakarta Pusat, Cabang Surabaya Barat, Cabang Denpasar Bali*.
    - Admin mengunggah promo khusus lokal Bali tanpa takut tertukar dengan cabang Jakarta. Namun kantor pusat tetap memiliki visibilitas menyeluruh atas seluruh cabang.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Berwibawa, profesional, mewakili ketertiban skala korporasi besar.
- **Voice Over (VO)**:
  > *"Kelola aneka merek dan cabang kini terasa sangat rapi. HNDSigma mengisolasi materi promosi tiap cabang dengan aman, namun tetap memberikan pantauan penuh dari satu akun kantor pusat."*
- **Desain Audio & SFX**:
  - Denting ritmis instrumen korporat bernada presisi dan teratur, mempertegas stabilitas sistem.
- **Teks On-Screen**:
  - `Multi-Tenancy Korporasi & Cabang`
  - `Isolasi Konten Aman • Pantauan Terpusat`

---

### Scene 09: Siaran Cepat & Darurat Real-Time (*Emergency Broadcast*)
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Admin menekan tombol merah *"Siaran Darurat"* di bilah navigasi atas dashboard.
  - *Modal Siaran Cepat*: Muncul jendela siaran darurat. Admin mengetik teks *"Pemberitahuan: Jalur Kasir 3 Sedang Dibersihkan"*, memilih durasi 10 menit, lalu mengklik *"Siarkan Sekarang"*.
  - *Layar Toko Lapangan*: Seketika seluruh TV menghentikan video promo dan menampilkan kartu pengumuman penting berlatar tegas. Begitu selesai, layar kembali memutar video normal dengan mulus.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Tanggap, sigap, dan responsif.
- **Voice Over (VO)**:
  > *"Butuh mengumumkan informasi mendadak? Manfaatkan fitur Siaran Cepat. Satu klik dari kantor, seluruh layar toko akan menginterupsi tayangan dan menyampaikan pesan penting detik itu juga."*
- **Desain Audio & SFX**:
  - Bunyi notifikasi peringatan santun tapi mencuri perhatian (*attention alert chime*).
- **Teks On-Screen**:
  - `Siaran Pengumuman Cepat Real-Time`
  - `Interupsi Instan Seluruh Layar Toko`

---

### Scene 10: Pantau Layar Nyata — *Live Screenshot Telemetry*
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Masuk ke detail player di menu `Player` (`/hardware/displays/player/[id]`).
  - *Aksi UI*: Admin di Jakarta ingin memeriksa apakah TV di cabang Surabaya beroperasi dengan benar. Dia mengklik tombol *"Ambil Tangkapan Layar (Live Screenshot)"*.
  - Dalam 1 detik, kartu pratinjau memuat gambar tangkapan layar langsung (*live frame*) yang persis sama dengan apa yang sedang ditonton pengunjung di Surabaya, lengkap dengan status suhu dan kapasitas memori.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Terbuka, transparan, dan komunikatif.
- **Voice Over (VO)**:
  > *"Ingin memastikan TV di cabang luar kota tayang dengan benar? Fitur Live Screenshot memungkinkan Anda melihat tampilan layar secara langsung dari meja kerja Anda. Pastikan toko selalu tampil sempurna."*
- **Desain Audio & SFX**:
  - Bunyi *shutter* kamera lembut yang bersih (*crisp camera snapshot*).
- **Teks On-Screen**:
  - `Live Screenshot Telemetri Real-Time`
  - `Pantau Tampilan Lapangan Langsung dari Meja Anda`

---

### Scene 11: Pembaruan APK Otomatis & Pelacakan Layar (*Fleet Rollout*)
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Elemen UI Aplikasi*: Halaman `Pembaruan APK` (`/system/apk`).
  - *Aksi UI*:
    - Admin membuka detail rilis `v1.2.0` (`/system/apk/[id]`).
    - Terlihat bilah progres hijau elegan: `98% Terdistribusi (98/100 Layar)`.
    - Tabel di bawah menampilkan tab filter jelas: *Sudah Diperbarui* dan *Perlu Pembaruan*.
  - *Kondisi Lapangan*: Di malam hari saat gerai tutup, player TV Android memperbarui dirinya sendiri di latar belakang (*silent update*) tanpa memerlukan kedatangan teknisi ke toko.
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Santai, solutif, menonjolkan efisiensi operasional tanpa beban biaya tambahan.
- **Voice Over (VO)**:
  > *"Perbarui aplikasi display ke seluruh kota tanpa perlu kirim teknisi ke lapangan. Di malam hari, HNDSigma mengupdate sistem secara otomatis, siap menyambut pelanggan esok pagi dengan performa terbaik."*
- **Desain Audio & SFX**:
  - Efek transisi digital lembut berirama santai (*smooth digital progression chime*).
- **Teks On-Screen**:
  - `Pembaruan APK Otomatis (Silent Update)`
  - `Pelacakan Sebaran Layar Real-Time • Nol Biaya Teknisi`

---

### Scene 12: Nilai Investasi Terbaik & Call to Action (CTA)
- **Durasi**: 20 Detik
- **Latar & Aset Visual**:
  - *Komposisi Sinematik*:
    - Di tengah: Layar laptop menampilkan Dashboard HNDSigma PRO (mode gelap HDR+ elegan).
    - Di kiri: TV Android komersial menayangkan video ritel memukau dengan running text dan widget antrean aktif.
    - Di kanan: Tombol antrean fisik nirkabel yang ramping di meja kayu kasir.
  - Teks promosi menonjol: *Tanpa Biaya Lisensi Bulanan per Layar*.
  - Logo resmi **HNDSigma PRO** menyala indah dengan kilau aksen biru-cyan (*HDR glow*).
- **Instruksi Suara Narator (Perempuan)**:
  - *Tone*: Hangat, persuasif, mengundang kerjasama dengan nada percaya diri tinggi.
- **Voice Over (VO)**:
  > *"Satu solusi terpadu untuk promosi visual memukau dan antrean toko yang tertib rapi. Tanpa biaya langganan per layar, manfaatkan TV yang sudah Anda miliki. Hubungi kami sekarang dan jadwalkan demo gratis untuk bisnis Anda!"*
- **Desain Audio & SFX**:
  - Musik latar mencapai klimaks orkestra modern megah, diakhiri dengan *brand audio signature* HNDSigma yang bersih dan berkesan mendalam.
- **Teks On-Screen**:
  - `HNDSigma Enterprise Digital Signage`
  - `Satu Platform: Media Promosi + Antrean IoT`
  - `Hemat Anggaran • Tanpa Royalti Bulanan per Layar`
  - `Hubungi Kami Sekarang • Jadwalkan Demo Gratis`

---

## 🎧 Lembar Panduan Mixing Audio (Untuk Sound Engineer & Editor)

1. **Volume Level Standards (EBU R128 / ITU-R BS.1770)**:
   - Target Loudness Keseluruhan: **-14 LUFS** (standar video online YouTube/Instagram/TikTok).
   - Peak Ceiling Maksimal: **-1.0 dBFS True Peak**.
2. **Sidechain Audio Ducking Configuration**:
   - Sumber Pemicu (*Trigger*): Trek Voice Over Narator Perempuan & Trek TTS Panggilan Toko.
   - Target Ducking: Trek Musik Latar (*BGM*) & Trek Audio Video Iklan Player.
   - Besaran Penurunan (*Threshold / Gain Reduction*): **-18 dB**.
   - Attack Time: **25 ms** (meredup halus tanpa mengagetkan).
   - Release Time: **350 ms** (kembali normal secara bertahap begitu suara selesai).
3. **Penyaringan Frekuensi Suara Narator Perempuan (Voice EQ)**:
   - Low-cut (High-pass filter): Potong di bawah **80 Hz** untuk menghilangkan gemuruh napas (*plosive/rumble*).
   - Mid-presence: Angkat halus +1.5 dB pada frekuensi **2.8 kHz** untuk artikulasi kata yang renyah dan tegas.
   - De-Esser: Aktifkan pada rentang **6 kHz – 8 kHz** untuk meredam desisan konsonan 's' yang tajam.
4. **Verifikasi Anti-Repetisi Audio**:
   - Pastikan tidak ada loop suara chime antrean yang berulang lebih dari 1 kali dalam satu scene panggilan.
   - Pastikan setiap jeda antar kalimat narator terasa organik (1–1.5 detik), memberi jeda agar penonton menyerap visual UI aplikasi di layar.
