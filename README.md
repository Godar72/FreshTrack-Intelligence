---
title: FreshTrack Intelligence API
emoji: 🥬
colorFrom: green
colorTo: emerald
sdk: docker
app_port: 7860
pinned: false
---

# AI-Based Retail Food Waste Prediction & Dynamic Markdown Recommendation System

An end-to-end, explainable machine learning and decision-support system designed for grocery and supermarket retailers to minimize perishable food spoilage and optimize revenue recovery before product expiration.

---

## 1. Project Overview & Motivation

Perishable items (produce, dairy, bakery, meats) account for a substantial portion of grocery retail shrink. Traditional static discount strategies either markdown goods too late (resulting in unsold waste) or too early (cannibalizing regular margins).

This project implements a **two-tier decision support system**:
1. **Demand Forecasting Model (ML)**: Predicts short-term daily unit sales per SKU using historical sales, day-of-week seasonality, and rolling demand statistics.
2. **Surplus & Dynamic Markdown Engine (Decision Rules)**: Analyzes on-hand stock and remaining shelf life against forecasted demand. When projected sales fall short of inventory before expiration, it triggers automated, configurable markdown recommendations designed to accelerate sell-through while preserving target margins.

---

## 2. System Architecture

```text
Historical Sales & Inventory Data
               │
               ▼
   [ Data Preprocessing ]  ──> Validation, Date Alignment, Shelf-Life Computations
               │
               ▼
   [ Feature Engineering ] ──> Lags (t-1, t-7), Rolling Means, Calendar Features
               │
               ▼
   [ ML Demand Forecaster ] ──> Scikit-Learn Regression Models (Ridge / RF / GBR)
               │
               ▼
   [ Waste Risk Engine ]   ──> Expected Surplus = max(0, Stock - Forecasted Demand)
               │
               ▼
 [ Markdown Policy Engine ] ──> Multi-tier transparent discount recommendations
               │
               ▼
   [ Streamlit Dashboard ] ──> Forecast charts, risk alerts, and markdown simulator
```

For detailed mathematical formulation and architecture diagrams, see [docs/architecture.md](docs/architecture.md).

---

## 3. Technology Stack

- **Core Programming**: Python 3.12
- **Data Manipulation & Analysis**: `pandas`, `numpy`
- **Machine Learning & Pipeline**: `scikit-learn`, `joblib`
- **Visualization & UI**: `streamlit`, `plotly`
- **Testing & Quality Assurance**: `pytest`

---

## 4. Repository Structure

```text
AUCML Project/
│
├── .gitignore               # Excludes venvs, caches, binaries, raw data
├── requirements.txt         # Compatible Python dependencies
├── README.md                # Project documentation and guide
├── PROJECT_STATUS.md        # Milestone checklist and implementation phases
│
├── data/
│   ├── raw/                 # Raw datasets (ignored in git)
│   └── processed/           # Cleaned feature tables (ignored in git)
│
├── models/                  # Serialized trained model pipelines (.joblib)
│
├── src/                     # Core system modules
│   ├── __init__.py
│   ├── preprocessing.py     # Data cleaning, calendar regularization & feature engineering
│   ├── data_quality_report.py # Empirical data inspection and split verification
│   ├── train.py             # Model training, out-of-sample evaluation & model persistence
│   ├── waste_risk.py        # Perishable waste risk engine & recursive multi-step forecaster
│   └── markdown_rules.py    # Dynamic markdown recommendation engine & margin floor safeguard
│
├── app/                     # Streamlit web application
│   ├── __init__.py
│   └── dashboard.py         # 4-Tab decision-support UI with Plotly visualizations
│
├── tests/                   # Automated unit tests (36 passing tests)
│   ├── __init__.py
│   ├── test_dashboard.py    # Smoke and integration tests for dashboard
│   ├── test_preprocessing.py # Validation, calendar reconciliation & leakage tests
│   ├── test_train.py        # Metrics, zero-denominator safety & pipeline tests
│   ├── test_waste_risk.py   # Surplus quantification, horizon & leakage tests
│   └── test_markdown_rules.py # Dynamic markdown tiers & margin safeguard tests
│
└── docs/
    ├── architecture.md      # Detailed technical architecture & formulas
    ├── dataset_plan.md      # Dataset schema, gap analysis & hybrid design
    └── viva_guide.md        # Comprehensive undergraduate viva defense guide & 25 Q&As
```

---

## 5. Empirical Model Evaluation Benchmark

All models were evaluated strictly out-of-sample on the held-out 30-day validation window (`2017-07-17` to `2017-08-15`, $N = 270$ samples, Store 1 across 9 perishable families):

| Architecture | MAE (units) | RMSE | WAPE (%) | Training Time | Role |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lag-7 Baseline** | 69.3309 | 153.2353 | 14.56% | Instant | Naive weekly heuristic |
| **Ridge Regression** | 62.2834 | 126.7119 | 13.08% | < 1s | Linear regularized benchmark |
| **Random Forest Regressor** | 53.7903 | 119.5944 | 11.29% | ~5s | Non-linear ensemble |
| **HistGradientBoostingRegressor** | **50.9129** | **103.8764** | **10.69%** | ~1.5s | **Selected Champion Model** |

*Verification file*: `models/evaluation_metrics.json`. Serialized artifact: `models/demand_forecast_model.joblib`.

---

## 6. Local Setup & Dashboard Launch

### 6.1 Prerequisites
- Python 3.10+ (tested and verified on Python 3.12)
- Kaggle Store Sales raw CSV files placed in `data/raw/` (`train.csv`, `stores.csv`, `holidays_events.csv`)

### 6.2 Environment Setup
1. Open terminal / PowerShell in the project directory:
   ```bash
   cd "AUCML Project"
   ```

2. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install project dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Run the automated test suite (36 unit tests):
   ```bash
   python -m pytest tests/ -v
   ```

5. Compile all modules for syntax verification:
   ```bash
   python -m compileall -q src app tests
   ```

6. Generate the reproducible data quality report:
   ```bash
   python -m src.data_quality_report
   ```

### 6.3 Launching the Interactive Streamlit Dashboard
```bash
python -m streamlit run app/dashboard.py
```
Open your browser at `http://localhost:8501`.

### 6.4 Launching the Modern Next.js Web Platform & FastAPI Backend

FreshTrack Intelligence includes an institutional web platform implementing the approved Stitch forest-green (`#183D32`) and warm-ivory (`#F5F3EA`) design system with 0px corner radii and editorial typography across all 7 operational screens.

#### Step 1: Start the FastAPI Backend
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- Interactive API Swagger: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

#### Step 2: Start the Next.js Web Application
```bash
cd frontend
npm install
npm run build
npm run start -- -p 3000
```
- Web Application: `http://localhost:3000`
- **Screen 1 — Desktop Overview**: `http://localhost:3000/` or `/overview`
- **Screen 2 — Demand Forecast Workspace**: `http://localhost:3000/demand-forecast`
- **Screen 3 — Inventory Risk Simulator**: `http://localhost:3000/inventory-risk`
- **Screen 4 — Dynamic Markdown Planner**: `http://localhost:3000/markdown-planner`
- **Screen 5 — Model Performance & Validation**: `http://localhost:3000/model-performance`
- **Screen 6 — Dedicated Floor Ops Mobile**: `http://localhost:3000/mobile`
- **Screen 7 — Terminal Login & Identity Review**: `http://localhost:3000/login`

### 6.5 Running Automated Verification Tests

The platform features comprehensive test suites validating modeling, API contracts, margin safeguards, and responsive rendering:

1. **Python Unit & Integration Tests (47 tests)**:
   ```bash
   pytest tests -v
   ```
2. **Playwright End-to-End Browser Tests (54 tests across 6 viewports)**:
   ```bash
   cd frontend
   npx playwright test
   ```
   Tested viewports: `1440px` (desktop), `1280px` (laptop), `768px` (tablet), `430px` (mobile), `390px` (mobile), `360px` (narrow mobile). Zero horizontal overflow.

### 6.6 Production Cloud & Container Deployment

The application is architected for zero-configuration cloud hosting across free-tier providers:

1. **Backend (Render / Docker)**:
   - Build using `Dockerfile` or connect `render.yaml` to Render Web Service.
   - Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Configurable origins: Set `ALLOWED_ORIGINS` to the deployed frontend domain.
   - Includes lightweight historical cache (`data/processed/store1_history.parquet`, 47 KB), avoiding 120MB raw data downloads.

2. **Frontend (Vercel)**:
   - Deploy `frontend/` directory directly to Vercel via Vercel CLI or GitHub Git integration.
   - Set environment variable: `BACKEND_API_URL=https://<your-backend-domain>`
   - Next.js proxies all `/api/*` endpoints directly to the backend.

---

## 7. College Viva / Technical Defense Highlights

When presenting this project in an academic viva, focus on these engineering decisions:

1. **Why Supervised ML for Demand + Rule Engine for Pricing?**
   - Pure reinforcement learning or unconstrained neural pricing often recommends erratic discounts or violates commercial pricing regulations.
   - Separating **uncertainty estimation** (ML for sales prediction) from **business policy** (deterministic markdown rules with floor margin protections) makes the system auditable, explainable, and production-safe.
2. **Evaluation Metrics**:
   - Instead of generic $R^2$, we use **MAE** (Mean Absolute Error), **RMSE** (Root Mean Squared Error), and **WAPE** (Weighted Absolute Percentage Error), which is the industry standard for retail inventory planning where volume weighting matters.
3. **Data Leakage Prevention**:
   - Rolling statistics strictly apply `.shift(1)` before window aggregation.
   - Recursive forecasting feeds prior-step predictions into dynamic buffers without ever reading future actual sales.
4. **Comprehensive Viva Defense Document**:
   - Detailed answers to 25 common examiner questions, complete mathematical formulations, and a 3–5 minute live presentation script are available in [docs/viva_guide.md](docs/viva_guide.md).

---

## 8. Academic Scope & Limitations Disclosure

To maintain scientific integrity and academic transparency:
- **Implemented & Empirically Validated**: Supervised demand forecasting across 9 perishable families on Store 1, calendar regularization, recursive forecasting, and margin safeguard logic (all verified via 35 automated tests).
- **Simulated Variables**: On-hand inventory balances, expiration dates, unit wholesale costs, and minimum margin thresholds are user-configured simulation parameters, as public supermarket checkout logs omit confidential ERP balances and physical waste manifests.
- **No Direct Measurement of Real Waste Reduction**: The project does not claim to have empirically measured physical landfill food waste reduction in Corporación Favorita stores. Waste reduction is an *operational simulation inference*.
- **Future Work**: Cross-store hierarchical modeling (scaling from Store 1 to all 54 Favorita stores) and empirical price elasticity estimation via A/B testing in live store deployments.

