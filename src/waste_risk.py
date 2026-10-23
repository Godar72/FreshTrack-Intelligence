"""
src/waste_risk.py

Perishable Inventory Waste Risk Quantification & Recursive Multi-Step Forecaster.

Architecture:
1. Recursive Multi-Step Forecaster:
   Forecasts daily demand recursively across a multi-day shelf-life horizon [t+1, ..., t+T_shelf]
   using strictly historical data up to origin date t. Predictions for day t+1 feed into
   the lag and rolling buffers for day t+2, guaranteeing zero future leakage.
2. Waste Risk Quantification Engine:
   Computes cumulative horizon demand, expected surplus units (max(0, Stock - Cumulative Demand)),
   surplus percentage, demand coverage ratio, and categorizes risk against configurable thresholds.
3. Simulation Assumptions:
   Inventory levels and shelf-life horizons are configurable simulation inputs,
   as public grocery sales datasets do not itemize closing warehouse stock balances or expiry dates.
"""

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from src.preprocessing import (
    DEFAULT_PERISHABLE_FAMILIES,
    add_calendar_and_holiday_features,
    load_and_filter_sales,
    reconcile_calendar_grid,
    validate_raw_files,
)
from src.train import (
    DEFAULT_CAT_COLS,
    DEFAULT_FEATURE_COLS,
    load_trained_forecast_model,
)


@dataclass
class WasteRiskThresholds:
    """
    Configurable boundaries for waste risk ratio:
    Surplus Ratio R = max(0, Starting_Inventory - Cumulative_Demand) / Starting_Inventory
    """
    low_max: float = 0.15        # Surplus <= 15% of on-hand inventory
    moderate_max: float = 0.40   # 15% < Surplus <= 40% of on-hand inventory
    high_max: float = 0.65       # 40% < Surplus <= 65% of on-hand inventory
    # Surplus > 65% of inventory is classified as CRITICAL

    def __post_init__(self):
        if not (0.0 <= self.low_max < self.moderate_max < self.high_max <= 1.0):
            raise ValueError(
                f"Invalid threshold ordering: expected 0 <= low_max ({self.low_max}) "
                f"< moderate_max ({self.moderate_max}) < high_max ({self.high_max}) <= 1.0"
            )

    def classify(self, surplus_ratio: float) -> str:
        """Classify surplus ratio into standard risk tier."""
        if surplus_ratio <= self.low_max:
            return "LOW"
        elif surplus_ratio <= self.moderate_max:
            return "MODERATE"
        elif surplus_ratio <= self.high_max:
            return "HIGH"
        else:
            return "CRITICAL"


@dataclass
class WasteRiskAssessment:
    """Structured container separating observed, forecasted, and simulated variables."""
    product_family: str
    store_nbr: int
    forecast_origin_date: str
    remaining_shelf_life_days: int
    starting_inventory: float
    cumulative_forecast_demand: float
    expected_surplus_units: float
    surplus_percentage: float
    demand_coverage_ratio: float
    risk_category: str
    daily_forecasts: List[Dict[str, Any]]
    model_name: str
    simulation_notes: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def load_historical_series(
    data_dir: Union[str, Path] = "data/raw",
    store_nbr: int = 1,
    start_date: str = "2016-01-01",
    end_date: str = "2017-08-15",
) -> Tuple[pd.DataFrame, Dict[str, Path]]:
    """
    Load and calendar-reconcile historical sales series for feature construction.
    Supports pre-extracted processed history fallback when raw train.csv is omitted for deployment.
    """
    data_path = Path(data_dir)
    train_path = data_path / "train.csv"
    processed_dir = data_path.parent / "processed" if data_path.name == "raw" else data_path
    processed_parquet = processed_dir / "store1_history.parquet"
    processed_csv = processed_dir / "store1_history.csv"

    # In production containers or lean deployments without 121MB raw train.csv, use pre-extracted series
    if not train_path.is_file() and (processed_csv.is_file() or processed_parquet.is_file()):
        if processed_csv.is_file():
            cal_df = pd.read_csv(processed_csv)
        else:
            cal_df = pd.read_parquet(processed_parquet)
        cal_df["date"] = pd.to_datetime(cal_df["date"])
        raw_files = {
            "train": processed_csv if processed_csv.is_file() else processed_parquet,
            "stores": data_path / "stores.csv",
            "holidays": data_path / "holidays_events.csv",
        }
        return cal_df, raw_files

    raw_files = validate_raw_files(data_dir=data_dir)
    raw_df = load_and_filter_sales(
        train_path=raw_files["train"],
        store_nbr=store_nbr,
        start_date=start_date,
        end_date=end_date,
    )
    grid_df = reconcile_calendar_grid(raw_df)
    cal_df = add_calendar_and_holiday_features(
        grid_df,
        holidays_path=raw_files["holidays"],
        stores_path=raw_files["stores"],
    )
    return cal_df, raw_files



def recursive_multistep_forecast(
    model: Pipeline,
    history_df: pd.DataFrame,
    product_family: str,
    forecast_origin_date: Union[str, pd.Timestamp],
    horizon_days: int,
    holidays_path: Optional[Union[str, Path]] = "data/raw/holidays_events.csv",
    stores_path: Optional[Union[str, Path]] = "data/raw/stores.csv",
) -> List[Dict[str, Any]]:
    """
    Generate recursive multi-step forecasts over horizon_days.

    LEAKAGE-SAFE PROTOCOL:
    - History up to forecast_origin_date is fixed.
    - Day t+1 uses observed history [..., t-1, t].
    - Day t+2 appends predicted demand D_hat_{t+1} to the buffer to compute lags and rolling stats.
    - Future observed actual sales are NEVER accessed.
    """
    if horizon_days < 1:
        raise ValueError(f"horizon_days must be >= 1, got: {horizon_days}")

    origin_ts = pd.to_datetime(forecast_origin_date)

    # Filter family history up to origin date
    fam_hist = history_df[
        (history_df["family"] == product_family) & (history_df["date"] <= origin_ts)
    ].sort_values("date").reset_index(drop=True)

    if fam_hist.empty:
        raise ValueError(
            f"No historical records found for family '{product_family}' up to origin '{origin_ts.date()}'."
        )

    if origin_ts not in fam_hist["date"].values:
        raise ValueError(
            f"Origin date '{origin_ts.date()}' is not present in historical series."
        )

    # We require at least 14 days of history to compute lag-14
    if len(fam_hist) < 14:
        raise ValueError(
            f"Insufficient historical depth for family '{product_family}' (found {len(fam_hist)} days, need >= 14)."
        )

    # Pre-extract store info for holiday lookup
    store_nbr = int(fam_hist["store_nbr"].iloc[0])

    # Preload holidays to quickly look up future calendar holidays
    future_holiday_dates = set()
    if holidays_path is not None and Path(holidays_path).is_file():
        h_df = pd.read_csv(holidays_path, parse_dates=["date"])
        valid_types = {"Holiday", "Transfer", "Bridge", "Additional", "Event"}
        valid_h = h_df[(h_df["type"].isin(valid_types)) & (~h_df["transferred"])]

        store_city, store_state = None, None
        if stores_path is not None and Path(stores_path).is_file():
            stores = pd.read_csv(stores_path)
            st_match = stores[stores["store_nbr"] == store_nbr]
            if not st_match.empty:
                store_city = st_match["city"].iloc[0]
                store_state = st_match["state"].iloc[0]

        if store_city is not None and store_state is not None:
            mask = (
                (valid_h["locale"] == "National")
                | ((valid_h["locale"] == "Regional") & (valid_h["locale_name"] == store_state))
                | ((valid_h["locale"] == "Local") & (valid_h["locale_name"] == store_city))
            )
            future_holiday_dates = set(valid_h[mask]["date"].dt.date)
        else:
            future_holiday_dates = set(valid_h[valid_h["locale"] == "National"]["date"].dt.date)

    # Maintain an in-memory chronological buffer of (date, sales)
    sales_buffer = fam_hist[["date", "sales"]].copy()

    forecast_steps: List[Dict[str, Any]] = []

    for step in range(1, horizon_days + 1):
        target_date = origin_ts + pd.Timedelta(days=step)

        # 1. Autoregressive Lags from buffer (buffer ends at target_date - 1 day)
        lag_1 = float(sales_buffer.iloc[-1]["sales"])
        lag_2 = float(sales_buffer.iloc[-2]["sales"])
        lag_7 = float(sales_buffer.iloc[-7]["sales"])
        lag_14 = float(sales_buffer.iloc[-14]["sales"])

        # 2. Rolling Statistics (shifted by 1 because buffer ends at t-1)
        rolling_7_series = sales_buffer["sales"].iloc[-7:]
        rolling_mean_7 = float(rolling_7_series.mean())
        rolling_std_7 = float(rolling_7_series.std(ddof=1)) if len(rolling_7_series) > 1 else 0.0
        if np.isnan(rolling_std_7):
            rolling_std_7 = 0.0

        rolling_14_series = sales_buffer["sales"].iloc[-14:]
        rolling_mean_14 = float(rolling_14_series.mean())
        rolling_std_14 = float(rolling_14_series.std(ddof=1)) if len(rolling_14_series) > 1 else 0.0
        if np.isnan(rolling_std_14):
            rolling_std_14 = 0.0

        # 3. Calendar & Exogenous Features
        day_of_week = int(target_date.dayofweek)
        day_of_month = int(target_date.day)
        month = int(target_date.month)
        year = int(target_date.year)
        is_weekend = int(day_of_week in [5, 6])
        is_holiday = int(target_date.date() in future_holiday_dates)

        # Onpromotion: If future promotion schedule is in history_df for this date, use it; else 0
        future_match = history_df[
            (history_df["family"] == product_family) & (history_df["date"] == target_date)
        ]
        if not future_match.empty and "onpromotion" in future_match.columns:
            onpromotion = int(future_match["onpromotion"].iloc[0])
        else:
            onpromotion = 0

        # 4. Construct Exact Model Input Row
        feature_dict = {
            "family": product_family,
            "onpromotion": onpromotion,
            "day_of_week": day_of_week,
            "day_of_month": day_of_month,
            "month": month,
            "year": year,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "sales_lag_1": lag_1,
            "sales_lag_2": lag_2,
            "sales_lag_7": lag_7,
            "sales_lag_14": lag_14,
            "sales_rolling_mean_7": rolling_mean_7,
            "sales_rolling_std_7": rolling_std_7,
            "sales_rolling_mean_14": rolling_mean_14,
            "sales_rolling_std_14": rolling_std_14,
        }
        row_df = pd.DataFrame([feature_dict])

        # 5. Predict & Enforce Non-Negative Demand
        raw_pred = float(model.predict(row_df)[0])
        pred_demand = max(0.0, raw_pred)

        # 6. Append to sales_buffer for subsequent steps
        new_row = pd.DataFrame([{"date": target_date, "sales": pred_demand}])
        sales_buffer = pd.concat([sales_buffer, new_row], ignore_index=True)

        forecast_steps.append({
            "step": step,
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_demand": round(pred_demand, 2),
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "onpromotion": onpromotion,
        })

    return forecast_steps


def assess_waste_risk(
    product_family: str,
    forecast_origin_date: Union[str, pd.Timestamp],
    starting_inventory: float,
    remaining_shelf_life: int,
    store_nbr: int = 1,
    model_pipeline: Optional[Pipeline] = None,
    history_df: Optional[pd.DataFrame] = None,
    thresholds: Optional[WasteRiskThresholds] = None,
    model_path: Union[str, Path] = "models/demand_forecast_model.joblib",
    data_dir: Union[str, Path] = "data/raw",
) -> WasteRiskAssessment:
    """
    Quantify expected perishable surplus and waste risk level.

    Parameters:
    -----------
    product_family : str
        Perishable category (e.g. 'DAIRY', 'PRODUCE', 'MEATS').
    forecast_origin_date : str or Timestamp
        Cutoff date representing close of business before forecast horizon starts.
    starting_inventory : float
        Current on-hand batch stock in units (must be >= 0).
    remaining_shelf_life : int
        Days until expiration date (must be >= 1).
    store_nbr : int
        Store location identifier.
    model_pipeline : Pipeline, optional
        Pre-loaded forecasting model. If None, loaded from model_path.
    history_df : DataFrame, optional
        Historical sales table. If None, loaded from data_dir.
    thresholds : WasteRiskThresholds, optional
        Configurable risk classification boundaries.

    Returns:
    --------
    WasteRiskAssessment: Comprehensive risk metrics, daily forecasts, and category.
    """
    # 1. Input Validations
    if starting_inventory < 0:
        raise ValueError(f"starting_inventory cannot be negative, got: {starting_inventory}")
    if remaining_shelf_life < 1:
        raise ValueError(f"remaining_shelf_life must be >= 1 day, got: {remaining_shelf_life}")
    if product_family not in DEFAULT_PERISHABLE_FAMILIES:
        raise ValueError(
            f"Unknown perishable family '{product_family}'. "
            f"Expected one of: {DEFAULT_PERISHABLE_FAMILIES}"
        )

    if thresholds is None:
        thresholds = WasteRiskThresholds()

    # 2. Model & History Loading
    model_name = "HistGradientBoosting"
    if model_pipeline is None:
        model_pipeline, meta = load_trained_forecast_model(model_path=model_path)
        model_name = meta.get("selected_model", "Loaded_Model")

    holidays_file = Path(data_dir) / "holidays_events.csv"
    stores_file = Path(data_dir) / "stores.csv"

    if history_df is None:
        history_df, _ = load_historical_series(data_dir=data_dir, store_nbr=store_nbr)

    # 3. Generate Recursive Forecast
    daily_forecasts = recursive_multistep_forecast(
        model=model_pipeline,
        history_df=history_df,
        product_family=product_family,
        forecast_origin_date=forecast_origin_date,
        horizon_days=remaining_shelf_life,
        holidays_path=holidays_file,
        stores_path=stores_file,
    )

    # 4. Compute Waste Risk Metrics
    cumulative_demand = float(sum(d["predicted_demand"] for d in daily_forecasts))
    expected_surplus = max(0.0, starting_inventory - cumulative_demand)

    if starting_inventory > 0:
        surplus_percentage = round((expected_surplus / starting_inventory) * 100.0, 2)
        surplus_ratio = expected_surplus / starting_inventory
        coverage_ratio = round(cumulative_demand / starting_inventory, 3)
    else:
        surplus_percentage = 0.0
        surplus_ratio = 0.0
        coverage_ratio = 0.0

    risk_category = thresholds.classify(surplus_ratio)

    simulation_notes = (
        f"Simulated batch of {starting_inventory:.1f} units with {remaining_shelf_life}d shelf life. "
        f"Cumulative {remaining_shelf_life}-day forecast demand is {cumulative_demand:.1f} units. "
        f"Projected surplus is {expected_surplus:.1f} units ({surplus_percentage:.1f}% risk)."
    )

    return WasteRiskAssessment(
        product_family=product_family,
        store_nbr=store_nbr,
        forecast_origin_date=str(pd.to_datetime(forecast_origin_date).date()),
        remaining_shelf_life_days=remaining_shelf_life,
        starting_inventory=round(float(starting_inventory), 2),
        cumulative_forecast_demand=round(cumulative_demand, 2),
        expected_surplus_units=round(expected_surplus, 2),
        surplus_percentage=surplus_percentage,
        demand_coverage_ratio=coverage_ratio,
        risk_category=risk_category,
        daily_forecasts=daily_forecasts,
        model_name=model_name,
        simulation_notes=simulation_notes,
    )
