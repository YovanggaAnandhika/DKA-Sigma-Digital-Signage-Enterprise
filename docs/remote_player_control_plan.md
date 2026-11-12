# Rencana Remote Control Player Android dari CMS

**Status:** Rencana, belum diimplementasikan  
**Tanggal:** 2026-11-12

## Tujuan

Menambahkan tab **Remote Control** pada detail layar CMS agar operator dapat:

- melihat status layar dan aktivitas player yang sedang berjalan;
- mengirim navigasi **Home** dan **Back** ke player Android;
- mengetahui apakah perintah diterima, gagal, atau belum mendapat respons.

Kontrol hanya berlaku untuk player Android yang dipilih, bukan broadcast ke seluruh perangkat.

## Kondisi Saat Ini

- Navigasi detail layar berada di `DisplayDetailNavigation.tsx`; tab saat ini adalah Ringkasan, Pemutaran, Monitor, dan Riwayat.
- Detail perangkat sudah memiliki `handleSendCommand`, yang mengirim perintah melalui RPC `PushCommand`.
- Player menerima perintah lewat bidirectional `DisplayStream`; Android mengirim `LiveDiagnostics` secara berkala.
- `LiveDiagnostics` belum menyertakan aktivitas atau state layar player.
- `PlayerActivity` mengelola state pemutaran dan tombol fisik. `PlayerKeyCoordinator` memiliki perilaku khusus untuk tombol Back, sehingga perintah web tidak boleh disimulasikan sebagai input tombol fisik tanpa aturan terpisah.
- `PLANNING.md` mencatat Remote Screen Control / Web VNC sebagai Fase 4, tetapi belum memiliki spesifikasi implementasi khusus.

## Batasan dan Semantik V1

V1 berfokus pada navigasi dalam aplikasi signage:

- **Home:** kembali ke tampilan utama signage di `PlayerActivity`; tidak keluar ke Android Launcher dan tidak menghentikan playback/offline sync.
- **Back:** menutup dialog atau overlay yang sedang terbuka. Jika tidak ada overlay, player tetap berada di tampilan utama.
- **Aktivitas saat ini:** menampilkan state UI player yang aman dan berguna, seperti `PLAYING`, `SYNCING_MANIFEST`, `DOWNLOADING_ASSETS`, `ERROR`, atau `NOT_PAIRED`, beserta waktu pembaruan terakhir. Jangan menginspeksi nama aktivitas aplikasi pihak ketiga.

Jika yang dimaksud adalah mengendalikan Android Launcher atau aplikasi lain, itu bukan bagian V1: perilaku tersebut memerlukan hak Device Owner/OEM atau izin sistem, dan harus dirancang serta diuji terpisah.

V1 **tidak** mencakup streaming layar kontinu, klik/touch arbitrer, keyboard jarak jauh, atau kendali aplikasi pihak ketiga. Itu tetap menjadi perluasan Web VNC terpisah.

## Rancangan Teknis

### Kontrak dan pengiriman perintah

1. Tambahkan enum `COMMAND_REMOTE_HOME` dan `COMMAND_REMOTE_BACK` pada `backend/proto/distribution/v1/stream/stream.common.proto`; jangan memakai `COMMAND_EMERGENCY_BROADCAST` untuk navigasi.
2. Teruskan tipe perintah secara eksplisit di backend `PushCommand` dan `DisplayStream`. Perintah yang tidak dikenal harus ditolak, bukan dialihkan ke perintah lain.
3. Android menangani perintah pada main thread melalui handler khusus di `PlayerActivity`. Handler menutup overlay/settings sesuai semantik V1 dan menjaga state playback serta manifest tetap utuh.
4. Gunakan `CommandAck` untuk melaporkan keberhasilan atau kegagalan eksekusi. Status `queued` dari RPC saja tidak berarti tindakan sudah dijalankan.
5. Tetap gunakan autentikasi/permission administratif yang berlaku untuk `PushCommand` (`can_manage_distribution`) dan validasi target perangkat di backend.

### Status aktivitas

1. Tambahkan field terstruktur untuk state layar player pada `LiveDiagnostics`, yang merupakan sumber status realtime yang sudah dikirim Android.
2. Isi field dari state UI yang benar-benar aktif di Android; jangan menebak state dari nama route atau dari data CMS.
3. Teruskan field tersebut lewat `WatchDeviceStatus` dan tampilkan waktu penerimaan di UI.
4. Gunakan stream status yang sudah ada, tanpa polling baru. Jika stream atau diagnostik basi, tampilkan **Tidak tersedia** dan nonaktifkan navigasi sampai player kembali online.

### Tab CMS

1. Tambahkan route detail `/hardware/displays/[id]/remote` dan tab **Remote Control** pada `DisplayDetailNavigation`.
2. Tampilkan status online, aktivitas player, waktu update, tombol Home dan Back, serta status perintah yang sedang diproses.
3. Nonaktifkan tombol jika player offline, status basi, atau perintah sebelumnya masih menunggu hasil. Tampilkan error dari penolakan/timeout secara eksplisit.
4. Pertahankan navigasi daftar layar dan tab detail lain. `DisplayListView` tidak perlu diubah; row tetap membuka halaman detail.

## Urutan Implementasi

1. **Kontrak protobuf:** tambahkan tipe perintah Home/Back dan state player di `backend/proto/`; Android tetap generate client langsung dari proto tersebut melalui Gradle.
2. **Backend:** petakan perintah baru, cek permission/target, dan teruskan acknowledgement tanpa fallback untuk enum yang tidak dikenal.
3. **Android:** implementasi semantik Home/Back, pembaruan state aktivitas, dan `CommandAck`.
4. **Frontend:** jalankan `bun scripts/generate_grpc.ts`, tambahkan route dan tab, kirim perintah, serta render state/error dari stream.
5. **Verifikasi:** jalankan `cargo check` dari `backend/`, `bun tsc --noEmit` dari `frontend/`, dan `./gradlew :app:check` dari `android/`; uji player online/offline dan state player berbeda.

Tidak diperlukan migrasi database untuk V1 karena state aktivitas hanya realtime dan tidak perlu disimpan.

## Kriteria Selesai

- Tab hanya menargetkan perangkat pada halaman detail yang sedang dibuka.
- Home kembali ke tampilan signage player tanpa membuka Android Launcher atau menghentikan playback.
- Back menutup overlay/dialog; jika tidak ada, tidak keluar dari player.
- State aktivitas berasal dari Android, berubah saat UI player berubah, dan terlihat basi/offline ketika stream terputus.
- Operator dapat membedakan perintah queued, acknowledged, gagal, dan timeout.
- Tombol tidak dapat digunakan saat player offline atau state tidak segar.
- Permission `can_manage_distribution` ditegakkan dan input perintah yang tidak dikenal ditolak.
- Playback offline-first dan transisi manifest tetap tidak terpengaruh.

## Keputusan Sebelum Implementasi

- Rencana ini mengartikan **Home** sebagai tampilan utama signage, bukan Android Launcher.
- Rencana ini mengartikan **aktivitas saat ini** sebagai state UI internal player, bukan aplikasi foreground pihak ketiga.
- Streaming layar dan kendali touch/mouse/keyboard arbitrer tetap di luar V1.
