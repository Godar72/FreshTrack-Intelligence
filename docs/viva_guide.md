# Retail Food Waste Prediction & Dynamic Markdown System: Viva Defense Guide

**Project Title**: AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System  
**Academic Level**: Undergraduate Computer Science / Data Science Capstone  
**Target Audience**: Students preparing for project viva, external examiners, and technical evaluators  
**Scope**: Verified Implementation & Empirical Results (Store 1, Pichincha, Ecuador)  

---

## Table of Contents
1. [Section A: Project Overview & Motivation](#section-a-project-overview--motivation)
2. [Section B: Dataset, Gap Analysis & Assumptions](#section-b-dataset-gap-analysis--assumptions)
3. [Section C: Technical Architecture & System Pipeline](#section-c-technical-architecture--system-pipeline)
4. [Section D: Mathematical Formulations & Exact Code Alignment](#section-d-mathematical-formulations--exact-code-alignment)
5. [Section E: Model Selection & Empirical Benchmark Results](#section-e-model-selection--empirical-benchmark-results)
6. [Section F: Leakage Prevention & Methodological Rigor](#section-f-leakage-prevention--methodological-rigor)
7. [Section G: 3-to-5 Minute Live Dashboard Demonstration Script](#section-g-3-to-5-minute-live-dashboard-demonstration-script)
8. [Section H: Comprehensive Examiner Q&A (25 Essential Questions)](#section-h-comprehensive-examiner-qa-25-essential-questions)

---

## Section A: Project Overview & Motivation

### 1. Problem Statement
In retail grocery operations, perishable food products (e.g., dairy, produce, meats, poultry, seafood, bakery) suffer from rapid physical decay and short shelf lives. Retail store managers face a daily operational trade-off:
- **Under-stocking** causes stockouts, lost sales revenue, and dissatisfied customers.
- **Over-stocking** leads to unsold expired inventory, causing severe commercial shrink and biological food waste.

Traditional supermarket discounting is typically static and reactive: items are discounted manually hours before expiration or discarded entirely, forfeiting capital recovery and creating environmental waste.

### 2. Project Objectives & Scope
The objective of this project is to build an explainable, auditable **decision-support system** that:
1. **Forecasts daily demand** for perishable product categories using supervised machine learning on historical retail sales patterns.
2. **Quantifies waste surplus risk** over remaining shelf-life horizons by recursively comparing simulated on-hand inventory against cumulative predicted demand.
3. **Recommends dynamic markdown discounts** through transparent business rules that stimulate sell-through while strictly enforcing a **commercial cost-floor safeguard**.
4. **Presents actionable insights** to store managers through an interactive Streamlit dashboard.

### 3. What the System Actually Does
- Ingests real-world supermarket transaction time-series from the Corporación Favorita dataset.
- Filters and regularizes 9 perishable product families for Store 1 (Quito, Ecuador).
- Trains and compares 4 forecasting models (Lag-7 Heuristic Baseline, Ridge Regression, Random Forest, and Histogram-based Gradient Boosting).
- Performs leakage-safe recursive multi-step forecasting across arbitrary shelf-life horizons ($T_{\text{shelf}} \ge 1$ days).
- Computes expected unsold surplus units and categorizes risk into four tiers: `LOW`, `MODERATE`, `HIGH`, and `CRITICAL`.
- Generates dynamic markdown recommendations with an automated margin floor fallback (`0%`, `15%`, `30%`, `50%`).

### 4. What the System Does NOT Establish (Academic Boundaries)
- **Does not measure real-world waste reduction**: The public Kaggle dataset does not record physical waste logs or store inventory levels. Food waste reduction is an *operational inference* modeled through controlled inventory simulations.
- **Does not prove causal price elasticity**: The model does not claim that a 30% markdown guarantees an exact percentage increase in demand; markdown tiers are operational heuristics.
- **Does not claim cross-store generalization**: The trained champion model is validated strictly on Store 1. Extending the model across all 54 retail stores is a future enterprise milestone.

---

## Section B: Dataset, Gap Analysis & Assumptions

### 1. Kaggle Store Sales Dataset Overview
- **Source**: Kaggle Competition — *Store Sales - Time Series Forecasting* (Corporación Favorita, Ecuador).
- **Core Files Utilized**:
  - `train.csv`: Daily sales records containing `date`, `store_nbr`, `family`, `sales` (units/kg), and `onpromotion` (number of items on promotion).
  - `stores.csv`: Store metadata containing `store_nbr`, `city`, `state`, `type`, and `cluster`.
  - `holidays_events.csv`: Calendar events containing `date`, `type`, `locale`, `locale_name`, and `transferred`.

### 2. Experimental Subset (Store 1 & Perishable Families)
- **Store Location**: Store 1, located in Quito, Pichincha province.
- **Perishable Food Families (9 categories)**:
  1. `BREAD/BAKERY`
  2. `DAIRY`
  3. `DELI`
  4. `EGGS`
  5. `MEATS`
  6. `POULTRY`
  7. `PREPARED FOODS`
  8. `PRODUCE`
  9. `SEAFOOD`

### 3. Time Span and Chronological Partitioning
- **Overall Dataset Window**: `2016-01-01` to `2017-08-15` (593 calendar days).
- **Burn-in Lag Drop**: The initial 14 calendar days (`2016-01-01` to `2016-01-14`, 126 observations across 9 families) are reserved to populate autoregressive lags up to $t-14$ and are cleanly dropped from model fitting.
- **Training Set**: `2016-01-15` to `2017-07-16` (549 unique calendar dates, 4,941 samples across 9 families).
- **Validation Set (Out-of-Sample Hold-Out)**: `2017-07-17` to `2017-08-15` (30 unique calendar dates, 270 samples across 9 families).

### 4. Missing Data & Calendar Regularization
- **Store Closure Gap**: Ecuadorian supermarkets close on Christmas Day (`12-25`). In raw data, `2016-12-25` is absent.
- **Calendar Grid Reconciliation**: `src/preprocessing.py` explicitly constructs an unbroken daily index for every `(store_nbr, family)` pair. Missing Christmas entries are filled with `sales = 0.0` and `onpromotion = 0` to preserve uniform temporal spacing.

### 5. Why Inventory, Expiry, and Unit Cost are Simulated
Public retail time-series datasets contain sales volume and promotion counts, but omit:
1. **Starting warehouse/shelf stock balances**: Real ERP inventory logs are confidential.
2. **Product batch expiration dates**: Real batch codes and expiry tags are not recorded in checkout barcode logs.
3. **Wholesale procurement costs**: Store acquisition prices are commercially sensitive.
4. **Physical waste manifests**: Landfill and compost spoilage weights are rarely publicly disclosed.

**System Design Decision**: The project adopts a rigorous **hybrid architecture**:
- **Empirical ML**: Real historical supermarket data drives consumer demand forecasting.
- **Configurable Simulation**: Store managers provide starting inventory, days to expiry, regular unit price, wholesale unit cost, and minimum margin threshold via the interactive decision-support interface.

---

## Section C: Technical Architecture & System Pipeline

```
                 Raw CSV Data (train.csv, stores.csv, holidays_events.csv)
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │            src/preprocessing.py              │
                    │  - Filter Store 1 & 9 Perishable Families    │
                    │  - Reconcile Missing Dates (12-25 Closure)   │
                    │  - Merge City/State/National Holidays        │
                    │  - Generate Shifted Lags & Rolling Stats     │
                    │  - Strict Chronological Train/Val Split      │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │                 src/train.py                 │
                    │  - Fit Candidate Models on Train Set Only    │
                    │  - Evaluate Out-of-Sample on 30-Day Val Set  │
                    │  - Metrics: MAE, RMSE, WAPE                  │
                    │  - Select Champion (HistGradientBoosting)    │
                    │  - Serialize: models/demand_forecast_model   │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │              src/waste_risk.py               │
                    │  - Recursive Multi-Step Forecast (1..T days) │
                    │  - Zero Future Leakage via In-Memory Buffer  │
                    │  - Expected Surplus = max(0, Stock - Demand) │
                    │  - Classify Risk: LOW / MOD / HIGH / CRIT    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            src/markdown_rules.py             │
                    │  - Map Risk to Discount Tiers (0, 15, 30, 50)│
                    │  - Compute Margin Floor = Cost * (1 + Margin)│
                    │  - Automatic Safeguard Downgrade if Breached │
                    │  - Generate Plain-Language Audit Trail       │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │              app/dashboard.py                │
                    │  - Tab A: Inventory & Expiry Monitor         │
                    │  - Tab B: Interactive Plotly Forecast Visual │
                    │  - Tab C: Waste Risk & Dynamic Markdown Sim  │
                    │  - Tab D: Model Health & Viva Defense Center │
                    └──────────────────────────────────────────────┘
```

---

## Section D: Mathematical Formulations & Exact Code Alignment

Every mathematical formula in this section directly matches the Python implementation in `src/`.

### 1. Autoregressive Lag Features
For product family $f$, store $s$, on day $t$:
$$\text{sales\_lag\_k}(t) = y_{s, f, t-k}, \quad k \in \{1, 2, 7, 14\}$$
*Code implementation*: `grouped.shift(k)` in `src/preprocessing.py`.

### 2. Shifted Rolling Window Statistics
To guarantee zero lookahead leakage, rolling aggregations apply `.shift(1)` before window computation:
$$\mu_{w}(t) = \frac{1}{w} \sum_{i=1}^{w} y_{s, f, t-i}, \quad w \in \{7, 14\}$$
$$\sigma_{w}(t) = \sqrt{\frac{1}{w-1} \sum_{i=1}^{w} \left( y_{s, f, t-i} - \mu_{w}(t) \right)^2}, \quad w \in \{7, 14\}$$
*Code implementation*: `s.shift(1).rolling(window=w, min_periods=...).mean()` and `.std()` in `src/preprocessing.py`.

### 3. Chronological Train/Validation Separation
Let $\mathcal{D} = \{(x_t, y_t)\}_{t=t_{\text{start}}}^{t_{\text{end}}}$ be the regularized time-series. For cutoff date $t_{\text{cut}} = \text{"2017-07-17"}$:
$$\mathcal{D}_{\text{train}} = \{(x_t, y_t) \mid t < t_{\text{cut}}\}, \quad \mathcal{D}_{\text{val}} = \{(x_t, y_t) \mid t \ge t_{\text{cut}}\}$$
$$\max(t \in \mathcal{D}_{\text{train}}) < \min(t \in \mathcal{D}_{\text{val}})$$
*Code implementation*: `chronological_train_val_split()` in `src/preprocessing.py`.

### 4. Forecast Evaluation Metrics
For actual sales $y_i$ and model predictions $\hat{y}_i$ across $N$ validation observations ($N = 270$):

- **Non-Negative Rectification**:
  $$\hat{y}_i^{\text{rect}} = \max(0.0, \hat{y}_i)$$
  *(Ground-truth target values $y_i$ are never altered).*

- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |y_i - \hat{y}_i^{\text{rect}}|$$

- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i^{\text{rect}})^2}$$

- **Weighted Absolute Percentage Error (WAPE)**:
  $$\text{WAPE} = \left( \frac{\sum_{i=1}^{N} |y_i - \hat{y}_i^{\text{rect}}|}{\sum_{i=1}^{N} |y_i|} \right) \times 100\%$$
  *Zero-Denominator Safeguard*: If $\sum |y_i| == 0$, WAPE returns $0.0\%$ if $\sum |y_i - \hat{y}_i| == 0$, else a configurable fallback ($0.0\%$).

### 5. Recursive Multi-Step Demand Forecasting
For remaining shelf life $T_{\text{shelf}} \ge 1$ days starting from origin date $t_0$:
- At step $\tau = 1$ (day $t_0 + 1$): Features $x_{t_0+1}$ are computed from historical observed sales up to $t_0$. Model predicts $\hat{D}_{t_0+1} = \max(0.0, f(x_{t_0+1}))$.
- At step $\tau = 2$ (day $t_0 + 2$): $\hat{D}_{t_0+1}$ is dynamically appended into the sales history buffer to compute `sales_lag_1` and shifted rolling statistics for day $t_0 + 2$.
- This process recurses up to $\tau = T_{\text{shelf}}$ without ever accessing actual future sales.

### 6. Expected Surplus & Waste Risk Quantification
For batch starting inventory $S_0 \ge 0$ and shelf-life horizon $T_{\text{shelf}}$:

- **Cumulative Forecast Demand**:
  $$\hat{D}_{\text{cum}} = \sum_{\tau=1}^{T_{\text{shelf}}} \hat{D}_{t_0+\tau}$$

- **Expected Surplus Units ($W$)**:
  $$W = \max\left(0.0, \; S_0 - \hat{D}_{\text{cum}}\right)$$

- **Surplus-Risk Ratio ($R$)**:
  $$R = \begin{cases} \frac{W}{S_0}, & \text{if } S_0 > 0 \\ 0.0, & \text{if } S_0 = 0 \end{cases}$$

- **Demand Coverage Ratio**:
  $$\text{Coverage} = \begin{cases} \frac{\hat{D}_{\text{cum}}}{S_0}, & \text{if } S_0 > 0 \\ 0.0, & \text{if } S_0 = 0 \end{cases}$$

### 7. Risk Categorization Tiers
Implemented in `WasteRiskThresholds` (`src/waste_risk.py`):
- **LOW**: $R \le 0.15$ (Surplus $\le 15\%$ of inventory)
- **MODERATE**: $0.15 < R \le 0.40$ ($15\% < \text{Surplus} \le 40\%$)
- **HIGH**: $0.40 < R \le 0.65$ ($40\% < \text{Surplus} \le 65\%$)
- **CRITICAL**: $R > 0.65$ (Surplus $> 65\%$ of inventory)

### 8. Dynamic Markdown Tiers & Minimum-Margin Safeguard
Implemented in `src/markdown_rules.py`:

- **Proposed Discount Tier ($d_{\text{proposed}}$)**:
  $$d_{\text{proposed}} = \begin{cases} 0.00 \; (0\%), & \text{if Risk is LOW} \\ 0.15 \; (15\%), & \text{if Risk is MODERATE} \\ 0.30 \; (30\%), & \text{if Risk is HIGH} \\ 0.50 \; (50\%), & \text{if Risk is CRITICAL} \end{cases}$$

- **Commercial Margin Floor Price**:
  $$P_{\text{floor}} = \min\left(P_{\text{original}}, \; \text{round}\left(C_{\text{unit}} \times (1 + m_{\text{min}}), 2\right)\right)$$
  where $C_{\text{unit}}$ is wholesale procurement cost and $m_{\text{min}}$ is minimum required profit margin percentage.

- **Proposed Discounted Price**:
  $$P_{\text{proposed}} = \text{round}\left(P_{\text{original}} \times (1 - d_{\text{proposed}}), 2\right)$$

- **Enforced Margin Safeguard & Automatic Downgrade**:
  $$\text{If } P_{\text{proposed}} < P_{\text{floor}} \implies \text{Safeguard Triggered}$$
  The engine tests permissible discount tiers in descending order: $d \in (0.50, 0.30, 0.15, 0.00)$.  
  The final approved discount $d_{\text{final}}$ is the highest tier satisfying:
  $$\text{round}\left(P_{\text{original}} \times (1 - d), 2\right) \ge P_{\text{floor}}$$
  If no positive discount satisfies the floor, $d_{\text{final}} = 0.00$ ($0\%$, full price).

---

## Section E: Model Selection & Empirical Benchmark Results

### 1. Empirical Results on Out-of-Sample Validation Set
All models were evaluated on the identical 30-day out-of-sample validation slice (`2017-07-17` to `2017-08-15`, $N = 270$ observations).

| Architecture | MAE (units) | RMSE | WAPE (%) | Training Time | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lag-7 Heuristic Baseline** | 69.3309 | 153.2353 | 14.56% | Instant | Naive reference |
| **Ridge Regression** | 62.2834 | 126.7119 | 13.08% | Fast (< 1s) | Linear benchmark |
| **Random Forest Regressor** | 53.7903 | 119.5944 | 11.29% | Moderate (~5s) | Non-linear ensemble |
| **HistGradientBoostingRegressor** | **50.9129** | **103.8764** | **10.69%** | Fast (~1.5s) | **Champion Model** |

*Verification source*: `models/evaluation_metrics.json`.

### 2. Analysis of Model Progression
1. **Lag-7 Baseline (14.56% WAPE)**: Uses sales from the same day last week ($t-7$). It captures weekly cyclical seasonality but fails during promotions, holiday shifts, or trend shifts.
2. **Ridge Regression (13.08% WAPE)**: Achieves a $1.48\%$ absolute WAPE reduction over the baseline by combining autoregressive lags with one-hot encoded category indicators and calendar flags. However, linear models cannot represent complex non-linear feature interactions (e.g., interaction between `is_holiday` and specific food categories like `MEATS` or `PRODUCE`).
3. **Random Forest (11.29% WAPE)**: Captures complex non-linear threshold effects across categories and promotion counts, lowering WAPE by $1.79\%$ compared to Ridge.
4. **HistGradientBoosting (10.69% WAPE)**: Achieves the lowest error across all three metrics (MAE: $50.91$, RMSE: $103.88$, WAPE: $10.69\%$). Gradient boosted decision trees construct sequential trees that focus directly on residuals from previous iterations, naturally handling the skewed distributions of grocery sales.

### 3. Why Validation Superiority Does Not Guarantee Future Performance
- **Stationarity Assumption**: Validation occurred in July–August 2017. Macroeconomic shifts, inflation, or competitor store openings can shift the underlying data distribution (concept drift).
- **Store-Specific Patterns**: Store 1 is an urban store in Quito. Other stores in coastal regions or small towns exhibit different category turnover rates and holiday impacts.

---

## Section F: Leakage Prevention & Methodological Rigor

| Potential Leakage Vector | Risk to Validity | Project Mitigation Protocol | Exact Code Check |
| :--- | :--- | :--- | :--- |
| **Lookahead in Rolling Stats** | Rolling mean on day $t$ including day $t$'s sales leaks ground truth. | Mandatory `.shift(1)` applied before computing `.rolling()`. Day $t$ features only use data up to $t-1$. | `src/preprocessing.py:274-284` |
| **Contemporaneous Features** | Using same-day customer count (`transactions.csv`) leaks traffic. | Excluded from the pipeline; customer traffic is unknown prior to store opening. | `docs/dataset_plan.md` |
| **Temporal Cross-Validation** | Standard K-Fold randomly shuffles dates, training on future days to predict the past. | Strict chronological train/val split. Enforced assertion: `train_max_date < val_min_date`. | `src/preprocessing.py:347` |
| **Multi-Step Forecasting** | Reading true actual sales during horizon $[t+1, \dots, t+T]$. | Recursive buffer: predicted $\hat{D}_{t+1}$ dynamically feeds lags for $t+2$. Future sales are never read. | `src/waste_risk.py:258-260` |
| **Negative Prediction Clipping** | Modifying ground truth actuals corrupts metric calculations. | Non-negative clipping applies strictly to `y_pred`; ground-truth target `y_true` is never modified. | `src/train.py:84` |

---

## Section G: 3-to-5 Minute Live Dashboard Demonstration Script

When presenting to examiners, follow this structured walkthrough:

```
[0:00 - 0:45] SYSTEM OVERVIEW & SCOPE
- Action: Open http://localhost:8501.
- Examiner Talking Point: 
  "Good morning. This project is an AI-based decision-support system for retail food waste mitigation.
  In the sidebar, you see our operational boundary: Store 1, 9 perishable food categories, and our champion
  HistGradientBoosting model. Notice our academic transparency badge: demand forecasts are driven by real
  historical supermarket transactions, while on-hand inventory balances and expiration dates are simulated
  operational inputs."

[0:45 - 1:30] TAB A: INVENTORY & EXPIRY MONITOR
- Action: Select 'DAIRY', set 'Forecast Origin Date' to 2017-07-16, 'On-Hand Stock' to 2800 units, 'Remaining Shelf Life' to 3 days.
- Examiner Talking Point:
  "In Tab A, store managers track batch parameters. For Dairy on July 16, 2017, we simulate a batch of 2,800 units
  expiring in 3 days. The system immediately calculates that under normal demand, cumulative sales will reach
  approximately 2,216 units, leaving an expected surplus of ~584 units that will spoil if no action is taken."

[1:30 - 2:30] TAB B: RECURSIVE DEMAND FORECASTING
- Action: Switch to Tab B ('Demand Forecast'). Point out the vertical dotted line and Plotly curve.
- Examiner Talking Point:
  "In Tab B, we visualize past 30-day historical sales alongside our recursive multi-step forecast.
  Notice the vertical dashed line marking the forecast origin. Day 1 is predicted using true historical lags.
  Day 2 and Day 3 are predicted recursively: Day 1's forecast is dynamically fed into the lag buffer without
  touching future actual sales. The table below details predicted sales and holiday flags for each horizon step."

[2:30 - 3:30] TAB C: WASTE RISK & DYNAMIC MARKDOWN SIMULATOR
- Action: Switch to Tab C. Show the risk tier, markdown recommendation, and open the pricing expander.
- Action: Change Unit Price to $3.50, Unit Cost to $2.00, and Min Margin to 5%.
- Examiner Talking Point:
  "Tab C is our core decision engine. The surplus ratio of ~20.9% categorizes this batch as MODERATE risk,
  triggering a recommended 15% markdown. The price drops from $3.50 to $2.98.
  Now observe what happens if we change the risk to CRITICAL (e.g., increase inventory to 4,500 units):
  The proposed markdown is 50%, which would price the item at $1.75.
  However, our unit cost is $2.00 with a 5% margin, setting a strict cost floor of $2.10.
  The Margin Safeguard triggers automatically! It rejects the 50% discount and downgrades to 30% ($2.45),
  protecting the retailer from selling at a commercial loss."

[3:30 - 4:30] TAB D: MODEL HEALTH & VIVA DEFENSE
- Action: Switch to Tab D. Show the comparison bar chart.
- Examiner Talking Point:
  "In Tab D, we demonstrate rigorous empirical validation on held-out data.
  Our HistGradientBoosting model achieved 10.69% WAPE, outperforming the heuristic baseline (14.56%),
  Ridge regression (13.08%), and Random Forest (11.29%). Below the chart, we document our leakage prevention
  protocols and architectural decisions for academic defense."
```

---

## Section H: Comprehensive Examiner Q&A (25 Essential Questions)

### Q1. Why did you choose retail food waste mitigation as your project problem?
**Answer**: Food waste in supermarket retail is an acute environmental and economic crisis. Approximately one-third of produced food is wasted globally, with retail perishables accounting for significant commercial shrink. Unlike non-perishable goods, perishable inventory faces deterministic physical expiration. An AI decision-support system that predicts demand and dynamically markdowns products before expiration recovers capital while diverting edible food from landfills.

### Q2. Why did you choose the Kaggle Corporación Favorita dataset?
**Answer**: The Corporación Favorita dataset is one of the few open, high-volume retail time-series datasets containing real grocery store sales across multiple perishable categories (`DAIRY`, `PRODUCE`, `MEATS`, etc.), promotions, and regional holidays. It provides realistic non-stationary demand patterns with weekend surges and holiday disruptions.

### Q3. Why does your system forecast sales demand rather than forecasting food waste directly?
**Answer**: Public retail datasets record sales transactions, not waste logs. Supermarket waste is an unobserved latent variable in checkout data. More importantly, waste is fundamentally a function of *inventory minus sales demand*. By forecasting consumer demand, our system models the true exogenous variable, allowing store managers to calculate waste risk for *any* arbitrary inventory batch size.

### Q4. Why did you select HistGradientBoosting as your final champion model?
**Answer**: In our empirical benchmark on held-out out-of-sample data, `HistGradientBoostingRegressor` achieved the lowest error across all three metrics: MAE of $50.91$ units, RMSE of $103.88$, and WAPE of $10.69\%$. Histogram-based gradient boosting bins continuous numerical features into integer bins, drastically accelerating training while modeling non-linear interactions between categories, calendar cycles, and promotional signals.

### Q5. Why is standard K-Fold cross-validation inappropriate for time-series forecasting?
**Answer**: Standard K-Fold cross-validation randomly shuffles rows. In a time series, random shuffling causes lookahead data leakage: the model trains on future sales to predict past sales. This artificially inflates accuracy scores. We enforce strict chronological validation, training strictly on past data and validating out-of-sample on the future 30-day window.

### Q6. How did you prevent data leakage in your rolling mean and rolling standard deviation features?
**Answer**: We enforced a strict `.shift(1)` operation prior to computing any rolling aggregation. For example, `s.shift(1).rolling(7).mean()` on day $t$ computes the mean over days $[t-7, \dots, t-1]$. Day $t$'s sales target is strictly excluded from day $t$'s feature vector.

### Q7. What is WAPE, and why did you use it instead of MAPE or $R^2$?
**Answer**: WAPE (Weighted Absolute Percentage Error) is $\frac{\sum |y - \hat{y}|}{\sum y} \times 100\%$. In retail inventory, Standard MAPE divides by individual actual sales $y_i$. When daily sales are zero or near-zero, MAPE divides by zero or produces infinite percentages. $R^2$ is scale-dependent and does not represent operational inventory error. WAPE provides an aggregate volume-weighted percentage error that is robust, bounded, and the industry standard in retail supply chain forecasting.

### Q8. What happens to your WAPE calculation if total actual sales are zero?
**Answer**: In `src/train.py`, `calculate_metrics` includes an explicit zero-division guard. If $\sum |y_i| == 0$, it checks whether errors are also zero (returning $0.0\%$), and otherwise returns a configured safe fallback ($0.0\%$), preventing runtime division-by-zero crashes.

### Q9. Why can recursive multi-step forecasting accumulate error over longer horizons?
**Answer**: In recursive forecasting, predicted demand $\hat{D}_{t+1}$ feeds into the lag buffer to predict $\hat{D}_{t+2}$. Any prediction error in $\hat{D}_{t+1}$ corrupts the lag inputs for $\hat{D}_{t+2}$. Over extended horizons (e.g., beyond 7–14 days), this compound error can cause forecast drift. For perishable food retail, however, shelf lives are short (typically 1–7 days), making recursive forecasting well-suited for the operational window.

### Q10. How is expected surplus mathematically defined?
**Answer**: Expected surplus $W$ is defined as $W = \max(0.0, \; S_0 - \sum_{\tau=1}^{T_{\text{shelf}}} \hat{D}_{\tau})$, where $S_0$ is initial on-hand stock and $\hat{D}_{\tau}$ is predicted demand on horizon day $\tau$. The $\max(0, \cdot)$ operator guarantees that if demand exceeds inventory, surplus is zero rather than negative.

### Q11. How is the surplus-risk ratio calculated when starting inventory is zero?
**Answer**: In `src/waste_risk.py`, if $S_0 == 0$, the surplus-risk ratio $R$ is explicitly defined as $0.0$. There is zero stock on hand, so there is zero risk of physical inventory spoilage.

### Q12. What are the four waste risk categories and their numerical thresholds?
**Answer**: Configured in `WasteRiskThresholds`:
- **LOW**: Surplus ratio $R \le 0.15$
- **MODERATE**: $0.15 < R \le 0.40$
- **HIGH**: $0.40 < R \le 0.65$
- **CRITICAL**: $R > 0.65$

### Q13. Why are your dynamic markdown recommendations rule-based rather than reinforcement learning?
**Answer**: Reinforcement learning for retail pricing requires interactive reward signals (customer elasticity responses) that do not exist in historical offline datasets. Furthermore, RL pricing agents can exhibit erratic, unpredictable pricing behaviors that violate retail margin floors and consumer trust. Rule-based markdown matrices combined with ML demand forecasts provide transparent, legally compliant, and auditable pricing control.

### Q14. How does the minimum-margin safeguard work?
**Answer**: The user configures wholesale unit cost $C_{\text{unit}}$ and minimum profit margin $m_{\text{min}}$. The system computes a cost floor price: $P_{\text{floor}} = C_{\text{unit}} \times (1 + m_{\text{min}})$. If a proposed markdown tier drops the discounted price below $P_{\text{floor}}$, the engine automatically downgrades the discount through permitted tiers ($50\% \to 30\% \to 15\% \to 0\%$) to find the highest discount that respects the margin floor.

### Q15. Can the margin safeguard ever silently approve a price below the cost floor?
**Answer**: No. If even a 15% discount breaches the floor price, the engine downgrades the discount to $0\%$ (full regular price). The price cannot breach the commercial floor unless the original price was already below the floor before markdowns.

### Q16. Why is the current model trained only on Store 1?
**Answer**: Store 1 was chosen as the baseline representative pilot store for the capstone experiment. Restricting the pilot to Store 1 enabled deep inspection of data quality, calendar regularization, local holiday resolution, and multi-model benchmarking. The modular architecture is designed so that passing `store_nbr=K` into the preprocessing and training pipelines scales the solution across other stores.

### Q17. How did you handle holiday transfers in the Ecuadorian calendar?
**Answer**: In `holidays_events.csv`, when a public holiday falls midweek, authorities often move the holiday to Friday or Monday. The original date is marked `transferred = True` (normal working day), while the actual day off is recorded as `type = 'Transfer'`. Our preprocessing excludes rows with `transferred == True` and filters for national holidays plus regional/local events matching Store 1's location (Quito, Pichincha).

### Q18. How do you handle missing dates in the historical time series?
**Answer**: In Corporación Favorita data, stores close on Christmas Day (`12-25`), creating missing date rows. Rather than allowing irregular time steps that break lag features, `src/preprocessing.py` performs calendar grid reconciliation: it reindexes every series to a continuous daily frequency, explicitly filling Christmas closures with $0.0$ sales and $0$ promotions.

### Q19. Did you clip negative model predictions, and did that alter the training targets?
**Answer**: Gradient boosting and linear regression can occasionally predict negative numbers during low-demand periods. In `src/train.py` and `src/waste_risk.py`, predictions are rectified using $\max(0.0, \hat{y})$. Ground-truth target values $y_{\text{true}}$ are never modified.

### Q20. What features were used as inputs to the machine learning model?
**Answer**: A total of 16 features: 1 categorical (`family`) and 15 numerical features: `onpromotion`, `day_of_week`, `day_of_month`, `month`, `year`, `is_weekend`, `is_holiday`, `sales_lag_1`, `sales_lag_2`, `sales_lag_7`, `sales_lag_14`, `sales_rolling_mean_7`, `sales_rolling_std_7`, `sales_rolling_mean_14`, and `sales_rolling_std_14`.

### Q21. Why did you use Ridge Regression rather than Ordinary Least Squares (OLS)?
**Answer**: Autoregressive lags and rolling statistics exhibit high multicollinearity (e.g., `sales_rolling_mean_7` and `sales_rolling_mean_14` are strongly correlated). Ordinary Least Squares under high multicollinearity suffers from unstable coefficient estimates and high variance. Ridge regression applies an $L_2$ penalty ($\alpha = 10.0$) that shrinks coefficients, preventing numerical instability and overfitting.

### Q22. How is your project tested for code reliability and regression?
**Answer**: The repository includes 35 automated unit and integration tests across 5 test suites (`test_preprocessing.py`, `test_train.py`, `test_waste_risk.py`, `test_markdown_rules.py`, and `test_dashboard.py`). Tests verify schema integrity, non-leakage counterfactuals, zero-denominator safety, recursive lag feeding, margin floor downgrading, and end-to-end dashboard execution.

### Q23. What would be required to deploy this system into real-world production?
**Answer**: A real enterprise deployment would require:
1. Integration with the store's Point of Sale (POS) and Enterprise Resource Planning (ERP) databases for real-time inventory balances and batch expiration tracking.
2. Electronic Shelf Label (ESL) integration to automatically update digital price tags upon markdown approval.
3. Automated model retraining pipelines (e.g., using Airflow/Kubeflow) to retrain on fresh weekly sales.
4. Continuous data drift and concept drift monitoring.

### Q24. What are the key limitations of your current implementation?
**Answer**:
1. **Pilot Scope**: Trained and validated on Store 1; cross-store hierarchical models remain future work.
2. **Unobserved Price Elasticity**: The system models markdown price adjustments heuristically because public checkout data does not include historical price elasticity experiments.
3. **Cold-Start Items**: Newly introduced products with fewer than 14 days of sales history cannot construct `sales_lag_14` and require heuristic fallback estimates.

### Q25. If an examiner asks: "Did your model reduce food waste by 20%?", how should you respond?
**Answer**: "No, sir/madam. We must be scientifically precise: our model achieved a **10.69% WAPE** in forecasting perishable demand on real out-of-sample supermarket data. Because the Kaggle dataset does not record physical landfill waste or store inventory balances, real-world food waste reduction cannot be measured empirically from this data. Instead, our system provides an auditable decision-support simulation that quantifies surplus risk and recommends margin-safe markdowns to help store managers mitigate waste."
