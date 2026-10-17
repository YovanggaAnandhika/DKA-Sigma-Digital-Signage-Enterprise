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
    ├── middleware.ts             # Route protection and auth cookie verification
    ├── components/               # Shared UI components (AppShell, Modals, Forms, Canvas)
    ├── lib/
    │   ├── auth.ts               # Cookie & session helpers
    │   ├── core/
    │   │   └── grpcClient.ts     # Core gRPC bridge (getGrpcHost, credentials, metadata)
    │   ├── api/                  # Generated Protobuf & gRPC stubs (DO NOT EDIT)
    │   │   ├── common/
    │   │   ├── distribution/
    │   │   ├── hardware/
    │   │   ├── iam/
    │   │   └── studio/
    │   └── services/             # Client-side API fetchers
    └── app/
        ├── layout.tsx            # Global HTML & theme wrapper
        ├── globals.css           # HDR+ design system tokens & base styles
        ├── (auth)/               # Unauthenticated routes (e.g. /login)
        ├── (dashboard)/          # Authenticated CMS pages wrapped with AppShell
        │   ├── hardware/         # Display player registration, status, pairing
        │   ├── iam/              # Users, roles, permissions, role-groups
        │   └── studio/           # Layouts, zones, media library, schedules, queue displays
        └── (api)/api/grpc/       # Next.js Server Route Handlers proxying gRPC
```

---

## gRPC Route Handler Pattern

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

## Essential Developer Commands

```bash
bun dev                  # Run local dev server (port 80 or PORT env)
bun run generate:grpc    # Compile proto files from backend/proto into src/lib/api/
bun run build            # Next.js production build
bun run lint             # ESLint checks
```
