# PLANNING.md — HNDSigma Digital Signage Enterprise

## Current Status
- **Environment**: Docker Compose dev mode, Bun HMR, Rust gRPC backend
- **Rechecked**: 2026-11-07 — Graphify knowledge graph updated, all markdown documentation calibrated, frontend and backend checks passed
- **Graphify snapshot**: report updated 2026-11-07; 4,728 nodes, 11,128 edges, 467 communities. Structural evidence only, not a behavior or runtime audit.
- **Stack**: Rust/Tonic gRPC (`backend/`), Next.js 14 CMS (`frontend/`), Kotlin Media3 player (`android/`), ESP32/Arduino firmware (`iot/`)

## Health Matrix

| Area | Status | Notes |
|---|---|---|
| Backend gRPC | 🟢 Verified | `cargo check` clean (0 errors, 0 warnings); 45 migrations verified |
| Frontend CMS | 🟢 Actively Refined | `bun tsc --noEmit` clean (0 errors); Rundown tabs, unified assign card, and wide modals in place |
| Android Player | ⚪ Behavior unaudited | Player and offline-manifest code/docs in graph; runtime/retry behavior not checked |
| DB Migrations | 🟢 Reconciled | Repository has 45 up/down pairs (0001–0045); `docs/DDL.md` and `backend/aicontext.md` reconciled |
| IoT/MQTT Worker | 🟡 Source checked | MQTT telemetry updates `last_seen_at`; UI derives online for 60s and refreshes list. Broker/device runtime not verified |
| Compose Orchestration | 🟡 Partial | External Postgres/MQTT containers and external `dka-internal` network; floating image tags and no healthchecks |

## Recently Completed (Source-Verified)

- **Rundown Operasional Route Path-Based Tabs (`/studio/schedules`)** — Kalender Rundown (`/calendar`) dan Daftar Tabel Jadwal (`/table`) dipisah ke route tab independen dengan `next/dynamic` lazy loading. Root `/studio/schedules` redirect otomatis ke `/calendar`.
- **Single Card Schedule Assignment (`/studio/schedules/assign/[layoutId]`)** — Form disatukan ke dalam 1 kartu lebar penuh (`card-elevated`), dilengkapi switch toggle on/off modern, selector segmented (`Tetapkan Mulai & Selesai` vs `Tanpa Batas Akhir`), chip multi-select hari, dan tab target player (`Kelompok` & `Single`).
- **Tabel Rundown Kolom Ramping & Aksi Ikon** — Menggabungkan layout tayang & prioritas ke dalam kolom rundown, serta menggabungkan jam tayang & hari aktif menjadi 5 kolom esensial tanpa memicu horizontal scrollbar. Tombol aksi berbasis ikon (`Eye` dan `Trash2`).
- **Layout Designer Modals Overhaul** — Memperlebar `ComponentPickerModal`, `MediaPickerModal`, `PlaylistPickerModal`, dan `EmergencyBroadcastModal` hingga `1240px` (tinggi `82vh`) dengan tab ber-scroll horizontal halus dan fitur pencarian real-time.
- **Rundown Harian Terdedikasi (`/studio/schedules/day/[date]`)** — Halaman rincian jadwal harian dengan pencarian, hapus satu per satu, hapus terpilih, dan *Clear All Hari Ini*.
- **Kalibrasi Dokumentasi Migrasi** — Memperbaiki drift pada `backend/aicontext.md`, `docs/DDL.md`, dan `PLANNING.md` dari klaim 48 migrasi menjadi tepat 45 pasang migrasi fisik (`0001`–`0045`).
- **IoT Cloud MQTT Auto-Setup Spec (`iot/IOT_PLANNING.md`)** — Spesifikasi firmware tombol antrean ESP32 dengan koneksi langsung ke Cloud MQTT broker (outbound-only), mengeliminasi kompleksitas local/LAN discovery (mDNS) karena broker berbasis cloud.
- **Dashboard route loading** — all 69 dashboard `page.tsx` routes have a `loading.tsx` using shared responsive shimmer variants.
- **IoT heartbeat status** — approved-device list polls every 5 seconds and marks devices offline when telemetry is older than 60 seconds; telemetry detail uses the same threshold.
- **Media library UX** — detail panel is draggable and defaults to 30% of content width (bounded to 240–560px); successful upload returns to media list; preview video volume set to 50%.

## Resolved / Corrected Findings

- **Schedule time validation silently falls back** — `parse_schedule_time_range` dan validasi di `ScheduleService` / `ScheduleRepository` telah diimplementasikan; input jam/tanggal malformed atau order terbalik (`end < start`) kini melempar `Status::invalid_argument` / `AppError::BadRequest`. Unit test lulus.
- **Transition and visual-filter service layer** — Diverifikasi bahwa `MyTransitionService` dan `MyVisualFilterService` menginjeksi repository secara langsung dengan permission check; tidak diperlukan lapisan abstraksi wrapper kosong (`services.rs`), sesuai prinsip Ponytail (zero unnecessary abstractions).
- **Endpoints outside protobuf contract reviewed** — `frontend/src/app/(api)/api/assets/[filename]/route.ts` memanggil gRPC `StreamMediaFile` dan mem-bridge HTTP `206 Partial Content` (Range: bytes) agar tag `<video>` browser dapat melakukan seek/buffer. `api/tts/route.ts` adalah in-memory audio caching proxy untuk sintesis suara antrean web.
- **Migration documentation drift** — `backend/aicontext.md` and `docs/DDL.md` claimed migrations through `0048`; reconciled to the actual 45 pairs (`0001_create_permissions` to `0045_add_iot_device_telemetry`).
- **`--migrate:revert` empty/single-migration panic** — `backend/src/db.rs` now returns when no migrations are applied and uses target `0` for a single migration.
- **`.DS_Store` tracking claim** — `backend/src/grpc/studio/.DS_Store` is not tracked by Git in the current checkout; removed from open findings.

## Open Findings (priority top to bottom)

### P0 — Feature-killing

1. **`compose.yml` is not self-contained** — It depends on external Postgres/MQTT containers and an external `dka-internal` network. Images use floating `latest` tags and services have no healthchecks. Verify the README port discrepancy before changing ports.

### P1 — Data integrity / contract

2. **Crate-wide dead-code allowances** — `backend/src/main.rs` still allows `dead_code`, `unused_imports`, and `unused_variables`, which can hide regressions.

### P2 — Planned Features (Architectural Specs Ready, Implementation Pending)

3. **APK Update System / Kiosk Silent Update (`docs/apk_update_system_plan.md`)** — Rencana instalasi APK OTA latar belakang (PackageInstaller silent mode) dan dashboard release management belum diimplementasikan di backend dan Android.

4. **Route naming inconsistency** — Reconcile backend `grpc/components/*` with frontend `api/grpc/studio/*`, and `layer_block` / `layer_override` with proto `layer/block` / `layer/item_override`.

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
3. [ ] Verify Rundown Operasional assignment and recurrence against a running database and browser; confirm multiple target precedence.
4. [ ] Add regression tests and run `cargo check` for migration revert edge cases (guard is already present).
5. [ ] Reject invalid schedule times; run targeted backend checks.
6. [ ] Add service-layer handling for transition and visual-filter modules; validate permission and transaction boundaries.
7. [ ] Verify media Range behavior and Android offline playback.
8. [ ] Make Compose startup reproducible with explicit dependencies, healthchecks, and pinned image tags.
9. [ ] Reconcile migration documentation and route/protobuf coverage.
10. [ ] Complete the remaining security, Android, and firmware audit checklist.
