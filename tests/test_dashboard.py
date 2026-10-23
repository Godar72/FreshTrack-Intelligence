"""
tests/test_dashboard.py

Smoke and integration tests for app/dashboard.py components,
cached model/data loaders, and simulation consistency.
"""

from pathlib import Path
import pytest

from app.dashboard import (
    build_forecast_figure,
    get_evaluation_metrics,
    get_historical_context,
    get_trained_model,
)
from src.markdown_rules import calculate_markdown_recommendation
from src.waste_risk import assess_waste_risk


def test_get_trained_model_loading():
    """Verify get_trained_model retrieves valid pipeline and metadata."""
    pipeline, meta = get_trained_model()
    assert pipeline is not None
    assert meta is not None
    assert meta["selected_model"] == "HistGradientBoosting"
    assert "sales" in meta["target_column"]


def test_get_evaluation_metrics_integrity():
    """Verify evaluation_metrics.json loads and contains all benchmarked models."""
    metrics = get_evaluation_metrics()
    assert metrics is not None
    assert "validation_metrics" in metrics
    v_metrics = metrics["validation_metrics"]
    assert "Lag7_Baseline" in v_metrics
    assert "Ridge" in v_metrics
    assert "RandomForest" in v_metrics
    assert "HistGradientBoosting" in v_metrics
    assert v_metrics["HistGradientBoosting"]["wape"] <= v_metrics["Lag7_Baseline"]["wape"]


def test_get_historical_context_smoke():
    """Verify historical dataset loads with continuous dates and Store 1 records."""
    history_df, raw_files = get_historical_context()
    assert history_df is not None
    assert not history_df.empty
    assert history_df["store_nbr"].nunique() == 1
    assert "sales" in history_df.columns
    assert "family" in history_df.columns


def test_dashboard_end_to_end_simulation_integration():
    """
    Test end-to-end pipeline invocation as executed by the dashboard:
    Loads model and history, runs assess_waste_risk, and calculates markdown recommendation.
    """
    pipeline, _ = get_trained_model()
    history_df, _ = get_historical_context()

    # Run for Produce with 2-day shelf life
    waste_res = assess_waste_risk(
        product_family="PRODUCE",
        forecast_origin_date="2017-07-16",
        starting_inventory=5000.0,
        remaining_shelf_life=2,
        store_nbr=1,
        model_pipeline=pipeline,
        history_df=history_df,
    )

    assert waste_res.product_family == "PRODUCE"
    assert len(waste_res.daily_forecasts) == 2
    assert waste_res.cumulative_forecast_demand > 0.0

    # Run markdown recommendation with 5% margin floor
    markdown_res = calculate_markdown_recommendation(
        product_family="PRODUCE",
        risk_category=waste_res.risk_category,
        expected_surplus_units=waste_res.expected_surplus_units,
        unit_price=2.00,
        unit_cost=1.20,
        min_margin_pct=0.05,
    )

    assert markdown_res.original_price == 2.00
    assert markdown_res.final_price >= markdown_res.floor_price
    assert markdown_res.final_discount_pct in [0.0, 15.0, 30.0, 50.0]
    assert len(markdown_res.explanation) > 0


def test_build_forecast_figure_with_timestamps():
    """
    Regression test for TypeError in Plotly with Timestamp x-coordinates:
    Ensures build_forecast_figure generates valid Plotly Figure without
    'TypeError: Addition/subtraction of integers and integer-arrays with Timestamp is no longer supported'.
    """
    pipeline, _ = get_trained_model()
    history_df, _ = get_historical_context()

    origin_date = "2017-07-16"
    shelf_life = 3
    waste_res = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin_date,
        starting_inventory=2800.0,
        remaining_shelf_life=shelf_life,
        store_nbr=1,
        model_pipeline=pipeline,
        history_df=history_df,
    )

    fig = build_forecast_figure(
        history_df=history_df,
        selected_family="DAIRY",
        forecast_origin_date=origin_date,
        waste_assessment=waste_res,
        remaining_shelf_life=shelf_life,
    )

    assert fig is not None
    # Traces: 1 historical trace, 1 forecast trace
    assert len(fig.data) == 2
    assert fig.data[0].name == "Observed Historical Sales"
    assert "Recursive Forecast" in fig.data[1].name

    # Shapes: vertical origin line
    assert len(fig.layout.shapes) == 1
    assert fig.layout.shapes[0].type == "line"
    assert fig.layout.shapes[0].x0 == origin_date
    assert fig.layout.shapes[0].x1 == origin_date

    # Annotations: origin label
    assert len(fig.layout.annotations) == 1
    assert fig.layout.annotations[0].text == "Forecast Origin"

    # Verify JSON serialization succeeds
    fig_json = fig.to_json()
    assert isinstance(fig_json, str)
    assert len(fig_json) > 0

