Set-Location (Join-Path $PSScriptRoot "frontend")
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Starting FreshTrack Intelligence Next.js Frontend" -ForegroundColor Green
Write-Host "Frontend Directory: $(Get-Location)"
Write-Host "Local Website URL:  http://localhost:3000"
Write-Host "Reverse Proxy to:   http://127.0.0.1:8000"
Write-Host "============================================================" -ForegroundColor Green
npm run start -- -p 3000
