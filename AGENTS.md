# AGENTS.md — DKASigma Digital Signage Enterprise

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

| Directory | Tech Stack | Responsibility |
|---|---|---|
| `backend/` | Rust (Tonic gRPC, Tokio, SQLx, PostgreSQL) | Core business logic, gRPC services, database migrations, media storage, player telemetry streaming. |
| `frontend/` | Next.js 14 (App Router, Bun, React 18, TypeScript) | Studio CMS, layout editor canvas (`react-rnd`), IAM console, hardware management, gRPC-Web/Node route bridge. |
| `backend/proto/` | Protocol Buffers v3 | Single source of truth for all API contracts between backend, frontend, and players. |
| `docs/` | Markdown | DDL database schemas, Android player hardware & streaming protocol guides. |
| `graphify-out/` | GraphRAG / Knowledge Graph | Architectural dependency graph, god nodes, and community analysis report (`GRAPH_REPORT.md`). |
| `compose.yml` | Docker Compose | Local & production orchestration (`frontend` on port 80, `backend` on 50051, `db` on 54321/5432). |

---

## Non-Negotiable Project Rules

### 1. Protobuf Contract Rule (Single Source of Truth)
- All API and data exchange contracts **MUST** be defined in `backend/proto/`.
- Never invent ad-hoc HTTP endpoints or custom payload formats that diverge from protobuf specs.
- Workflow for API changes:
  1. Modify or add `.proto` files in `backend/proto/`.
  2. Verify backend compiles (`build.rs` generates tonic code).
  3. Re-generate frontend stubs via `bun scripts/generate_grpc.ts` inside `frontend/`.

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
- Support both dark mode (default) and `[data-theme="light"]`.

### 4. Database & Migration Rule
- All schema alterations require an explicit SQLx migration pair in `backend/migrations/` (`XXXX_name.up.sql` and `XXXX_name.down.sql`).
- Never run manual DDL in production containers without migration tracking.

### 5. Player Streaming & Offline-First Invariants
- Android players operate offline-first: media must be downloaded and verified against `sha256_hash` before manifest playback transitions.
- Real-time player commands and telemetry rely on the bidirectional HTTP/2 gRPC stream (`DisplayStream`).

### 6. Larangan Eksekusi Build Frontend (`bun run build`)
- **DILARANG KERAS menjalankan `bun run build` atau `next build`.**
- Lingkungan kerja sudah berjalan fleksibel menggunakan Docker Compose (`compose.yml`) dalam mode dev dengan live HMR (Hot Module Replacement) / auto-reload.
- Cukup ubah berkas kode langsung, Next.js dev server di container akan me-reload otomatis tanpa perlu kompilasi produksi manual.

