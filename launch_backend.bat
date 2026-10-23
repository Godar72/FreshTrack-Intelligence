@echo off
cd /d "%~dp0"
echo ============================================================
echo Starting FreshTrack Intelligence FastAPI Backend
echo Project Directory: %cd%
echo Backend API URL:   http://127.0.0.1:8000
echo Health Check:      http://127.0.0.1:8000/api/health
echo Swagger Docs:      http://127.0.0.1:8000/docs
echo ============================================================
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
