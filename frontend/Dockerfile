# Build stage
FROM oven/bun:1-slim AS builder
WORKDIR /app

COPY package.json bun.lock* ./
COPY frontend/package.json ./frontend/
RUN bun install --frozen-lockfile

COPY frontend ./frontend
WORKDIR /app/frontend
RUN bun run build

# Runner stage
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Copy built assets and server
COPY --from=builder /app/frontend/dist ./dist
COPY frontend/server.ts ./

# Set permissions for non-root user
RUN chown -R bun:bun /app
USER bun

ENV DIST_PATH="./dist"
EXPOSE 3000

CMD ["bun", "run", "server.ts"]