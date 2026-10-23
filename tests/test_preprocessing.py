"""
tests/test_preprocessing.py

Comprehensive unit tests verifying:
1. File validation and error handling on missing/invalid files.
2. Perishable-family filtering and date bounds.
3. Duplicate detection.
4. Leakage prevention for lag and rolling features.
5. Chronological train/val splitting with zero temporal overlap.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.preprocessing import (
    DEFAULT_PERISHABLE_FAMILIES,
    add_calendar_and_holiday_features,
    add_leakage_safe_features,
    chronological_train_val_split,
    load_and_filter_sales,
    reconcile_calendar_grid,
    validate_raw_files,
)


@pytest.fixture
def sample_sales_df() -> pd.DataFrame:
    """Creates a small 2-family, 30-day continuous sales dataframe."""
    dates = pd.date_range("2017-01-01", periods=30, freq="D")
    records = []
    for fam in ["DAIRY", "PRODUCE"]:
        for i, d in enumerate(dates):
            records.append({
                "date": d,
                "store_nbr": 1,
                "family": fam,
                "sales": float((i + 1) * 10),
                "onpromotion": int(i % 3),
            })
    return pd.DataFrame(records)


def test_validate_raw_files_success():
    """Verify raw file validator detects real data files when present."""
    files = validate_raw_files("data/raw")
    assert files["train"].is_file()
    assert files["stores"].is_file()
    assert files["holidays"].is_file()


def test_validate_raw_files_missing():
    """Verify validator raises FileNotFoundError for non-existent directories."""
    with pytest.raises(FileNotFoundError):
        validate_raw_files("non_existent_directory_xyz")


def test_load_and_filter_sales_invalid_store(tmp_path):
    """Verify invalid store numbers trigger ValueError."""
    dummy_csv = tmp_path / "dummy_train.csv"
    dummy_csv.write_text("date,store_nbr,family,sales,onpromotion\n2017-01-01,1,DAIRY,10,0\n")
    with pytest.raises(ValueError, match="positive integer"):
        load_and_filter_sales(train_path=dummy_csv, store_nbr=0)


def test_load_and_filter_sales_invalid_dates(tmp_path):
    """Verify start_date > end_date raises ValueError."""
    dummy_csv = tmp_path / "dummy_train.csv"
    dummy_csv.write_text("date,store_nbr,family,sales,onpromotion\n2017-01-01,1,DAIRY,10,0\n")
    with pytest.raises(ValueError, match="cannot be after end_date"):
        load_and_filter_sales(
            train_path=dummy_csv,
            store_nbr=1,
            start_date="2017-02-01",
            end_date="2017-01-01",
        )


def test_perishable_filtering(sample_sales_df):
    """Ensure non-perishable categories are excluded when filtering is applied."""
    extra_row = pd.DataFrame([{
        "date": pd.Timestamp("2017-01-01"),
        "store_nbr": 1,
        "family": "AUTOMOTIVE",
        "sales": 5.0,
        "onpromotion": 0,
    }])
    combined = pd.concat([sample_sales_df, extra_row], ignore_index=True)
    filtered = combined[combined["family"].isin(DEFAULT_PERISHABLE_FAMILIES)]
    assert "AUTOMOTIVE" not in filtered["family"].values
    assert set(filtered["family"].unique()) == {"DAIRY", "PRODUCE"}


def test_duplicate_detection_error(tmp_path):
    """Ensure duplicate (date, store_nbr, family) records raise ValueError."""
    dup_csv = tmp_path / "dup_train.csv"
    dup_csv.write_text(
        "date,store_nbr,family,sales,onpromotion\n"
        "2017-01-01,1,DAIRY,10,0\n"
        "2017-01-01,1,DAIRY,15,1\n"
    )
    with pytest.raises(ValueError, match="duplicate"):
        load_and_filter_sales(train_path=dup_csv, store_nbr=1)


def test_calendar_reconciliation_gap_fill():
    """Verify missing dates are populated with sales=0.0."""
    dates = [pd.Timestamp("2016-12-24"), pd.Timestamp("2016-12-26")]
    df = pd.DataFrame({
        "date": dates,
        "store_nbr": [1, 1],
        "family": ["DAIRY", "DAIRY"],
        "sales": [100.0, 150.0],
        "onpromotion": [0, 0],
    })
    reconciled = reconcile_calendar_grid(df, fill_known_closures=True)
    assert len(reconciled) == 3
    christmas_row = reconciled[reconciled["date"] == pd.Timestamp("2016-12-25")]
    assert len(christmas_row) == 1
    assert christmas_row["sales"].values[0] == 0.0


def test_leakage_safe_lag_and_rolling(sample_sales_df):
    """
    CRITICAL TEST: Verify that day t features strictly depend on past data.
    Modifying day t's sales MUST NOT change lag or rolling features on day t.
    """
    featured = add_leakage_safe_features(sample_sales_df, lag_days=(1, 2, 7), rolling_windows=(7,))

    # Inspect Dairy row on day index 10 (day 11 of series)
    dairy_subset = featured[featured["family"] == "DAIRY"].reset_index(drop=True)
    target_idx = 10
    
    # Lag 1 on day t must equal sales on day t-1
    assert dairy_subset.loc[target_idx, "sales_lag_1"] == dairy_subset.loc[target_idx - 1, "sales"]
    # Lag 2 on day t must equal sales on day t-2
    assert dairy_subset.loc[target_idx, "sales_lag_2"] == dairy_subset.loc[target_idx - 2, "sales"]

    # Rolling mean 7 on day t must be average of days [t-7, t-1]
    expected_rolling_mean = dairy_subset.loc[target_idx - 7 : target_idx - 1, "sales"].mean()
    assert np.isclose(dairy_subset.loc[target_idx, "sales_rolling_mean_7"], expected_rolling_mean, atol=1e-3)

    # NOW TEST COUNTERFACTUAL: Alter day t's sales in raw data and recompute
    corrupted_df = sample_sales_df.copy()
    corrupted_mask = (corrupted_df["family"] == "DAIRY") & (corrupted_df["date"] == dairy_subset.loc[target_idx, "date"])
    corrupted_df.loc[corrupted_mask, "sales"] = 99999.0  # Massive spike on day t

    corrupted_featured = add_leakage_safe_features(corrupted_df, lag_days=(1, 2, 7), rolling_windows=(7,))
    corrupted_dairy = corrupted_featured[corrupted_featured["family"] == "DAIRY"].reset_index(drop=True)

    # Day t's lag 1, lag 2, and rolling mean 7 MUST NOT CHANGE because day t was not in the past!
    assert corrupted_dairy.loc[target_idx, "sales_lag_1"] == dairy_subset.loc[target_idx, "sales_lag_1"]
    assert corrupted_dairy.loc[target_idx, "sales_rolling_mean_7"] == dairy_subset.loc[target_idx, "sales_rolling_mean_7"]


def test_chronological_train_val_split_strict_ordering(sample_sales_df):
    """Verify train/val split guarantees train max date < val min date."""
    featured = add_leakage_safe_features(sample_sales_df, lag_days=(1, 2), rolling_windows=(7,))
    train_df, val_df = chronological_train_val_split(featured, val_days=7)

    # Check temporal ordering
    assert train_df["date"].max() < val_df["date"].min()
    # Check no overlap
    train_dates = set(train_df["date"].unique())
    val_dates = set(val_df["date"].unique())
    assert len(train_dates.intersection(val_dates)) == 0
    # Check validation set duration
    assert len(val_dates) == 7
