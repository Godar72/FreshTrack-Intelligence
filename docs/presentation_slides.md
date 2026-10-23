# FreshTrack Intelligence — Presentation Slides & Timed Speaking Script

**Course:** Applications and Use Cases of Machine Learning (Course Code: `TE7483`, Semester 5)  
**Department:** AIML Department, Symbiosis Institute of Technology, Pune  
**Faculty Evaluators:** Dr. Aniket Shahade, Dr. Shrikrishna Kolhar, Dr. Sumanto Dutta  
**Project Title:** FreshTrack Intelligence: AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System  
**Presentation Target Duration:** 8 to 10 Minutes  
**Design Palette:** Forest Green (`#183D32`), Warm Ivory (`#F5F3EA`), Leaf Green (`#A8BE78`), Alert Amber (`#D99A38`), Risk Red (`#B94F42`)  

---

## Slide 1: Title & Academic Affiliation

### Visual Layout
- **Header:** Symbiosis Institute of Technology, Pune — AIML Department
- **Course Banner:** Applications and Use Cases of Machine Learning (AUCML · TE7483)
- **Title:** FreshTrack Intelligence
- **Subtitle:** AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System
- **Pilot Scope:** Store 1 (Quito, Pichincha, Ecuador) · 9 Perishable Product Families
- **Evaluators:** Dr. Aniket Shahade · Dr. Shrikrishna Kolhar · Dr. Sumanto Dutta
- **Presenter:** `[Student Name]` · `[PRN]` · Third Year B.Tech AIML (Batch 2024–28)

### Speaker Notes (0:00 – 0:45)
> "Good morning, respected faculty members Dr. Shahade, Dr. Kolhar, and Dr. Dutta.  
> Today, I am presenting **FreshTrack Intelligence**, an AI-driven decision-support platform designed to solve a critical commercial and environmental dilemma in retail grocery: **perishable food waste mitigation through predictive demand forecasting and margin-safe dynamic markdowns**.  
> The project benchmarks 9 perishable food categories from Corporación Favorita's Store 1 in Quito, Ecuador, coupling a 10.69% WAPE gradient-boosted demand model with an automated cost-floor pricing safeguard. Over the next 8 minutes, I will walk you through the problem formulation, methodology, empirical results, and system implementation."

---

## Slide 2: Real-World Problem & Motivation

### Visual Layout
- **The Operational Trade-off (Split Infographic):**
  - **Left Box (Stockout Risk):** Under-stocking $\to$ Empty shelves, lost revenue, customer churn.
  - **Right Box (Spoilage Risk):** Over-stocking $\to$ Expiration shrink, zero capital recovery, organic landfill waste.
- **Current Supermarket Practice:** Manual, subjective, end-of-day markdown stickers ("30% off") applied hours before expiry. Often breaches wholesale procurement margins or occurs too late to stimulate demand.
- **Project Solution:** Replace subjective store guessing with **algorithmic demand forecasting**, **proactive shelf-life surplus quantification**, and **margin-protected discount tiers**.

### Speaker Notes (0:45 – 1:30)
> "Supermarket managers managing perishable items like fresh produce, meats, dairy, and bakery face an operational trade-off every day. If they under-stock, they suffer stockouts and lost revenue. If they over-stock, unsold items expire and must be discarded.  
> Traditional supermarket discounting is manual, subjective, and reactive—items are discounted hours before expiration or thrown away entirely.  
> FreshTrack Intelligence replaces this subjective guesswork with a proactive system: we forecast customer demand across the remaining shelf life, quantify the expected surplus, and recommend margin-safe discounts early enough to stimulate sell-through while strictly protecting retail profitability."

---

## Slide 3: Objectives, Scope & Proposed Solution

### Visual Layout
- **Four Core Pillars:**
  1. **Demand Forecasting:** Autoregressive gradient boosting on empirical retail transaction data.
  2. **Surplus Risk Engine:** Recursive multi-step projection of unsold stock across remaining shelf life ($T_{\text{shelf}}$).
  3. **Dynamic Pricing Safeguard:** Transparent discount tiers ($0\%, 15\%, 30\%, 50\%$) governed by an automated margin cost floor.
  4. **Dual Interfaces:** Next.js 16 modern editorial web app + preserved Streamlit decision dashboard.
- **Empirical vs. Simulated Scope Boundary:**
  - *Empirical Data:* Point-of-sale transaction logs (sales, promotions, calendar dates).
  - *Simulated Parameters:* On-hand inventory, batch shelf life, and procurement costs (modeled as scenario assumptions).

### Speaker Notes (1:30 – 2:15)
> "Our solution is built on four core pillars: first, category-level demand forecasting; second, a recursive multi-step surplus risk engine; third, a transparent dynamic markdown rule engine; and fourth, dual user interfaces for store managers.  
> To maintain academic boundaries: our historical demand forecasting uses real supermarket sales data from Corporación Favorita. However, because public retail datasets do not track physical batch expiration tags or wholesale procurement costs, our platform treats starting stock, shelf-life days, and costs as configurable simulation inputs for operational scenario testing."

---

## Slide 4: Dataset, Provenance & Preprocessing

### Visual Layout
- **Dataset Source:** Kaggle Store Sales Benchmark (Corporación Favorita, Ecuador).
- **Isolated Subset:** Store 1 (Quito, Pichincha) across 9 Perishable Families:
  - `PRODUCE`, `DAIRY`, `BREAD/BAKERY`, `MEATS`, `POULTRY`, `DELI`, `EGGS`, `PREPARED FOODS`, `SEAFOOD`.
- **Chronological Span:** 593 calendar days (`2016-01-01` to `2017-08-15`).
- **Calendar Regularization Highlight:**
  - Ecuadorian supermarkets close on Christmas Day (`12-25`). In raw data, Dec 25 is missing.
  - Preprocessing pipeline injects explicit operational zeros (`sales = 0.0`, `onpromotion = 0`) to preserve an unbroken daily index for autoregressive lag stability.

### Speaker Notes (2:15 – 3:00)
> "Our dataset comes from the Kaggle Store Sales benchmark, capturing transaction history from Corporación Favorita in Ecuador. We isolate Store 1 in Quito across the 9 official perishable grocery categories.  
> In data cleaning, we addressed an operational nuance: Ecuadorian supermarkets close on Christmas Day, creating a missing date in raw POS records. Our preprocessing pipeline regularizes the calendar grid by explicitly imputing zero sales and zero promotions for Dec 25, preserving an unbroken daily time-series index without which autoregressive lags would suffer temporal displacement."

---

## Slide 5: Feature Engineering & Leakage-Safe Validation

### Visual Layout
- **Strict Leakage Prevention Protocol:**
  - **Lags:** $t-1, t-2, t-7, t-14$ (weekly and bi-weekly seasonality).
  - **Shifted Rolling Windows:** 7-day and 14-day rolling mean and standard deviation. Crucially, `.shift(1)` is applied before the window calculation:
    $$\text{Rolling Mean} = \text{mean}(y_{t-7}, \dots, y_{t-1})$$
    *Day $t$'s sales target is never included in day $t$'s feature vector.*
- **Locality-Aware Holiday Features:** Merges national holidays, Pichincha provincial events, and Quito municipal holidays, filtering out transferred holidays and compensatory workdays.
- **Validation Partition:**
  - *Train Partition:* 2016-01-15 to 2017-07-16 ($549$ dates, $4,941$ samples).
  - *Holdout Partition:* 2017-07-17 to 2017-08-15 ($30$ dates, $270$ samples).
  - Zero temporal overlap: $\max(\text{Train Date}) < \min(\text{Val Date})$.

### Speaker Notes (3:00 – 4:00)
> "A core priority in this project was methodological rigor and zero data leakage.  
> First, all lag features are shifted by at least 1 day. For our 7-day and 14-day rolling averages, we explicitly apply `.shift(1)` before computing the rolling window, ensuring that day $t$'s sales target is never included in day $t$'s feature vector.  
> Second, we reject randomized k-fold splits, which leak future data into the past. We enforce an empirical chronological holdout: training strictly on 4,941 samples up to July 16, 2017, and validating strictly out-of-sample on the final 30 calendar days across 270 observations."

---

## Slide 6: System Architecture & Technology Stack

### Visual Layout
- **Architecture Pipeline Diagram (Clean Horizontal Flow):**
  $$\text{Kaggle Raw CSVs} \longrightarrow \text{Preprocessing \& Lags} \longrightarrow \text{HistGradientBoosting Model} \longrightarrow \text{FastAPI (8 Endpoints)} \longleftrightarrow \text{Next.js 16 + Streamlit}$$
- **Technology Stack Summary:**
  - *ML Core:* Python 3.12, scikit-learn 1.7, pandas, NumPy, joblib.
  - *API Engine:* FastAPI, Uvicorn, Pydantic input models, reverse proxy.
  - *Frontends:* Next.js 16 (Turbopack, TypeScript, Lucide React, Stitch design system) on port 3000; Streamlit dashboard on port 8501.
  - *Testing Suite:* 47 Pytest tests + 54 Playwright browser acceptance tests.

### Speaker Notes (4:00 – 5:00)
> "Here is our end-to-end technical architecture.  
> The preprocessing and machine learning pipeline serializes the champion model into a joblib pipeline bundle. This bundle is loaded by an asynchronous FastAPI backend running on port 8000.  
> The backend exposes 8 REST endpoints with Pydantic request validation and CORS protection.  
> On the client side, we deploy two interfaces: a modern Next.js 16 web application styled according to our approved Stitch design system with 0-pixel border radius and editorial brutalist aesthetics, and our original Streamlit decision dashboard. Both interfaces are verified through 101 automated tests."

---

## Slide 7: Comparative Model Tournament Results

### Visual Layout
- **Out-of-Sample Holdout Benchmark Table ($N = 270$ samples, Jul 17 – Aug 15, 2017):**

| Architecture | MAE (Units) | RMSE | WAPE (%) | Training Time | Selection Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Lag-7 Baseline** | 69.33 | 153.24 | 14.56% | Instant | Naive weekly heuristic |
| **Ridge Regression** | 62.28 | 126.71 | 13.08% | < 1s | Linear regularized benchmark |
| **Random Forest Regressor** | 53.79 | 119.59 | 11.29% | ~4.8s | Non-linear ensemble |
| **HistGradientBoosting** | **50.91** | **103.88** | **10.69%** | **~1.2s** | **Selected Champion Model** |

- **Key Insights:**
  - $26.6\%$ relative error reduction over the Lag-7 heuristic baseline.
  - HistGradientBoosting beats Random Forest by $0.60\%$ WAPE and $15.72$ RMSE with $4\times$ faster training speed.
  - **$R^2$ Variance Decomposition:** Global pooled $R^2 = 0.9805$; Volume-weighted within-family $R^2 = 0.7916$; Macro-averaged within-family $R^2 = 0.5749$.

### Speaker Notes (5:00 – 6:00)
> "This slide presents our comparative model evaluation tournament on the 30-day out-of-sample validation set.  
> The naive Lag-7 baseline achieved a 14.56% WAPE. Ridge regression reduced this to 13.08%. Random Forest brought error down to 11.29%.  
> Our champion architecture, **HistGradientBoostingRegressor**, achieved the best performance: **10.69% WAPE, 50.91 units MAE, and 103.88 RMSE**, representing a 26.6% relative error reduction over naive store ordering.  
> Regarding $R^2$: our global pooled $R^2$ across all 270 samples is **0.9805**. Through ANOVA variance decomposition, we established that 85.6% of pooled variance represents static baseline level differences between product categories. When evaluated within individual families, the volume-weighted $R^2$ is **0.7916**, explaining 88% of variance in high-volume Produce and over 70% in Bakery, Meats, and Dairy."

---

## Slide 8: Waste-Risk Simulation & Dynamic Markdown Safeguard

### Visual Layout
- **Mathematical Formulations:**
  1. *Recursive Cumulative Demand:* $\hat{D}_{\text{cum}} = \sum_{k=1}^{T_{\text{shelf}}} \hat{D}_{t+k}$
  2. *Expected Surplus:* $W = \max(0, \; S - \hat{D}_{\text{cum}})$
  3. *Risk Ratio:* $R = W / S$
- **Operational Risk Classification Tiers:**
  - $R \le 15\% \to$ `LOW` (0% Discount)
  - $15\% < R \le 40\% \to$ `MODERATE` (15% Discount)
  - $40\% < R \le 65\% \to$ `HIGH` (30% Discount)
  - $R > 65\% \to$ `CRITICAL` (50% Discount)
- **Minimum-Margin Cost Floor Safeguard:**
  $$\text{Floor Price} = \text{round}\left(\text{Unit Cost} \times (1 + \text{Margin Floor}), \; 2\right)$$
  - *Automated Downgrade Ladder:* If Proposed Price $<$ Floor Price, automatically downgrades: $50\% \to 30\% \to 15\% \to 0\%$ until $\text{Price} \ge \text{Floor Price}$.

### Speaker Notes (6:00 – 7:00)
> "Here is our decision-support mathematical formulation.  
> First, our recursive forecaster generates daily predictions across the product's remaining shelf life without reading future ground truth. We sum these predictions to find cumulative expected demand.  
> If starting stock exceeds demand, we quantify expected surplus units and classify the surplus ratio into four operational risk tiers: Low, Moderate, High, or Critical.  
> Crucially, to prevent selling below cost, we enforce an automated **Minimum-Margin Floor Price**: Unit Cost times one plus the minimum margin. If a 50% liquidation discount would cause the selling price to breach the cost floor, the engine automatically steps down the discount to 30%, 15%, or 0%, guaranteeing that retail economics are protected."

---

## Slide 9: User Interfaces & System Walkthrough

### Visual Layout
- **Visual Showcase (Screenshots / Component Highlights):**
  - **Screen 1 (Overview):** Executive KPI cards, perishable risk table, live FastAPI aggregate sync.
  - **Screen 2 (Demand Forecast):** Horizon selector (1 to 14 days), recursive forecast graph, CSV download.
  - **Screen 3 (Inventory Risk):** Interactive stock and shelf-life sliders, daily inventory burn-down table.
  - **Screen 4 (Markdown Planner):** Visual pricing spectrum, live cost floor indicator, safeguard breach alert.
  - **Screen 6 (Mobile Dashboard):** Compact floor-operations view optimized for handheld inventory audits.
- **Original Streamlit Dashboard:** Preserved on port 8501 for comparative validation.

### Speaker Notes (7:00 – 8:00)
> "This slide illustrates our user interfaces.  
> In the Next.js application, store managers access the Overview screen to see total simulated surplus units and critical category alerts across all 9 families.  
> On the Demand Forecast workspace, planners can adjust the forecast horizon from 1 to 14 days and inspect recursive projections.  
> On the Markdown Decision Planner, department managers enter regular price, wholesale unit cost, and minimum margin. The interface renders a visual pricing spectrum showing exactly where the unit cost, floor price, and authorized markdown price sit, visibly alerting the user whenever the margin safeguard intervenes.  
> We also maintain our dedicated mobile view for floor staff doing shelf audits."

---

## Slide 10: Testing, Verification & Architectural Rigor

### Visual Layout
- **Automated Testing Evidence:**
  - **Python Pytest Suite:** **47 / 47 Passed (100%)** in 20.23s.
    - Verified: file validation, Christmas closure reconciliation, zero leakage assertions, negative prediction clipping, risk boundaries, and margin downgrades.
  - **Playwright Browser E2E Suite:** **54 / 54 Passed (100%)** in 44.1s.
    - Verified across 6 viewports (Desktop 1440px, Laptop 1280px, Tablet 768px, Mobile 430px, 390px, 360px).
    - Verified: Zero horizontal scrollbar overflow, zero console errors, live API proxying.
- **Security & Integrity:** Whitelisted CORS (`localhost:3000`, `127.0.0.1:3000`), Pydantic bounds sanitization, zero hardcoded secrets, prototype login disclosure.

### Speaker Notes (8:00 – 8:45)
> "Our implementation has been rigorously verified through comprehensive automated testing.  
> In Python, our Pytest suite executes 47 unit and integration tests with a 100% pass rate in 20 seconds, verifying data reconciliation, lag integrity, and business logic boundaries.  
> In the frontend, our Playwright end-to-end test suite executes 54 browser tests across 6 device viewports from 360px mobile to 1440px desktop with zero failures, confirming zero horizontal overflow, zero uncaught errors, and healthy API proxying.  
> Security practices include strict Pydantic bounds validation, origin-whitelisted CORS, and explicit prototype disclosures."

---

## Slide 11: Limitations, Future Work & Conclusion

### Visual Layout
- **Academic Limitations & Boundaries:**
  - Single-store pilot benchmark (Store 1 in Quito).
  - Public Kaggle dataset lacks warehouse RFID balances and physical waste logs (modeled via scenario simulations).
  - Discount tiers are discrete operational heuristics, not econometric price elasticity curves.
- **Future Enterprise Roadmap:**
  - Scale across all 54 Corporación Favorita stores via hierarchical multi-store LightGBM models.
  - Endogenous price elasticity estimation using historical promotional variation.
  - Cold-chain IoT temperature sensor telemetry integration.
- **Conclusion:** FreshTrack Intelligence delivers a mathematically sound, 10.69% WAPE demand forecaster and margin-safe dynamic pricing engine that bridges machine learning with retail decision support.

### Speaker Notes (8:45 – 9:30)
> "To conclude, FreshTrack Intelligence demonstrates how supervised machine learning can be translated into an actionable, explainable decision-support tool for retail food waste mitigation.  
> We recognize clear academic boundaries: our pilot validates Store 1, and our public dataset requires simulation assumptions for starting inventory and costs.  
> In future work, we plan to expand across all 54 stores using hierarchical multi-store gradient boosting, incorporate econometric price elasticity curves, and connect live cold-chain IoT temperature sensors.  
> The current system achieves a 10.69% WAPE, is backed by 101 passing tests, and protects commercial margins while targeting perishable waste."

---

## Slide 12: Question & Answer / Viva Defense Reference

### Visual Layout
- **Ready for Examiner Discussion:**
  - *Methodology:* Why WAPE over MAPE? Why `.shift(1)` is mandatory for zero leakage?
  - *Model Selection:* Why HistGradientBoosting outperforms Ridge and Random Forest?
  - *Statistics:* $R^2$ Variance Decomposition ($0.9805$ pooled vs $0.7916$ volume-weighted vs $0.5749$ macro-averaged).
  - *Business Logic:* Margin cost floor downgrade proof ($\text{Price} \ge \text{Cost} \times (1 + \text{Margin})$).
  - *Architecture:* Dual-frontend integration (Next.js 16 + Streamlit + FastAPI).
- **Comprehensive Reference:** Full answers to 25 examiner viva questions available in `docs/viva_guide.md`.

### Speaker Notes (9:30 – 10:00)
> "Thank you, Dr. Shahade, Dr. Kolhar, and Dr. Dutta.  
> The project codebase, empirical evaluation files, documentation, and live demonstration servers are active and ready.  
> I am now ready to take your questions and defend any aspect of the data preprocessing, model selection, mathematical formulations, or system implementation."
