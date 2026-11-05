# Android Player Guidelines

These rules supplement the repository-root `AGENTS.md`.

## Directory Pattern

- `app/src/main/java/com/dkaapis/sigma/presentation/`: activities, view models, player UI, and player flows.
- `domain/model/`, `domain/repository/`, `domain/usecase/`: platform-independent models, repository contracts, and use cases.
- `data/repository/`, `data/local/`, `data/grpc/`: repository implementations, persistent/cache storage, and gRPC/network adapters.
- `service/`: Android lifecycle, boot, foreground, and watchdog services.
- `renderers/`: zone-specific playback/rendering.
- `app/src/main/proto/`: mirrored `.proto` inputs; canonical definitions live in `backend/proto/`, with generated clients derived from the mirror.
- `app/src/test/` and `app/src/androidTest/`: local JVM and device/instrumentation tests.

## Implementation Rules

- Keep UI/lifecycle concerns in `presentation/` or `service/`; put playback/business decisions in use cases and repository contracts in `domain/`.
- Implement network, disk cache, and gRPC details in `data/`; do not move transport or storage code into UI classes.
- Preserve offline-first playback: verify every required asset against its SHA-256 before switching the active manifest. Keep manifest activation atomic.
- Use the existing gRPC/protobuf and Media3 dependencies; do not introduce a parallel HTTP/API contract for backend RPCs.
- For contract changes, edit `backend/proto/`, sync `app/src/main/proto/`, and regenerate clients. Do not edit generated sources manually.
- Add tests for changed use-case behavior where practical. Exercise hardware-, storage-, and stream-dependent behavior on representative devices before claiming it is verified.
