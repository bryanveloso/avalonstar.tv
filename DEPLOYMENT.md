# Deployment Architecture

## Overview

This project uses **automated deployment via GitHub Actions** to a Mac Mini ("Saya") running OrbStack.

## ⚠️ IMPORTANT: NO MANUAL DEPLOYMENT COMMANDS

**DO NOT** run `docker-compose` commands manually on Saya. Deployment is **100% automated** via GitHub Actions.

## How It Works

### 1. Push to `main` Triggers Deployment

When code is pushed to the `main` branch:

1. **Deploy** (Self-hosted runner on Saya):
   - Checks which files changed (backend/, frontend/, or infrastructure)
   - Builds only the changed services using `docker compose up --build -d <service>`
   - Services restart automatically with new versions
   - Cleans up old Docker images

### 2. Architecture Components

```
┌─────────────────┐
│  Developer      │
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Saya (Mac Mini + OrbStack)     │
│  Self-hosted GitHub Runner      │
│  - Checkout code                │
│  - Build changed services       │
│  - Run docker compose up -d     │
│  - Clean old images             │
└─────────────────────────────────┘
```

### 3. Why This Architecture?

- **Simplicity**: Direct build and deploy on target server
- **Selective rebuilds**: Only changed services are rebuilt
- **GitOps workflow**: Infrastructure as code via `docker-compose.yml`
- **Self-contained**: No external dependencies or registries
- **Resource efficient**: Builds only what changed

## For AI Assistants (Claude, etc.)

When helping with this project:

- ✅ **DO**: Suggest changes to `.github/workflows/deploy.yml`
- ✅ **DO**: Suggest changes to `docker-compose.yml`
- ✅ **DO**: Explain how the automated deployment works
- ✅ **DO**: Use `docker exec`, `docker logs`, `docker ps` when user is SSH'd into Saya for debugging
- ❌ **DO NOT**: Tell the user to run `docker-compose` commands on Saya
- ❌ **DO NOT**: Tell the user to manually deploy
- ❌ **DO NOT**: Suggest `docker-compose` when SSH'd into Saya

**The GitHub Actions self-hosted runner handles ALL deployment operations automatically. When SSH'd into Saya, use `docker` commands only.**

## Manual Operations (If Needed)

If you absolutely must intervene on Saya via SSH:

```bash
# View running containers
docker ps

# View logs (find container name from docker ps first)
docker logs -f <container_name>

# Get a shell in a running container
docker exec -it <container_name> sh

# Restart a container (if needed)
docker restart <container_name>
```

## Environment Variables

Production environment variables are configured in:
- `.github/workflows/deploy.yml` (workflow env vars)
- GitHub Secrets (sensitive values like `JWT_SECRET`)
- Generated `.env` file in `backend/` during deployment

Local development uses `.env` files in `backend/` and `frontend/`.

## Services

- **Backend**: Elysia/Bun API on port 8088
- **Frontend**: React SPA on port 3000
- **Exposure**: Cloudflare Tunnel (`avalonstar.tv`)

## Network Architecture

```
Internet
    │
    ▼
Cloudflare Tunnel
    │
    ├─> frontend:3000 (React SPA)
    └─> backend:8088 (API + WebSocket relay)
            │
            ├─> Elsydeon (100.87.170.6:3000) - Quotes
            └─> Synthform (100.87.170.6:7175) - Everything else
```
