# PLANNING.md — HNDSigma Digital Signage Enterprise

## Current Status
- **Environment**: Docker Compose dev mode, Bun HMR, Rust gRPC backend
- **Rechecked**: 2026-11-05 — Graphify snapshot plus targeted source checks; no build or tests run
- **Graphify snapshot**: report generated 2026-10-20; 4,156 nodes, 9,538 edges, 405 communities. Structural evidence only, not a behavior or runtime audit.
- **Stack**: Rust/Tonic gRPC (`backend/`), Next.js 14 CMS (`frontend/`), Kotlin Media3 player (`android/`), ESP32/Arduino firmware (`iot/`)

## Health Matrix

| Area | Status | Notes |
|---|---|---|
| Backend gRPC | 🟡 Source present | Last known `cargo check` was green; not rerun for this update |
| Frontend CMS | 🟡 Source present | Graph includes auth and route handlers; session enforcement still needs review |
| Android Player | ⚪ Behavior unaudited | Player and offline-manifest code/docs are in the graph; runtime/retry behavior not checked |
| DB Migrations | 🔴 Drift | Docs claim 47 migrations, actual latest is 0044 (44 up migrations) |
| IoT/MQTT Worker | ⚪ Not rechecked | Previously observed running; current runtime status not verified |
| Compose Orchestration | 🟡 Partial | External Postgres/MQTT containers and external `dka-internal` network; floating image tags and no healthchecks |

## Resolved / Corrected Findings

- **`--migrate:revert` empty/single-migration panic** — `backend/src/db.rs` now returns when no migrations are applied and uses target `0` for a single migration. Add and run regression tests for 0, 1, and 2 applied migrations before closing validation.
- **`.DS_Store` tracking claim** — `backend/src/grpc/studio/.DS_Store` is not tracked by Git in the current checkout; removed from open findings.

## Open Findings (priority top to bottom)

### P0 — Feature-killing

1. **`compose.yml` is not self-contained** — It depends on external Postgres/MQTT containers and an external `dka-internal` network. Images use floating `latest` tags and services have no healthchecks. Verify the README port discrepancy before changing ports.

2. **Schedule time validation silently falls back** — `backend/src/grpc/studio/schedule/service.rs` and `backend/src/modules/studio/schedule/repositories.rs` replace invalid input with default times. Reject malformed times with `Status::invalid_argument` / `AppError::Validation`.

3. **Transition and visual-filter service layer is absent** — `backend/src/modules/studio/transition/` and `.../visual_filter/` have model/repository modules but no `services.rs`, while gRPC service implementations exist. Check permission and transaction boundaries against `backend/aicontext.md`.

### P1 — Data integrity / contract

4. **Endpoints outside the protobuf contract** — `frontend/src/app/(api)/api/tts/route.ts` and `frontend/src/app/(api)/api/assets/` need contract/security review; the TTS route is outside `/api/grpc/`.

5. **HTTP Range behavior is an unverified risk, not a confirmed defect** — Verify media routes return `206 Partial Content` and `Accept-Ranges: bytes` for a range request. The Android offline flow depends on reliable asset retrieval and hash verification.

6. **Crate-wide dead-code allowances** — `backend/src/main.rs` still allows `dead_code`, `unused_imports`, and `unused_variables`, which can hide regressions.

### P2 — Cleanup / documentation drift

7. **Migration documentation drift** — `backend/aicontext.md` claims migrations through `0048`; the current latest migration is `0045_optimize_telemetry_device_index`.

8. **Route naming inconsistency** — Reconcile backend `grpc/components/*` with frontend `api/grpc/studio/*`, and `layer_block` / `layer_override` with proto `layer/block` / `layer/item_override`.

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
2. [ ] Add regression tests and run `cargo check` for migration revert edge cases (guard is already present).
3. [ ] Reject invalid schedule times; run targeted backend checks.
4. [ ] Add service-layer handling for transition and visual-filter modules; validate permission and transaction boundaries.
5. [ ] Verify media Range behavior and Android offline playback.
6. [ ] Make Compose startup reproducible with explicit dependencies, healthchecks, and pinned image tags.
7. [ ] Reconcile migration documentation and route/protobuf coverage.
8. [ ] Complete the remaining security, Android, and firmware audit checklist.
