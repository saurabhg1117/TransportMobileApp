# Start TPSMS at home with a free public link (no credit card).
# Requires: Docker Desktop running
#
# Usage:
#   .\deploy\start-home-server.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "TPSMS - Home server (no credit card)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check Docker
try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host ""
    Write-Host "Docker is not running. Install Docker Desktop first:" -ForegroundColor Red
    Write-Host "  https://www.docker.com/products/docker-desktop/"
    exit 1
}

if (-not (Test-Path (Join-Path $ProjectRoot "backend\.env"))) {
    Write-Host "ERROR: backend\.env not found. Configure Google Sheets first." -ForegroundColor Red
    exit 1
}

Set-Location $ProjectRoot
Write-Host "Starting Docker stack (api + web)..."
docker compose up -d --build

Write-Host ""
Write-Host "Local app:  http://localhost" -ForegroundColor Green
Write-Host "Health:     http://localhost/health" -ForegroundColor Green
Write-Host ""

# Check cloudflared
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "Install Cloudflare Tunnel for a public HTTPS link (free, no credit card):" -ForegroundColor Yellow
    Write-Host "  winget install Cloudflare.cloudflared"
    Write-Host ""
    Write-Host "Then run:"
    Write-Host "  cloudflared tunnel --url http://localhost:80"
    Write-Host ""
    exit 0
}

Write-Host "Starting public tunnel (copy the https://....trycloudflare.com URL)..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the tunnel. Docker keeps running in background." -ForegroundColor Yellow
Write-Host ""
cloudflared tunnel --url http://localhost:80
