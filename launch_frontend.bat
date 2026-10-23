@echo off
cd /d "%~dp0frontend"
echo ============================================================
echo Starting FreshTrack Intelligence Next.js Frontend
echo Frontend Directory: %cd%
echo Local Website URL:  http://localhost:3000
echo Reverse Proxy to:   http://127.0.0.1:8000
echo ============================================================
npm run start -- -p 3000
pause
