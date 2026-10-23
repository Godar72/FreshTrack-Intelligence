"""
tests/test_api.py

Integration and validation tests for the FastAPI backend service (backend/main.py).
Tests all 8 REST endpoints, input bounds, safeguard triggers, and error states.
"""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_api_health():
    """Verify health endpoint returns 200 and indicates model and data readiness."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["historical_records"] > 0
    assert "Store 1" in data["academic_scope"]


def test_api_metadata():
    """Verify metadata returns all 9 perishable families and risk thresholds."""
    response = client.get("/api/metadata")
    assert response.status_code == 200
    data = response.json()
    assert len(data["perishable_families"]) == 9
    assert "PRODUCE" in data["perishable_families"]
    assert "DAIRY" in data["perishable_families"]
    assert data["store"]["store_nbr"] == 1
    assert data["risk_thresholds"]["low_max"] == 0.15


def test_api_metrics():
    """Verify metrics match evaluation_metrics.json."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "validation_metrics" in data
    vm = data["validation_metrics"]
    assert vm["HistGradientBoosting"]["wape"] == 10.69
    assert vm["RandomForest"]["wape"] == 11.29
    assert vm["Ridge"]["wape"] == 13.08
    assert vm["Lag7_Baseline"]["wape"] == 14.56


def test_api_historical_sales():
    """Verify historical sales retrieval for valid family."""
    response = client.get("/api/historical-sales?family=PRODUCE&days=14&end_date=2017-07-16")
    assert response.status_code == 200
    data = response.json()
    assert data["product_family"] == "PRODUCE"
    assert data["count"] == 14
    assert len(data["series"]) == 14
    assert "sales" in data["series"][0]


def test_api_historical_sales_invalid_family():
    """Verify rejection of unsupported family."""
    response = client.get("/api/historical-sales?family=ELECTRONICS")
    assert response.status_code == 400


def test_api_forecast():
    """Verify recursive forecast endpoint."""
    payload = {
        "product_family": "PRODUCE",
        "forecast_origin_date": "2017-07-16",
        "horizon_days": 14,
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["product_family"] == "PRODUCE"
    assert len(data["daily_forecasts"]) == 14
    assert data["cumulative_demand"] > 0
    assert data["peak_day"] is not None


def test_api_forecast_bounds_validation():
    """Verify rejection of horizon out of bounds (> 30)."""
    payload = {
        "product_family": "PRODUCE",
        "forecast_origin_date": "2017-07-16",
        "horizon_days": 45,
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 422 # Pydantic validation error


def test_api_simulate_risk():
    """Verify inventory risk simulation endpoint."""
    payload = {
        "product_family": "DAIRY",
        "starting_inventory": 3000.0,
        "remaining_shelf_life_days": 4,
        "forecast_origin_date": "2017-07-16",
    }
    response = client.post("/api/simulate-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["product_family"] == "DAIRY"
    assert "expected_surplus_units" in data
    assert "risk_category" in data
    assert data["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]


def test_api_markdown_recommendation_approved():
    """Verify approved markdown when price clears margin floor."""
    payload = {
        "product_family": "PRODUCE",
        "risk_category": "CRITICAL",
        "expected_surplus_units": 500.0,
        "unit_price": 2.99,
        "unit_cost": 1.20,
        "min_margin_pct": 0.15,
    }
    response = client.post("/api/markdown-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["proposed_discount_pct"] == 50.0
    assert data["final_discount_pct"] == 50.0
    assert data["margin_safeguard_triggered"] is False
    assert data["final_price"] >= data["floor_price"]


def test_api_markdown_recommendation_safeguard_intervention():
    """Verify safeguard intervention and downgrade when discount breaches margin floor."""
    # Unit cost 3.20, price 4.50, min margin 10% -> Floor = 3.20 * 1.10 = 3.52
    # Proposed 50% discount -> 2.25 < 3.52 (Breach!)
    # Permissible tier: 15% discount -> 4.50 * 0.85 = 3.83 >= 3.52 (Compliant!)
    payload = {
        "product_family": "PRODUCE",
        "risk_category": "CRITICAL",
        "expected_surplus_units": 600.0,
        "unit_price": 4.50,
        "unit_cost": 3.20,
        "min_margin_pct": 0.10,
    }
    response = client.post("/api/markdown-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["margin_safeguard_triggered"] is True
    assert data["proposed_discount_pct"] == 50.0
    assert data["final_discount_pct"] == 15.0
    assert data["final_price"] >= data["floor_price"]
    assert data["final_price"] == pytest.approx(3.83, abs=0.02)


def test_api_overview_data():
    """Verify overview data returns calculated simulation for all 9 families."""
    response = client.get("/api/overview-data?origin_date=2017-07-16&min_margin=0.15")
    assert response.status_code == 200
    data = response.json()
    assert data["family_count"] == 9
    assert len(data["families"]) == 9
    assert data["total_simulated_surplus_units"] >= 0
    # Check PRODUCE row
    produce = next(f for f in data["families"] if f["product_family"] == "PRODUCE")
    assert produce["configured_stock"] == 2400.0
    assert produce["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
