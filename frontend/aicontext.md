# Frontend Architecture & AI Context — Next.js CMS

## Overview

The Frontend is the control plane (Studio CMS) for DKASigma Digital Signage Enterprise. It runs on Next.js 14 (App Router) using the Bun runtime, with gRPC-Node integration bridging server routes to the Rust backend.

---

## Technical Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Runtime & Package Manager**: Bun
- **Language**: TypeScript 5.5.4
- **Styling**: Pure Vanilla CSS with modern smooth HDR+ design tokens (`src/app/globals.css`). No Tailwind.
- **gRPC Client**: `@grpc/grpc-js` (Node-native gRPC communication inside Route Handlers)
- **Icons**: `lucide-react`
- **Canvas / Layout Engine**: `react-rnd` (drag, resize, coordinate positioning)

---

## Directory Structure

```
frontend/
├── package.json
├── tsconfig.json
├── scripts/
│   └── generate_grpc.ts          # Protobuf compilation script (invokes protoc)
├── public/                       # Static public assets
└── src/
    ├── middleware.ts             # API request logging only (not auth enforcement)
    ├── components/               # Shared UI (MainLayout, Sidebar, Navbar, Modals, Forms)
    ├── lib/
    │   ├── auth.ts               # localStorage session helpers (dkasigma_session)
    │   ├── core/
    │   │   ├── grpcClient.ts     # Core gRPC bridge (host, credentials, metadata, token)
    │   │   ├── invokeApi.ts      # Browser fetch wrapper with bearer token
    │   │   └── deviceStreamHub.ts# Server-side device event/SSE hub
    │   ├── api/                  # Generated Protobuf & gRPC stubs (DO NOT EDIT)
    │   │   ├── common/
    │   │   ├── distribution/
    │   │   ├── hardware/
    │   │   ├── iam/
    │   │   └── studio/
    │   └── services/             # Domain API fetchers (common, hardware, iam, studio)
    └── app/
        ├── layout.tsx            # Global HTML & theme wrapper (boots light)
        ├── globals.css           # HDR+ design system tokens & base styles
        ├── (auth)/login/         # Unauthenticated login page
        ├── (dashboard)/          # AuthGuard + MainLayout CMS shell
        │   ├── hardware/         # displays (CRUD, pairing, detail) & groups
        │   ├── iam/roles/        # Roles CRUD & permission assignment
        │   └── studio/           # layouts, media, playlists, schedules, components
        │                         # (album, clock, ticker, webview, queue/ticket editor)
        ├── (api)/api/            # auth/login, grpc/*, stream/*, tts, assets, up
        └── player/[id]/          # Public device-style player preview
```

---

## gRPC Route Handler Pattern

`getGrpcHost()` reads `DKA_GRPC_SERVER_HOST` (default `localhost:50051`); `getGrpcCredentials()` uses TLS only when `DKA_GRPC_SERVER_SECURE=true`. Auth is enforced client-side by `AuthGuard` reading `localStorage.dkasigma_session`, not by `middleware.ts` (which only logs API traffic).

Every API route handler under `src/app/(api)/api/grpc/` follows this standard pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';
import { SomeServiceClient } from '@/lib/api/..._grpc_pb';
import { SomeRequest } from '@/lib/api/..._pb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new SomeServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new SomeRequest();
    
    // Populate request fields...

    return new Promise<NextResponse>((resolve) => {
      client.someMethod(request, getGrpcMetadata(token), (err: any, res: any) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(res.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

---

## Design System Tokens (`globals.css`)

Always use the design system variables:

| Category | Token Variables |
|---|---|
| **Surfaces** | `--bg-primary` (deep canvas), `--bg-secondary` (nav shell), `--bg-surface` (panels/cards), `--bg-surface-elevated` (chips/inspectors), `--bg-glass` |
| **Borders** | `--border-subtle` (subtle hairlines), `--border-strong`, `--border-focus` |
| **Typography** | `--text-primary`, `--text-secondary`, `--text-muted`, `--font-main` (Plus Jakarta Sans) |
| **Shadows & Glow** | `--card-shadow`, `--card-shadow-hover`, `--focus-ring-glow`, `--input-inset-shadow` |
| **Inputs** | `--input-bg`, `--input-border` |
| **Accents** | `--primary-500`, `--primary-600`, `--accent-emerald`, `--accent-amber`, `--accent-rose`, `--accent-cyan`, `--accent-violet` |
| **Border Radii** | `--radius-sm` (7px), `--radius-md` (10px), `--radius-lg` (14px), `--radius-xl` (20px), `--radius-full` (9999px) |

---

## Developer Workflow & Rules

> [!WARNING]
> **DILARANG MENJALANKAN `bun run build` ATAU `next build`**
> Aplikasi frontend sudah dijalankan oleh user menggunakan Docker Compose (`compose.yml`) dalam mode development fleksibel dengan live HMR. Mengedit kode sumber secara langsung sudah otomatis ter-reload.

```bash
bun dev                  # Local dev server (dijalankan via Docker Compose dev)
bun run generate:grpc    # Compile proto files from backend/proto into src/lib/api/
bun run lint             # ESLint checks
```

