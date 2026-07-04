# Opens the Google Cloud / Sheets pages needed for TPSMS setup.
# Run from the backend folder:  .\setup-google-sheets.ps1

Write-Host ""
Write-Host "TPSMS - Google Sheets setup (opens browser tabs)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Follow these tabs in order:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  TAB 1  Enable Google Sheets API"
Write-Host "         -> Click ENABLE on the API page"
Write-Host ""
Write-Host "  TAB 2  Create a service account"
Write-Host "         -> Create account (name: tpsms)"
Write-Host "         -> Keys -> Add key -> JSON -> download the file"
Write-Host ""
Write-Host "  TAB 3  Create your spreadsheet"
Write-Host "         -> New blank spreadsheet"
Write-Host "         -> Copy the id from the URL after /d/"
Write-Host ""
Write-Host "  TAB 4  Share spreadsheet with the service account"
Write-Host "         -> Open the downloaded JSON, copy client_email"
Write-Host "         -> Share spreadsheet with that email as Editor"
Write-Host ""
Write-Host "Then run (replace paths/ids):" -ForegroundColor Green
Write-Host '  npm run sheets:configure -- "C:\path\to\key.json" YOUR_SPREADSHEET_ID'
Write-Host "  npm run sheets:migrate"
Write-Host "  npm run sheets:verify"
Write-Host "  npm run dev"
Write-Host ""

$urls = @(
  "https://console.cloud.google.com/apis/library/sheets.googleapis.com",
  "https://console.cloud.google.com/iam-admin/serviceaccounts",
  "https://sheets.google.com/create",
  "https://support.google.com/docs/answer/2494822"
)

foreach ($url in $urls) {
  Start-Process $url
  Start-Sleep -Milliseconds 800
}

Write-Host "Opened $($urls.Count) browser tabs." -ForegroundColor Cyan
Write-Host "When done, send your JSON file path and spreadsheet id in Cursor chat."
Write-Host ""
