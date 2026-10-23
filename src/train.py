"""
src/train.py

Demand forecasting model training, evaluation, comparison, and serialization.
Implements:
1. Lag-7 heuristic baseline.
2. Ridge Regression baseline with standardized numericals and one-hot encoding.
3. Random Forest Regressor.
4. HistGradientBoostingRegressor.
5. Strict out-of-sample evaluation with MAE, RMSE, and WAPE.
6. Non-negative demand rectification (clipping at 0).
7. Leakage-safe model artifact persistence (joblib).
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.preprocessing import run_preprocessing_pipeline

DEFAULT_FEATURE_COLS: List[str] = [
    "onpromotion",
    "day_of_week",
    "day_of_month",
    "month",
    "year",
    "is_weekend",
    "is_holiday",
    "sales_lag_1",
    "sales_lag_2",
    "sales_lag_7",
    "sales_lag_14",
    "sales_rolling_mean_7",
    "sales_rolling_std_7",
    "sales_rolling_mean_14",
    "sales_rolling_std_14",
]

DEFAULT_CAT_COLS: List[str] = ["family"]


def calculate_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    clip_negative: bool = True,
    zero_division_wape: float = 0.0,
) -> Dict[str, float]:
    """
    Compute MAE, RMSE, and WAPE on validation predictions.

    Parameters:
    -----------
    y_true : np.ndarray
        Ground-truth actual target values.
    y_pred : np.ndarray
        Predicted sales values from the model.
    clip_negative : bool
        If True, non-physical negative predictions are rectified to 0.0.
        Actual ground-truth target values are never modified.
    zero_division_wape : float
        Fallback percentage if actual demand sum is zero.

    Returns:
    --------
    Dict[str, float]: {"mae": float, "rmse": float, "wape": float}
    """
    y_true_arr = np.asarray(y_true, dtype=np.float64)
    y_pred_arr = np.asarray(y_pred, dtype=np.float64)

    if y_true_arr.shape != y_pred_arr.shape:
        raise ValueError(
            f"Shape mismatch: y_true shape {y_true_arr.shape} != y_pred shape {y_pred_arr.shape}"
        )

    if clip_negative:
        y_pred_arr = np.maximum(0.0, y_pred_arr)

    errors = y_true_arr - y_pred_arr
    abs_errors = np.abs(errors)

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    actual_sum = float(np.sum(np.abs(y_true_arr)))
    if actual_sum == 0.0:
        if float(np.sum(abs_errors)) == 0.0:
            wape = 0.0
        else:
            wape = zero_division_wape
    else:
        wape = float((np.sum(abs_errors) / actual_sum) * 100.0)

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 2),
    }


def build_model_pipelines(
    cat_cols: List[str] = DEFAULT_CAT_COLS,
    num_cols: List[str] = DEFAULT_FEATURE_COLS,
    random_state: int = 42,
) -> Dict[str, Pipeline]:
    """
    Construct scikit-learn pipelines with strictly train-fitted transformers.
    """
    # Preprocessor for Ridge (Standardized numericals, OneHot categorical)
    ridge_preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"), cat_cols),
            ("num", StandardScaler(), num_cols),
        ]
    )

    # Preprocessor for tree models (Passthrough numericals, OneHot categorical)
    tree_preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
            ("num", "passthrough", num_cols),
        ]
    )

    pipelines = {
        "Ridge": Pipeline(
            steps=[
                ("preprocessor", ridge_preprocessor),
                ("regressor", Ridge(alpha=10.0, random_state=random_state)),
            ]
        ),
        "RandomForest": Pipeline(
            steps=[
                ("preprocessor", tree_preprocessor),
                (
                    "regressor",
                    RandomForestRegressor(
                        n_estimators=100,
                        max_depth=12,
                        min_samples_split=5,
                        random_state=random_state,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
        "HistGradientBoosting": Pipeline(
            steps=[
                ("preprocessor", tree_preprocessor),
                (
                    "regressor",
                    HistGradientBoostingRegressor(
                        max_iter=100,
                        max_depth=8,
                        learning_rate=0.1,
                        random_state=random_state,
                    ),
                ),
            ]
        ),
    }
    return pipelines


def evaluate_lag7_baseline(val_df: pd.DataFrame) -> Dict[str, float]:
    """
    Evaluate the heuristic lag-7 baseline (sales_lag_7).
    """
    if "sales_lag_7" not in val_df.columns:
        raise ValueError("Column 'sales_lag_7' not present in validation dataframe.")
    y_val = val_df["sales"].values
    y_pred_lag7 = val_df["sales_lag_7"].values
    return calculate_metrics(y_val, y_pred_lag7)


def train_and_evaluate_all_models(
    data_dir: Union[str, Path] = "data/raw",
    store_nbr: int = 1,
    start_date: str = "2016-01-01",
    end_date: str = "2017-08-15",
    val_days: int = 30,
    random_state: int = 42,
    output_model_path: Union[str, Path] = "models/demand_forecast_model.joblib",
    output_metrics_path: Union[str, Path] = "models/evaluation_metrics.json",
) -> Tuple[Dict[str, Dict[str, float]], str, Pipeline, Dict[str, Any]]:
    """
    Train all candidate models strictly on training data, evaluate on out-of-sample
    validation data, select the best model by lowest WAPE, and serialize artifacts.
    """
    train_df, val_df, meta = run_preprocessing_pipeline(
        data_dir=data_dir,
        store_nbr=store_nbr,
        start_date=start_date,
        end_date=end_date,
        val_days=val_days,
    )

    feature_cols = DEFAULT_FEATURE_COLS
    cat_cols = DEFAULT_CAT_COLS
    all_feature_cols = cat_cols + feature_cols

    X_train = train_df[all_feature_cols]
    y_train = train_df["sales"].values

    X_val = val_df[all_feature_cols]
    y_val = val_df["sales"].values

    results: Dict[str, Dict[str, float]] = {}

    # 1. Heuristic Lag-7 Baseline
    results["Lag7_Baseline"] = evaluate_lag7_baseline(val_df)

    # 2. Build and train scikit-learn models
    pipelines = build_model_pipelines(cat_cols=cat_cols, num_cols=feature_cols, random_state=random_state)
    trained_pipelines: Dict[str, Pipeline] = {}

    for name, pipe in pipelines.items():
        # Fit on training data only
        pipe.fit(X_train, y_train)
        trained_pipelines[name] = pipe

        raw_preds = pipe.predict(X_val)
        results[name] = calculate_metrics(y_val, raw_preds, clip_negative=True)

    # Model Selection: Lowest WAPE, breaking ties with lowest MAE
    ml_models = [m for m in results.keys() if m != "Lag7_Baseline"]
    best_model_name = min(ml_models, key=lambda m: (results[m]["wape"], results[m]["mae"]))
    best_pipeline = trained_pipelines[best_model_name]

    # Model Metadata Package
    metadata = {
        "selected_model": best_model_name,
        "random_seed": random_state,
        "store_nbr": store_nbr,
        "target_column": "sales",
        "feature_columns": all_feature_cols,
        "categorical_columns": cat_cols,
        "numerical_columns": feature_cols,
        "training_period": {
            "start": meta["train_start"],
            "end": meta["train_end"],
            "unique_dates": train_df["date"].nunique(),
            "samples": len(train_df),
        },
        "validation_period": {
            "start": meta["val_start"],
            "end": meta["val_end"],
            "unique_dates": val_df["date"].nunique(),
            "samples": len(val_df),
        },
        "perishable_families": sorted(train_df["family"].unique().tolist()),
        "validation_metrics": results,
    }

    # Save joblib bundle
    out_model_p = Path(output_model_path)
    out_model_p.parent.mkdir(parents=True, exist_ok=True)
    joblib_payload = {
        "pipeline": best_pipeline,
        "metadata": metadata,
    }
    joblib.dump(joblib_payload, out_model_p)

    # Save human-readable JSON metrics
    out_metrics_p = Path(output_metrics_path)
    out_metrics_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_metrics_p, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return results, best_model_name, best_pipeline, metadata


def load_trained_forecast_model(
    model_path: Union[str, Path] = "models/demand_forecast_model.joblib",
) -> Tuple[Pipeline, Dict[str, Any]]:
    """
    Load the serialized model pipeline and verification metadata from disk.
    """
    path = Path(model_path)
    if not path.is_file():
        raise FileNotFoundError(f"Trained model artifact not found at: {path}")
    payload = joblib.load(path)
    return payload["pipeline"], payload["metadata"]


if __name__ == "__main__":
    print("=" * 70)
    print("TRAINING DEMAND FORECASTING MODELS ON REAL RETAIL DATA")
    print("=" * 70)
    metrics, best_name, _, meta = train_and_evaluate_all_models()

    print("\nEVALUATION COMPARISON TABLE (Out-Of-Sample Validation Set):")
    print("-" * 65)
    print(f"{'Model Name':<25} {'MAE (units)':<15} {'RMSE':<15} {'WAPE (%)':<10}")
    print("-" * 65)
    for model_name, m in metrics.items():
        print(f"{model_name:<25} {m['mae']:<15.3f} {m['rmse']:<15.3f} {m['wape']:<10.2f}%")
    print("-" * 65)
    print(f"\nSELECTED BEST MODEL: {best_name} (Lowest Out-Of-Sample WAPE)")
    print(f"Artifact saved to: models/demand_forecast_model.joblib")
    print(f"Metrics saved to: models/evaluation_metrics.json")
