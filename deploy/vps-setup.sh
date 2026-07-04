#!/bin/bash
# One-time setup on an Ubuntu VPS (Oracle Cloud free tier, etc.)
# Run as root on the server after cloning the repo.
set -euo pipefail

echo "=== TPSMS always-on VPS setup ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Installing Docker Compose plugin..."
  apt-get update && apt-get install -y docker-compose-plugin
fi

if [ ! -f backend/.env ]; then
  echo ""
  echo "ERROR: backend/.env not found on the server."
  echo "Copy your local backend/.env (with GOOGLE_* credentials) first:"
  echo "  scp backend/.env user@SERVER_IP:~/TransportMobileApp/backend/.env"
  exit 1
fi

echo "Building and starting containers (restart: always)..."
docker compose up -d --build

# Allow web traffic if ufw is enabled (optional on Oracle Ubuntu images)
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 22/tcp
fi

echo ""
echo "=== Done ==="
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "App:    http://${PUBLIC_IP}"
echo "Health: http://${PUBLIC_IP}/health"
echo ""
echo "Containers auto-restart on reboot. Check: docker compose ps"
