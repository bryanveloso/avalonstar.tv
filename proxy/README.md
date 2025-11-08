# Fly.io Proxy with Tailscale

Reverse proxy connecting Cloudflare to home server (Saya) via Tailscale private network.

## Architecture

```
Browser → Cloudflare (HTTPS/DNS) → Fly.io → Nginx → gost tunnels → Tailscale SOCKS5 → Saya
```

**Key components:**
- **Tailscale**: Private network with OAuth client (never expires)
- **gost**: TCP tunnels routing through SOCKS5 proxy
- **Nginx**: Reverse proxy for HTTP/WebSocket traffic
- **Fly.io**: Cloud hosting (256MB VM in SJC)

## Setup

### 1. Create Tailscale OAuth Client

Go to https://login.tailscale.com/admin/settings/oauth and create a new OAuth client:
- Name: `avalonstar-tv-proxy`
- Scopes: **Auth Keys** (with `tag:container`)
- Save the client ID and secret

### 2. Configure Fly.io Secrets

```bash
cd proxy
flyctl secrets set TAILSCALE_OAUTH_CLIENT_ID=kXXXXXXXXXXXXXXX
flyctl secrets set TAILSCALE_OAUTH_CLIENT_SECRET=tskey-client-XXXXXXXXXX
```

### 3. Deploy

```bash
flyctl deploy --local-only
```

### 4. Add Certificate

```bash
flyctl certs add avalonstar.tv -a avalonstar-tv
flyctl certs check avalonstar.tv -a avalonstar-tv
```

### 5. Configure DNS (Cloudflare)

**DNS Records:**
- AAAA `@` → `2a09:8280:1::ab:ea61:0` (orange cloud enabled)
- Remove any A records when using Cloudflare proxy

**SSL/TLS Mode:**
- Set to "Full" (not Flexible)

## Testing

Frontend: https://avalonstar.tv/
API: https://avalonstar.tv/api/*
WebSocket: wss://avalonstar.tv/ws

## Costs

- Fly.io: ~$2/month (256MB VM, shared IPv4)
- Bandwidth: Free up to 160GB/month
