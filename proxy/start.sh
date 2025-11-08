#!/bin/sh
set -e

echo "Starting Tailscale with userspace networking and SOCKS5 proxy..."

# Create state directory
mkdir -p /var/lib/tailscale

# Start tailscaled with BOTH SOCKS5 and HTTP proxy in the background
tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock --tun=userspace-networking --socks5-server=localhost:1055 --outbound-http-proxy-listen=localhost:1080 &
sleep 5

# Connect to Tailscale
echo "Connecting to Tailscale network..."
tailscale --socket=/var/run/tailscale/tailscaled.sock up \
  --authkey=${TAILSCALE_OAUTH_CLIENT_SECRET} \
  --advertise-tags=tag:container \
  --hostname=fly-avalonstar

echo "Tailscale connected! SOCKS5 proxy available on localhost:1055"

# Wait a bit more for everything to stabilize
sleep 5

echo "Starting gost to create HTTP-to-SOCKS5 tunnel forwards..."
# Frontend: localhost:13001 -> SOCKS5 -> 100.87.170.6:3001
gost -L=tcp://:13001/100.87.170.6:3001 -F=socks5://127.0.0.1:1055 &
# Backend: localhost:18088 -> SOCKS5 -> 100.87.170.6:8088
gost -L=tcp://:18088/100.87.170.6:8088 -F=socks5://127.0.0.1:1055 &

sleep 3

echo "Starting Nginx..."
exec nginx -g 'daemon off;'
