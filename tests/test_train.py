"""
tests/test_train.py

Unit and integration tests for model training, metrics calculation,
zero-division safety, negative demand clipping, pipeline creation,
and model persistence.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.pipeline import Pipeline

from src.train import (
    DEFAULT_CAT_COLS,
    DEFAULT_FEATURE_COLS,
    build_model_pipelines,
    calculate_metrics,
    evaluate_lag7_baseline,
    load_trained_forecast_model,
)


def test_calculate_metrics_basic():
    """Verify MAE, RMSE, and WAPE with known mathematical values."""
    y_true = np.array([100.0, 200.0, 300.0])
    y_pred = np.array([110.0, 190.0, 330.0])

    res = calculate_metrics(y_true, y_pred)
    # Errors: [10, -10, 30] -> Abs errors: [10, 10, 30]
    # MAE = 50 / 3 = 16.6667
    # RMSE = sqrt((100 + 100 + 900) / 3) = sqrt(1100 / 3) = 19.1485
    # WAPE = 50 / 600 * 100 = 8.33%
    assert np.isclose(res["mae"], 16.6667, atol=1e-3)
    assert np.isclose(res["rmse"], 19.1485, atol=1e-3)
    assert np.isclose(res["wape"], 8.33, atol=1e-2)


def test_calculate_metrics_negative_clipping():
    """Verify that negative predictions are rectified to 0 without altering actuals."""
    y_true = np.array([10.0, 0.0])
    y_pred = np.array([-5.0, -10.0])

    # With clipping: y_pred becomes [0.0, 0.0]
    res = calculate_metrics(y_true, y_pred, clip_negative=True)
    assert res["mae"] == 5.0
    assert res["wape"] == 100.0

    # Without clipping: y_pred stays [-5.0, -10.0] -> errors: [15, 10] -> MAE = 12.5
    res_no_clip = calculate_metrics(y_true, y_pred, clip_negative=False)
    assert res_no_clip["mae"] == 12.5


def test_calculate_metrics_zero_denominator():
    """Verify safe handling when actual demand sum is zero."""
    y_true_zero = np.array([0.0, 0.0, 0.0])

    # Perfect prediction on zero actuals -> WAPE = 0.0
    res_perfect = calculate_metrics(y_true_zero, np.array([0.0, 0.0, 0.0]))
    assert res_perfect["wape"] == 0.0

    # Imperfect prediction on zero actuals -> Fallback handled safely without ZeroDivisionError
    res_imperfect = calculate_metrics(y_true_zero, np.array([5.0, 5.0, 5.0]), zero_division_wape=100.0)
    assert res_imperfect["wape"] == 100.0


def test_calculate_metrics_shape_mismatch():
    """Verify shape mismatch raises ValueError."""
    with pytest.raises(ValueError, match="Shape mismatch"):
        calculate_metrics(np.array([1.0, 2.0]), np.array([1.0]))


def test_build_model_pipelines_structure():
    """Verify all candidate pipelines are created and contain preprocessor and regressor."""
    pipes = build_model_pipelines(cat_cols=["family"], num_cols=["sales_lag_1", "onpromotion"])
    assert "Ridge" in pipes
    assert "RandomForest" in pipes
    assert "HistGradientBoosting" in pipes

    for name, p in pipes.items():
        assert isinstance(p, Pipeline)
        assert "preprocessor" in p.named_steps
        assert "regressor" in p.named_steps


def test_evaluate_lag7_baseline_success():
    """Verify heuristic lag-7 baseline evaluation."""
    val_df = pd.DataFrame({
        "sales": [10.0, 20.0, 30.0],
        "sales_lag_7": [12.0, 18.0, 30.0],
    })
    res = evaluate_lag7_baseline(val_df)
    assert "mae" in res
    assert "rmse" in res
    assert "wape" in res
    assert res["wape"] > 0.0


def test_evaluate_lag7_baseline_missing_column():
    """Verify evaluate_lag7_baseline raises ValueError if sales_lag_7 is absent."""
    val_df = pd.DataFrame({"sales": [10.0, 20.0]})
    with pytest.raises(ValueError, match="sales_lag_7"):
        evaluate_lag7_baseline(val_df)


def test_pipeline_fit_predict_save_load(tmp_path):
    """Test full cycle: training a small pipeline, saving, reloading, and running inference."""
    dates = pd.date_range("2017-01-01", periods=10, freq="D")
    df = pd.DataFrame({
        "family": ["DAIRY"] * 10,
        "onpromotion": [0] * 10,
        "day_of_week": [d.dayofweek for d in dates],
        "day_of_month": [d.day for d in dates],
        "month": [1] * 10,
        "year": [2017] * 10,
        "is_weekend": [1 if d.dayofweek in [5, 6] else 0 for d in dates],
        "is_holiday": [0] * 10,
        "sales_lag_1": [10.0] * 10,
        "sales_lag_2": [10.0] * 10,
        "sales_lag_7": [10.0] * 10,
        "sales_lag_14": [10.0] * 10,
        "sales_rolling_mean_7": [10.0] * 10,
        "sales_rolling_std_7": [1.0] * 10,
        "sales_rolling_mean_14": [10.0] * 10,
        "sales_rolling_std_14": [1.0] * 10,
    })
    y = np.array([12.0] * 10)

    pipes = build_model_pipelines(cat_cols=DEFAULT_CAT_COLS, num_cols=DEFAULT_FEATURE_COLS, random_state=42)
    model = pipes["Ridge"]
    model.fit(df, y)

    # Save to tmp_path
    save_file = tmp_path / "test_model.joblib"
    payload = {
        "pipeline": model,
        "metadata": {"model_name": "Ridge", "target": "sales"},
    }
    joblib.dump(payload, save_file)

    # Reload
    loaded_model, loaded_meta = load_trained_forecast_model(save_file)
    assert loaded_meta["model_name"] == "Ridge"

    preds = loaded_model.predict(df)
    assert preds.shape == (10,)
    assert not np.isnan(preds).any()
