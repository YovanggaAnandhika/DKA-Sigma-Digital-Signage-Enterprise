# DKASigma Digital Signage Enterprise (SIGNAGE) - AI Context

## Project Overview
This repository contains the codebase for DKASigma Digital Signage Enterprise, a system designed to manage and broadcast media content to distributed Android-based digital signage players.

## Tech Stack Overview
- **Backend**: Rust, gRPC (tonic), PostgreSQL, sqlx (Database Migrations & Seeders).
- **Frontend (Studio CMS)**: Next.js, React, TypeScript, SWC.
- **Proxy**: Envoy (transcoding gRPC-Web from Frontend to gRPC for Backend).
- **Hardware Player**: Android TV / Tablet (Kotlin, Media3/ExoPlayer), gRPC bi-directional stream.

## Core Domain Models & Architecture
- **IAM (Identity and Access Management)**: `UserEntity`, `RoleEntity`, `PermissionEntity`, `RoleGroupEntity`.
- **Media & Content**: `MediaEntity` (Asset storage and tracking).
- **Presentation**: `LayoutEntity` (Defines multi-zone layouts), `ZoneWithPlaylistDto` (Assigns content sequences to layout zones).
- **Hardware**: `DeviceEntity` (Represents an Android Player in the field).
- **Manifest Engine**: Generates a synchronized content schedule + visual layout + media hash list (`CompiledManifestDto`) that players sync offline.
- **Canary Rollouts**: `CanaryGroupEntity` allows distributing manifests gradually.

## Essential Business Flows

1. **Boot & Pairing Flow**: 
   - New device requests pairing via `RegisterDevice()`.
   - Backend returns `pairing_code`. Device shows it.
   - Admin maps the `pairing_code` via the Next.js CMS.
   - Device polls and receives a persistent `device_token`.

2. **Offline-First Caching**:
   - Player polls `ManifestService.GetActiveManifest()`.
   - If changed, player downloads missing `required_assets` matching their `sha256_hash`.
   - Playback transition only occurs *after* 100% of assets are locally validated.

3. **Bi-directional Stream (`DisplayStream`)**:
   - Player maintains an active gRPC HTTP/2 stream with the backend.
   - **Upstream (Telemetry)**: Memory usage, disk space, currently playing media id.
   - **Downstream (Commands)**: Server issues `COMMAND_RELOAD_MANIFEST`, `COMMAND_CAPTURE_SCREENSHOT`, `COMMAND_EMERGENCY_BROADCAST`, or `COMMAND_REBOOT_PLAYER`.

4. **Multi-Zone Rendering**:
   - Android client renders multiple `Zone` elements using absolute coordinates (`x, y, width, height`) and `z_index` based on the compiled layout manifest.

## AI Instructions for Maintaining this Codebase
- **Rust Backend**: Prioritize robust error handling via the custom `AppError` and gRPC `Status` objects. Ensure any new service implements the appropriate gRPC traits and handles IAM correctly (e.g., via `auth_interceptor()` and `require_permission()`).
- **Frontend Next.js**: Ensure new gRPC-Web clients use `loginWithGrpc()` and `saveSession()` for authentication. Maintain UI consistency within the AppShell and Theme context.
- **Protobufs**: Any API change must start in the `backend/proto/` files. Note the common types and separate files (e.g., `device.proto` & `device.common.proto`).
- **Graphify**: Consult `graphify-out/GRAPH_REPORT.md` and related graph data if exploring architectural dependencies or isolated components.
