# Android Player Guidelines

These rules supplement the repository-root `AGENTS.md`.

## Directory Pattern

- `app/src/main/java/com/dkaapis/sigma/presentation/`: activities, view models, player UI, and player flows.
- `domain/model/`, `domain/repository/`, `domain/usecase/`: platform-independent models, repository contracts, and use cases.
- `data/repository/`, `data/local/`, `data/grpc/`: repository implementations, persistent/cache storage, and gRPC/network adapters.
- `service/`: Android lifecycle, boot, foreground, and watchdog services.
- `renderers/`: zone-specific playback/rendering.
- Protobuf inputs: consumed directly from the repository's `backend/proto/` by the Android Gradle protobuf plugin; do not create or copy `.proto` files under `android/`.
- `app/src/test/` and `app/src/androidTest/`: local JVM and device/instrumentation tests.

## Implementation Rules

- Keep UI/lifecycle concerns in `presentation/` or `service/`; put playback/business decisions in use cases and repository contracts in `domain/`.
- Implement network, disk cache, and gRPC details in `data/`; do not move transport or storage code into UI classes.
- Preserve offline-first playback: verify every required asset against its SHA-256 before switching the active manifest. Keep manifest activation atomic.
- Use the existing gRPC/protobuf and Media3 dependencies; do not introduce a parallel HTTP/API contract for backend RPCs.
- For contract changes, edit `backend/proto/` only, then regenerate Android clients through Gradle. Do not duplicate proto sources or edit generated code manually.
- Add tests for changed use-case behavior where practical. Exercise hardware-, storage-, and stream-dependent behavior on representative devices before claiming it is verified.

## Verification Commands

- From `android/`, verification is limited to `./gradlew :app:check` and `./gradlew :app:assemble`.
- Do not run debug-variant tasks (including `assembleDebug`) or the `build` task.
