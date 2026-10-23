# FreshTrack Intelligence — Project Status & Acceptance Handoff

**Project Title:** FreshTrack Intelligence: AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System  
**Academic Benchmark:** Kaggle Store Sales — Time Series Forecasting (Store 1, Quito, Pichincha, Ecuador, 2013–2017)  
**Evaluated Product Categories:** 9 Perishable Product Families (`PRODUCE`, `DAIRY`, `BREAD/BAKERY`, `MEATS`, `POULTRY`, `DELI`, `EGGS`, `SEAFOOD`, `PREPARED FOODS`)  
**Validation Window:** July 17, 2017 – August 15, 2017 (270 validation samples, Store 1)  
**Status Date:** October 2026  
**Final Audit:** All Acceptance Tests Passing (100% Pass Rate: 47/47 Python Tests, 54/54 Playwright Tests across 6 Viewports)

---

## 1. Executive Summary

FreshTrack Intelligence is an academic machine-learning decision-support platform designed to predict retail perishable grocery demand, simulate forward inventory surplus risk, and generate margin-guarded dynamic markdown recommendations.

The implementation preserves the approved Stitch visual design specification (`#183D32` Forest Green, `#F5F3EA` Warm Ivory, 0px corner radii, zero-blur elevation, Space Grotesk + Source Serif 4 typography) while replacing all design placeholders with live inferences from pre-trained machine learning models and validated simulation engines.

The platform architecture couples:
1. **Next.js 16 App Router** frontend with React 19, TypeScript, and Tailwind CSS v4.
2. **Python FastAPI** backend communicating with existing forecasting pipelines (`src/predict.py`, `src/waste_risk.py`, `src/markdown_rules.py`).
3. **Streamlit Operational Dashboard** (`app/dashboard.py`) preserved untouched.

---

## 2. Requirements Compliance Matrix

| Requirement | Category | Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Preserve Approved Stitch Design** | Visual & Design | **Implemented and tested** | Applied exact forest-green (`#183D32`) and ivory (`#F5F3EA`) palette, 0px border-radius, zero blur, editorial layout. |
| **All 7 Screens Implemented** | Architecture | **Implemented and tested** | 1. Overview (`/overview`), 2. Forecast (`/demand-forecast`), 3. Risk (`/inventory-risk`), 4. Markdown (`/markdown-planner`), 5. Performance (`/model-performance`), 6. Mobile (`/mobile`), 7. Login (`/login`). All load with status 200. |
| **Anti-Template Rules** | Design System | **Implemented and tested** | Zero purple-to-blue gradients, no neon glow, no generic bento grids, no fake testimonials, strict typographic discipline. |
| **Next.js + FastAPI Architecture** | Architecture | **Implemented and tested** | Production build passes (11 routes compiled). Next.js `/api/*` rewrites proxy seamlessly to FastAPI. |
| **Single Source of Truth (ML Modules)** | Modeling | **Implemented and tested** | ML inference and rule arbitration execute solely in Python backend (`src/`); zero duplicated ML business logic in browser. |
| **Real Kaggle Data Integration** | Data Integrity | **Implemented and tested** | Store 1 Quito 2016–2017 historical series (5,337 verified daily records across 9 perishable families) loaded into memory. |
| **Reported Validation Metrics** | Evaluation | **Implemented and tested** | Verified against `evaluation_metrics.json`: HistGradientBoosting WAPE 10.69%, MAE 50.913, RMSE 103.876; RF 11.29%; Ridge 13.08%; Lag-7 baseline 14.56%. |
| **Simulation Assumptions Transparency** | Academic Ethics | **Implemented and tested** | Explicit disclosures displayed: Kaggle dataset lacks actual waste quantities and measured markdown uplift; inventory stock and shelf life are user inputs. |
| **Four Risk Categories & Tiers** | Risk Simulation | **Implemented and tested** | LOW ($\le 15\%$, 0% disc), MODERATE ($15-40\%$, 15% disc), HIGH ($40-65\%$, 30% disc), CRITICAL ($>65\%$, 50% disc). |
| **Cost Floor Safeguard Enforcement** | Markdown Safeguard | **Implemented and tested** | Equation $\text{Floor} = \text{Unit Cost} \times (1 + \text{min\_margin})$ enforced server-side. Downgrades discount tiers when floor breached. |
| **Security & Secrets Review** | Security | **Implemented and tested** | Zero committed credentials. Restrictive CORS configured. Security headers (`X-Frame-Options`, `CSP`, `X-Content-Type-Options`) applied. |
| **Disclosed Prototype Authentication** | Security / Auth | **Implemented and tested** | Login interface explicitly discloses mock evaluative scope; reviewer state matrix enables testing validation errors and reset workflows without fake password collections. |
| **Input Validation & Bound Checks** | API Security | **Implemented and tested** | FastAPI Pydantic models validate shelf life (1–30), stock ($\ge 0$), margin ($0.05-0.50$), and supported perishable families. |
| **Responsive Viewports (1440, 1280, 768, 430, 390, 360)** | Accessibility | **Implemented and tested** | Verified across all 6 viewports via Playwright. Zero horizontal overflow (`document.documentElement.scrollWidth === clientWidth`). |
| **Accessible HTML & Keyboard Navigation** | Accessibility | **Implemented and tested** | Semantic `<main>`, `<nav>`, `<aside>`, `<header>`, skip-to-content links, visible focus outlines (`*:focus-visible`), readable color contrast. |
| **Automated Testing Suite** | Quality Assurance | **Implemented and tested** | 47/47 pytest tests passed in 52.00s. 54/54 Playwright browser tests passed across 6 viewports in 1.1m. |
| **Production Payment Processing** | Payments | **Not applicable** | Single-user academic decision support research tool; no real-world transaction or payment gateway needed. |
| **Persistent User Database** | Authentication | **Deferred** | Local academic prototype. Integration with external identity provider (Clerk, Auth0, Firebase) deferred to institutional deployment. |

---

## 3. Test Verification Summary

### Backend Unit & Integration Tests (Pytest)
```
====================== 47 passed, 15 warnings in 52.00s =======================
- tests/test_api.py (11 tests): Health, metadata, metrics, historical sales, forecast bounds, risk simulation, markdown safeguard, overview aggregation
- tests/test_dashboard.py (5 tests): Model loading, metrics integrity, historical context, end-to-end simulation
- tests/test_markdown_rules.py (5 tests): Discount tiers, margin safeguard downgrades, input validation
- tests/test_preprocessing.py (9 tests): Raw file validation, store filtering, date ordering, lag feature creation
- tests/test_train.py (8 tests): Metric calculation, clipping, baseline evaluation, pipeline persistence
- tests/test_waste_risk.py (9 tests): Threshold classification, recursive buffer, counterfactual leakage test
```

### End-to-End Browser Tests (Playwright across 6 Viewports)
```
Running 54 tests using 1 worker
- [desktop-1440] (1440px desktop): 9 passed
- [laptop-1280] (1280px laptop): 9 passed
- [tablet-768] (768px tablet): 9 passed
- [mobile-430] (430px mobile): 9 passed
- [mobile-390] (390px mobile): 9 passed
- [mobile-360] (360px narrow mobile): 9 passed

====================== 54 passed in 1.1m ======================
```

---

## 4. Quickstart & Deployment Instructions

### Prerequisites
- Node.js 18+ (tested on Node v24.14.0, npm 11.9.0)
- Python 3.10+ (tested on Python 3.13.5 Anaconda)

### 1. Launch FastAPI Backend Service
```powershell
# From project root:
& "python" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

### 2. Launch Next.js Web Application
```powershell
# In a separate terminal, navigate to frontend/:
cd frontend
npm install
npm run build
npm run start -- -p 3000
```
- Web Application: `http://localhost:3000`
- Screen 1: Desktop Overview: `http://localhost:3000/` or `http://localhost:3000/overview`
- Screen 2: Demand Forecast: `http://localhost:3000/demand-forecast`
- Screen 3: Inventory Risk: `http://localhost:3000/inventory-risk`
- Screen 4: Markdown Planner: `http://localhost:3000/markdown-planner`
- Screen 5: Model Performance: `http://localhost:3000/model-performance`
- Screen 6: Dedicated Mobile: `http://localhost:3000/mobile`
- Screen 7: Terminal Login: `http://localhost:3000/login`

### 3. Run Automated Browser Verification Suite
```powershell
cd frontend
npx playwright test
```

### 4. Optional: Run Original Streamlit Dashboard
```powershell
streamlit run app/dashboard.py
```

---

## 5. Production Deployment Architecture & Hosting Readiness

### Cloud Architecture Overview
The platform decouples the stateful Python decision engine from the Next.js edge frontend:
1. **Frontend (Vercel)**:
   - Framework: Next.js 16.4.3 (App Router) + React 19 + Tailwind CSS
   - Deployment: Edge CDN static generation (11 routes prerendered)
   - Configuration: `frontend/vercel.json` with dynamic API rewrites (`/api/:path*` -> `${BACKEND_API_URL}/api/:path*`)
2. **Backend (Render Web Service / Container)**:
   - Framework: FastAPI 0.161.1 + Uvicorn 0.54.0 + Python 3.11/3.13
   - Model In-Memory: `models/demand_forecast_model.joblib` (324 KB, HistGradientBoosting)
   - Benchmark Metrics: `models/evaluation_metrics.json` (1.7 KB)
   - Lightweight Perishables Cache: `data/processed/store1_history.parquet` (46.9 KB, 5,337 rows)
   - Dynamic Port/Host: Binds to `$PORT` and `$HOST` (default `0.0.0.0:8000`)
   - Healthcheck: `/api/health`
3. **Containerization**:
   - `Dockerfile`: Multi-stage, non-root user (`appuser:1001`), curl healthcheck, zero large Kaggle zip dependencies
   - `render.yaml`: Infrastructure-as-code blueprint for automated free-tier deployment

