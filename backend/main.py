"""
backend/main.py

FastAPI REST Service for FreshTrack Intelligence:
AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System.

Integrates existing Python forecasting and simulation modules:
- src.preprocessing (Kaggle Store Sales, 9 perishable families, calendar features)
- src.train (HistGradientBoosting model persistence)
- src.waste_risk (Recursive multi-step forecaster, surplus quantification, risk classification)
- src.markdown_rules (Rule-based discount tiers and margin-safeguard cost floor protection)
"""

import os
import sys
import json
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional

# Suppress loky sub-process wmic search warning on Windows
os.environ["LOKY_MAX_CPU_COUNT"] = "4"
warnings.filterwarnings("ignore", category=UserWarning)

# Ensure project root is in Python sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from src.preprocessing import DEFAULT_PERISHABLE_FAMILIES
from src.train import load_trained_forecast_model
from src.waste_risk import (
    WasteRiskAssessment,
    WasteRiskThresholds,
    assess_waste_risk,
    load_historical_series,
)
from src.markdown_rules import (
    DEFAULT_DISCOUNT_TIERS,
    MarkdownRecommendation,
    calculate_markdown_recommendation,
)

# -----------------------------------------------------------------------------
# FastAPI App Initialization & CORS Configuration
# -----------------------------------------------------------------------------
app = FastAPI(
    title="FreshTrack Intelligence API",
    description="Backend decision-support API for perishable grocery demand forecasting, inventory risk simulation, and dynamic markdown recommendations.",
    version="1.4.0",
)

# CORS configuration: configurable via ALLOWED_ORIGINS environment variable
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    ALLOWED_ORIGINS = [orig.strip() for orig in env_origins.split(",") if orig.strip()]
else:
    ALLOWED_ORIGINS = [
        "https://fresh-track-intelligence.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8501",  # Streamlit if needed
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# In-Memory Model & Data Cache
# -----------------------------------------------------------------------------
MODEL_PIPELINE = None
MODEL_METADATA = None
HISTORICAL_DF = None
RAW_FILES = None
EVALUATION_METRICS = None

def get_loaded_resources():
    global MODEL_PIPELINE, MODEL_METADATA, HISTORICAL_DF, RAW_FILES, EVALUATION_METRICS
    
    if MODEL_PIPELINE is None:
        model_path = PROJECT_ROOT / "models" / "demand_forecast_model.joblib"
        if not model_path.is_file():
            raise RuntimeError(f"Trained model not found at {model_path}")
        MODEL_PIPELINE, MODEL_METADATA = load_trained_forecast_model(model_path)
    
    if HISTORICAL_DF is None:
        HISTORICAL_DF, RAW_FILES = load_historical_series(
            data_dir=PROJECT_ROOT / "data" / "raw",
            store_nbr=1,
            start_date="2016-01-01",
            end_date="2017-08-15",
        )
    
    if EVALUATION_METRICS is None:
        metrics_path = PROJECT_ROOT / "models" / "evaluation_metrics.json"
        if metrics_path.is_file():
            with open(metrics_path, "r", encoding="utf-8") as f:
                EVALUATION_METRICS = json.load(f)
        else:
            EVALUATION_METRICS = {}

    return MODEL_PIPELINE, HISTORICAL_DF, EVALUATION_METRICS

# Pre-load on startup
@app.on_event("startup")
def startup_event():
    try:
        get_loaded_resources()
    except Exception as e:
        print(f"Warning during startup pre-loading: {e}")

# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------
class ForecastRequest(BaseModel):
    product_family: str = Field(..., description="One of the 9 perishable families")
    forecast_origin_date: str = Field("2017-07-16", description="Origin date for recursive forecast (YYYY-MM-DD)")
    horizon_days: int = Field(14, ge=1, le=30, description="Forecast horizon in days (1 to 30)")

    @field_validator("product_family")
    @classmethod
    def validate_family(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in DEFAULT_PERISHABLE_FAMILIES:
            raise ValueError(f"Unsupported product family: '{v}'. Must be one of: {DEFAULT_PERISHABLE_FAMILIES}")
        return v_upper

class RiskSimulationRequest(BaseModel):
    product_family: str = Field(..., description="One of the 9 perishable families")
    starting_inventory: float = Field(..., gt=0, le=50000, description="User-configured starting inventory units")
    remaining_shelf_life_days: int = Field(..., ge=1, le=30, description="Days until batch expiration")
    forecast_origin_date: str = Field("2017-07-16", description="Origin date (YYYY-MM-DD)")

    @field_validator("product_family")
    @classmethod
    def validate_family(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in DEFAULT_PERISHABLE_FAMILIES:
            raise ValueError(f"Unsupported product family: '{v}'. Must be one of: {DEFAULT_PERISHABLE_FAMILIES}")
        return v_upper

class MarkdownRequest(BaseModel):
    product_family: str = Field(..., description="Perishable category name")
    risk_category: str = Field(..., description="LOW, MODERATE, HIGH, or CRITICAL")
    expected_surplus_units: float = Field(..., ge=0, description="Projected unsold units")
    unit_price: float = Field(..., gt=0, description="Regular selling price MSRP")
    unit_cost: float = Field(..., ge=0, description="Wholesale procurement cost")
    min_margin_pct: float = Field(0.15, ge=0.0, le=1.0, description="Minimum margin floor percentage (e.g. 0.15)")

    @field_validator("risk_category")
    @classmethod
    def validate_risk(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in ["LOW", "MODERATE", "HIGH", "CRITICAL"]:
            raise ValueError(f"Invalid risk category: '{v}'. Must be LOW, MODERATE, HIGH, or CRITICAL")
        return v_upper

# -----------------------------------------------------------------------------
# REST Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/health")
def health_check():
    """System health check and readiness status."""
    try:
        model, history_df, metrics = get_loaded_resources()
        return {
            "status": "healthy",
            "service": "FreshTrack Intelligence API",
            "version": "1.4.0",
            "model_loaded": model is not None,
            "historical_records": len(history_df) if history_df is not None else 0,
            "academic_scope": "Store 1 (Quito, Pichincha, Ecuador) · Kaggle Store Sales benchmark",
        }
    except Exception as e:
        import traceback
        return {
            "status": "degraded",
            "error": str(e),
            "traceback": traceback.format_exc(),
        }

@app.get("/api/metadata")
def get_metadata():
    """Metadata regarding dataset scope, perishable families, and rule parameters."""
    return {
        "dataset": "Kaggle Store Sales - Time Series Forecasting (2013-2017)",
        "store": {
            "store_nbr": 1,
            "city": "Quito",
            "state": "Pichincha",
            "country": "Ecuador",
            "type": "D",
            "cluster": 13,
        },
        "perishable_families": DEFAULT_PERISHABLE_FAMILIES,
        "default_origin_date": "2017-07-16",
        "validation_period": {
            "start": "2017-07-17",
            "end": "2017-08-15",
            "total_days": 30,
            "total_samples": 270,
        },
        "risk_thresholds": {
            "low_max": 0.15,
            "moderate_max": 0.40,
            "high_max": 0.65,
        },
        "discount_tiers": DEFAULT_DISCOUNT_TIERS,
    }

@app.get("/api/metrics")
def get_metrics():
    """Model evaluation metrics from the empirical 30-day chronological holdout benchmark."""
    _, _, metrics = get_loaded_resources()
    return metrics

@app.get("/api/historical-sales")
def get_historical_sales(
    family: str = Query("PRODUCE", description="Perishable product family"),
    days: int = Query(30, ge=7, le=90, description="Trailing days of observations"),
    end_date: str = Query("2017-07-16", description="Anchor date for historical slice"),
):
    """Retrieve historical daily point-of-sale observations for a given family."""
    fam_upper = family.strip().upper()
    if fam_upper not in DEFAULT_PERISHABLE_FAMILIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported family '{family}'. Must be one of {DEFAULT_PERISHABLE_FAMILIES}",
        )

    _, history_df, _ = get_loaded_resources()
    fam_df = history_df[history_df["family"] == fam_upper].sort_values("date")
    slice_df = fam_df[fam_df["date"] <= end_date].tail(days)

    records = [
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "sales": float(row["sales"]),
            "onpromotion": int(row.get("onpromotion", 0)),
            "day_of_week": int(row["date"].weekday()),
        }
        for _, row in slice_df.iterrows()
    ]

    return {
        "product_family": fam_upper,
        "count": len(records),
        "start_date": records[0]["date"] if records else None,
        "end_date": records[-1]["date"] if records else None,
        "series": records,
    }

@app.post("/api/forecast")
def generate_forecast(req: ForecastRequest):
    """
    Execute recursive multi-step forecasting across requested horizon.
    """
    model, history_df, _ = get_loaded_resources()

    try:
        # Run assess_waste_risk with dummy stock to get daily forecasts
        assessment = assess_waste_risk(
            product_family=req.product_family,
            forecast_origin_date=req.forecast_origin_date,
            starting_inventory=10000.0,
            remaining_shelf_life=req.horizon_days,
            store_nbr=1,
            model_pipeline=model,
            history_df=history_df,
        )

        daily_forecasts = assessment.daily_forecasts
        cumulative_demand = round(assessment.cumulative_forecast_demand, 1)
        daily_average = round(cumulative_demand / len(daily_forecasts), 1) if daily_forecasts else 0.0

        # Find peak projected day
        peak_step = max(daily_forecasts, key=lambda x: x["predicted_demand"]) if daily_forecasts else None

        return {
            "product_family": req.product_family,
            "forecast_origin_date": req.forecast_origin_date,
            "horizon_days": req.horizon_days,
            "cumulative_demand": cumulative_demand,
            "daily_average_demand": daily_average,
            "peak_day": peak_step,
            "daily_forecasts": daily_forecasts,
            "model_architecture": "HistGradientBoosting",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast generation failed: {str(e)}",
        )

@app.post("/api/simulate-risk")
def simulate_waste_risk(req: RiskSimulationRequest):
    """
    Simulate spoilage vulnerability by evaluating on-hand inventory
    and remaining shelf life against recursive demand curves.
    """
    model, history_df, _ = get_loaded_resources()

    try:
        assessment = assess_waste_risk(
            product_family=req.product_family,
            forecast_origin_date=req.forecast_origin_date,
            starting_inventory=req.starting_inventory,
            remaining_shelf_life=req.remaining_shelf_life_days,
            store_nbr=1,
            model_pipeline=model,
            history_df=history_df,
        )

        return assessment.to_dict()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}",
        )

@app.post("/api/markdown-recommendation")
def calculate_markdown(req: MarkdownRequest):
    """
    Compute dynamic markdown recommendation with mathematical margin floor safeguard.
    """
    try:
        recommendation = calculate_markdown_recommendation(
            product_family=req.product_family,
            risk_category=req.risk_category,
            expected_surplus_units=req.expected_surplus_units,
            unit_price=req.unit_price,
            unit_cost=req.unit_cost,
            min_margin_pct=req.min_margin_pct,
        )

        return recommendation.to_dict()
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Markdown calculation failed: {str(e)}",
        )

# -----------------------------------------------------------------------------
# Aggregated Overview Data (Powers Screen 1 & Screen 6)
# -----------------------------------------------------------------------------
DEFAULT_SCENARIO_CONFIGS: Dict[str, Dict[str, Any]] = {
    "PRODUCE": {
        "stock": 2400.0,
        "shelf_life": 4,
        "unit_price": 2.99,
        "unit_cost": 1.20,
        "description": "High perishability · leafy greens and fruits",
    },
    "DAIRY": {
        "stock": 1850.0,
        "shelf_life": 7,
        "unit_price": 3.49,
        "unit_cost": 1.60,
        "description": "Temperature-sensitive · milk, yogurt, butter",
    },
    "BREAD/BAKERY": {
        "stock": 920.0,
        "shelf_life": 3,
        "unit_price": 4.50,
        "unit_cost": 2.20,
        "description": "Rapid staling curve · artisanal loaves",
    },
    "MEATS": {
        "stock": 1450.0,
        "shelf_life": 5,
        "unit_price": 5.80,
        "unit_cost": 3.50,
        "description": "Cold chain critical · beef and pork cuts",
    },
    "POULTRY": {
        "stock": 1200.0,
        "shelf_life": 4,
        "unit_price": 4.20,
        "unit_cost": 2.50,
        "description": "Strict shelf expiry · fresh chicken portions",
    },
    "DELI": {
        "stock": 880.0,
        "shelf_life": 6,
        "unit_price": 4.80,
        "unit_cost": 3.00,
        "description": "Prepared charcuterie and sliced cheeses",
    },
    "EGGS": {
        "stock": 1600.0,
        "shelf_life": 18,
        "unit_price": 2.50,
        "unit_cost": 1.80,
        "description": "Refrigerated crate goods · resilient shelf life",
    },
    "SEAFOOD": {
        "stock": 420.0,
        "shelf_life": 2,
        "unit_price": 6.50,
        "unit_cost": 4.50,
        "description": "High turn requirement · fresh catch",
    },
    "PREPARED FOODS": {
        "stock": 510.0,
        "shelf_life": 2,
        "unit_price": 3.80,
        "unit_cost": 2.20,
        "description": "Ready-to-eat deli meals and salad bar items",
    },
}

@app.get("/api/overview-data")
def get_overview_data(
    origin_date: str = Query("2017-07-16", description="Anchor origin date (YYYY-MM-DD)"),
    min_margin: float = Query(0.15, description="Global minimum margin floor"),
):
    """
    Computes real-time simulations across all 9 perishable families for the Overview table.
    """
    model, history_df, _ = get_loaded_resources()

    results = []
    total_simulated_surplus = 0.0

    for family in DEFAULT_PERISHABLE_FAMILIES:
        cfg = DEFAULT_SCENARIO_CONFIGS.get(family, {
            "stock": 1000.0,
            "shelf_life": 4,
            "unit_price": 3.00,
            "unit_cost": 1.50,
            "description": "Perishable category",
        })

        assessment = assess_waste_risk(
            product_family=family,
            forecast_origin_date=origin_date,
            starting_inventory=cfg["stock"],
            remaining_shelf_life=cfg["shelf_life"],
            store_nbr=1,
            model_pipeline=model,
            history_df=history_df,
        )

        markdown = calculate_markdown_recommendation(
            product_family=family,
            risk_category=assessment.risk_category,
            expected_surplus_units=assessment.expected_surplus_units,
            unit_price=cfg["unit_price"],
            unit_cost=cfg["unit_cost"],
            min_margin_pct=min_margin,
        )

        total_simulated_surplus += assessment.expected_surplus_units

        results.append({
            "product_family": family,
            "description": cfg["description"],
            "configured_stock": cfg["stock"],
            "shelf_life_days": cfg["shelf_life"],
            "horizon_forecast": round(assessment.cumulative_forecast_demand, 1),
            "expected_surplus": round(assessment.expected_surplus_units, 1),
            "surplus_percentage": round(assessment.surplus_percentage, 1),
            "risk_category": assessment.risk_category,
            "unit_price": cfg["unit_price"],
            "unit_cost": cfg["unit_cost"],
            "recommended_discount_pct": markdown.final_discount_pct,
            "recommended_price": markdown.final_price,
            "margin_safeguard_triggered": markdown.margin_safeguard_triggered,
            "explanation": markdown.explanation,
        })

    return {
        "origin_date": origin_date,
        "min_margin_pct": min_margin,
        "total_simulated_surplus_units": round(total_simulated_surplus, 1),
        "family_count": len(results),
        "families": results,
    }

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host=host, port=port)
