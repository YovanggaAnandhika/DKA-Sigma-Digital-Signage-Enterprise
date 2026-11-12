FROM oven/bun:latest AS deps

WORKDIR /home/app
RUN apt-get update
RUN apt-get install -y --no-install-recommends nodejs
RUN rm -rf /var/lib/apt/lists/*
COPY frontend/package.json frontend/bun.lock ./
COPY frontend/scripts/generate_grpc.ts ./scripts/generate_grpc.ts
COPY backend/proto/ /home/backend/proto/
RUN bun install --frozen-lockfile

FROM oven/bun:latest AS builder

WORKDIR /home/app
RUN apt-get update
RUN apt-get install -y --no-install-recommends nodejs
RUN rm -rf /var/lib/apt/lists/*
COPY --from=deps /home/app/node_modules ./node_modules
COPY frontend/ ./
COPY backend/proto/ /home/backend/proto/
RUN bun scripts/generate_grpc.ts
RUN bun run build

FROM oven/bun:latest AS runner

WORKDIR /home/app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=80 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=10001:10001 /home/app/public ./public
COPY --from=builder --chown=10001:10001 /home/app/.next/standalone ./
COPY --from=builder --chown=10001:10001 /home/app/.next/static ./.next/static
COPY --chown=10001:10001 frontend/package.json ./package.json

USER 10001:10001
CMD ["bun", "."]
