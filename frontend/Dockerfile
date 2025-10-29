# Build stage
FROM oven/bun:1-slim AS builder
WORKDIR /app

COPY package.json bun.lock* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN bun install --frozen-lockfile

COPY frontend ./frontend
WORKDIR /app/frontend

# Accept build args for Vite env vars
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

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