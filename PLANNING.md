# PLANNING.md — HNDSigma Digital Signage Enterprise

## Current Status
- **Environment**: Docker Compose dev mode, Bun HMR, Rust gRPC backend
- **Last audited**: read-only inspection + `cargo check` baseline (green)
- **Stack**: Rust/Tonic gRPC (`backend/`), Next.js 14 CMS (`frontend/`), Kotlin Media3 player (`android/`), ESP32/Arduino firmware (`iot/`)

## Health Matrix

| Area | Status | Notes |
|---|---|---|
| Backend gRPC (14 registered services) | 🟡 Running | `cargo check` green |
| Frontend CMS | 🟡 Running | Auth client-side only |
| Android Player | ⚪ Not audited | Needs separate review |
| DB Migrations | 🔴 Drift | Docs claim 48 pairs, actual 45 |
| IoT/MQTT Worker | 🟢 Running | `dka-development-mqtt` (emqx 5.8.0) up |
| Compose Orchestration | 🟡 Partial | MQTT + Postgres live, but `compose.yml` not self-contained |

## Verified Defects (priority top to bottom)

### P0 — Feature-killing

1. **`--migrate:revert` panics on empty DB** — `backend/src/db.rs`:
   ```rust
   let last_version = rows.last().unwrap().0;
   let target = rows[rows.len() - 2].0;
   ```
   Panics when DB has 0 or 1 applied migration. Fix: guard `rows.len()` and return `AppError`.

2. **`compose.yml` not self-contained** — `DB_HOST: dka-development-postgres` and `MQTT_HOST: dka-development-mqtt` are external containers; network `dka-internal` declared `external: true`. `docker compose up` on a clean machine fails. Also: `DB_PORT: 5432` vs README `54321` mismatch; images `yovanggaanandhika/node:latest` / `rust:latest` unpinned; no `healthcheck` + `depends_on: condition: service_healthy`.

3. **Schedule time validation silently swallowed** — `backend/src/grpc/studio/schedule/service.rs`:
   ```rust
   .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(8, 0, 0).unwrap());
   .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(22, 0, 0).unwrap());
   ```
   Same pattern in `backend/src/modules/studio/schedule/repositories.rs` (00:00 / 23:59:59). Input `25:99` is accepted and the schedule shifts silently. Trust boundary -> must return `Status::invalid_argument` / `AppError::Validation`.

4. **`services.rs` layer bypassed** — `backend/src/modules/studio/transition/` and `.../visual_filter/` contain only `mod.rs`, `model.rs`, `repositories.rs` (no `services.rs`), while `backend/src/grpc/studio/transition/service.rs` and `visual_filter/service.rs` exist. Violates the Layer Rule in `backend/aicontext.md`; permission checks and transaction boundaries risk being skipped.

### P1 — Data corruption / contract drift

5. **Endpoints outside Protobuf Contract Rule** — `frontend/src/app/(api)/api/grpc/tts/route.ts` (ad-hoc payload, no `.proto`) and `frontend/src/app/(api)/api/assets/` (direct filesystem serving).

6. **HTTP Range risk for offline-first player** — `StreamMediaFile` route and `api/assets/` must return `206 Partial Content` with `Accept-Ranges: bytes`. Verify: `curl -H Range:bytes=0-1023 -sD- <url>` expect `206`. Failure: resume dead, `sha256_hash` mismatch, manifest never activates -> black screen.

7. **Crate-wide dead-code allow** — `#![allow(dead_code, unused_imports, unused_variables)]` at root of `backend/src/main.rs` hides dead code across the crate.

### P2 — Cleanup / doc drift

8. **Migration drift** — `backend/aicontext.md` claims `0001-0048`; actual last is `0045_optimize_telemetry_device_index`.

9. **`.DS_Store` committed** — `backend/src/grpc/studio/.DS_Store`.

10. **Route naming inconsistency** — backend `grpc/components/*` maps to frontend `api/grpc/studio/*`; `layer_block` / `layer_override` vs proto `layer/block` / `layer/item_override`.

## Audit Checklist (not yet verified)

- [ ] `backend/proto/**` vs `android/app/src/main/proto/**` — field/tag drift?
- [ ] Every `backend/src/grpc/*/service.rs` calls `require_permission`?
- [ ] `frontend/src/middleware.ts` logging-only — can `(api)/api/grpc/**` be called without a session?
- [ ] `AuthGuard` client-side — open dashboard URL directly without session
- [ ] Android `DownloadAndVerifyMediaUseCase`: retry, hash mismatch, disk-full
- [ ] `DisplayStream` reconnect/backoff across backend restart
- [ ] Missing frontend routes for `iam/role_group`, `iam/permission`, `distribution/*`
- [ ] `iot/*` firmware topics match `dka/iot/+/action` and `dka/iot/+/telemetry`
- [ ] `--migrate:fresh --seed` then `--migrate:revert`

## Work Order (in progress)

1. [x] Baseline `cargo check` green
2. [ ] Fix PLANNING.md (MQTT already up) — commit
3. [ ] Guard `--migrate:revert` in `db.rs` — `cargo check` — commit
4. [ ] Schedule time validation (reject invalid) — `cargo check` — commit
5. [ ] Extract `services.rs` for transition + visual_filter — `cargo check` — commit
6. [ ] Verify `206` + `Accept-Ranges` on media routes
7. [ ] Add healthchecks + pinned image tags to `compose.yml`
8. [ ] Reconcile migration drift
