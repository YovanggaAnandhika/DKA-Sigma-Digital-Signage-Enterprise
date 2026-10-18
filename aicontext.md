# DKASigma Digital Signage Enterprise (SIGNAGE) - AI Context

## System Architecture

DKASigma Digital Signage Enterprise is a broadcast and display management system for distributed Android hardware players managed via a Next.js Studio CMS and backed by a high-performance Rust gRPC server.

```
┌─────────────────────────────────────────────────────────┐
│               Frontend CMS (Next.js 14)                │
│  - App Router: (auth), (dashboard), (api)               │
│  - Studio Layout Canvas (react-rnd, Vanilla CSS HDR+)   │
│  - IAM & Hardware Management Web UI                     │
└──────────────────────────┬──────────────────────────────┘
                           │ Route Handlers (@grpc/grpc-js)
                           ▼
┌─────────────────────────────────────────────────────────┐
│            Backend Server (Rust + Tonic gRPC)           │
│  - Port 50051 (HTTP/2 Cleartext / TLS)                  │
│  - Modules: IAM, Studio, Hardware, Distribution         │
│  - Manifest Compiler Engine & Dynamic Telemetry Stream  │
└──────────────┬───────────────────────────┬──────────────┘
               │ SQLx Pools                │ Bidirectional DisplayStream
               ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│  PostgreSQL 17.1 Database │ │ Android Hardware Players  │
│  - Schemas & Migrations   │ │ - Kotlin / Media3         │
│  - Relational DB Storage  │ │ - Offline SHA-256 caching │
└───────────────────────────┘ └───────────────────────────┘
```

---

## Architectural God Nodes (Graphify Insights)

Extracted from Graphify knowledge graph analysis (`graphify-out/GRAPH_REPORT.md`):

1. **`getGrpcCredentials()`, `getGrpcHost()`, `getGrpcMetadata()`, `getTokenFromRequest()`**:
   - Location: `frontend/src/lib/core/grpcClient.ts`
   - Purpose: Universal communication nexus bridging Next.js server-side route handlers to backend gRPC services. Every API route handler relies on these 4 primitives.
2. **`AppError` & `tonic::Status`**:
   - Location: `backend/src/common/error.rs`
   - Purpose: Unified backend error boundary. Translates domain database, authentication, and validation failures into standard gRPC error status codes.
3. **`CompiledManifestDto` & `ManifestAssetDto`**:
   - Location: `backend/src/modules/distribution/` / `backend/proto/distribution/`
   - Purpose: The synchronized manifest format consumed by Android display clients to schedule zones, playlists, layouts, and assets offline.

---

## Domain Modules & Structural Map

| Domain | Backend Rust Module | Backend Proto | Frontend Route Handlers / Pages |
|---|---|---|---|
| **IAM** | `backend/src/modules/iam/` | `proto/iam/` | `src/app/(dashboard)/iam/`, `api/grpc/iam/` |
| **Studio** | `backend/src/modules/studio/` | `proto/studio/` | `src/app/(dashboard)/studio/`, `api/grpc/studio/` |
| **Hardware** | `backend/src/modules/hardware/` | `proto/hardware/` | `src/app/(dashboard)/hardware/`, `api/grpc/hardware/` |
| **Distribution** | `backend/src/modules/distribution/` | `proto/distribution/` | `api/grpc/distribution/` |
| **Common** | `backend/src/common/` | `proto/common/` | `src/lib/api/common/`, `src/lib/core/` |

### Key Business Flows
1. **Device Pairing Handshake:**
   - Player calls `RegisterDevice()` with hardware specs → receives `pairing_code`.
   - Admin enters `pairing_code` into Studio CMS → maps device to organization and sets active layout.
   - Player polling resolves the handshake and secures a persistent JWT `device_token`.
2. **Offline-First Manifest Distribution:**
   - Player retrieves latest manifest (`GetActiveManifest`).
   - Downloads required media files matching `sha256_hash` to local storage.
   - Playback changes only after all assets verify cleanly against their hashes.
3. **Display Telemetry Stream (`DisplayStream`):**
   - Persistent HTTP/2 bi-directional gRPC stream between player and server.
   - Upstream: Periodic heartbeat, CPU/memory stats, storage availability, active media ID.
   - Downstream: Instant commands (`COMMAND_RELOAD_MANIFEST`, `COMMAND_CAPTURE_SCREENSHOT`, `COMMAND_EMERGENCY_BROADCAST`, `COMMAND_REBOOT_PLAYER`).

---

## Development Environment & Container Specs

Managed via `compose.yml`:
- **Frontend**: Bun-powered Next.js running on port 80. Hot reloads on local file change.
- **Backend**: Rust container with `cargo watch` monitoring `src/`, `proto/`, `migrations/`, and `build.rs`. Port 50051.
- **Database**: PostgreSQL 17.1 container on host port 54321 (`dka_signage` database).

> [!IMPORTANT]
> **Larangan Eksekusi Build**: Dilarang menjalankan `bun run build` atau `next build`. Container `compose.yml` sudah berjalan fleksibel dalam mode dev dengan live HMR. Cukup edit berkas secara langsung.

