# Backend Architecture & AI Context — Rust Tonic gRPC

## Overview

The Backend is a high-performance gRPC service built in Rust using Tonic, Tokio, and SQLx. It serves as the primary system of record, media manifest compiler, and real-time command/telemetry streaming server for digital signage players and the CMS frontend.

---

## Technical Stack

- **Language**: Rust (2021 edition)
- **Async Runtime**: Tokio (`full` features)
- **gRPC Framework**: Tonic 0.11 + Prost 0.12 + `tonic-build` 0.11
- **Database & Migrations**: SQLx 0.7 (`runtime-tokio-rustls`, `postgres`, `uuid`, `chrono`, `json`, `migrate`)
- **Database Engine**: PostgreSQL 17.1
- **Authentication & Security**: Argon2 (password hashing), `jsonwebtoken` 9.3 (JWT tokens), `sha2` (asset hashing)
- **Logging & Tracing**: `tracing` + `tracing-subscriber` (`env-filter`)

---

## Directory Structure & Modules

```
backend/
├── Cargo.toml
├── build.rs                      # Compiles protobufs via tonic_build::configure()
├── migrations/                   # SQLx sequential migration scripts
│   ├── 0001_initial.up.sql
│   ├── ...
│   └── 0034_create_queue_layout_items.up.sql
├── proto/                        # Protobuf definitions (Single Source of Truth)
│   ├── common/
│   ├── distribution/
│   ├── hardware/
│   ├── iam/
│   └── studio/
├── uploads/                      # Uploaded media assets storage
└── src/
    ├── main.rs                   # Entry point: DB pool, router, gRPC server on 0.0.0.0:50051
    ├── config.rs                 # Environment configuration (DATABASE_URL, JWT_SECRET, etc.)
    ├── db.rs                     # PostgreSQL connection pool builder
    ├── common/
    │   ├── error.rs              # Central AppError enum & Status mapping
    │   ├── interceptor.rs        # gRPC metadata JWT authentication interceptor
    │   └── pagination.rs         # Reusable pagination structs
    ├── seeders/                  # Default roles, permissions, and admin user seeder
    └── modules/
        ├── iam/                  # Users, Roles, Permissions, Role Groups, Auth
        ├── hardware/             # Devices, Pairing Handshake, Display Stream Telemetry
        ├── studio/               # Layouts, Layers, Playlists, Schedules, Media, Queue
        └── distribution/         # Manifest Compiler, Canary Distribution
```

---

## Canonical Module Architecture

Each feature module under `src/modules/<name>/` strictly follows this 4-layer structure:

```
src/modules/<domain>/
├── mod.rs                        # Re-exports service, repository, and models
├── model.rs                      # Database entity structs (FromRow) & domain DTOs
├── repository.rs                 # SQLx queries using PgPool or &mut PgConnection
├── service.rs                    # Business logic, permissions checks, transaction orchestration
└── grpc.rs                       # Tonic gRPC trait implementation (maps Protobuf <-> DTO)
```

### Layer Rules:
1. **`grpc.rs`**: Only handles gRPC input validation, calling the service, and translating `AppError` into `tonic::Status`.
2. **`service.rs`**: Houses business rules, permission checks, and transaction boundaries. Does not write raw SQL.
3. **`repository.rs`**: Houses SQLx queries. All queries must be parameterized (`$1`, `$2`). Never format queries with raw strings.
4. **`model.rs`**: Declares structs deriving `sqlx::FromRow`, `serde::Serialize`, and `serde::Deserialize`.

---

## Core Domain Workflows

### 1. Device Pairing & Provisioning
- **Step 1 (`RegisterDevice`)**: Player calls hardware service. If unregistered, server generates a random 6-character uppercase alphanumeric `pairing_code` (expiring in 15 minutes) and returns it.
- **Step 2 (Admin Claim)**: Admin claims `pairing_code` in the Studio CMS, associating the player with an organization and default layout.
- **Step 3 (`CheckPairingStatus`)**: Player polls every 5 seconds. Once paired, server issues a persistent JWT `device_token` with `role = "device"`.

### 2. Manifest Compiler (`distribution`)
- Compiles the active layout, assigned playlists, time schedules, and media files into a unified `CompiledManifestDto`.
- Computes SHA-256 hashes for every asset (`ManifestAssetDto`).
- Android players only transition playback once 100% of required assets are locally cached and validated against their hashes.

### 3. Display Stream (`hardware`)
- Tonic bidirectional streaming endpoint: `Stream<Item = DisplayStreamMessage>`.
- Client streams telemetry (heartbeat, memory, storage, current playback).
- Server streams downstream commands (`RELOAD_MANIFEST`, `SCREENSHOT`, `EMERGENCY_BROADCAST`, `REBOOT`).

---

## Essential Developer Commands

```bash
cargo check               # Quick syntax and type verification
cargo build               # Build debug binary (executes build.rs for proto compilation)
cargo test                # Run unit and integration tests
cargo run                 # Run backend server directly

# Watch command (mirrors compose.yml):
cargo watch -w src -w proto -w migrations -w Cargo.toml -w build.rs -i uploads -x run
```
