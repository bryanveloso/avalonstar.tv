# Development Setup

## Prerequisites
- Bun installed

## Setup

```bash
# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install all dependencies
bun install

# Run both backend and frontend
bun dev
```

Or run them separately:
```bash
bun dev:backend    # Backend only
bun dev:frontend   # Frontend only
```

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8088
- Backend WebSocket: ws://localhost:8088/ws

## Project Structure
```
avalonstar.tv/
├── backend/          # Elysia API server
│   ├── src/
│   │   └── index.ts  # API routes + WebSocket relay
│   └── Dockerfile
├── frontend/         # React + TanStack Router
│   ├── src/
│   │   ├── routes/   # File-based routing
│   │   └── main.tsx
│   ├── server.ts     # Bun static file server
│   └── Dockerfile
└── docker-compose.yml
```
