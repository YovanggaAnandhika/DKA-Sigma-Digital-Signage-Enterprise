# PLANNING.md — HNDSigma Digital Signage Enterprise

## Current Status
- **Environment**: Docker Compose dev mode, Bun HMR, Rust gRPC backend
- **Rechecked**: 2026-11-07 — Graphify knowledge graph updated, all markdown documentation calibrated, frontend and backend checks passed
- **Graphify snapshot**: report updated 2026-11-07; 4,728 nodes, 11,128 edges, 467 communities. Structural evidence only, not a behavior or runtime audit.
- **Stack**: Rust/Tonic gRPC (`backend/`), Next.js 14 CMS (`frontend/`), Kotlin Media3 player (`android/`), ESP32/Arduino firmware (`iot/`)

## Health Matrix

| Area | Status | Notes |
|---|---|---|
| Backend gRPC | 🟢 Verified | `cargo check` clean (0 errors, 0 warnings); 49 migrations verified |
| Frontend CMS | 🟢 Actively Refined | `bun tsc --noEmit` clean (0 errors); Rundown tabs, APK OTA management & rollout stats, wide modals in place |
| Android Player | ⚪ Behavior unaudited | Player and offline-manifest code/docs in graph; runtime/retry behavior not checked; Gradle compiles directly from `backend/proto/` |
| DB Migrations | 🟢 Reconciled | Repository has 49 up/down pairs (0001–0049); `0049_create_system_apk_releases` added and verified |
| IoT/MQTT Worker | 🟡 Source checked | MQTT telemetry updates `last_seen_at`; UI derives online for 60s and refreshes list. Broker/device runtime not verified |
| Compose Orchestration | 🟡 Partial | External Postgres/MQTT containers and external `dka-internal` network; floating image tags and no healthchecks |

## Recently Completed (Source-Verified)

- **Sistem Pembaruan APK OTA & Fleet Rollout Tracking (`/system/apk`) [SUDAH SELESAI ✅]** — Manajemen versi APK dan distribusi OTA terpusat. Meliputi migrasi `0049_create_system_apk_releases`, gRPC service `AppUpdateService` (`backend/src/grpc/system/update/service.rs`), Next.js CMS (`/system/apk` list, `/system/apk/create` unggah berkas full-width, `/system/apk/[id]` rincian rilis & pelacakan sebaran pembaruan per layar player Android, tab filter status sebaran, pencarian nama layar/cabang/IP, dan tombol circular icon back).
- **Sidebar Modern Vibrant Gradient Icons [SUDAH SELESAI ✅]** — Pembaruan visual navigasi sidebar CMS dengan ikon modern ber-gradient dinamis dan transisi halus sesuai standar HDR+.
- **Multi-Tenancy Corporation & Branch Isolation [SUDAH SELESAI ✅]** — Pemisahan aset, layout, perangkat, dan data berdasarkan hirarki korporasi & cabang. Alur auto-discovery aman dengan validasi 6 digit pairing code atau MAC address sebelum perangkat diadopsi ke cabang tertentu.
- **Rundown Operasional Route Path-Based Tabs (`/studio/schedules`)** — Kalender Rundown (`/calendar`) dan Daftar Tabel Jadwal (`/table`) dipisah ke route tab independen dengan `next/dynamic` lazy loading. Root `/studio/schedules` redirect otomatis ke `/calendar`.
- **Single Card Schedule Assignment (`/studio/schedules/assign/[layoutId]`)** — Form disatukan ke dalam 1 kartu lebar penuh (`card-elevated`), dilengkapi switch toggle on/off modern, selector segmented (`Tetapkan Mulai & Selesai` vs `Tanpa Batas Akhir`), chip multi-select hari, dan tab target player (`Kelompok` & `Single`).
- **Tabel Rundown Kolom Ramping & Aksi Ikon** — Menggabungkan layout tayang & prioritas ke dalam kolom rundown, serta menggabungkan jam tayang & hari aktif menjadi 5 kolom esensial tanpa memicu horizontal scrollbar. Tombol aksi berbasis ikon (`Eye` dan `Trash2`).
- **Layout Designer Modals Overhaul** — Memperlebar `ComponentPickerModal`, `MediaPickerModal`, `PlaylistPickerModal`, dan `EmergencyBroadcastModal` hingga `1240px` (tinggi `82vh`) dengan tab ber-scroll horizontal halus dan fitur pencarian real-time.
- **Rundown Harian Terdedikasi (`/studio/schedules/day/[date]`)** — Halaman rincian jadwal harian dengan pencarian, hapus satu per satu, hapus terpilih, dan *Clear All Hari Ini*.
- **Kalibrasi Dokumentasi Migrasi** — Memperbaiki drift pada `backend/aicontext.md`, `docs/DDL.md`, dan `PLANNING.md` dari klaim 48 migrasi menjadi tepat 49 pasang migrasi fisik (`0001`–`0049`).
- **IoT Cloud MQTT Auto-Setup Spec (`iot/IOT_PLANNING.md`)** — Spesifikasi firmware tombol antrean ESP32 dengan koneksi langsung ke Cloud MQTT broker (outbound-only), mengeliminasi kompleksitas local/LAN discovery (mDNS) karena broker berbasis cloud.
- **Dashboard route loading** — all 69 dashboard `page.tsx` routes have a `loading.tsx` using shared responsive shimmer variants.
- **IoT heartbeat status** — approved-device list polls every 5 seconds and marks devices offline when telemetry is older than 60 seconds; telemetry detail uses the same threshold.
- **Media library UX** — detail panel is draggable and defaults to 30% of content width (bounded to 240–560px); successful upload returns to media list; preview video volume set to 50%.

## Resolved / Corrected Findings

- **APK Update System / Kiosk Silent Update (`docs/apk_update_system_plan.md`) [RESOLVED]** — Diimplementasikan penuh dengan database `0049_create_system_apk_releases`, gRPC service `AppUpdateService`, dan Next.js CMS (`/system/apk` & `/system/apk/[id]`).
- **Eliminasi Warning Rust Tanpa Dead-Code Hacks [RESOLVED]** — Menghilangkan 4 warning compiler di Rust tanpa menggunakan `#[allow(dead_code)]` dengan mengubah implementasi `From` menjadi inherent method `into_proto(self)` pada `ResolutionRow`, `ClockRow`, `TickerRow`, dan `WebviewRow`. `cargo check` di host dan Docker 100% bersih (0 error, 0 warning).
- **Crate-wide dead-code allowances eliminated** — `#![allow(dead_code, unused_imports, unused_variables)]` telah dihapus dari `backend/src/main.rs`. Sebanyak 69 warning compiler dibersihkan tuntas: unused imports dibuang, dead models/functions (`find_by_hardware_fingerprint`, `find_by_version_hash`, `ZoneWithPlaylistDto`, `DevicePairingEntity`, dll) dihapus, re-exports tak terpakai pada `mod.rs` dibersihkan. `cargo check` menghasilkan **0 error dan 0 warning**.
- **Schedule time validation silently falls back** — `parse_schedule_time_range` dan validasi di `ScheduleService` / `ScheduleRepository` telah diimplementasikan; input jam/tanggal malformed atau order terbalik (`end < start`) kini melempar `Status::invalid_argument` / `AppError::BadRequest`. Unit test lulus.
- **Transition and visual-filter service layer** — Diverifikasi bahwa `MyTransitionService` dan `MyVisualFilterService` menginjeksi repository secara langsung dengan permission check; tidak diperlukan lapisan abstraksi wrapper kosong (`services.rs`), sesuai prinsip Ponytail (zero unnecessary abstractions).
- **Endpoints outside protobuf contract reviewed (Legitimate HTTP Bridge)** — `frontend/src/app/(api)/api/assets/[filename]/route.ts` memanggil gRPC `StreamMediaFile` dan mem-bridge HTTP `206 Partial Content` (Range: bytes) khusus untuk tag `<video>` browser native. `api/tts/route.ts` adalah in-memory audio caching proxy untuk antrean browser. Android player 100% menggunakan pure gRPC (`GrpcMediaDownloader` port 50051 & `TtsServiceGrpcKt`). Bukan technical debt melainkan intentional browser bridge.
- **`--migrate:revert` empty/single-migration panic** — `backend/src/db.rs` now returns when no migrations are applied and uses target `0` for a single migration.
- **`.DS_Store` tracking claim** — `backend/src/grpc/studio/.DS_Store` is not tracked by Git in the current checkout; removed from open findings.

## Open Findings (priority top to bottom)

### P0 — Feature-killing

1. **`compose.yml` is not self-contained** — It depends on external Postgres/MQTT containers and an external `dka-internal` network. Images use floating `latest` tags and services have no healthchecks. Verify the README port discrepancy before changing ports.

### P1 — Roadmap Fitur Kompetitor Enterprise (Rencana Pengembangan Lanjutan)

2. **[BELUM] Modul Advanced Live Streaming (Fase 2)** — Modul terdedikasi untuk live streaming: dukungan server signage sebagai origin host HLS / relay stream, serta opsi embed URL streaming eksternal (CCTV RTSP/HLS atau YouTube/HLS publik).
3. **[BELUM] Komponen RSS News & Ticker Dinamis (Fase 3)** — Parser RSS feed berita nasional & bisnis dengan auto-refresh interval dan opsi integrasi Google Sheets.
4. **[BELUM] Remote Screen Control / Web VNC Interaktif (Fase 4)** — Peningkatan dari screenshot capture pasif menjadi remote interaction web.

### P2 — Architectural & Housekeeping

5. **Route naming inconsistency** — Reconcile backend `grpc/components/*` with frontend `api/grpc/studio/*`, and `layer_block` / `layer_override` with proto `layer/block` / `layer/item_override`.

## Graphify Cross-Check

- The graph has **no detected import cycles**, but reports **226 isolated symbol nodes** and **302 thin communities**. Treat these as candidate missing links/docs, not confirmed code defects.
- The highest-degree shared nodes are `getGrpcHost()`, `getGrpcCredentials()`, `getTokenFromRequest()`, and `getGrpcMetadata()`; `AppError` is also highly connected. Add focused checks for shared gRPC credential/metadata behavior and error-to-status mapping because regressions there can affect many features.
- Graph communities show Android/offline-manifest documentation and player code, plus frontend permission and display-group routes. This confirms those areas exist, not that every RPC has a route or that the offline flow works end-to-end.
- The report is dated 2026-10-20; rebuild/update it before relying on it for changes made after that snapshot.

## Audit Checklist (not yet verified)

- [ ] Verify Android Gradle continues consuming `backend/proto/` directly and generates clients for new contracts; do not restore an Android proto copy.
- [ ] Check `require_permission` coverage in every `backend/src/grpc/*/service.rs`.
- [ ] Verify whether `(api)/api/grpc/**` rejects requests without a session; inspect `frontend/src/middleware.ts`.
- [ ] Test direct dashboard access without a session; inspect `AuthGuard`.
- [ ] Android `DownloadAndVerifyMediaUseCase`: retry, hash mismatch, disk-full; also verify manifest activation.
- [ ] Test `DisplayStream` reconnect/backoff after backend restart.
- [ ] Compare protobuf RPCs against frontend route handlers. `ListPermissions` and `CreateDisplayGroup` routes exist; completeness for `iam/role_group` and `distribution/*` remains unverified.
- [ ] Verify `iot/*` firmware topics against `dka/iot/+/action` and `dka/iot/+/telemetry`.
- [ ] Test `--migrate:fresh --seed` and `--migrate:revert`, including empty, one-migration, and multiple-migration cases.
- [ ] Verify HTTP Range support on media routes with `Range: bytes=0-1023`.
- [ ] Review graph-isolated symbols and low-cohesion communities for important undocumented or missing relationships; prioritize by user-facing impact.

## Work Order

1. [x] Recheck plan against graph and source; update this document.
2. [x] Implement Rundown Operasional calendar under Ringkasan, with dedicated schedule assignment, player/group tags, custom date/time range, weekly recurrence blocks, and existing-migration reuse.
3. [x] Implement Sistem Pembaruan APK OTA & Fleet Rollout Tracking (`/system/apk`, backend gRPC `AppUpdateService`, database migration `0049_create_system_apk_releases`, dan Android PackageInstaller contract).
4. [ ] Implementasi Fase 2: Modul Advanced Live Streaming (Origin Host HLS & Relay stream, serta opsi embed CCTV RTSP/HLS eksternal).
5. [ ] Implementasi Fase 3: Komponen RSS News Feed & Running Ticker Berita Terverifikasi.
6. [ ] Verify Rundown Operasional assignment and recurrence against a running database and browser; confirm multiple target precedence.
7. [ ] Add regression tests and run `cargo check` for migration revert edge cases (guard is already present).
8. [ ] Reject invalid schedule times; run targeted backend checks.
9. [ ] Add service-layer handling for transition and visual-filter modules; validate permission and transaction boundaries.
10. [ ] Verify media Range behavior and Android offline playback.
11. [ ] Make Compose startup reproducible with explicit dependencies, healthchecks, and pinned image tags.
12. [ ] Reconcile migration documentation and route/protobuf coverage.
13. [ ] Complete the remaining security, Android, and firmware audit checklist.
