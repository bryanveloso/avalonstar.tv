FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lock* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN bun install --frozen-lockfile

COPY backend/src ./backend/src

WORKDIR /app/backend

EXPOSE 8088

CMD ["bun", "src/index.ts"]
