# DKASigma Digital Signage Enterprise (SIGNAGE)

Welcome to the DKASigma Digital Signage Enterprise project repository. This project is a comprehensive, enterprise-grade digital signage management platform. It allows administrators to manage media assets, create multi-zone layouts, build playlists, and orchestrate content distribution to remote hardware devices (Android Players) in real-time.

## System Architecture

The platform follows a microservices-inspired monolithic architecture with specialized domains:

1.  **Frontend Web Application (Studio CMS):** 
    Built with **Next.js**, React, and TypeScript. This acts as the backoffice for administrators to manage devices, roles, permissions, layouts, playlists, and media assets.
2.  **Backend Core:**
    Built in **Rust** using **gRPC**. It handles domain logic, user management (IAM), device provisioning, manifest compilation, and real-time bidirectional telemetry streaming.
3.  **Proxy Gateway:**
    **Envoy Proxy** sits between the Next.js frontend (using gRPC-Web) and the Rust gRPC backend.
4.  **Hardware Display Player:**
    An **Android TV/Tablet** application using Kotlin. It utilizes ExoPlayer for multi-zone native rendering and communicates with the backend via bidirectional gRPC streaming.

## Core Business Flow

### 1. Device Pairing & Provisioning
1.  **Boot & Registration:** An unprovisioned Android Display boots up and checks for a saved token. If none exists, it calls `RegisterDevice` via gRPC to the backend.
2.  **Pairing Code:** The backend returns a short `pairing_code` (e.g., "XR8-992"), which the Android app displays on the physical screen.
3.  **CMS Assignment:** The administrator logs into the Next.js CMS, enters the pairing code, and assigns the device to a specific layout/zone.
4.  **Token Issuance:** The backend authenticates the device and sends a persistent `device_token`.

### 2. Studio CMS Content Management (IAM & Media)
*   **IAM (Identity & Access Management):** Comprehensive user, role, permission, and role group management system to control backoffice access.
*   **Media & Layouts:** Users can upload media, create multi-zone layouts (defining coordinates and z-index for rendering), and organize content into playlists.

### 3. Content Distribution (Manifest Compilation)
*   **Manifest Engine:** When layouts or playlists change, the backend compiles a `Manifest` containing all visual properties, scheduling, and asset hashes.
*   **Canary Rollouts:** Support for canary distribution to slowly roll out manifest updates to a specific `CanaryGroupEntity` of devices before global release.

### 4. Player Synchronization & Real-time Telemetry
*   **Bidirectional Streaming (`DisplayStream`):** The Android Player maintains an active HTTP/2 gRPC stream.
    *   **Telemetry:** Player sends continuous heartbeat pings with memory usage, free disk space, and currently playing media.
    *   **Live Commands:** The backend can push commands instantly, such as `COMMAND_RELOAD_MANIFEST`, `COMMAND_CAPTURE_SCREENSHOT`, `COMMAND_EMERGENCY_BROADCAST`, or `COMMAND_REBOOT_PLAYER`.
*   **Offline-First Asset Caching:** When a player detects a new manifest, it checks `required_assets` and downloads missing files via HTTP byte-range requests. Media playback only updates atomically once 100% of the assets are verified by SHA-256 hash, ensuring a seamless visual cross-fade without black screens.

## Project Structure
*   `backend/` - Rust gRPC microservices and domain logic.
*   `frontend/` - Next.js Backoffice CMS.
*   `docs/` - System documentation (e.g., Android Player integration).
*   `envoy/` - Envoy proxy configuration.
*   `graphify-out/` - AI knowledge graph and structural reports of the repository.
