# Perbandingan Komprehensif: HNDSigma vs Kompetitor Digital Signage Enterprise

Dokumen ini membandingkan kapabilitas **HNDSigma Digital Signage Enterprise** dengan pemain utama digital signage. Status HNDSigma di bawah ini disesuaikan dengan implementasi repository saat ini; perbandingan bukan hasil benchmark independen. Harga dan fitur kompetitor dapat berbeda menurut paket, wilayah, dan waktu.

---

## 1. Pemetaan Kompetitor Utama

| Kompetitor | Tipe / Target Pasar | Arsitektur Utama | Model Bisnis / Lisensi |
|---|---|---|---|
| **Samsung MagicINFO** | Enterprise Hardware Incumbent | Ekosistem Samsung dengan player Tizen pada display yang didukung | Lisensi dan layanan bergantung pada produk/paket |
| **BrightSign (BSN.cloud)** | Commercial & Enterprise Appliance | Cloud management + BrightSign OS pada perangkat BrightSign | Hardware dan layanan berlisensi |
| **Yodeck** | SMB & Mid-Market Cloud Signage | Layanan cloud + beragam pilihan player | Subscription berdasarkan paket |
| **ScreenCloud** | Modern Cloud Signage SaaS | Layanan cloud + player multi-platform | Subscription berdasarkan paket |
| **Xibo Signage** | Open Source / Traditional Signage | CMS self-hosted/cloud + player beragam platform | Opsi open-source dan layanan komersial |
| **Raydiant / NoviSign** | Retail Experience & Interactive QSR | Layanan cloud + player yang didukung vendor | Subscription berdasarkan paket |
| **HNDSigma (Proyek Ini)** | Enterprise Retail Signage + IoT Hardware | **Rust/Tonic gRPC + Next.js 16 + Android Media3 + ESP32/Arduino** | **CMS self-hosted; biaya infrastruktur dan perangkat ditentukan deployment** |

---

## 2. Kelebihan & Keunggulan Kompetitif HNDSigma

### 1. Backend Rust dan API gRPC
- **Backend Rust dan Tonic gRPC**: Backend memakai Rust dan Tokio; frontend CMS memakai Next.js 16.4.6. Arsitektur ini menghindari garbage collection pada proses Rust, tetapi kapasitas, penggunaan memori, dan latensi aktual tetap bergantung pada beban serta konfigurasi deployment.
- **Belum ada benchmark head-to-head yang dipublikasikan**. Batas resource pada Compose adalah konfigurasi deployment, bukan hasil pengukuran performa atau jaminan kapasitas.

### 2. Single Source of Truth Melalui Protobuf (`backend/proto/`)
- Seluruh kontrak komunikasi antara Backend Rust, Web Next.js Bridge, dan Android Native Player diatur oleh satu skema Protobuf murni.
- Client yang dihasilkan dari skema ini mengurangi kebutuhan menjaga kontrak API terpisah secara manual.

### 3. Playback Offline-First dan Verifikasi Integritas (SHA-256)
- **Atomic Manifest Switch**: Player Android (Media3/ExoPlayer) mengaktifkan manifest baru setelah aset wajib tersedia dan lolos validasi SHA-256; jika pengunduhan aset gagal, playback aktif yang lama dipertahankan.
- **Pemutaran offline berbasis cache**: Saat sinkronisasi server gagal, player dapat menggunakan manifest lokal dan aset yang sudah tersimpan. Konten WebView dan siaran live tetap bergantung pada sumber/jaringan masing-masing.
- **Profil Android low-spec**: Player mendeteksi perangkat low-RAM dari `isLowRamDevice` atau RAM terpasang maksimal 1,5 GB. Untuk video tersimpan, buffer disetel 2,5–5 detik dengan `targetBufferBytes` 10 MB dan extension renderer/software decoder dimatikan agar mengutamakan decoder hardware. Untuk siaran RTSP server-hosted, profil low-spec memilih endpoint `hd/live`, target buffer 6 MB, dan buffer 1,2–3,5 detik. Angka buffer ini bukan total konsumsi RAM aplikasi. Implementasi: `android/app/src/main/java/com/dkaapis/sigma/presentation/util/DeviceCapabilityHelper.kt`, `.../renderers/VideoZoneRenderer.kt`, dan `.../renderers/LiveStreamZoneRenderer.kt`.
- Profil tersebut memungkinkan player berjalan pada perangkat Android berspesifikasi rendah yang kompatibel, tetapi bukan sertifikasi untuk semua TV box. Hasil tetap bergantung pada dukungan codec/decoder hardware, storage, resolusi konten, dan kondisi jaringan.

### 4. Integrasi Hardware IoT & Antrean Fisik
- HNDSigma mengintegrasikan input tombol ESP32 dan Arduino Nano dengan alur antrean digital signage; kemampuan serupa pada platform lain perlu dinilai berdasarkan produk dan integrasi yang ditawarkan.
- HNDSigma mengintegrasikan **firmware ESP32 (Wi-Fi + MQTT)** dan **Arduino Nano (USB-Serial)** langsung ke dalam backend dan player.
- Event tombol dikirim melalui MQTT (ESP32) atau USB-serial (Arduino Nano), diteruskan ke player untuk aksi antrean, chime, dan TTS. Tidak ada angka latensi end-to-end terukur yang dipakai sebagai klaim di dokumen ini.

### 5. Komunikasi Player Bidirectional (`DisplayStream`)
- Menggunakan HTTP/2 stream persisten (gRPC bidirectional stream).
- **Siaran Darurat**: Perintah administratif dapat dikirim melalui kanal stream player; kecepatan penerimaan bergantung pada jaringan dan kondisi perangkat.
- **Screenshot Telemetry**: CMS dapat menampilkan screenshot yang dikirim player; ini bukan remote desktop atau kontrol sentuh interaktif.
- **Power Scheduling**: Manifest player memuat jadwal daya; kemampuan mematikan/menyalakan panel bergantung pada perangkat Android dan integrasi display.

### 6. Desain UI/UX Modern & Bebas Bloatware CSS
- Frontend menggunakan **Next.js 16.4.6** dan sistem desain **HDR+ Vanilla CSS** dengan dukungan tema gelap dan terang.
- UI tidak memakai TailwindCSS atau Bootstrap; klaim perbandingan kecepatan rendering tetap memerlukan benchmark.

### 7. Deployment Mandiri dan Model Biaya
- HNDSigma dapat di-deploy secara self-hosted; total biaya tidak dapat disimpulkan dari kode saja. Biaya deployment mencakup server, jaringan, pemeliharaan, dan perangkat player, sehingga perbandingan TCO perlu memakai skenario yang sama.

---

## 3. Kekurangan & Kesenjangan Dibanding Kompetitor

HNDSigma masih memiliki beberapa area yang belum tersedia atau perlu diverifikasi terhadap paket kompetitor:

### 1. Ketiadaan Ekosistem App Store / Integrasi Pihak Ketiga [BELUM]
- **Kondisi Kompetitor**: Vendor signage menawarkan integrasi dan widget yang berbeda-beda menurut produk dan paket; jumlah serta ketersediaannya perlu diverifikasi dari dokumentasi vendor terbaru.
- **Kondisi HNDSigma**: Sudah memiliki komponen konten seperti video, jam, cuaca, WebView, ticker, album, antrean, dan live stream. Player Android memutar live stream server-hosted melalui RTSP/TCP; player web mendukung WebRTC dan HLS. Katalog aplikasi pihak ketiga, RSS, Google Sheets, dan integrasi siap pakai sejenis masih menjadi kesenjangan.

### 2. Keterbatasan Ekosistem Platform Player (Baru Mendukung Android) [BELUM]
- **Kondisi Kompetitor**:
  - BrightSign menawarkan hardware appliance khusus signage.
  - Samsung MagicINFO berjalan langsung di SoC bawaan TV Samsung (Tizen OS) tanpa memerlukan kabel HDMI atau media player eksternal tambahan.
  - ScreenCloud mendukung Android, iOS/iPad, Windows, macOS, ChromeOS, dan Amazon Fire TV.
- **Kondisi HNDSigma**: APK player native menargetkan Android (minSdk 24 / Android 7.0); belum ada player native untuk Tizen OS, webOS, atau Windows. Kesesuaian perangkat tetap bergantung pada decoder, RAM, dan kemampuan hardware perangkat tersebut.

### 3. Belum Tersedia Remote Desktop / Web VNC Interaktif [BELUM — Baru Screenshot Telemetri]
- **Kondisi Kompetitor**: Dukungan remote control berbeda menurut vendor, player, dan paket.
- **Kondisi HNDSigma**: Baru mendukung *screenshot capture* satu arah. Fitur interaktif remote touch/VNC masih berstatus rencana dan belum diimplementasikan.

### 4. Distribusi dan Pembaruan APK Terpusat [SUDAH DIIMPLEMENTASIKAN]
- Dukungan update firmware/APK pada platform lain bervariasi menurut perangkat, vendor, dan paket.
- **Status HNDSigma (SUDAH IMPLEMENTASI)**:
  - **Database Migration**: `0049_create_system_apk_releases.up.sql` menyimpan metadata versi, hash SHA-256, ukuran file, URL unduhan APK, changelog, dan kebijakan *force update*.
  - **Backend gRPC (`AppUpdateService`)**: Menyediakan endpoint `GetLatestAppRelease`, `GetAppRelease` (agregasi sebaran layar ter-update vs belum), `ListAppReleases`, `CreateAppRelease`, `DeleteAppRelease`, `ToggleAppReleaseActive`, dan `CheckDeviceAppUpdate` dengan auto-sync versi perangkat di `hardware_devices`.
  - **Frontend CMS (`/system/apk`)**: Dashboard terpusat untuk unggah rilis APK (`/system/apk/create`), daftar versi, serta halaman rincian rilis (`/system/apk/[id]`) untuk memantau layar mana yang sudah update dan layar yang masih tertinggal.
  - **Android Player**: Mengunduh APK di latar belakang, memeriksa ukuran, package/version, dan SHA-256, lalu menyerahkan instalasi ke Android PackageInstaller. Instalasi tanpa interaksi pengguna bergantung pada hak Device Owner/kebijakan perangkat; bukan jaminan pada semua Android TV Box.

### 5. Analitik Audiens Cerdas Berbasis AI (AI Proof-of-Play & Computer Vision) [BELUM]
- **Kondisi Kompetitor Enterprise**: Sejumlah platform menawarkan analitik audiens atau integrasi sensor; cakupan fitur bergantung pada produk dan perangkat.
- **Kondisi HNDSigma**: Pelaporan baru berfokus pada telemetri teknis: log riwayat pemutaran (Proof of Play), status online/offline, utilisasi memori/storage, dan log error player.

### 6. Integrasi Point-of-Sale (POS) & ERP Langsung [BELUM]
- **Kondisi Kompetitor**: Integrasi POS/ERP tersedia pada sebagian ekosistem digital signage, dengan cakupan berbeda menurut vendor dan integrator.
- **Kondisi HNDSigma**: Manajemen harga menu board masih harus diubah manual melalui Layout Designer atau halaman Webview.

---

## 4. Matriks Perbandingan Fitur Head-to-Head

| Fitur / Parameter | HND Signage | Samsung MagicINFO | Yodeck | ScreenCloud | Xibo Signage |
|---|:---:|:---:|:---:|:---:|:---:|
| **Teknologi Backend** | **Rust + Tonic gRPC; Next.js 16 CMS** | Java + Tomcat | Platform proprietary/cloud | Platform proprietary/cloud | PHP + MySQL |
| **Throughput & Efisiensi Server** | ⚪ Belum ada benchmark komparatif | ⚪ Bergantung deployment | ⚪ Bergantung paket | ⚪ Bergantung paket | ⚪ Bergantung deployment |
| **Offline-First Playback** | 🟢 Manifest lokal + verifikasi SHA-256 untuk aset yang disimpan | Berdasarkan produk/paket | Berdasarkan produk/paket | Berdasarkan produk/paket | Berdasarkan produk/paket |
| **Profil Player Android Low-Spec** | 🟢 Buffer dan decoder disesuaikan otomatis; tetap perlu decoder hardware kompatibel | — | — | — | — |
| **Player TV Komersial Bawaan** | 🔴 Belum ada untuk Tizen/webOS (perlu perangkat Android) | 🟢 Tizen pada display yang didukung | — | — | — |
| **Integrasi Tombol Antrean IoT** | 🟢 **ESP32/Nano terintegrasi** | Bergantung produk/integrasi | Bergantung produk/integrasi | Bergantung produk/integrasi | Bergantung produk/integrasi |
| **Panggilan Suara TTS Ritel** | 🟢 TTS dan audio antrean tersedia | Bergantung produk | Bergantung produk | Bergantung produk | Bergantung produk |
| **Distribusi Update APK** | 🟡 Dashboard, unduh dan verifikasi tersedia; silent install bergantung Device Owner | Bergantung produk/perangkat | Bergantung produk/perangkat | Bergantung produk/perangkat | Bergantung produk/perangkat |
| **Siaran Darurat** | 🟢 Kanal player bidirectional; latensi belum diukur | Bergantung produk | Bergantung produk | Bergantung produk | Bergantung produk |
| **Katalog App/Widget Eksternal** | 🔴 Belum ada katalog; live stream sudah tersedia | Berdasarkan produk | Berdasarkan produk | Berdasarkan produk | Berdasarkan produk |
| **Remote Screen Mirroring / VNC** | 🔴 Belum Ada (Baru Screenshot) | Bergantung produk/paket | Bergantung produk/paket | Bergantung produk/paket | Bergantung produk/paket |
| **Lisensi & Biaya Berlangganan** | Self-hosted; total biaya bergantung deployment | Bergantung produk/paket | Subscription/paket | Subscription/paket | Opsi open-source dan komersial |
| **Kustomisasi Layout Multi-Zone** | 🟢 **Canvas Bebas + Rollback** | 🟢 Bebas | 🟢 Grid & Free | 🟢 Grid & Free | 🟢 Freeform Regions |

---

## 5. Ringkasan Strategis & Rekomendasi Pengembangan

HNDSigma memiliki diferensiasi yang relevan untuk **Ritel, Perbankan, Klinik, dan Pelayanan Publik**:
1. **Diferensiasi Utama**: Penggabungan **Media Promosi Multi-Zona**, **Sistem Panggilan Antrean Fisik IoT**, dan **player Android adaptif** dalam satu platform. Kecocokan di lapangan tetap perlu diuji pada model perangkat dan kondisi jaringan yang digunakan.
2. **Prioritas Pengembangan untuk Mengejar Kompetitor**:
   - [x] **Prioritas 1 (SUDAH DIIMPLEMENTASIKAN)**: Menyediakan distribusi APK melalui dashboard, pemeriksaan hash, dan pemantauan status versi perangkat. Instalasi otomatis tanpa interaksi tetap memerlukan hak Device Owner/kebijakan perangkat.
   - [x] **Live Streaming (SUDAH TERSEDIA)**: Live stream server-hosted untuk Android via RTSP/TCP dan untuk web via WebRTC/HLS.
   - [ ] **Prioritas 2 (SELANJUTNYA)**: Memperluas katalog komponen/integrasi pihak ketiga seperti RSS News Feed dan Google Sheets.
   - [ ] **Prioritas 3**: Eksplorasi player multi-platform (misal: Web Player berbasis PWA/Tauri untuk hardware PC atau display non-Android) dan Remote VNC interaktif.
