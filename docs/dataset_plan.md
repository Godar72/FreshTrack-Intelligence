# Dataset Acquisition Strategy, Analysis & Preprocessing Plan

**Project**: AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System  
**Document Type**: Technical Specification & viva Defense Strategy  
**Status**: Completed Planning Stage  
**Target Milestone**: Phase 2 (Data Acquisition & Preprocessing Strategy)  

---

## 1. Candidate Dataset Evaluation: Kaggle Store Sales

We evaluated the primary candidate public retail dataset:
- **Dataset**: [Kaggle Store Sales – Time Series Forecasting](https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data)
- **Origin**: Corporación Favorita (large grocery retailer in Ecuador).
- **Domain**: Supermarket grocery sales time series across 54 stores and 33 product families.
- **Suitability for Demand Forecasting**: **High**. It contains real-world supermarket transactions with clear day-of-week seasonality, promotional effects, holiday shocks, and distinct perishable product categories (such as `DAIRY`, `PRODUCE`, `MEATS`, `POULTRY`, `SEAFOOD`, `BREAD/BAKERY`, and `DELI`).

---

## 2. Environment Accessibility & Download Protocol

### 2.1 Accessibility Status in Local Environment
- **Direct CLI Access**: The `kaggle` command-line tool is not installed or configured with API tokens in this environment.
- **Authentication Requirement**: Kaggle competition datasets require user login and agreement to the competition's specific terms and conditions. As a software engineering standard, Kaggle credentials (`kaggle.json` / API tokens) are private and must not be requested or exposed in code repositories.

### 2.2 Manual Download Instructions for the User
To acquire the official dataset without exposing credentials:

1. Open your web browser and navigate to the competition page:  
   [https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data](https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data)
2. Log in with your Kaggle account and accept the competition rules if prompted.
3. Click the **"Download All"** button (downloads `store-sales-time-series-forecasting.zip`, approx. 21 MB compressed).
4. Extract the zip archive and place the following files into the project directory:
   ```text
   AUCML Project/data/raw/
   ├── train.csv
   ├── stores.csv
   ├── holidays_events.csv
   ├── oil.csv (optional external covariate)
   └── transactions.csv (optional exploratory data)
   ```
5. Do not commit extracted CSV files to git; [.gitignore](file:///c:/Users/adity/Desktop/AUCML%20Project/.gitignore) is already configured to keep `data/raw/*.csv` untracked.

---

## 3. Authoritative Dataset Schema: Verified Facts vs. Assumptions

Based on authoritative competition documentation and historical schemas:

### 3.1 Verified Schema
| File | Column Name | Verified Data Type | Description |
| :--- | :--- | :--- | :--- |
| `train.csv` | `id` | Integer | Unique identifier for row. |
| `train.csv` | `date` | String (`YYYY-MM-DD`) | Date of sales record (2013-01-01 to 2017-08-15). |
| `train.csv` | `store_nbr` | Integer (1 to 54) | Store identifier. |
| `train.csv` | `family` | Categorical String | Product category (33 categories, including perishable food). |
| `train.csv` | `sales` | Float | **Target variable**: Total sales volume in units/kg. |
| `train.csv` | `onpromotion` | Integer | Total number of items in that family on promotion on that date. |
| `stores.csv` | `store_nbr` | Integer | Primary key matching `train.csv`. |
| `stores.csv` | `city`, `state` | String | Store geographic location. |
| `stores.csv` | `type` | String (`A`, `B`, `C`, `D`, `E`) | Store format / tier. |
| `stores.csv` | `cluster` | Integer (1 to 17) | Store cluster grouping. |
| `holidays_events.csv` | `date`, `type`, `locale`, `transferred` | String, Boolean | Calendar events and official national/local holidays. |

### 3.2 Verified Facts vs. Inferences
- **Verified Fact**: The dataset records aggregated daily sales per store per product family, **not individual barcode scans**.
- **Verified Fact**: `sales` can be fractional (e.g. 1.25 kg of produce or cheese).
- **Verified Fact**: There are 33 distinct families; 9 perishable grocery categories are explicitly available and selected: `BREAD/BAKERY`, `DAIRY`, `DELI`, `EGGS`, `MEATS`, `POULTRY`, `PREPARED FOODS`, `PRODUCE`, and `SEAFOOD`.
- **Inference / Caution**: Product prices, inventory stock balances, expiration dates, and physical waste logs are **NOT** in the dataset.

---

## 4. Time-Series Demand Forecasting Formulation

### 4.1 Prediction Target
- **Target Variable**: $y_{s, f, t} = \text{sales}$ for store $s$ and perishable product family $f$ on day $t$.
- We focus specifically on perishable food families to align directly with the project objective (food waste mitigation).

### 4.2 Candidate Input Features
1. **Calendar & Seasonality Features**:
   - Day of week (0 to 6, capturing weekend grocery surges).
   - Day of month and month of year (capturing salary cycles and seasonal shifts).
   - Binary flags: `is_weekend`, `is_holiday` (derived from `holidays_events.csv`).
2. **Lag Features (Autoregressive Signals)**:
   - $t-1$: Yesterday's sales.
   - $t-2$: 2-day prior sales.
   - $t-7$: Same day of previous week (captures 7-day cyclical seasonality).
   - $t-14$: Same day two weeks prior.
3. **Rolling Window Aggregations**:
   - `rolling_mean_7d`: 7-day moving average of sales (shifted by 1 day).
   - `rolling_std_7d`: 7-day sales volatility (shifted by 1 day).
   - `rolling_mean_14d`: 14-day moving average (shifted by 1 day).
4. **Contextual / Promotional Features**:
   - `onpromotion`: Number of items on sale in the family.
   - `store_type`, `cluster`: Static store-level categorical attributes.

### 4.3 Chronological Validation Strategy & Leakage Prevention
- **No Random K-Fold Splitting**: In time series, standard random cross-validation leaks future sales patterns into historical predictions, producing unrealistically optimistic scores.
- **Strict Chronological Split**:
  - Training window: Data up to cutoff date $T_{\text{train}}$.
  - Validation window: A contiguous hold-out window $[T_{\text{train}} + 1, T_{\text{val}}]$ (e.g. last 30 to 60 days of the training set).
- **Lag Shifting Enforcement**:
  - All rolling and lag statistics must be calculated on `.shift(1)`. A feature for day $t$ must only contain data known at day $t-1$ (end of prior business day).
- **Exclusion of Same-Day Contemporaneous Fields**:
  - `transactions.csv` records same-day customer count. Because same-day customer traffic cannot be known in advance of forecasting, it must **not** be used as a predictor for daily sales.

### 4.4 Model Evaluation Metrics
1. **MAE (Mean Absolute Error)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i|$$
   *Direct physical interpretability (average deviation in units sold).*
2. **RMSE (Root Mean Squared Error)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2}$$
   *Penalizes large demand underestimations or overestimations.*
3. **WAPE (Weighted Absolute Percentage Error)**:
   $$\text{WAPE} = \frac{\sum_{i=1}^N |y_i - \hat{y}_i|}{\sum_{i=1}^N y_i}$$
   *The retail industry standard for inventory planning. Avoids division-by-zero on low-demand or zero-sales days where standard MAPE fails.*

---

## 5. Food Waste & Dynamic Markdown Gap Analysis

### 5.1 The Fundamental Gap in Public Retail Datasets
Almost all public retail competitions (including Kaggle Store Sales, Rossmann, and M5) were created for **sales forecasting**, not waste accounting. Consequently:
- **No Inventory Balances**: The dataset records what was *sold*, not what remained on store shelves at close of business.
- **No Expiration Dates / Shelf-Life**: Retail receipts do not log batch shelf-life or expiry dates.
- **No Recorded Waste / Shrink**: Spoiled items discarded into waste bins are not itemized.
- **No Unit Costs or Retail Prices**: Only aggregated gross sales are reported, not individual SKU selling prices or supplier wholesale costs.

### 5.2 Academic Viva Risk
If a student project claims:
> *"Our machine learning model reduced food waste by 28% on the Kaggle dataset,"*

an examiner will immediately ask:
> *"Where in the Kaggle dataset is the waste or expiry column? How did you measure waste if it is not recorded?"*

Claiming direct waste metrics from unrecorded data destroys credibility.

---

## 6. The Defensible Hybrid Solution

To build a scientifically rigorous, defensible project, we adopt an **Empirical ML + Inventory Simulation Hybrid Design**:

```text
┌────────────────────────────────────────────────────────┐
│  Tier 1: Empirical Demand Forecasting (Machine Learning) │
│  - Real historical grocery sales (Kaggle Store Sales)   │
│  - Evaluated on real unseen sales with MAE, RMSE, WAPE │
└──────────────────────────┬─────────────────────────────┘
                           │ Predicted Demand (D_t)
                           ▼
┌────────────────────────────────────────────────────────┐
│  Tier 2: Controlled Inventory & Perishable Simulation   │
│  - Configurable batch replenishment (s, S policy)      │
│  - Shelf-life horizons based on food standards         │
│    (Dairy: 5-7d, Produce: 3-5d, Bakery: 2d)           │
│  - Simulated On-Hand Stock (S_t) & Days to Expiry (T)   │
└──────────────────────────┬─────────────────────────────┘
                           │ Stock (S_t) & Remaining Shelf-Life (T)
                           ▼
┌────────────────────────────────────────────────────────┐
│  Tier 3: Deterministic Waste Risk & Markdown Policy    │
│  - Expected Surplus: W = max(0, S_t - Cumulative D)    │
│  - Dynamic Markdown Decision Matrix (0%, 15%, 30%, 50%)│
│  - Margin Floor Safeguard: Price >= Unit Cost * Floor  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Tier 4: Streamlit Interactive Decision Dashboard      │
│  - Clearly badges Real vs. Simulated components        │
│  - Interactive "What-If" slider for markdown policy   │
└────────────────────────────────────────────────────────┘
```

### 6.1 Scientific Justification
1. **Real-world Demand Dynamics**: The demand forecasting model learns real seasonal fluctuations, weekend peaks, and category variations from genuine retail data.
2. **Transparent Simulation Boundary**: The inventory level and expiry dates are explicitly simulated using standard retail replenishment policies.
3. **Honest Metric Reporting**:
   - Forecast accuracy is reported as **Empirical Model Performance** (e.g. WAPE on actual sales).
   - Waste reduction is reported as **Policy Simulation Performance** (e.g. theoretical waste avoided under the markdown matrix vs. baseline no-discount policy).

---

## 7. Data Preprocessing & Pipeline Plan

When `data/raw/train.csv` and `data/raw/stores.csv` are placed in the directory, the preprocessing pipeline (`src/preprocessing.py`) will execute the following steps:

1. **Filtering Scope**:
   - Focus on key perishable food categories: `DAIRY`, `PRODUCE`, `MEATS`, `POULTRY`, `BREAD/BAKERY`, `DELI`.
   - Select a high-volume representative store (e.g., Store 1 or Store 44) or subset of stores to ensure responsive model training on student machines.
   - Filter to a continuous recent historical window (e.g., 2016–2017) to capture modern purchasing patterns without memory bloat.
2. **Date Alignment & Regularization**:
   - Ensure a complete continuous daily date grid (no missing calendar days).
   - Fill closed-store dates (e.g., Christmas) with 0 sales.
3. **Feature Construction (`src/features.py`)**:
   - Compute lags: $t-1, t-2, t-7, t-14$.
   - Compute rolling statistics: 7-day rolling mean and standard deviation shifted by 1 day.
   - Add calendar day-of-week, weekend, and holiday indicators.
4. **Data Validation & Sanity Checks**:
   - Assert zero null values in model feature columns.
   - Check that `sales >= 0`.
   - Verify that train/test cutoff preserves temporal ordering.

### 7.1 Empirical Preprocessing Verification Results (Executed on Real Data)
The preprocessing pipeline was implemented in [src/preprocessing.py](file:///c:/Users/adity/Desktop/AUCML%20Project/src/preprocessing.py) and executed via [src/data_quality_report.py](file:///c:/Users/adity/Desktop/AUCML%20Project/src/data_quality_report.py) on Store 1 (2016-01-01 to 2017-08-15):
- **Raw Rows Filtered**: 5,328 perishable records (9 families).
- **Calendar Reconciliation**: Missing Christmas Day 2016 (`2016-12-25`) correctly identified as annual store closure and reconciled to `sales=0.0`, resulting in 5,337 continuous daily rows.
- **Usable Modeling Rows**: 5,211 rows after dropping 14 initial burn-in days for lag computation.
- **Temporal Split**: 4,941 training rows (2016-01-15 to 2017-07-16) and 270 validation rows (2017-07-17 to 2017-08-15).
- **Zero Leakage**: Strict inequality verified (`2017-07-16 < 2017-07-17`), zero duplicate keys, zero null values in final feature matrix.

---

## 8. Summary of Milestones Achieved

1. **Phases 1–3 Completed**: Data inspection, calendar regularization, shifted lag & rolling feature engineering, and data quality reporting (`src/data_quality_report.py`).
2. **Phase 4 Completed**: Multi-model demand forecasting benchmark (Lag-7 baseline: 14.56% WAPE; Ridge: 13.08% WAPE; Random Forest: 11.29% WAPE; HistGradientBoosting: 10.69% WAPE). Champion pipeline persisted to `models/demand_forecast_model.joblib`.
3. **Phase 5 Completed**: Recursive multi-step forecasting engine (`src/waste_risk.py`) and dynamic markdown decision engine with minimum margin safeguards (`src/markdown_rules.py`).
4. **Phase 6 Completed**: Interactive 4-tab Streamlit dashboard (`app/dashboard.py`).
5. **Phase 7 Completed**: Project-wide code audit, 35/35 automated tests passing, documentation alignment, and comprehensive undergraduate defense guide created in [docs/viva_guide.md](file:///c:/Users/adity/Desktop/AUCML%20Project/docs/viva_guide.md).
