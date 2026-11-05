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
| `compose.yml` | Development container orchestration for frontend and backend; database/MQTT may be external. |
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
- Support both themes: CSS base tokens are dark (`:root`), `[data-theme="light"]` overrides them. The app currently boots in light mode (`RootLayout` + `ThemeProvider`) and persists the choice in `localStorage` (`dkasigma_theme`).

### 4. Database & Migration Rule
- All schema alterations require an explicit SQLx migration pair in `backend/migrations/` (`XXXX_name.up.sql` and `XXXX_name.down.sql`).
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
- Android: verification is limited to `./gradlew :app:check` and `./gradlew :app:assemble` from `android/`. Do not run debug-variant tasks (including `assembleDebug`) or the `build` task.
