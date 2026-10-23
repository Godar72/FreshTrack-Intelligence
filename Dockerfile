# Production Dockerfile for FreshTrack Intelligence FastAPI Backend Service
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies including curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application modules and necessary runtime artifacts
COPY src/ ./src/
COPY backend/ ./backend/
COPY models/demand_forecast_model.joblib ./models/demand_forecast_model.joblib
COPY models/evaluation_metrics.json ./models/evaluation_metrics.json
COPY data/raw/stores.csv ./data/raw/stores.csv
COPY data/raw/holidays_events.csv ./data/raw/holidays_events.csv
COPY data/processed/ ./data/processed/

# Create non-privileged service user for security
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

CMD ["sh", "-c", "uvicorn backend.main:app --host ${HOST} --port ${PORT}"]
