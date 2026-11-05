# Rencana Zero-Configuration IoT Queue Button

Dokumen ini merencanakan onboarding ESP32 queue button untuk server signage yang
masing-masing memiliki database dan backend sendiri. Bagian registry cloud
lintas-server masih berupa rencana; implementasi lokal yang sudah tersedia
dicatat pada bagian kondisi implementasi.

## Tujuan

- Pengguna cukup menghubungkan ESP32 ke Wi-Fi; tidak perlu memasukkan IP broker
  atau memilih server secara manual.
- Perangkat baru muncul sebagai menunggu persetujuan di dashboard server yang
  akan memilikinya.
- Satu perangkat hanya dapat dimiliki satu server pada satu waktu. Server lain
  tidak dapat mengambilnya sampai pemilik melepasnya (*unbind*).
- Setelah persetujuan awal, perangkat kembali otomatis ke server pemilik setelah
  restart dan dapat menerima pembaruan firmware lewat OTA.
- Tidak perlu membuka koneksi masuk ke jaringan tempat ESP32 dipasang.

## Batasan dan keputusan arsitektur

Server-server yang berdiri sendiri tidak dapat menjamin kepemilikan eksklusif
hanya dengan mDNS, Nginx Proxy Manager (NPM), atau database lokal. mDNS hanya
berlaku di LAN yang sama, sedangkan NPM hanya meneruskan koneksi; keduanya tidak
menjadi sumber kepemilikan bersama.

Karena itu, arsitektur yang direkomendasikan memakai **layanan cloud bersama
untuk enrollment dan registry kepemilikan**. Registry adalah sumber kebenaran
untuk status perangkat (`unclaimed`, `pending`, `owned`, `unbound`) dan melakukan
klaim secara atomik. Backend server signage tetap mengelola dashboard, mapping
pin, queue, dan aksi perangkatnya sendiri.

Bootstrap memakai nama domain tetap yang ditanam satu kali di firmware untuk
menghubungi layanan cloud—bukan IP atau alamat server pelanggan. Perangkat
belum dapat menemukan pemilik dari LAN sebelum ada klaim cloud.

### Makna “zero configuration”

Target akhir zero configuration berarti tidak ada konfigurasi IP/server dan
tidak ada kompilasi khusus per lokasi. **Tahap firmware awal yang sedang
dikerjakan belum mencapai target itu:** portal meminta hostname/IP dan port MQTT
secara manual. Pengguna tetap membutuhkan:

1. Firmware umum yang sudah dipasang sebelumnya (di pabrik atau saat
   provisioning awal).
2. Kredensial Wi-Fi yang disediakan satu kali melalui captive portal dari ponsel
   atau mekanisme provisioning setara.

Setelah itu, persetujuan di dashboard menetapkan pemilik. Pembaruan berikutnya
dapat dikirim OTA tanpa kabel data. ESP32 kosong tidak dapat menerima firmware
atau mengetahui password Wi-Fi tanpa proses provisioning fisik/awal.

### Perilaku captive portal

“Redirect otomatis” adalah perilaku captive portal jaringan, bukan pengalihan
paksa semua halaman web ponsel. ESP32 menjalankan access point, DNS lokal yang
mengarahkan nama host ke ESP32, endpoint pemeriksaan captive portal, serta HTTP
server untuk halaman konfigurasi. Sistem operasi ponsel biasanya mendeteksi
jaringan tanpa akses internet dan menawarkan halaman portal.

Redirect HTTPS arbitrer tidak dapat dilakukan dengan aman karena sertifikat TLS
tidak cocok untuk domain yang diminta. Karena itu:

- Portal konfigurasi harus dapat dibuka melalui HTTP lokal dan muncul melalui
  mekanisme captive-portal detection sistem operasi.
- Sediakan URL lokal fallback yang mudah dibaca jika pop-up tidak muncul.
- Portal setup saat ini sengaja **terbuka tanpa password**. Siapa pun dalam
  jangkauan dapat mengubah SSID atau endpoint broker; password Wi-Fi dikirim ke
  ESP32 melalui HTTP tanpa enkripsi. Gunakan hanya selama provisioning di lokasi
  terkontrol, dan tutup AP begitu Wi-Fi berhasil tersambung.
- Tahap ini meminta hostname/IP dan port broker MQTT. Setelah layanan bootstrap
  cloud tersedia, endpoint broker akan diberikan setelah accept sehingga tidak
  perlu dimasukkan pengguna.
- Beri status yang jelas saat kredensial ditolak, Wi-Fi tersambung, dan portal
  siap ditutup.
- Begitu kredensial tersimpan dan ESP32 berhasil tersambung ke Wi-Fi, access
  point setup dan captive portal langsung dimatikan.
- Untuk mengganti Wi-Fi, tahan tombol **BOOT lebih dari 15 detik**. Firmware
  menghapus konfigurasi Wi-Fi lokal lalu restart ke access point setup dan
  captive portal.
- Reset tombol BOOT hanya mengatur ulang Wi-Fi; identitas perangkat dan
  kepemilikan server tetap tersimpan. Untuk memindahkan perangkat ke server lain,
  admin harus melakukan **unbind dari dashboard** terlebih dahulu. Ini mencegah
  reset fisik mengakali lock kepemilikan cloud.
- Jika koneksi Wi-Fi hilang sementara, coba reconnect dahulu; jangan membuka
  access point setup atau menghapus kredensial hanya karena gangguan singkat.

## Alur pengguna dan perangkat

1. **Provisioning Wi-Fi**
   - Pada boot pertama atau setelah reset konfigurasi, ESP32 otomatis membuka
     access point setup dan menjalankan captive portal.
   - Pengguna menyambungkan ponsel ke Wi-Fi setup. Sistem operasi ponsel
     diharapkan menampilkan notifikasi/halaman login jaringan; halaman itu
     membuka form konfigurasi ESP32.
   - Portal menyediakan pemindaian jaringan, pilihan SSID, input password,
     tombol simpan, dan status koneksi. Jika ponsel tidak otomatis menampilkan
     portal, instruksi pada label/perangkat menyediakan alamat lokal fallback
     (misalnya `http://192.168.4.1`).
   - ESP32 menyimpan kredensial Wi-Fi dan mencoba koneksi. Jika gagal, perangkat
     kembali menawarkan setup; jangan menghapus konfigurasi valid secara diam-diam.
   - Pada tahap firmware awal, portal juga meminta hostname/IP dan port broker
     MQTT. Setelah koneksi Wi-Fi berhasil, ESP32 langsung mematikan access point
     setup dan mencoba endpoint tersebut.
   - Tahap discovery cloud berikutnya mengganti input endpoint manual dengan
     bootstrap domain umum dan menerima endpoint broker setelah admin melakukan
     accept.
   - Reset pairing melalui dashboard atau tahan BOOT lebih dari 15 detik meminta
     reset ke backend lokal. Backend menghapus record lokal dan mengirim ACK
     sebelum firmware menghapus konfigurasi dan membuka setup. Registry cloud,
     bila diterapkan, tetap menentukan pelepasan ownership lintas-server.

2. **Discovery cloud**
   - ESP32 membuat identitas perangkat unik dan menghubungi domain bootstrap
     melalui HTTPS/TLS.
   - Layanan cloud mendaftarkan perangkat sebagai `pending` dan memberi dashboard
     tenant daftar perangkat yang belum dimiliki.
   - Dashboard menampilkan perangkat baru, identitas singkat, dan waktu terakhir
     terlihat. Identitas unik tidak boleh bergantung pada MAC address saja.

3. **Accept dan klaim kepemilikan**
   - Admin menerima perangkat dari dashboard server signage yang dituju.
   - Dashboard memanggil backend servernya; backend meminta registry mengklaim
     perangkat untuk tenant/server tersebut.
   - Registry melakukan klaim atomik. Jika perangkat sudah dimiliki server lain,
     permintaan ditolak dan dashboard menampilkan pemilik/status yang sesuai
     tanpa membocorkan kredensial server lain.
   - Setelah klaim berhasil, registry mengembalikan konfigurasi koneksi dan
     kredensial khusus perangkat untuk broker pemilik.

4. **Operasi normal**
   - ESP32 menyimpan identitas pemilik dan kredensial broker di penyimpanan
     persisten, lalu tersambung keluar melalui MQTT/TLS.
   - Firmware mempertahankan topic/payload aksi dan ACK yang disepakati dengan
     backend; perubahan kontrak harus memperbarui keduanya dan dokumentasi.
   - Backend pemilik memvalidasi kepemilikan sebelum memproses aksi. Broker
     membatasi kredensial perangkat ke topic yang diizinkan.
   - Heartbeat/telemetri memperbarui status online dashboard.

5. **Restart, gangguan, dan perpindahan**
   - Setelah restart atau Wi-Fi putus, ESP32 mencoba kembali ke Wi-Fi dan server
     pemilik. Kegagalan koneksi tidak boleh memicu discovery/pemilihan pemilik
     baru.
   - Saat cloud tidak tersedia, perangkat mempertahankan klaim dan mencoba lagi
     dengan jeda bertahap; perangkat tidak boleh menerima pemilik kedua.
   - Untuk unbind, admin melakukan aksi eksplisit di dashboard. Backend dan
     registry mencabut kepemilikan/kredensial. Saat ESP32 kembali online, ia
     menghapus kredensial pemilik lama lalu kembali ke status discovery.
   - Sampai pencabutan terkonfirmasi, backend pemilik lama harus menolak aksi
     setelah status ownership/revocation diketahui; jangan menganggap perangkat
     offline berarti sudah dilepas.

6. **Pembaruan firmware OTA**
   - Firmware memeriksa rilis yang ditandatangani melalui HTTPS dan mengunduh
     pembaruan hanya dari sumber tepercaya.
   - Instalasi harus dapat dipulihkan bila unduhan/boot gagal (partisi OTA dan
     rollback yang sesuai dengan board).
   - OTA tidak boleh menghapus Wi-Fi atau kepemilikan yang masih valid.

## Komponen dan tanggung jawab

| Komponen | Tanggung jawab |
|---|---|
| ESP32 firmware | Captive portal, provisioning Wi-Fi, identitas perangkat, HTTPS bootstrap, MQTT/TLS, penyimpanan konfigurasi, reconnect, ACK, dan OTA |
| Layanan cloud enrollment/registry | Identitas perangkat, daftar pending, klaim atomik, status ownership, pencabutan/unbind, dan penerbitan konfigurasi/kredensial |
| Dashboard signage | Menampilkan perangkat pending dan meminta accept/unbind melalui backend |
| Backend signage | Otorisasi admin, integrasi registry, mapping pin/queue, validasi ownership, pemrosesan MQTT dan telemetri |
| MQTT broker | Pengiriman pesan TLS dan ACL per perangkat/tenant; broker dapat tetap berbeda per server |
| NPM / edge proxy | Meneruskan domain HTTPS enrollment/OTA dan, bila broker diekspos melalui NPM, TCP/TLS MQTT ke broker yang sesuai |

Registry dan enrollment sebaiknya menjadi layanan cloud terkelola yang tersedia
untuk semua server signage. Jika MQTT broker tetap terpisah per server, registry
mengembalikan endpoint broker milik server yang berhasil menerima klaim.

## Port dan jaringan

- **HTTPS/TLS 443:** ESP32 → layanan bootstrap, registry, serta metadata/manifest
  OTA. Gunakan reverse proxy HTTP(S) NPM ke layanan cloud.
- **MQTT/TLS 8883:** ESP32 → broker pemilik. Jika broker berada di belakang NPM,
  gunakan konfigurasi **TCP Stream** dengan TLS passthrough/terminasi yang
  dirancang untuk broker; jangan mengarahkan stream MQTT ke HTTP reverse proxy.
- ESP32 memulai koneksi keluar; tidak perlu port masuk ke LAN toko.
- **mDNS/UDP 5353 tidak diperlukan** untuk model cloud ini.
- Jangan mengekspos MQTT plaintext (umumnya 1883) ke internet. Pastikan DNS,
  sertifikat TLS, ACL broker, firewall, dan jalur reconnect diuji sebelum rollout.

## Persyaratan keamanan dan konsistensi

- Identitas MAC saja bukan bukti kepemilikan. Gunakan identitas/kredensial unik
  yang dapat divalidasi (misalnya kredensial provisioning perangkat); tetapkan
  mekanisme penerbitan dan rotasinya sebelum implementasi.
- Gunakan TLS dengan validasi sertifikat di ESP32; jangan menonaktifkan verifikasi
  sertifikat untuk mempermudah koneksi.
- Simpan Wi-Fi dan kredensial perangkat dengan mekanisme penyimpanan aman yang
  tersedia pada target ESP32; jangan menaruh rahasia lokasi di source firmware.
- Klaim harus atomik di registry agar dua dashboard yang menerima bersamaan
  tidak dapat memiliki perangkat yang sama.
- Unbind harus mencabut akses broker dan status ownership, bukan hanya menghapus
  binding queue lokal.
- Endpoint accept, list-pending, dan unbind membutuhkan autentikasi/otorisasi
  tenant serta audit log. Perangkat tidak boleh memperoleh kredensial tenant
  sebelum klaim disetujui.
- Kontrak lintas layanan mengikuti aturan proyek: perubahan RPC didefinisikan di
  `backend/proto/`, frontend stubs digenerate ulang, dan migrasi SQLx dibuat untuk
  perubahan schema lokal. Jangan menyalin proto ke Android.

## Tahapan implementasi

1. **Tetapkan kontrak dan operasi cloud**
   - Pilih domain bootstrap, penyedia/hosting registry, identitas perangkat,
     model tenant, retensi pending, serta prosedur rotasi/recovery.
   - Tetapkan perilaku saat registry/cloud tidak tersedia dan batas waktu
     pencabutan ownership.
2. **Bangun registry dan API enrollment**
   - Implementasikan register/status/claim/release/configuration dengan klaim
     atomik, autentikasi perangkat, otorisasi server, dan audit.
   - Tambahkan integrasi backend/dashboard untuk melihat pending, accept, dan
     unbind.
3. **Siapkan broker dan edge**
   - Konfigurasikan TLS, ACL per perangkat, penerbitan/pencabutan kredensial,
     domain, NPM, firewall, dan monitoring.
4. **Perbarui firmware**
   - Ganti alamat broker statis dengan bootstrap domain, tambahkan captive portal,
     state onboarding/pemilik, storage, reconnect, dan koneksi MQTT/TLS.
   - Pertahankan format aksi/ACK atau lakukan migrasi terkoordinasi dengan worker.
5. **Tambahkan OTA dan provisioning rilis**
   - Tetapkan signing key di luar source repo, kanal rilis, rollback, dan prosedur
     recovery perangkat.
6. **Pilot dan rollout**
   - Uji beberapa server independen, lalu rollout firmware secara bertahap.
     Sediakan prosedur migrasi untuk ESP32 yang sudah terpasang dan masih memakai
     konfigurasi broker statis.

## Kriteria penerimaan

- Firmware generik dapat dipasang massal; tidak ada IP broker atau Wi-Fi
  pelanggan yang dibundel di firmware.
- Pada boot pertama/reset, ESP32 membuka access point setup; ponsel dapat
  menampilkan captive portal otomatis, dan URL lokal fallback berfungsi bila
  deteksi otomatis tidak muncul.
- Pengguna dapat memilih SSID dan memasukkan Wi-Fi dari ponsel tanpa Arduino IDE.
- Tahap awal meminta endpoint broker MQTT; setelah registry cloud diterapkan,
  endpoint harus didapat otomatis setelah accept.
- Access point setup ditutup setelah Wi-Fi tersambung. BOOT >15 detik mencoba
  menghapus record melalui backend; jika ACK gagal/tidak datang dalam 30 detik,
  firmware tetap reset lokal dan record yang tertinggal bisa dihapus admin nanti.
- Penghapusan dashboard menunggu ACK backend; jika server/perangkat tidak
  merespons, record tidak dihapus dan konfigurasi lokal tidak berubah.
- Menahan BOOT kurang dari atau sama dengan 15 detik tidak mereset konfigurasi.
- Reset BOOT berusaha melepas record server lokal tetapi tidak bergantung pada
  keberhasilan server; registry global tetap diperlukan untuk klaim lintas-server.
- Perangkat pending terlihat pada dashboard dan baru tersambung ke broker pemilik
  setelah accept.
- Dua server yang menerima perangkat bersamaan menghasilkan tepat satu pemilik.
- Perangkat tetap pada pemiliknya setelah restart, kehilangan Wi-Fi, atau
  kegagalan sementara layanan cloud.
- Unbind melepaskan ownership dan mencabut kredensial lama; perangkat kembali
  discoverable setelah menerima status tersebut.
- Server/broker lama dan baru tidak dapat memproses pesan perangkat tanpa
  ownership yang valid.
- TLS, ACL, OTA signature/rollback, pemulihan provisioning, dan kompatibilitas
  perangkat lama telah diuji sebelum produksi.

## Hal yang masih perlu diputuskan

- Layanan registry akan menjadi bagian dari platform cloud mana dan siapa yang
  mengoperasikannya?
- Identitas unik perangkat akan diterbitkan bagaimana: provisioning pabrik,
  token sekali pakai, atau metode lain?
- Apakah broker dikelola terpusat atau tetap satu broker per server signage?
- Saat cloud tidak tersedia, apakah perangkat hanya mempertahankan koneksi/cache
  yang ada atau boleh menyimpan event tombol untuk dikirim ulang?
- Berapa lama perangkat pending berlaku, dan bagaimana admin memindahkan perangkat
  yang hilang/berganti pemilik?
- Apakah ambang tahan BOOT lebih dari 15 detik sesuai dengan board/enclosure dan
  mudah dilakukan installer tanpa reset tidak sengaja?
- Board/kapasitas flash target apa yang digunakan untuk partisi OTA dan rollback?

## Kondisi implementasi saat ini

- Firmware ESP32 memiliki captive portal setup terbuka untuk scan/pilih SSID,
  password Wi-Fi, endpoint/port broker, dan kredensial MQTT opsional. Access
  point ditutup setelah Wi-Fi tersambung. Reset BOOT >15 detik mencoba handshake
  MQTT selama 30 detik; setelah itu firmware tetap menghapus konfigurasi lokal
  dan membuka AP, meski server gagal menghapus record.
- Penghapusan dari dashboard tetap memerlukan ACK backend; jika perangkat/server
  tidak merespons, record dan konfigurasi lokal dipertahankan. Record sisa dari
  reset fisik offline dapat dihapus admin secara manual setelah server hidup.
- Reset pairing selalu aktif; kredensial MQTT opsional dan backend dapat
  tersambung ke broker anonymous.
- Firmware memakai koneksi MQTT TCP plaintext (`WiFiClient`); jangan mengekspos
  endpoint MQTT ini ke internet. TLS/validasi sertifikat belum diterapkan.
- Firmware mengirim aksi/telemetri dengan topik `dka/iot/<device_uid>/...`.
- MQTT worker backend terhubung ke broker berdasarkan konfigurasi environment
  dan memproses topic IoT tersebut.
- Persetujuan IoT saat ini memperbarui `is_approved` pada database backend lokal;
  belum ada registry global, klaim lintas-server, atau OTA.
- Reset dashboard dan BOOT telah terhubung ke handshake lokal. BOOT tetap menghapus konfigurasi
  lokal setelah 30 detik tanpa ACK; record server mungkin tertinggal untuk
  dihapus manual.
- Registry ownership cloud belum ada; reset hanya menghapus perangkat pada
  backend lokal yang terhubung ke broker.
- Captive portal memakai HTTP lokal dan access point terbuka tanpa autentikasi;
  provisioning harus dilakukan di lokasi terkontrol.
