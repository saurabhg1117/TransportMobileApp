# Upload TPSMS to Oracle Cloud VPS from Windows.
# Usage:
#   .\deploy\upload-to-vps.ps1 -ServerIP "129.146.x.x" -SshKey "C:\Users\saura\Downloads\ssh-key.key"

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIP,

    [Parameter(Mandatory = $true)]
    [string]$SshKey,

    [string]$User = "ubuntu"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$ZipPath = Join-Path $env:TEMP "tpsms-deploy.zip"
$EnvFile = Join-Path $ProjectRoot "backend\.env"

Write-Host ""
Write-Host "TPSMS - Upload to Oracle VPS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

if (-not (Test-Path $SshKey)) {
    Write-Error "SSH key not found: $SshKey"
}
if (-not (Test-Path $EnvFile)) {
    Write-Error "backend\.env not found. Configure Google Sheets first."
}

# Build zip excluding heavy/secret folders
Write-Host "Creating deployment zip..."
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$staging = Join-Path $env:TEMP "tpsms-staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$exclude = @('node_modules', '.git', 'dist', 'data', '.expo', 'web-build')
Get-ChildItem $ProjectRoot | ForEach-Object {
    if ($exclude -contains $_.Name) { return }
    Copy-Item $_.FullName -Destination (Join-Path $staging $_.Name) -Recurse -Force
}

Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $ZipPath -Force
Remove-Item $staging -Recurse -Force

$zipMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host "  Zip size: ${zipMb} MB"

Write-Host "Uploading to ${User}@${ServerIP}..."
scp -i $SshKey -o StrictHostKeyChecking=accept-new $ZipPath "${User}@${ServerIP}:~/tpsms-deploy.zip"
scp -i $SshKey $EnvFile "${User}@${ServerIP}:~/backend.env"

Write-Host ""
Write-Host "Upload complete. Now SSH in and run setup:" -ForegroundColor Green
Write-Host ""
Write-Host "  ssh -i `"$SshKey`" ${User}@${ServerIP}"
Write-Host ""
Write-Host "Then on the server:"
Write-Host @"

  sudo apt-get update && sudo apt-get install -y unzip
  rm -rf ~/TransportMobileApp
  mkdir -p ~/TransportMobileApp
  unzip -o ~/tpsms-deploy.zip -d ~/TransportMobileApp
  mv ~/backend.env ~/TransportMobileApp/backend/.env
  cd ~/TransportMobileApp
  chmod +x deploy/vps-setup.sh
  sudo ./deploy/vps-setup.sh

"@
Write-Host "Open: http://${ServerIP}" -ForegroundColor Cyan
Write-Host ""
