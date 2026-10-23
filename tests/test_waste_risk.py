"""
tests/test_waste_risk.py

Unit tests for perishable inventory waste risk quantification,
recursive multi-step forecasting, and leakage prevention.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.dummy import DummyRegressor
from sklearn.pipeline import Pipeline

from src.waste_risk import (
    WasteRiskAssessment,
    WasteRiskThresholds,
    assess_waste_risk,
    recursive_multistep_forecast,
)


@pytest.fixture
def mock_trained_pipeline():
    """A mock pipeline that returns a constant demand prediction of 50.0 units."""
    dummy = DummyRegressor(strategy="constant", constant=50.0)
    dummy.fit([[0]], [50.0])
    return Pipeline([("regressor", dummy)])


@pytest.fixture
def mock_negative_pipeline():
    """A mock pipeline that returns negative predictions to test non-negative rectification."""
    dummy = DummyRegressor(strategy="constant", constant=-25.0)
    dummy.fit([[0]], [-25.0])
    return Pipeline([("regressor", dummy)])


@pytest.fixture
def sample_history_df():
    """Create 30 days of continuous historical sales for DAIRY at Store 1."""
    dates = pd.date_range("2017-06-01", periods=30, freq="D")
    records = []
    for d in dates:
        records.append({
            "date": d,
            "store_nbr": 1,
            "family": "DAIRY",
            "sales": 100.0,
            "onpromotion": 0,
        })
    return pd.DataFrame(records)


def test_waste_risk_thresholds_classification():
    """Verify standard risk ratio classification boundaries."""
    t = WasteRiskThresholds(low_max=0.15, moderate_max=0.40, high_max=0.65)
    assert t.classify(0.0) == "LOW"
    assert t.classify(0.15) == "LOW"
    assert t.classify(0.16) == "MODERATE"
    assert t.classify(0.40) == "MODERATE"
    assert t.classify(0.41) == "HIGH"
    assert t.classify(0.65) == "HIGH"
    assert t.classify(0.66) == "CRITICAL"
    assert t.classify(1.0) == "CRITICAL"


def test_waste_risk_thresholds_invalid():
    """Verify non-monotonic threshold boundaries raise ValueError."""
    with pytest.raises(ValueError, match="Invalid threshold ordering"):
        WasteRiskThresholds(low_max=0.50, moderate_max=0.30)


def test_zero_and_below_demand_inventory(sample_history_df, mock_trained_pipeline):
    """
    Test zero starting inventory and inventory below expected demand:
    Expected surplus must be exactly 0, risk must be LOW.
    """
    origin = sample_history_df["date"].max()

    # 1. Zero inventory
    res_zero = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=0.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=sample_history_df,
    )
    assert res_zero.expected_surplus_units == 0.0
    assert res_zero.surplus_percentage == 0.0
    assert res_zero.risk_category == "LOW"
    assert res_zero.cumulative_forecast_demand == 150.0  # 3 days * 50 units

    # 2. Inventory strictly below expected demand (Stock: 100, Demand: 150)
    res_below = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=100.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=sample_history_df,
    )
    assert res_below.expected_surplus_units == 0.0
    assert res_below.surplus_percentage == 0.0
    assert res_below.risk_category == "LOW"
    assert res_below.demand_coverage_ratio == 1.5  # 150 demand / 100 inventory


def test_surplus_inventory_and_risk_tiers(sample_history_df, mock_trained_pipeline):
    """
    Test surplus quantification and risk tier transitions.
    Cumulative demand for 3 days = 150 units.
    """
    origin = sample_history_df["date"].max()

    # Moderate surplus: Stock 200 -> Surplus 50 -> 25% surplus ratio -> MODERATE
    res_mod = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=200.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=sample_history_df,
    )
    assert res_mod.expected_surplus_units == 50.0
    assert res_mod.surplus_percentage == 25.0
    assert res_mod.risk_category == "MODERATE"

    # High surplus: Stock 350 -> Surplus 200 -> 57.14% surplus ratio -> HIGH
    res_high = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=350.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=sample_history_df,
    )
    assert res_high.expected_surplus_units == 200.0
    assert res_high.risk_category == "HIGH"

    # Critical surplus: Stock 1000 -> Surplus 850 -> 85% surplus ratio -> CRITICAL
    res_crit = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=1000.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=sample_history_df,
    )
    assert res_crit.expected_surplus_units == 850.0
    assert res_crit.risk_category == "CRITICAL"


def test_shelf_life_horizons_length(sample_history_df, mock_trained_pipeline):
    """Verify different shelf life horizons generate exactly T steps and correct totals."""
    origin = sample_history_df["date"].max()

    for horizon in [1, 3, 7]:
        res = assess_waste_risk(
            product_family="DAIRY",
            forecast_origin_date=origin,
            starting_inventory=500.0,
            remaining_shelf_life=horizon,
            model_pipeline=mock_trained_pipeline,
            history_df=sample_history_df,
        )
        assert len(res.daily_forecasts) == horizon
        assert res.cumulative_forecast_demand == horizon * 50.0


def test_recursive_buffer_lag_feeding(sample_history_df):
    """
    CRITICAL TEST: Verify recursive multi-step forecasting updates lags.
    Model outputs: day 1 -> 80.0, day 2 -> 90.0
    Step 2's sales_lag_1 must be 80.0!
    """
    recorded_lags = []

    class InspectionModel(BaseEstimator, RegressorMixin):
        def fit(self, X, y=None):
            self.is_fitted_ = True
            return self

        def predict(self, X):
            recorded_lags.append(float(X["sales_lag_1"].iloc[0]))
            return np.array([float(len(recorded_lags) * 100.0)])  # Day 1 -> 100, Day 2 -> 200

    origin = sample_history_df["date"].max()
    insp = InspectionModel()
    insp.fit([[0]], [0])
    pipe = Pipeline([("inspect", insp)])

    daily_steps = recursive_multistep_forecast(
        model=pipe,
        history_df=sample_history_df,
        product_family="DAIRY",
        forecast_origin_date=origin,
        horizon_days=2,
    )

    # Step 1 input lag_1 should be last observed sales from history (100.0)
    assert recorded_lags[0] == 100.0
    # Step 2 input lag_1 MUST be Step 1's prediction (100.0)
    assert recorded_lags[1] == 100.0
    assert daily_steps[0]["predicted_demand"] == 100.0
    assert daily_steps[1]["predicted_demand"] == 200.0


def test_zero_future_leakage_counterfactual(sample_history_df, mock_trained_pipeline):
    """
    CRITICAL TEST: Ensure modifying actual sales on future dates (after origin)
    does NOT alter the forecast. Future actual sales must never be accessed.
    """
    origin = sample_history_df["date"].iloc[19]  # 20th day as origin

    # Baseline forecast with uncorrupted history
    base_res = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=300.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=sample_history_df,
    )

    # Corrupt future sales after origin date in history dataframe
    corrupted_df = sample_history_df.copy()
    future_mask = corrupted_df["date"] > origin
    corrupted_df.loc[future_mask, "sales"] = 999999.0

    corrupted_res = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=300.0,
        remaining_shelf_life=3,
        model_pipeline=mock_trained_pipeline,
        history_df=corrupted_df,
    )

    # Predictions MUST be identical
    assert base_res.cumulative_forecast_demand == corrupted_res.cumulative_forecast_demand
    for b_step, c_step in zip(base_res.daily_forecasts, corrupted_res.daily_forecasts):
        assert b_step["predicted_demand"] == c_step["predicted_demand"]


def test_negative_forecast_rectification(sample_history_df, mock_negative_pipeline):
    """Verify that models returning negative values are safely rectified to 0.0."""
    origin = sample_history_df["date"].max()
    res = assess_waste_risk(
        product_family="DAIRY",
        forecast_origin_date=origin,
        starting_inventory=100.0,
        remaining_shelf_life=3,
        model_pipeline=mock_negative_pipeline,
        history_df=sample_history_df,
    )
    for step in res.daily_forecasts:
        assert step["predicted_demand"] == 0.0
    assert res.cumulative_forecast_demand == 0.0


def test_invalid_waste_risk_inputs(sample_history_df, mock_trained_pipeline):
    """Verify appropriate ValueErrors are raised for invalid inputs."""
    origin = sample_history_df["date"].max()

    with pytest.raises(ValueError, match="starting_inventory cannot be negative"):
        assess_waste_risk(
            product_family="DAIRY",
            forecast_origin_date=origin,
            starting_inventory=-10.0,
            remaining_shelf_life=3,
            model_pipeline=mock_trained_pipeline,
            history_df=sample_history_df,
        )

    with pytest.raises(ValueError, match="remaining_shelf_life must be >= 1"):
        assess_waste_risk(
            product_family="DAIRY",
            forecast_origin_date=origin,
            starting_inventory=50.0,
            remaining_shelf_life=0,
            model_pipeline=mock_trained_pipeline,
            history_df=sample_history_df,
        )

    with pytest.raises(ValueError, match="Unknown perishable family"):
        assess_waste_risk(
            product_family="HARDWARE",
            forecast_origin_date=origin,
            starting_inventory=50.0,
            remaining_shelf_life=3,
            model_pipeline=mock_trained_pipeline,
            history_df=sample_history_df,
        )
