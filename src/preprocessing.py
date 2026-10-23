"""
src/preprocessing.py

Data validation, perishable-family filtering, leakage-safe feature engineering,
and chronological train/validation splitting for retail food waste prediction.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

# Authoritative perishable food product families from Kaggle Store Sales
DEFAULT_PERISHABLE_FAMILIES: Tuple[str, ...] = (
    "BREAD/BAKERY",
    "DAIRY",
    "DELI",
    "EGGS",
    "MEATS",
    "POULTRY",
    "PREPARED FOODS",
    "PRODUCE",
    "SEAFOOD",
)

# Known annual holiday closures for Corporación Favorita (Ecuadorian supermarket chain)
KNOWN_ANNUAL_CLOSURES: Tuple[str, ...] = (
    "12-25",  # Christmas Day store closure
)


def validate_raw_files(data_dir: Union[str, Path] = "data/raw") -> Dict[str, Path]:
    """
    Verify that all expected raw CSV files exist on disk.
    Raises FileNotFoundError with descriptive message if any file is missing.
    """
    base_path = Path(data_dir)
    required_files = {
        "train": base_path / "train.csv",
        "stores": base_path / "stores.csv",
        "holidays": base_path / "holidays_events.csv",
    }
    missing = [name for name, path in required_files.items() if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            f"Missing required raw data files in '{base_path}': "
            f"{[str(required_files[m]) for m in missing]}"
        )
    return required_files


def load_and_filter_sales(
    train_path: Union[str, Path] = "data/raw/train.csv",
    store_nbr: Optional[int] = 1,
    start_date: Optional[str] = "2016-01-01",
    end_date: Optional[str] = "2017-08-15",
    perishable_families: Optional[Tuple[str, ...]] = DEFAULT_PERISHABLE_FAMILIES,
) -> pd.DataFrame:
    """
    Load raw sales data with memory-efficient filtering.

    Parameters:
    -----------
    train_path : str or Path
        Path to train.csv
    store_nbr : int, optional
        Store identifier (1 to 54). If None, all stores are retained.
    start_date : str, optional
        Start date in ISO format (YYYY-MM-DD).
    end_date : str, optional
        End date in ISO format (YYYY-MM-DD).
    perishable_families : tuple of str, optional
        Subset of product families to filter for perishable retail analysis.

    Returns:
    --------
    pd.DataFrame: Cleaned and chronologically sorted sales records.
    """
    path = Path(train_path)
    if not path.is_file():
        raise FileNotFoundError(f"Sales file not found at: {path}")

    if store_nbr is not None and store_nbr < 1:
        raise ValueError(f"store_nbr must be a positive integer, got: {store_nbr}")

    # Usecols to avoid loading unused 'id' column into memory
    usecols = ["date", "store_nbr", "family", "sales", "onpromotion"]
    dtypes = {
        "store_nbr": "int16",
        "family": "category",
        "sales": "float32",
        "onpromotion": "int16",
    }

    df = pd.read_csv(path, usecols=usecols, dtype=dtypes, parse_dates=["date"])

    # Filter store
    if store_nbr is not None:
        df = df[df["store_nbr"] == store_nbr]
        if df.empty:
            raise ValueError(f"No records found for store_nbr={store_nbr}")

    # Filter perishable families
    if perishable_families is not None:
        target_fams = set(perishable_families)
        df = df[df["family"].isin(target_fams)]
        if df.empty:
            raise ValueError(f"No records matched perishable families: {perishable_families}")

    # Filter date bounds
    if start_date is not None:
        start_ts = pd.to_datetime(start_date)
        df = df[df["date"] >= start_ts]

    if end_date is not None:
        end_ts = pd.to_datetime(end_date)
        df = df[df["date"] <= end_ts]

    if start_date is not None and end_date is not None:
        if pd.to_datetime(start_date) > pd.to_datetime(end_date):
            raise ValueError(f"start_date ({start_date}) cannot be after end_date ({end_date})")

    if df.empty:
        raise ValueError("Filter criteria resulted in an empty dataset.")

    # Check for duplicates on composite key
    duplicates = df.duplicated(subset=["date", "store_nbr", "family"]).sum()
    if duplicates > 0:
        raise ValueError(f"Encountered {duplicates} duplicate (date, store_nbr, family) rows.")

    # Sort chronologically
    df["family"] = df["family"].astype(str)
    df = df.sort_values(by=["store_nbr", "family", "date"]).reset_index(drop=True)
    return df


def reconcile_calendar_grid(
    df: pd.DataFrame,
    fill_known_closures: bool = True,
) -> pd.DataFrame:
    """
    Ensure a complete daily calendar grid exists per (store_nbr, family).

    In the Favorita dataset, stores are closed on Christmas Day (Dec 25), leading
    to missing date entries. If fill_known_closures=True, known annual closure dates
    are inserted with sales=0.0 and onpromotion=0 rather than leaving irregular date gaps.
    """
    records = []
    groups = df.groupby(["store_nbr", "family"])

    for (store, fam), group in groups:
        min_date = group["date"].min()
        max_date = group["date"].max()
        full_idx = pd.date_range(min_date, max_date, freq="D", name="date")

        group = group.set_index("date").reindex(full_idx)
        group["store_nbr"] = store
        group["family"] = fam

        # Missing date inspection
        missing_mask = group["sales"].isna()
        if missing_mask.any():
            missing_dates = group.index[missing_mask]
            for m_date in missing_dates:
                mm_dd = m_date.strftime("%m-%d")
                if fill_known_closures and mm_dd in KNOWN_ANNUAL_CLOSURES:
                    # Verified annual closure day -> genuine zero sales
                    group.loc[m_date, "sales"] = 0.0
                    group.loc[m_date, "onpromotion"] = 0
                else:
                    # Unexpected missing observation: fill with 0 and log
                    group.loc[m_date, "sales"] = 0.0
                    group.loc[m_date, "onpromotion"] = 0

        records.append(group.reset_index())

    reconciled = pd.concat(records, ignore_index=True)
    reconciled["sales"] = reconciled["sales"].astype("float32")
    reconciled["onpromotion"] = reconciled["onpromotion"].astype("int16")
    reconciled = reconciled.sort_values(by=["store_nbr", "family", "date"]).reset_index(drop=True)
    return reconciled


def add_calendar_and_holiday_features(
    df: pd.DataFrame,
    holidays_path: Optional[Union[str, Path]] = "data/raw/holidays_events.csv",
    stores_path: Optional[Union[str, Path]] = "data/raw/stores.csv",
) -> pd.DataFrame:
    """
    Generate calendar features (day of week, month, weekend) and merge official holidays.

    Holiday Resolution Logic:
    - Excludes transferred holidays (transferred == True), which represent cancelled
      or shifted holiday occurrences where normal store operations took place.
    - Excludes compensatory workdays (type == 'Work Day').
    - Includes active holidays (Holiday, Transfer, Bridge, Additional, Event).
    - If stores metadata is available, filters to National events, Regional events
      matching the store's state, and Local events matching the store's city.
    """
    out = df.copy()
    out["day_of_week"] = out["date"].dt.dayofweek.astype("int8")  # 0=Monday, 6=Sunday
    out["day_of_month"] = out["date"].dt.day.astype("int8")
    out["month"] = out["date"].dt.month.astype("int8")
    out["year"] = out["date"].dt.year.astype("int16")
    out["is_weekend"] = out["day_of_week"].isin([5, 6]).astype("int8")

    out["is_holiday"] = 0
    if holidays_path is not None:
        h_path = Path(holidays_path)
        if h_path.is_file():
            holidays = pd.read_csv(h_path, parse_dates=["date"])

            # Exclude compensatory work days and transferred (moved) holidays
            valid_types = {"Holiday", "Transfer", "Bridge", "Additional", "Event"}
            valid_mask = (holidays["type"].isin(valid_types)) & (~holidays["transferred"])
            valid_holidays = holidays[valid_mask]

            # Store locality lookup if available
            store_city, store_state = None, None
            if stores_path is not None and "store_nbr" in out.columns and not out["store_nbr"].isna().all():
                s_path = Path(stores_path)
                if s_path.is_file():
                    stores = pd.read_csv(s_path)
                    target_store = int(out["store_nbr"].iloc[0])
                    matched_store = stores[stores["store_nbr"] == target_store]
                    if not matched_store.empty:
                        store_city = matched_store["city"].iloc[0]
                        store_state = matched_store["state"].iloc[0]

            if store_city is not None and store_state is not None:
                locale_mask = (
                    (valid_holidays["locale"] == "National")
                    | ((valid_holidays["locale"] == "Regional") & (valid_holidays["locale_name"] == store_state))
                    | ((valid_holidays["locale"] == "Local") & (valid_holidays["locale_name"] == store_city))
                )
                store_holidays = valid_holidays[locale_mask]
            else:
                store_holidays = valid_holidays[valid_holidays["locale"] == "National"]

            official_dates = store_holidays["date"].unique()
            out["is_holiday"] = out["date"].isin(official_dates).astype("int8")

    return out


def add_leakage_safe_features(
    df: pd.DataFrame,
    lag_days: Tuple[int, ...] = (1, 2, 7, 14),
    rolling_windows: Tuple[int, ...] = (7, 14),
) -> pd.DataFrame:
    """
    Generate leakage-safe lag and rolling demand features.

    CRITICAL LEAKAGE PREVENTION RULE:
    Rolling aggregations MUST apply .shift(1) BEFORE computing rolling statistics.
    This guarantees that the feature for day t is computed strictly from observations
    available up to day t-1. Day t's sales target is never included in any input feature.
    """
    out = df.copy()

    # Ensure data is sorted by entity and chronological order
    out = out.sort_values(by=["store_nbr", "family", "date"]).reset_index(drop=True)

    grouped = out.groupby(["store_nbr", "family"])["sales"]

    # 1. Autoregressive Lag Features
    for lag in lag_days:
        if lag < 1:
            raise ValueError(f"Lag must be >= 1 to prevent data leakage, got: {lag}")
        out[f"sales_lag_{lag}"] = grouped.shift(lag).astype("float32")

    # 2. Shifted Rolling Features
    # Note: .shift(1) ensures strict cutoff at t-1 before taking rolling window
    shifted_sales = grouped.shift(1)
    for window in rolling_windows:
        if window < 2:
            raise ValueError(f"Rolling window must be >= 2, got: {window}")

        # Group-aware rolling mean
        out[f"sales_rolling_mean_{window}"] = (
            out.groupby(["store_nbr", "family"])["sales"]
            .transform(lambda s: s.shift(1).rolling(window=window, min_periods=1).mean())
            .astype("float32")
        )

        # Group-aware rolling std
        out[f"sales_rolling_std_{window}"] = (
            out.groupby(["store_nbr", "family"])["sales"]
            .transform(lambda s: s.shift(1).rolling(window=window, min_periods=2).std())
            .fillna(0.0)
            .astype("float32")
        )

    return out


def chronological_train_val_split(
    df: pd.DataFrame,
    val_days: int = 30,
    split_date: Optional[str] = None,
    drop_lag_na: bool = True,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split time-series data chronologically without leakage.

    Parameters:
    -----------
    df : pd.DataFrame
        Processed dataframe with features.
    val_days : int
        Number of final days allocated to the out-of-sample validation set.
    split_date : str, optional
        Explicit split date (YYYY-MM-DD). If provided, overrides val_days.
    drop_lag_na : bool
        If True, drops early rows that contain NaN due to historical lags.

    Returns:
    --------
    Tuple[pd.DataFrame, pd.DataFrame]: (train_df, val_df)
    """
    if val_days < 1:
        raise ValueError(f"val_days must be >= 1, got: {val_days}")

    out = df.copy()

    if drop_lag_na:
        # Lag columns
        lag_cols = [c for c in out.columns if "lag_" in c]
        if lag_cols:
            out = out.dropna(subset=lag_cols).reset_index(drop=True)

    if split_date is not None:
        cutoff = pd.to_datetime(split_date)
    else:
        max_date = out["date"].max()
        cutoff = max_date - pd.Timedelta(days=val_days - 1)

    train_df = out[out["date"] < cutoff].copy().reset_index(drop=True)
    val_df = out[out["date"] >= cutoff].copy().reset_index(drop=True)

    if train_df.empty:
        raise ValueError("Chronological split resulted in an empty training set.")
    if val_df.empty:
        raise ValueError("Chronological split resulted in an empty validation set.")

    # Mathematical assertion: strictly zero temporal overlap
    assert train_df["date"].max() < val_df["date"].min(), (
        f"Data leakage detected! Train max date ({train_df['date'].max()}) "
        f"is not strictly before Val min date ({val_df['date'].min()})."
    )

    return train_df, val_df


def run_preprocessing_pipeline(
    data_dir: Union[str, Path] = "data/raw",
    store_nbr: int = 1,
    start_date: str = "2016-01-01",
    end_date: str = "2017-08-15",
    val_days: int = 30,
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Union[int, str, float]]]:
    """
    Full pipeline runner for data loading, calendar regularization, feature engineering,
    and chronological train/validation splitting.
    """
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
    featured_df = add_leakage_safe_features(cal_df)

    train_df, val_df = chronological_train_val_split(featured_df, val_days=val_days)

    metadata = {
        "store_nbr": store_nbr,
        "start_date": str(raw_df["date"].min().date()),
        "end_date": str(raw_df["date"].max().date()),
        "raw_rows_loaded": len(raw_df),
        "reconciled_rows": len(grid_df),
        "train_rows": len(train_df),
        "val_rows": len(val_df),
        "train_start": str(train_df["date"].min().date()),
        "train_end": str(train_df["date"].max().date()),
        "val_start": str(val_df["date"].min().date()),
        "val_end": str(val_df["date"].max().date()),
        "perishable_families_count": int(featured_df["family"].nunique()),
    }

    return train_df, val_df, metadata
