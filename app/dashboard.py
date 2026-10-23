"""
app/dashboard.py

Streamlit Interactive Decision-Support Dashboard for:
AI-Based Retail Food Waste Prediction and Dynamic Markdown Recommendation System.

Features:
- Tab A: Inventory & Expiry Monitor (Batch configuration & simulation parameters).
- Tab B: Demand Forecast (Plotly time-series visualizer with recursive multi-day forecasting).
- Tab C: Waste Risk & Dynamic Markdown Simulator (Surplus quantification & margin-safe pricing).
- Tab D: Model Performance & Viva Explainability (Empirical metrics, model comparisons & defense guide).
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.markdown_rules import (
    DEFAULT_DISCOUNT_TIERS,
    calculate_markdown_recommendation,
)
from src.preprocessing import DEFAULT_PERISHABLE_FAMILIES
from src.train import load_trained_forecast_model
from src.waste_risk import (
    WasteRiskAssessment,
    WasteRiskThresholds,
    assess_waste_risk,
    load_historical_series,
)


# -----------------------------------------------------------------------------
# Cached Data & Model Loaders
# -----------------------------------------------------------------------------
@st.cache_resource(show_spinner="Loading trained forecasting model pipeline...")
def get_trained_model():
    """Load serialized demand forecasting model and training metadata."""
    model_path = Path("models/demand_forecast_model.joblib")
    if not model_path.is_file():
        return None, None
    return load_trained_forecast_model(model_path)


@st.cache_data(show_spinner="Loading historical sales context (Store 1, 2016-2017)...")
def get_historical_context():
    """Load and calendar-reconcile Store 1 sales data."""
    try:
        return load_historical_series(
            data_dir="data/raw",
            store_nbr=1,
            start_date="2016-01-01",
            end_date="2017-08-15",
        )
    except Exception as e:
        return None, None


@st.cache_data
def get_evaluation_metrics() -> Optional[Dict[str, Any]]:
    """Load model evaluation comparison metrics."""
    metrics_path = Path("models/evaluation_metrics.json")
    if metrics_path.is_file():
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def build_forecast_figure(
    history_df: pd.DataFrame,
    selected_family: str,
    forecast_origin_date: Any,
    waste_assessment: WasteRiskAssessment,
    remaining_shelf_life: int,
) -> go.Figure:
    """
    Construct the interactive Plotly demand forecast chart.

    Includes:
    - 30-day observed historical sales trace.
    - Multi-day recursive forecast trace.
    - Vertical marker shape & annotation at forecast origin date.

    Uses add_shape and add_annotation with string date coordinates to avoid
    the pandas/Plotly Timestamp addition TypeError encountered with add_vline.
    """
    fam_history = history_df[history_df["family"] == selected_family].sort_values("date")
    past_slice = fam_history[fam_history["date"] <= pd.to_datetime(forecast_origin_date)].tail(30)

    forecast_dates = [pd.to_datetime(d["date"]) for d in waste_assessment.daily_forecasts]
    forecast_values = [d["predicted_demand"] for d in waste_assessment.daily_forecasts]

    fig = go.Figure()

    # Historical sales trace
    fig.add_trace(
        go.Scatter(
            x=past_slice["date"],
            y=past_slice["sales"],
            mode="lines+markers",
            name="Observed Historical Sales",
            line=dict(color="#1f77b4", width=2.5),
            marker=dict(size=6),
            hovertemplate="<b>Date</b>: %{x|%Y-%m-%d}<br><b>Actual Sales</b>: %{y:.1f} units<extra></extra>",
        )
    )

    # Forecast trace
    plot_fc_dates = [past_slice["date"].iloc[-1]] + forecast_dates
    plot_fc_vals = [past_slice["sales"].iloc[-1]] + forecast_values

    fig.add_trace(
        go.Scatter(
            x=plot_fc_dates,
            y=plot_fc_vals,
            mode="lines+markers",
            name=f"Recursive Forecast ({waste_assessment.model_name})",
            line=dict(color="#ff7f0e", width=3, dash="dash"),
            marker=dict(size=8, symbol="star"),
            hovertemplate="<b>Date</b>: %{x|%Y-%m-%d}<br><b>Predicted Demand</b>: %{y:.1f} units<extra></extra>",
        )
    )

    # Vertical line and annotation at forecast origin (add_shape avoids Timestamp addition TypeError)
    origin_dt = pd.to_datetime(forecast_origin_date)
    origin_str = origin_dt.strftime("%Y-%m-%d")

    fig.add_shape(
        type="line",
        x0=origin_str,
        x1=origin_str,
        y0=0,
        y1=1,
        yref="paper",
        line=dict(color="#64748b", width=1.5, dash="dot"),
    )
    fig.add_annotation(
        x=origin_str,
        y=1,
        yref="paper",
        text="Forecast Origin",
        showarrow=False,
        xanchor="right",
        yanchor="top",
        font=dict(color="#64748b", size=11),
    )

    fig.update_layout(
        title=f"{selected_family} — 30-Day Historical Trend & {remaining_shelf_life}-Day Forecast",
        xaxis_title="Calendar Date",
        yaxis_title="Units Sold / Demanded",
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=60, b=40),
        template="plotly_white",
        height=450,
    )

    return fig


# -----------------------------------------------------------------------------
# Main Dashboard Renderer
# -----------------------------------------------------------------------------
def render_dashboard() -> None:
    """Render the full interactive Streamlit dashboard."""
    st.set_page_config(
        page_title="Retail Food Waste & Dynamic Markdown System",
        page_icon="🛒",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    st.markdown(
        """
        <style>
        .metric-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .badge-sim {
            background-color: #fef3c7;
            color: #92400e;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid #fde68a;
        }
        .badge-ml {
            background-color: #dbeafe;
            color: #1e40af;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid #bfdbfe;
        }
        .risk-low { color: #16a34a; font-weight: bold; }
        .risk-moderate { color: #d97706; font-weight: bold; }
        .risk-high { color: #dc2626; font-weight: bold; }
        .risk-critical { color: #7f1d1d; font-weight: bold; }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.title("🛒 AI-Based Retail Food Waste Prediction & Dynamic Markdown System")
    st.caption(
        "A hybrid operational decision-support tool combining **Supervised ML Demand Forecasting** with "
        "**Deterministic Waste Risk Quantification** and **Margin-Safe Markdown Rules**."
    )

    with st.sidebar:
        st.header("⚙️ System Status & Scope")
        st.info(
            "**Supported Scope**:\n"
            "- **Store**: Store 1 (Quito, Ecuador)\n"
            "- **Categories**: 9 Perishable Families\n"
            "- **Historical Window**: Jan 2016 – Aug 2017\n"
            "- **Model**: HistGradientBoosting (10.69% WAPE)"
        )
        st.markdown("---")
        st.markdown("### 📌 Simulation Notice")
        st.caption(
            "Sales forecasts are derived from **real historical supermarket data**. "
            "Inventory levels, shelf-life horizons, unit costs, and markdown elasticities "
            "are **user-configured simulation parameters** designed for store decision support."
        )
        st.markdown("---")
        st.markdown("**Academic Viva Project**: Retail Food Waste Optimization")

    # Load Artifacts
    pipeline, model_meta = get_trained_model()
    history_df, raw_files = get_historical_context()
    metrics_json = get_evaluation_metrics()

    if pipeline is None or history_df is None:
        st.error(
            "⚠️ Model artifacts or raw data files are missing! "
            "Please ensure `data/raw/` contains the verified CSV files and run `python -m src.train` to generate `models/demand_forecast_model.joblib`."
        )
        st.stop()

    # -------------------------------------------------------------------------
    # Global Interactive Inputs
    # -------------------------------------------------------------------------
    col_in1, col_in2, col_in3, col_in4 = st.columns(4)

    with col_in1:
        selected_family = st.selectbox(
            "Product Family (Perishable)",
            options=DEFAULT_PERISHABLE_FAMILIES,
            index=DEFAULT_PERISHABLE_FAMILIES.index("DAIRY") if "DAIRY" in DEFAULT_PERISHABLE_FAMILIES else 0,
            help="Select one of the 9 documented perishable food categories.",
        )

    with col_in2:
        min_date = pd.to_datetime("2016-01-15").date()
        max_date = history_df["date"].max().date()
        default_origin = pd.to_datetime("2017-07-16").date()  # Out-of-sample split boundary

        forecast_origin_date = st.date_input(
            "Forecast Origin Date",
            value=default_origin,
            min_value=min_date,
            max_value=max_date,
            help="Close-of-business date from which future demand is forecasted.",
        )

    with col_in3:
        starting_inventory = st.number_input(
            "On-Hand Stock (Units)",
            min_value=0.0,
            max_value=20000.0,
            value=2800.0,
            step=50.0,
            help="Current simulated inventory balance on shelves at origin date.",
        )

    with col_in4:
        remaining_shelf_life = st.slider(
            "Remaining Shelf Life (Days)",
            min_value=1,
            max_value=14,
            value=3,
            help="Number of days remaining before product batch expires.",
        )

    # Pricing & Margin Inputs Collapsible
    with st.expander("💰 Commercial Pricing & Margin Safeguard Settings", expanded=False):
        col_p1, col_p2, col_p3 = st.columns(3)
        with col_p1:
            unit_price = st.number_input(
                "Original Unit Price ($)",
                min_value=0.10,
                max_value=100.0,
                value=3.50,
                step=0.25,
                help="Regular retail selling price before any promotional markdown.",
            )
        with col_p2:
            unit_cost = st.number_input(
                "Unit Cost ($)",
                min_value=0.05,
                max_value=unit_price,
                value=2.00,
                step=0.25,
                help="Wholesale procurement cost paid by store to supplier.",
            )
        with col_p3:
            min_margin_pct = st.slider(
                "Minimum Required Margin Floor (%)",
                min_value=0.0,
                max_value=50.0,
                value=5.0,
                step=1.0,
                help="Profit margin above unit cost required by store commercial policy.",
            ) / 100.0

    # Execute Core Pipeline
    try:
        waste_assessment = assess_waste_risk(
            product_family=selected_family,
            forecast_origin_date=pd.to_datetime(forecast_origin_date),
            starting_inventory=starting_inventory,
            remaining_shelf_life=remaining_shelf_life,
            store_nbr=1,
            model_pipeline=pipeline,
            history_df=history_df,
        )

        markdown_rec = calculate_markdown_recommendation(
            product_family=selected_family,
            risk_category=waste_assessment.risk_category,
            expected_surplus_units=waste_assessment.expected_surplus_units,
            unit_price=unit_price,
            unit_cost=unit_cost,
            min_margin_pct=min_margin_pct,
        )
    except Exception as e:
        st.error(f"Simulation Error: {e}")
        st.stop()

    # -------------------------------------------------------------------------
    # Tab Navigation
    # -------------------------------------------------------------------------
    tab_monitor, tab_forecast, tab_markdown, tab_viva = st.tabs([
        "📋 A. Inventory & Expiry Monitor",
        "📈 B. Demand Forecast",
        "🏷️ C. Waste Risk & Markdown Simulator",
        "🎓 D. Model Health & Viva Explainability",
    ])

    # TAB A: Inventory and Expiry Monitor
    with tab_monitor:
        st.subheader("📋 Perishable Inventory Batch Overview")
        st.caption("Inspect batch parameters, expiration horizon, and baseline demand coverage.")

        kpi1, kpi2, kpi3, kpi4 = st.columns(4)
        with kpi1:
            st.metric("Store Location", "Store 1 (Quito, Pichincha)")
        with kpi2:
            st.metric("Category", selected_family)
        with kpi3:
            st.metric("Batch Inventory", f"{starting_inventory:,.0f} units")
        with kpi4:
            st.metric("Shelf Life Horizon", f"{remaining_shelf_life} days")

        st.markdown("---")

        horizon_start = pd.to_datetime(forecast_origin_date) + pd.Timedelta(days=1)
        horizon_end = pd.to_datetime(forecast_origin_date) + pd.Timedelta(days=remaining_shelf_life)

        c_box1, c_box2 = st.columns([2, 1])
        with c_box1:
            st.markdown(
                f"""
                #### Batch Schedule & Horizon Breakdown
                - **Forecast Origin Date (Close of Business)**: `{forecast_origin_date}`
                - **Forecast Active Window**: `{horizon_start.strftime('%Y-%m-%d')}` to `{horizon_end.strftime('%Y-%m-%d')}`
                - **Cumulative Expected Demand**: `{waste_assessment.cumulative_forecast_demand:,.1f} units`
                - **Coverage Status**: `{waste_assessment.demand_coverage_ratio:.2f}x` of on-hand inventory expected to be consumed under normal demand velocity.
                """
            )

            if waste_assessment.expected_surplus_units > 0:
                st.warning(
                    f"⚠️ **Surplus Warning**: Projected sales over the remaining {remaining_shelf_life} days "
                    f"({waste_assessment.cumulative_forecast_demand:,.0f} units) will not clear on-hand inventory "
                    f"({starting_inventory:,.0f} units). Estimated unsold surplus: **{waste_assessment.expected_surplus_units:,.0f} units**."
                )
            else:
                st.success(
                    f"✅ **Healthy Turnover**: Forecasted demand ({waste_assessment.cumulative_forecast_demand:,.0f} units) "
                    f"is sufficient to fully clear current on-hand stock ({starting_inventory:,.0f} units) before expiration."
                )

        with c_box2:
            st.markdown("#### 🔬 Academic Notice")
            st.markdown(
                """
                <div class="metric-card">
                <b>Verified Boundary</b>:<br><br>
                <span class='badge-ml'>Real ML Model</span> : Sales forecasts use historical store patterns.<br><br>
                <span class='badge-sim'>Simulated Variable</span> : Inventory quantities and expiration dates are user inputs.
                </div>
                """,
                unsafe_allow_html=True,
            )

    # TAB B: Demand Forecast
    with tab_forecast:
        st.subheader("📈 Multi-Day Recursive Demand Forecasting")
        st.caption(
            "Historical observed sales up to origin date combined with leakage-safe recursive multi-step forecasting."
        )

        fig = build_forecast_figure(
            history_df=history_df,
            selected_family=selected_family,
            forecast_origin_date=forecast_origin_date,
            waste_assessment=waste_assessment,
            remaining_shelf_life=remaining_shelf_life,
        )

        st.plotly_chart(fig, use_container_width=True)

        st.markdown("#### 📅 Daily Horizon Forecast Breakdown")
        df_steps = pd.DataFrame(waste_assessment.daily_forecasts)
        df_steps.columns = [
            "Horizon Step",
            "Date",
            "Predicted Demand (Units)",
            "Day of Week (0=Mon)",
            "Is Weekend",
            "Is Holiday",
            "On Promotion",
        ]
        st.dataframe(df_steps, use_container_width=True)

    # TAB C: Waste Risk and Dynamic Markdown Simulator
    with tab_markdown:
        st.subheader("🏷️ Perishable Waste Risk Assessment & Dynamic Markdown Simulator")
        st.caption("Quantifies surplus exposure and applies margin-safe dynamic discount rules.")

        risk_col1, risk_col2, risk_col3, risk_col4 = st.columns(4)
        with risk_col1:
            st.metric(
                "Waste Risk Category",
                waste_assessment.risk_category,
                f"{waste_assessment.surplus_percentage:.1f}% Surplus Ratio",
            )
        with risk_col2:
            st.metric("Expected Surplus", f"{waste_assessment.expected_surplus_units:,.0f} units")
        with risk_col3:
            st.metric("Starting Inventory", f"{waste_assessment.starting_inventory:,.0f} units")
        with risk_col4:
            st.metric("Cumulative Horizon Demand", f"{waste_assessment.cumulative_forecast_demand:,.0f} units")

        st.markdown("---")

        p_col1, p_col2 = st.columns([1, 1])
        with p_col1:
            st.markdown("#### 🎯 Markdown Recommendation")
            sub_c1, sub_c2 = st.columns(2)
            with sub_c1:
                st.metric("Original Retail Price", f"${markdown_rec.original_price:.2f}")
                st.metric("Proposed Discount", f"{markdown_rec.proposed_discount_pct:.0f}%")
            with sub_c2:
                st.metric("Final Permitted Price", f"${markdown_rec.final_price:.2f}")
                st.metric("Final Approved Discount", f"{markdown_rec.final_discount_pct:.0f}%")

            if markdown_rec.margin_safeguard_triggered:
                st.warning(
                    f"🛡️ **Margin Safeguard Triggered**: Initial proposed discount of "
                    f"**{markdown_rec.proposed_discount_pct:.0f}%** would breach the commercial cost floor "
                    f"of **${markdown_rec.floor_price:.2f}**. Discount was automatically downgraded to "
                    f"**{markdown_rec.final_discount_pct:.0f}%**."
                )
            else:
                st.success(
                    f"✅ **Safeguard Compliant**: Discount of **{markdown_rec.final_discount_pct:.0f}%** "
                    f"safely clears the minimum floor price of **${markdown_rec.floor_price:.2f}**."
                )

        with p_col2:
            st.markdown("#### 💡 Decision Explanation & Unit Economics")
            st.info(markdown_rec.explanation)

            potential_loss = waste_assessment.expected_surplus_units * markdown_rec.unit_cost
            recoverable_revenue = waste_assessment.expected_surplus_units * markdown_rec.final_price

            st.markdown(
                f"""
                - **Unit Cost**: `${markdown_rec.unit_cost:.2f}` | **Floor Price**: `${markdown_rec.floor_price:.2f}` (`cost + {markdown_rec.min_margin_pct*100:.0f}% margin`)
                - **Potential Inventory Spoilage Loss (at cost)**: `${potential_loss:,.2f}`
                - **Potential Capital Recovery (at discounted price)**: `${recoverable_revenue:,.2f}`
                """
            )

        st.markdown("---")
        st.caption(
            "⚠️ **Operational Disclaimer**: Markdown discount tiers (0%, 15%, 30%, 50%) are rule-based heuristics. "
            "The model does not claim that markdowns will cause a known percentage increase in consumer demand."
        )

    # TAB D: Model Performance and Viva Explainability
    with tab_viva:
        st.subheader("🎓 Model Health, Validation Metrics & Viva Explainability")
        st.caption("Empirical out-of-sample evaluation on held-out 30-day retail data (Store 1).")

        if metrics_json and "validation_metrics" in metrics_json:
            v_metrics = metrics_json["validation_metrics"]
            best_name = metrics_json.get("selected_model", "HistGradientBoosting")
            best_m = v_metrics[best_name]

            k1, k2, k3, k4 = st.columns(4)
            with k1:
                st.metric("Selected Champion Model", best_name)
            with k2:
                st.metric("Out-of-Sample WAPE", f"{best_m['wape']:.2f}%")
            with k3:
                st.metric("Mean Absolute Error (MAE)", f"{best_m['mae']:.2f} units")
            with k4:
                st.metric("Root Mean Squared Error", f"{best_m['rmse']:.2f}")

            st.markdown("---")

            comp_df = pd.DataFrame([
                {"Model": m, "MAE": vals["mae"], "RMSE": vals["rmse"], "WAPE (%)": vals["wape"]}
                for m, vals in v_metrics.items()
            ])

            fig_comp = go.Figure()
            fig_comp.add_trace(go.Bar(x=comp_df["Model"], y=comp_df["WAPE (%)"], name="WAPE (%)", marker_color="#3b82f6"))
            fig_comp.add_trace(go.Bar(x=comp_df["Model"], y=comp_df["MAE"], name="MAE (units)", marker_color="#10b981"))
            fig_comp.add_trace(go.Bar(x=comp_df["Model"], y=comp_df["RMSE"], name="RMSE", marker_color="#f59e0b"))

            fig_comp.update_layout(
                title="Model Evaluation Comparison (Out-of-Sample Validation Set)",
                barmode="group",
                xaxis_title="Model Architecture",
                yaxis_title="Error Metric Value",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                template="plotly_white",
                height=380,
            )
            st.plotly_chart(fig_comp, use_container_width=True)

            st.dataframe(comp_df, use_container_width=True)

        st.markdown("---")
        st.markdown("### 📚 Key Viva Defense Talking Points")
        with st.expander("1. Why Supervised ML + Rule-Based Pricing instead of Pure Reinforcement Learning?", expanded=True):
            st.markdown(
                """
                - **Auditability & Legal Compliance**: Retail grocery pricing requires strict guardrails (margins, fair pricing laws, expiration guidelines). Black-box reinforcement learning agents frequently recommend erratic discounts or trigger negative margins.
                - **Separation of Concerns**: ML handles *demand uncertainty estimation*, while deterministic business logic handles *policy constraints and commercial pricing floors*.
                """
            )

        with st.expander("2. How was Data Leakage Prevented in Time-Series Feature Engineering?", expanded=False):
            st.markdown(
                """
                - **Shifted Rolling Windows**: All rolling statistics (7-day and 14-day mean and std) explicitly apply `.shift(1)` before window aggregation. Day $t$'s sales target is strictly excluded from day $t$'s features.
                - **Strict Chronological Split**: Training occurred on historical dates (`2016-01-15` to `2017-07-16`) and was validated out-of-sample on (`2017-07-17` to `2017-08-15`). No future observations contaminated historical features.
                """
            )

        with st.expander("3. How does Recursive Multi-Step Forecasting Work?", expanded=False):
            st.markdown(
                r"""
                - For multi-day horizons ($T_{\text{shelf}} > 1$), predicting day $t+1$ generates a forecast $\hat{D}_{t+1}$.
                - This predicted demand is appended to an in-memory chronological buffer to construct `sales_lag_1` and rolling aggregates for day $t+2$.
                - **Zero Future Leakage**: Future actual sales after the forecast origin are never accessed.
                """
            )

        with st.expander("4. What are the Current Limitations of the Project?", expanded=False):
            st.markdown(
                """
                - **Scope**: Evaluated on Store 1 (9 perishable product families). Cross-store generalization across all 54 Favorita stores remains future work.
                - **Price Elasticity**: The system assumes discount tiers to incentivize sales, but does not model empirical price elasticity due to unobserved price changes in the raw dataset.
                - **Cold-Start**: Newly introduced product SKUs with fewer than 14 days of history require fallback heuristic forecasts.
                """
            )


# Execution Entry Point
if __name__ == "__main__":
    render_dashboard()
