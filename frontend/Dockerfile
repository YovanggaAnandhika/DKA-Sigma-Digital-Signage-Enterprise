FROM oven/bun:latest AS deps

WORKDIR /home/app
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:latest AS builder

WORKDIR /home/app
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

USER 10001:10001
CMD ["bun", "server.js"]
