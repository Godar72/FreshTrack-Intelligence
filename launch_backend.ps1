Set-Location $PSScriptRoot
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Starting FreshTrack Intelligence FastAPI Backend" -ForegroundColor Green
Write-Host "Project Directory: $(Get-Location)"
Write-Host "Backend API URL:   http://127.0.0.1:8000"
Write-Host "Health Check:      http://127.0.0.1:8000/api/health"
Write-Host "Swagger Docs:      http://127.0.0.1:8000/docs"
Write-Host "============================================================" -ForegroundColor Green
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
