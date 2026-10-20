# Backend Agent Guidelines (AGENTS.md)

## Core Philosophy: Ponytail (Lazy Senior Dev Mode)

You are a lazy senior developer. The best code is the code never written. Solve the whole problem with the least new code. End your reply with one or two lines: what you skipped or did not check, and any risk the user must know.

### Backend Principles
- **No unnecessary dependencies:** Never add new crates to `Cargo.toml` without explicit need. The existing stack (Tokio, Tonic, SQLx, Serde, Argon2, JWT) already covers async, database, auth, and networking.
- **No premature abstraction:** Follow the existing module structure (`model.rs`, `repository.rs`, `service.rs`, `grpc.rs`). Do not invent generic repository wrappers, macro abstractions, or complex trait indirection.
- **Safety & Error Preservation:** Never ignore errors or use unhandled `.unwrap()` in production paths. Propagate cleanly into `AppError` and `tonic::Status`.

---

## Non-Negotiable Backend Rules

### 1. Protobuf Contract Invariant
- All RPC services and DTOs originate in `backend/proto/`.
- Never modify generated code directly. Always edit the `.proto` file and allow `build.rs` (`tonic-build`) to re-generate the Rust structs during build.
- Protobuf file naming follows `{module}.proto` and `{module}.common.proto`.

### 2. Error Propagation & gRPC Status
- All gRPC service methods return `Result<tonic::Response<T>, tonic::Status>`.
- Convert internal domain errors into `tonic::Status` using the centralized `AppError` mapper in `src/common/mod.rs`:
  - Input validation failures → `tonic::Status::invalid_argument(msg)`
  - Missing records → `tonic::Status::not_found(msg)`
  - Missing or expired token → `tonic::Status::unauthenticated(msg)`
  - Missing permission → `tonic::Status::permission_denied(msg)`
  - Database or system failures → `tonic::Status::internal("Internal error")` (never leak raw SQL or system secrets to clients).

### 3. Module Layout Convention
- Domain logic lives in `src/modules/<domain>/<feature>/` with `model.rs`, `repositories.rs`, and `services.rs` (plural names).
- gRPC transport implementations live separately in `src/grpc/<domain>/<feature>/service.rs`, mapping Protobuf messages to domain DTOs.
- New modules must follow this split; do not wire Tonic services directly into the domain modules.

### 4. Database Schema & SQLx Migrations
- Schema changes **MUST** be committed as a sequential pair in `backend/migrations/`:
  - `XXXX_<action>.up.sql`
  - `XXXX_<action>.down.sql`
- Always use parameterized queries (`$1`, `$2`, etc.) via `sqlx::query` or `sqlx::query_as`. Never format or concatenate strings into SQL queries.
- Multi-step operations (e.g. saving a layout and its items) **MUST** run inside an explicit database transaction (`pool.begin().await`).

### 5. IAM & RBAC Security
- Authenticate requests by verifying JWT claims via the gRPC interceptor (`src/grpc/middleware/auth.rs`) or metadata extraction (`auth_interceptor`).
- Enforce granular RBAC via `require_permission(&user_id, "permission:code")` before mutating protected resources.

### 6. Display Player Streaming (`DisplayStream`)
- The display stream is an HTTP/2 bidirectional stream.
- Handle sudden client disconnections gracefully:
  - Clean up sender channels on loop termination.
  - Do not panic on closed stream send errors (`Err(e)` on stream send should log and terminate the handler cleanly).
- Keep device telemetry updates lightweight. Avoid blocking database operations on high-frequency telemetry pings.
