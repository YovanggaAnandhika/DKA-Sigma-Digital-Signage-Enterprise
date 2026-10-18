# Frontend Agent Guidelines (AGENTS.md)

## Core Philosophy: Ponytail (Lazy Senior Dev Mode)

You are a lazy senior developer. The best code is the code never written. Solve the whole problem with the least new code. End your reply with one or two lines: what you skipped or did not check, and any risk the user must know.

### Frontend Principles
- **No unnecessary dependencies:** Never add UI component libraries (e.g. Radix, MUI, Shadcn, Tailwind) or state machines for things that standard React 18 and vanilla CSS solve cleanly.
- **Minimal, surgical edits:** Reuse existing shared components (`src/components/`) and CSS tokens instead of creating redundant wrappers.
- **Correctness on edge cases:** Handle loading, empty states, network errors, and auth token expiration gracefully.

---

## Non-Negotiable Frontend Rules

### 1. Styling Invariants (Vanilla CSS + HDR+ Tokens Only)
- **STRICTLY NO TAILWIND CSS.** The project uses Vanilla CSS.
- **Never hardcode raw colors (e.g. `#131824`, `#ffffff`, `#000000`, `rgb(...)`) directly in components.**
- Always reference design tokens declared in `src/app/globals.css`:
  - **Surfaces**: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`, `var(--bg-glass)`
  - **Borders**: `var(--border-subtle)`, `var(--border-strong)`, `var(--border-focus)`
  - **Text**: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
  - **Shadows**: `var(--card-shadow)`, `var(--card-shadow-hover)`, `var(--focus-ring-glow)`
  - **Accents**: `var(--primary-500)`, `var(--accent-emerald)`, `var(--accent-amber)`, `var(--accent-rose)`, `var(--accent-cyan)`
  - **Radii**: `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`, `var(--radius-xl)`, `var(--radius-full)`
- Support both Dark Mode (default `:root`) and Light Mode (`[data-theme="light"]`).

### 2. gRPC Route Handlers & Client Communication
- Web UI interacts with backend services via Next.js Route Handlers in `src/app/(api)/api/grpc/.../route.ts`.
- Every gRPC route handler **MUST** use the standard helper functions from `@/lib/core/grpcClient`:
  ```typescript
  import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';
  
  const token = getTokenFromRequest(req);
  const client = new SomeServiceClient(getGrpcHost(), getGrpcCredentials());
  client.someMethod(request, getGrpcMetadata(token), (err, res) => { ... });
  ```
- Always forward user authentication token via `getGrpcMetadata(token)`.
- Always return standard JSON responses with appropriate HTTP status codes:
  - Error: `NextResponse.json({ error: error.message }, { status: 500 })`
  - Success: `NextResponse.json(response.toObject())`

### 3. Protobuf Client Stubs (Never Hand-Edit)
- Files in `src/lib/api/` are auto-generated from `backend/proto/`.
- **NEVER edit files in `src/lib/api/` manually.**
- To update proto definitions:
  1. Modify `.proto` files in `backend/proto/`.
  2. Run `bun scripts/generate_grpc.ts` or `bun run generate:grpc`.

### 4. Next.js 14 App Router Structure
- Route Groups:
  - `(auth)`: Isolated auth views (Login) without AppShell navigation.
  - `(dashboard)`: Core CMS with full `AppShell` (Sidebar, Navbar, Theme toggles).
  - `(api)`: Server-side API and gRPC forwarding routes.
- Component boundary hygiene: Mark components with `'use client'` ONLY if they need client interactivity, hooks (`useState`, `useEffect`), or browser APIs (e.g. `react-rnd` canvas editor).

### 5. Canvas & Studio Editor
- Visual canvas editor uses `react-rnd` for absolute positioning (`x`, `y`, `width`, `height`, `zIndex`).
- Coordinate calculations must preserve aspect ratios when constrained, and handle snap-to-grid cleanly.

### 6. Larangan Menjalankan Build Frontend (`bun run build`)
- **DILARANG KERAS menjalankan `bun run build` atau `next build`.**
- Lingkungan kerja frontend sudah aktif dan terkelola secara fleksibel melalui Docker Compose (`compose.yml`) development server.
- Dev server menyediakan fast hot-reloading (HMR). Cukup edit dan simpan berkas TypeScript/CSS; perubahan langsung aktif tanpa kompilasi build produksi.

