# Finishes Google Sheets setup: prompts for key file + sheet id, then migrates data.
# Run from backend folder:  .\finish-google-sheets.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "TPSMS - Finish Google Sheets setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$keyPath = Read-Host "Paste full path to your downloaded JSON key file"
$keyPath = $keyPath.Trim().Trim('"')
if (-not (Test-Path $keyPath)) {
  Write-Host "File not found: $keyPath" -ForegroundColor Red
  exit 1
}

$sheetId = Read-Host "Paste your spreadsheet id (from the Google Sheets URL)"
$sheetId = $sheetId.Trim()
if (-not $sheetId) {
  Write-Host "Spreadsheet id is required." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Configuring .env..." -ForegroundColor Yellow
npm run sheets:configure -- $keyPath $sheetId
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Migrating local data to Google Sheets..." -ForegroundColor Yellow
npm run sheets:migrate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Running seed..." -ForegroundColor Yellow
npm run seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Verifying connection..." -ForegroundColor Yellow
npm run sheets:verify
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done! Open your Google Spreadsheet - you should see 4 tabs:" -ForegroundColor Green
Write-Host "  Users | TransporterSettings | PaymentSlips | AuditLogs"
Write-Host ""
Write-Host "Restart the backend:  npm run dev"
Write-Host ""
