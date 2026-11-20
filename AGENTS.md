# AGENTS.md — HNDSigma Digital Signage Enterprise

## Core Agent Philosophy: Ponytail (Lazy Senior Dev Mode)

You are a lazy senior developer. The best code is the code never written. You solve the whole problem with the least new code. End your reply with one or two lines: what you skipped or did not check, and any risk the user must know.

### Smallest Complete Solution Rules
1. **Does it need to exist?** Skip features, options, and flexibility nobody asked for.
2. **Already in this codebase?** Use existing helpers, services, and patterns. Never reinvent what is already in `src/`.
3. **Standard library or existing platform feature?** Use it. A house component or standard API beats adding a dependency.
4. **Zero unnecessary abstractions:** No wrappers, extra layers, premature type conversions, or "for later" configs. Keep data in platform-native representations.
5. **Shortest working diff wins:** Deletion beats addition. Keep changes minimal and surgically targeted.
6. **Caller verification:** Before modifying any shared function, gRPC endpoint, or component, grep all callers and fix the root cause once.
7. **Documenting limits:** Any shortcut with a known limit must be tagged with `shortcut: <the limit>, <when to upgrade>`.
8. **Never cut:** Validation at trust boundaries, security checks, error handling preventing data loss, accessibility, or explicit user requests.

---

## Monorepo Architecture Overview

This project is an enterprise-grade digital signage management and streaming platform:

| Path | Responsibility |
|---|---|
| `backend/src/grpc/<domain>/` | Tonic transport handlers; convert protobuf requests/responses and enforce auth/permission checks. |
| `backend/src/modules/<domain>/<feature>/` | Rust domain models, repositories, and services. |
| `backend/src/common/`, `backend/src/grpc/middleware/` | Shared errors, status mapping, and authentication middleware. |
| `backend/proto/<domain>/v1/` | Source of truth for RPC and message contracts. |
| `backend/migrations/`, `backend/src/seeders/` | Reversible SQLx schema changes and seed data. |
| `frontend/src/app/(auth)/` | Public authentication pages. |
| `frontend/src/app/(dashboard)/` | Authenticated CMS pages and studio editors. |
| `frontend/src/app/(api)/api/grpc/<domain>/<RPC>/` | Next.js gRPC bridge route handlers. |
| `frontend/src/lib/core/`, `frontend/src/lib/services/` | Shared gRPC/API helpers and browser-facing service clients. |
| `frontend/src/lib/api/` | Generated protobuf/gRPC client stubs; do not hand-edit. |
| `android/app/src/main/java/com/dkaapis/sigma/{presentation,domain,data,service,renderers}/` | Player UI/rendering, use cases/contracts, repositories/storage/networking, Android services, and zone renderers. |
| `backend/proto/` | Sole source of protobuf contracts; Android Gradle reads these files directly. |
| `iot/esp32_queue_button/` | ESP32 Wi-Fi/MQTT queue-button firmware and flashing/wiring guide. |
| `iot/arduino_nano_queue_button/` | Arduino Nano USB-serial queue-button firmware and guide. |
| `docs/` | DDL, player integration, and operational/planning documents. |
| `compose.yml` | Development container orchestration for frontend (`dka-product-sigma-frontend`) and backend (`dka-product-sigma-backend`, including native UDP WebRTC SFU on port `8189/udp`). |
| `backend/src/media/` | Pure-Rust WebRTC WHIP/WHEP SFU (`str0m`) + RTSP Pull (`retina`) engine & HTTP signaling (`:50052`) directly inside `dka-product-sigma-backend`. |
| `backend/src/workers/live_stream_relay.rs` | Live stream relay supervisor managing `RTSP` pull workers and `MediaHub` publisher lifecycle. |
| `frontend/src/app/streams/[streamId]/[file]/route.ts` | Next.js streaming bridge forwarding WHIP/WHEP SDP signaling (`/streams/<id>/whip|whep`) directly to `BACKEND_MEDIA_URL`. |
| `frontend/src/components/ui/HlsPlayer.tsx` | Unified CMS player supporting sub-second WebRTC UDP (`RTCPeerConnection`), YouTube Live IFrame, external Web Embed, and adaptive HLS (`hls.js`). |
| `graphify-out/` | Generated knowledge graph and reports; derived analysis, not a source of truth. |

### Instruction File Hierarchy

- This root `AGENTS.md` applies across the repository.
- `backend/AGENTS.md` and `frontend/AGENTS.md` add narrower rules for their respective trees; follow both root and nearest subtree guidance.
- `android/AGENTS.md` and `iot/AGENTS.md` define platform-specific patterns. Add a closer `AGENTS.md` only when a nested area needs genuinely different rules.
- When instructions conflict, follow the most specific applicable file, while preserving root security, data-integrity, and API-contract requirements.

---

## Non-Negotiable Project Rules

### 1. Protobuf Contract Rule (Single Source of Truth)
- Define backend gRPC contracts and cross-platform API messages in `backend/proto/`.
- Do not add a new custom HTTP contract that duplicates a protobuf RPC. Existing non-gRPC routes are exceptions to review and document, not a pattern to extend silently.
- Workflow for API changes:
  1. Modify or add `.proto` files in `backend/proto/`.
  2. Verify backend compiles (`build.rs` generates tonic code).
  3. Re-generate frontend stubs via `bun scripts/generate_grpc.ts` inside `frontend/`.
  4. Android compiles directly from `backend/proto/`; regenerate generated clients through the Android protobuf Gradle tasks. Never copy proto files into Android or hand-edit generated code.

### 2. Frontend-Backend Communication Rule
- Frontend connects to Backend gRPC via Next.js Route Handlers (`src/app/(api)/api/grpc/.../route.ts`).
- Core communication helpers (Graphify God Nodes) in `frontend/src/lib/core/grpcClient.ts`:
  - `getGrpcHost()`
  - `getGrpcCredentials()`
  - `getGrpcMetadata(token)`
  - `getTokenFromRequest(req)`
- Never bypass the gRPC layer with direct database connections from the frontend.

### 3. Styling & UI Consistency Rule (Vanilla CSS HDR+)
- **NO TailwindCSS or third-party CSS utility frameworks.**
- All UI styling uses Vanilla CSS powered by the HDR design system in `frontend/src/app/globals.css`.
- Always reuse design tokens:
  - Surfaces: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`
  - Borders: `var(--border-subtle)`, `var(--border-strong)`, `var(--border-focus)`
  - Typography: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
  - Shadows & Accents: `var(--card-shadow)`, `var(--card-shadow-hover)`, `var(--primary-500)`, `var(--accent-emerald)`, etc.
- For back navigation from nested pages, use a **circular icon-only back button** (circular icon button pattern) rather than a text button; keep it visually aligned with the page's main icon and provide an `aria-label` and `title` describing its destination.
- When a child page provides its own tabs or section navigation, hide the parent page's primary tab/navigation layout to avoid duplicate navigation; retain a clear back control to the parent section.
- Support both themes: CSS base tokens are dark (`:root`), `[data-theme="light"]` overrides them. The app currently boots in light mode (`RootLayout` + `ThemeProvider`) and persists the choice in `localStorage` (`dkasigma_theme`).

### 4. Database & Migration Rule
- All schema alterations require an explicit SQLx migration pair in `backend/migrations/` (`XXXX_name.up.sql` and `XXXX_name.down.sql`).
- Each migration pair must alter exactly one table; keep that table's change and rollback in the matching `.up.sql` and `.down.sql` files.
- During development, edit an existing migration pair directly when it is still uncommitted and unapplied; do not add a follow-up migration just to revise it. Do not run `migrate:fresh` or seed commands unless asked—the user will run `migrate:fresh --seed` manually.
- Once a migration has been applied or shared, preserve it and create a new forward migration instead.
- Never run manual DDL in production containers without migration tracking.

### 5. Player Streaming & Offline-First Invariants
- Android players operate offline-first: media must be downloaded and verified against `sha256_hash` before manifest playback transitions.
- Real-time player commands and telemetry rely on the bidirectional HTTP/2 gRPC stream (`DisplayStream`).
- Preserve atomic manifest/playback transitions: do not activate a new manifest until its required assets have passed integrity checks.

### 6. Secrets and Configuration
- Never commit real passwords, tokens, signing keys, Wi-Fi credentials, or broker credentials.
- Read deployment-specific values from configuration/environment or device provisioning; use clearly fake placeholders in examples and docs.

### 7. Larangan Eksekusi Build Frontend (`bun run build`)
- **DILARANG KERAS menjalankan `bun run build` atau `next build`.**
- Lingkungan kerja sudah berjalan fleksibel menggunakan Docker Compose (`compose.yml`) dalam mode dev dengan live HMR (Hot Module Replacement) / auto-reload.
- Cukup ubah berkas kode langsung, Next.js dev server di container akan me-reload otomatis tanpa perlu kompilasi produksi manual.

### 8. Required Verification Commands
- Backend: never run `cargo run` or `cargo build`; verify Rust changes with `cargo check` from `backend/` and require zero errors and zero warnings.
- Frontend: use Bun only for all frontend package, script, type-check, and test commands; never use npm, pnpm, yarn, or direct Node commands. Verify TypeScript changes with `bun tsc --noEmit` from `frontend/`. Never run `bun run build` or `next build`.
- Android: verification is limited to `./gradlew :app:check` from `android/`. **DILARANG KERAS menjalankan `./gradlew assemble` atau `assembleDebug` atau task build APK**. Pengguna yang akan melakukan perakitan APK secara manual.
- **Larangan Clear / Hapus Direktori Sembarangan**: Jangan pernah membersihkan cache Gradle atau menghapus direktori proyek tanpa instruksi eksplisit dari pengguna.
- **Larangan Bypass Durasi Layer di `LayerZone.kt`**: Logika durasi blok di timeline layout dikelola di Web CMS. Jangan pernah mem-bypass durasi layer di Android player; `hasActiveBlockAt` wajib mematuhi interval waktu linimasa asli.

---

## Live Stream & Ultra-Low Latency Pure-Rust UDP SFU Architecture

### 1. Container & Network Topology (Direct UDP on Backend, Zero MediaMTX, Zero Nginx Media Proxy)
- **No MediaMTX Container**: `dka-product-sigma-streamer` is removed. Media fan-out runs directly inside `dka-product-sigma-backend` using Pure-Rust `str0m` (`rust-crypto`) + `retina` (zero C FFI, zero FFmpeg transcoding).
- **Direct Host Ports on `dka-product-sigma-backend`**:
  - `8189/udp` exposed directly on `dka-product-sigma-backend` in both `compose.yml` and `compose.production.yml` for all WHIP (OBS ingest) and WHEP (Android/Browser playback) WebRTC media over ICE-Lite + DTLS-SRTP.
  - `50051/tcp` (Tonic gRPC) exposed directly on `dka-product-sigma-backend` in `compose.production.yml`.
  - Nginx (`nginx-proxy-manager` / `dka-development-nginx`) serves Web CMS HTTP/HTTPS (`80/443/81`) and MQTT (`1883/18083/8083`) ONLY — **no streaming port forwarding through Nginx**.
- **Public ICE Candidate Configuration (`MEDIA_PUBLIC_IP` & `MEDIA_UDP_PORT`)**:
  - `MEDIA_PUBLIC_IP` on `dka-product-sigma-backend` MUST be set to the host LAN IP in development (e.g. `10.20.30.97`) or the server's public IP/hostname in production (`signage.hndtech.id`) so `str0m` emits a reachable UDP host candidate on `MEDIA_UDP_PORT` (`8189`).
- **Internal Frontend-Backend Signaling URL**:
  - `dka-product-sigma-frontend` forwards WHIP/WHEP HTTP signaling to `BACKEND_MEDIA_URL` (`http://dka-product-sigma-backend:50052`).

### 2. Zero-Transcode Multi-Source Support (0 DB Migration)
- **OBS Studio (`WHIP`)**: OBS 30+ connects via standard WHIP (`POST /streams/<id>/whip`) with `Authorization: Bearer <token>` validated against PostgreSQL (`requires_auth`, `ingest_password`, `is_relay_active`) and encrypted via DTLS-SRTP over `8189/udp`. OBS encoder must output H.264 with `720p 30fps`, `Keyframe = 1s`, `B-frames = 0`.
- **CCTV (`RTSP`)**: Supports Server UDP Relay (1 `retina` TCP pull connection per camera fanned out via `str0m` WHEP UDP to all screens; AAC audio is skipped in WebRTC SFU mode — `shortcut: use Direct LAN RTSP mode if CCTV AAC audio is required`) OR Direct LAN (`EXTERNAL_EMBED` played directly by ExoPlayer).
- **External Sources (`YOUTUBE`, `HLS`, `EMBED`)**: Stored as `EXTERNAL_EMBED` and played directly on clients (`YouTube IFrame Player API` supporting `watch?v=`, `/live/`, `youtu.be/`, `/embed/`, and `/channel/UC.../live`; ExoPlayer/`hls.js` for `.m3u8`; `WebView`/`iframe` for generic embeds).

### 3. Real-Time Frontend & Android Playback
- **Frontend (`HlsPlayer.tsx` & `/streams/[streamId]/[file]/route.ts`)**: Proxies `POST/PATCH/DELETE` WHIP/WHEP directly to `BACKEND_MEDIA_URL`, handles YouTube/Embed iframes, and preserves `hls.js`/Safari adaptive playback for external `.m3u8`.
- **Android (`LiveStreamZoneRenderer.kt`)**:
  - Server SFU streams (`WHIP`, `RTSP` Server Relay) negotiate SDP over gRPC (`LiveStreamService.NegotiateWhep` / `CloseWhepSession`) and render via `SharedWebRtcRuntime` (`EglBase` singleton + hardware `DefaultVideoDecoderFactory` + `SurfaceViewRenderer.setZOrderMediaOverlay(true)`) over `8189/udp`.
  - `YOUTUBE` and `EMBED` render via managed `WebView` (`loadDataWithBaseURL("https://www.youtube.com", ...)` + `SigmaYtBridge` JS audio/error hook).
  - External `HLS` and Direct LAN `RTSP` render via Media3 `ExoPlayer`.

### 4. Container Performance & Lifecycle Invariants
- **Singleton gRPC Channel Multiplexing**: High-frequency Next.js route handlers must use `getGrpcClient(ServiceClient)` from `frontend/src/lib/core/grpcClient.ts` and parse JSON bodies safely with `await req.json().catch(() => ({}))`.
- **Lightweight Healthcheck (`/up`)**: Container healthchecks in `dka-product-sigma-frontend` must hit `GET /up` (`frontend/src/app/up/route.ts`) rather than SSR pages.
- **Graceful Shutdown**: `backend/src/main.rs` uses `serve_with_shutdown` listening for `SIGTERM`/`SIGINT` to invoke `relay_manager.stop_all()`, terminating active `rtsp_pull` workers and the `MediaHub` SFU cleanly.

---

## Ultra-Smooth Multi-Zone Player & Adaptive Architecture (1 GB RAM to High-End)

### 1. Dynamic Hardware Adaptation Matrix (`DeviceCapabilityHelper.kt`)
- **Low-Spec Profile (`RAM <= 1.5 GB` / `isLowRamDevice`)**:
  - **ExoPlayer LoadControl Buffer**: `minBuffer: 2.5s`, `maxBuffer: 5s`, `bufferForPlayback: 400ms`, `targetBufferBytes: 10 MB` strict memory cap (prevents Dalvik/ART GC pauses and 128MB heap exhaustion).
  - **Extension Renderers**: Set `EXTENSION_RENDERER_MODE_OFF` to completely bypass heavy CPU-based software decoders (FFmpeg/VP9/AV1) and force native hardware `MediaCodec`.
  - **Image Loading**: Coil image loader configured with `allowRgb565(true)` to halve bitmap heap memory usage.
- **High-End Profile (`RAM > 1.5 GB`)**:
  - Buffer: `minBuffer: 8s`, `maxBuffer: 20s`, `targetBufferBytes: 32 MB`, full ARGB_8888 rendering.

### 2. Dual SurfaceView Zero-Copy & Z-Order Management
- **Hardware Overlay Planes**: All video rendering uses `SurfaceView` (`app:surface_type="surface_view"`), bypassing OpenGL texture composition (`TextureView`) to save 20–35 MB VRAM per zone and achieve 0% CPU memory copy.
- **Multi-Zone Overlay Anti-Flicker**: Inset/secondary videos (such as WebRTC `SurfaceViewRenderer` or HLS `PlayerView`) MUST call:
  ```kotlin
  setZOrderMediaOverlay(true)
  ```
  This places the inset cleanly above the primary video `SurfaceView` without SurfaceFlinger layer fighting or screen blanking.

### 3. Anti-Slow-Motion & Reconnection Snapping (`LiveStreamZoneRenderer.kt`)
- **Strict Speed Lock**: Configure `MediaItem.LiveConfiguration`:
  - `setMinPlaybackSpeed(1.0f)`: Strictly prevents ExoPlayer from slowing down below 1.0x (eliminating the "slomo" drift).
  - `setMaxPlaybackSpeed(1.15f)`: Allows gentle catch-up if minor buffering occurs.
- **Instant Live-Edge Seek on Reconnect**: When OBS or upstream stream restarts, immediately call `exoPlayer.seekToDefaultPosition()` to snap directly to the latest live edge rather than decoding accumulated stale frames.

### 4. Zero-GC & Anti-Layout Thrashing on Queue Display
- **No Allocations in Frame Loop**: `QueueVisualEffectHelper.kt` pre-allocates a static `FloatArray(20)` and reusable `ColorMatrix`. During ticket call animations (color inversion), the array is mutated in-place with zero heap allocations (0 GC runs).
- **Anti-Thrashing Font Scaling**: `QueueCanvasView.kt` caches display metrics `density` and only applies `setTextSize()` when the target size differs by $> 0.5\text{px}$, preventing recursive layout and measurement passes.

### 5. OS-Level Zero-Overdraw & Smooth Audio Ducking
- **Zero-Overdraw Window**: In `PlayerActivity.kt`, call `window.setBackgroundDrawable(null)` to eliminate Android's default window background fill pass, saving ~20% GPU fillrate. Rendering thread priority is set to `Process.THREAD_PRIORITY_DISPLAY`.
- **Smooth Audio Ducking Ramp**: In `VideoZoneRenderer.kt`, volume ducking uses `ValueAnimator` with a 60ms linear ramp down to mute and a 180ms ramp up to base volume when TTS/chime finishes, preventing harsh speaker clicks or audio pops.

---

## Backend Database & gRPC Service Integrity Invariants

### 1. Layer Block Component References (Single Source of Truth)
- `studio_layer_blocks` stores foreign keys (`queue_id`, `ticker_id`, `clock_id`, `playlist_id`, `media_item_id`, `webview_id`, `album_id`, `live_stream_id`) referencing already existing records in their respective component tables.
- **DILARANG KERAS menyisipkan query dummy `INSERT INTO components_* ... ON CONFLICT DO NOTHING` di dalam `LayerBlockRepository::create`**:
  - Tabel-tabel komponen memiliki constraint `corporation_id UUID NOT NULL`. Query dummy tanpa `corporation_id` akan seketika digagalkan oleh PostgreSQL (`violates not-null constraint`), me-rollback transaksi, dan mengembalikan error gRPC `Code: 13 (INTERNAL)`.
  - Dampak kegagalan ini adalah blok yang baru disimpan di Web CMS akan **hilang dari linimasa (*timeline*)** setelah halaman di-refresh.

### 2. Nullable Columns Decoding Safety
- Kolom teks opsional pada PostgreSQL (seperti `tts_template_call`, `tts_template_recall`, `tts_template_break` pada `components_queue_displays`) bertipe `TEXT` (nullable).
- Struct Row sqlx di Rust WAJIB mendefinisikan field ini sebagai `Option<String>` dan memetakannya dengan `.unwrap_or_default()` saat mengonversi ke Protobuf message, agar tidak memicu `ColumnDecodeError` (gRPC Code 13).

### 3. Real Schema Columns Alignment
- `components_tickers`: Kolom riil adalah `text_content`, `badge_label`, `badge_bg_color`, `badge_text_color`, `speed`, `font_size`, `background_color`, `text_color`. Hindari penggunaan kolom fiktif (`messages`, `badge`, `theme`).
- `components_clocks`: Kolom riil adalah `timezone`, `clock_format`, `show_seconds`, `show_date`, `font_size`, `text_color`, `background_color`, `weather_city`. Hindari penggunaan kolom fiktif (`city`, `is_24_hour`, `theme`).

### 4. Player Telemetry & Touch Command Authorization (`PushCommand`)
- Endpoint `StreamService::push_command` membedakan perintah administratif dengan sinyal operasional player:
  - Perintah administratif (`ReloadManifest`, `RebootPlayer`, `ClearCache`) strictly mewajibkan izin `can_manage_distribution` via JWT Bearer token.
  - Sinyal real-time player/antrean (`CommandEmergencyBroadcast` dengan payload `CALL_QUEUE`, `ASSET_DOWNLOAD_PROGRESS`, `ASSET_DOWNLOAD_COMPLETE`) diizinkan untuk dikirimkan oleh player Android tanpa penolakan `Code: 16 (UNAUTHENTICATED)`.
  - Android player (`PlayerTouchBroadcaster`) tetap menyematkan header `Authorization: Bearer <token>` dari `TokenStorage` jika tersedia.

### 5. Database Relative URL Invariant (Strict No-Domain Rule)
- Domain lokal seperti `sigma.dkaapis.test` HANYA berlaku di mesin pengembang host (`/etc/hosts`) dan **DILARANG KERAS disimpan ke dalam database PostgreSQL** (`components_live_streams`, `studio_layer_blocks`, `studio_media_items`, dll).
- Seluruh kolom endpoint, poster, maupun sumber stream (`source_url`, `server_hls_endpoint`, `poster_image_url`) **WAJIB HANYA menyimpan URL relatif** (contoh: `/streams/<stream_id>/live.m3u8` atau `/streams/<stream_id>/whip`).
- Penyelesaian (*resolving*) ke absolute URL adalah tanggung jawab penuh masing-masing client runtime:
  - **Android Player**: Menggunakan `ServerConfig.getHost(context)` (misalnya `http://10.20.30.97` atau IP server yang diinput device).
  - **Frontend Web**: Menggunakan URL relatif browser atau `window.location.origin`.
  - **Backend Relay**: Menggunakan internal Docker DNS hostname (`http://dka-product-sigma-streamer:8889` / `:8888`).

### 6. Dedicated Stateless Player Stream Channel (Zero Cookie & Zero Session)
- Player signage adalah perangkat keras (*appliance*) yang bekerja 24/7 dan **TIDAK BOLEH** dibebani oleh mekanisme browser seperti dynamic cookie challenge (`cookieCheck=1`), parameter sesi MediaMTX (`?session=<uuid>`), maupun proteksi autentikasi yang memicu redirect 302 / error 404.
- Backend/Gateway menyediakan jalur pengiriman streaming terpisah khusus player:
  - Menghandle cookie check dan redirect secara server-to-server.
  - Menghapus (*strip*) parameter query `?session=...` dari playlist `.m3u8` agar segmen `.ts` bersifat *stateless* dan *cacheable*.
  - Menyajikan payload murni langsung ke ExoPlayer tanpa risiko `HttpDataSourceException: Connection reset` atau `Source error (code: 2001)`.

### 7. Anti-Flapping Buffering/Offline State Machine pada Player
- Saat siaran sedang tidak aktif, belum dipublikasikan (*offline*), atau mengalami gangguan jaringan:
  - Player WAJIB mempertahankan tampilan **"Siaran Offline"** yang elegan (menggunakan UI glassmorphism modern dengan indikator retry halus).
  - **DILARANG KERAS meloncat ke state "BUFFERING"** di setiap interval percobaan reconnecting (`reconnectRunnable`) ketika belum ada aliran paket/frame riil yang diterima. State buffering HANYA boleh aktif ketika media source telah terhubung dan sedang mengisi buffer playback frame pertama.

### 8. Android Live Stream = WebRTC WHEP UDP (Server SFU) + Multi-Source
- Android player memutar siaran server-hosted (`WHIP` & `RTSP` Server Relay) melalui **WebRTC WHEP UDP (`8189/udp`)** dengan negosiasi SDP via gRPC `LiveStreamService.NegotiateWhep` / `CloseWhepSession` (`50051/tcp`), menggunakan `SharedWebRtcRuntime` (`EglBase` singleton + hardware `DefaultVideoDecoderFactory` + `SurfaceViewRenderer.setZOrderMediaOverlay(true)`).
- Sumber `YOUTUBE` dan `EMBED` memakai `WebView` terkelola (`YouTubeLiveUrlParser`), sedangkan `HLS` eksternal dan `RTSP` Direct LAN tetap memakai Media3 `ExoPlayer`.
- Signaling WHIP/WHEP HTTP dilayani backend internal di port `50052` (dan dibungkus Next.js di `/streams/<id>/whip|whep`).
