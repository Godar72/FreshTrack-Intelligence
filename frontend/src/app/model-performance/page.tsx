"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Percent,
  TrendingDown,
  Info,
  ShieldCheck,
  FileDown,
} from "lucide-react";

interface ValidationMetrics {
  Lag7_Baseline: { mae: number; rmse: number; wape: number };
  Ridge: { mae: number; rmse: number; wape: number };
  RandomForest: { mae: number; rmse: number; wape: number };
  HistGradientBoosting: { mae: number; rmse: number; wape: number };
}

interface MetricsResponse {
  selected_model: string;
  random_seed: number;
  store_nbr: number;
  target_column: string;
  training_period: { start: string; end: string; unique_dates: number; samples: number };
  validation_period: { start: string; end: string; unique_dates: number; samples: number };
  perishable_families: string[];
  validation_metrics: ValidationMetrics;
}

export default function ModelPerformanceValidationPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Error loading metrics:", err));
  }, []);

  const vm = metrics?.validation_metrics;
  const hgbWape = vm?.HistGradientBoosting?.wape ?? 10.69;
  const hgbMae = vm?.HistGradientBoosting?.mae ?? 50.913;
  const hgbRmse = vm?.HistGradientBoosting?.rmse ?? 103.876;
  const rfWape = vm?.RandomForest?.wape ?? 11.29;
  const ridgeWape = vm?.Ridge?.wape ?? 13.08;
  const naiveWape = vm?.Lag7_Baseline?.wape ?? 14.56;

  const wapeDelta = (hgbWape - naiveWape).toFixed(2);

  return (
    <div className="flex flex-col w-full bg-[#FBF9F0]">
      {/* 1. Page Metric Bar & Editorial Title Banner */}
      <section className="p-6 lg:p-12 bg-[#FBF9F0]">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C3C8C3] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center bg-[#13201A] text-[#FAF9F5] px-2 py-0.5 font-label-sm uppercase tracking-widest">
                Benchmark Protocol
              </span>
              <span className="font-label-sm text-[#434845] uppercase">
                Partition: Store 1 (Quito) Holdout · 30-Day Window (270 Perishable Samples)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#434845] font-label-sm">
              <span>Dataset: Kaggle Store Sales (2013–2017)</span>
              <span>•</span>
              <span className="text-[#416659] font-medium">Validation State: Frozen (Jul 17 – Aug 15, 2017)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-2">
              <h1 className="font-headline-lg text-3xl lg:text-4xl text-[#13201A] tracking-tight font-bold">
                Machine Learning Model Performance &amp; Validation
              </h1>
              <p className="font-body-lg text-base lg:text-lg text-[#434845] max-w-3xl leading-relaxed">
                Rigorous comparative benchmark of grocery demand forecasting architectures evaluated against
                Store 1 (Quito, Pichincha, Ecuador) holdout across 9 perishable product families.
              </p>
            </div>

            <div className="lg:col-span-4 bg-[#F0EEE5] p-5 border-l-4 border-[#183D32] border-y border-r border-[#C3C8C3]">
              <div className="flex items-center gap-1.5 text-[#183D32] mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-label-sm text-xs uppercase font-semibold">
                  Selected Champion Architecture
                </span>
              </div>
              <div className="font-headline-sm text-xl font-bold text-[#13201A]">
                HistGradientBoosting
              </div>
              <p className="font-body-sm text-xs text-[#434845] mt-1 leading-relaxed">
                Standardized across 30-day forecast horizon for 9 perishable categories. Strict chronological
                holdout: training through July 16, 2017; validation July 17 through August 15, 2017.
              </p>
            </div>
          </div>

          {/* Academic Disclaimer */}
          <div className="bg-[#F6F4EB] p-5 border border-[#C3C8C3]">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#737875] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-xs uppercase tracking-wider text-[#13201A] font-bold">
                  Model Validation &amp; Single-Store Scope
                </span>
                <p className="font-body-md text-xs text-[#1B1C17] leading-relaxed">
                  <strong className="font-semibold text-[#13201A]">Scope of Validation:</strong> Initial
                  validation strictly reflects Store 1 (Quito, Pichincha, Ecuador) holdout partition spanning
                  270 samples across the reported 30-day validation window (July 17, 2017 – August 15, 2017)
                  over the 9 perishable product families. These metrics verify localized algorithmic fit under
                  controlled benchmark constraints and do not assert universal cross-store generalization
                  across diverse retail footprints or untested macroeconomic regimes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Champion Metric Archival Cards (6 Grid Tiles) */}
      <section className="px-6 lg:px-12 pb-8 bg-[#FBF9F0]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[#C3C8C3] border border-[#C3C8C3]">
            {/* Tile 1 */}
            <div className="bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider">
                Champion WAPE
              </span>
              <div className="my-3">
                <div className="font-data-tabular-lg text-2xl font-bold text-[#13201A]">
                  {hgbWape.toFixed(2)}%
                </div>
                <span className="font-label-sm text-xs text-[#416659] font-medium">
                  {wapeDelta}% vs Naive
                </span>
              </div>
              <span className="font-body-sm text-[11px] text-[#737875]">Weighted Abs % Error</span>
            </div>

            {/* Tile 2 */}
            <div className="bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider">
                Champion MAE
              </span>
              <div className="my-3">
                <div className="font-data-tabular-lg text-2xl font-bold text-[#13201A]">
                  {hgbMae.toFixed(3)}
                </div>
                <span className="font-label-sm text-xs text-[#434845] font-medium">units / day</span>
              </div>
              <span className="font-body-sm text-[11px] text-[#737875]">Mean Absolute Error</span>
            </div>

            {/* Tile 3 */}
            <div className="bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider">
                Champion RMSE
              </span>
              <div className="my-3">
                <div className="font-data-tabular-lg text-2xl font-bold text-[#13201A]">
                  {hgbRmse.toFixed(3)}
                </div>
                <span className="font-label-sm text-xs text-[#434845] font-medium">units / day</span>
              </div>
              <span className="font-body-sm text-[11px] text-[#737875]">Root Mean Sq. Error</span>
            </div>

            {/* Tile 4 */}
            <div className="bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider">
                Validation Samples
              </span>
              <div className="my-3">
                <div className="font-data-tabular-lg text-2xl font-bold text-[#13201A]">270</div>
                <span className="font-label-sm text-xs text-[#434845] font-medium">eval observations</span>
              </div>
              <span className="font-body-sm text-[11px] text-[#737875]">9 perishable families</span>
            </div>

            {/* Tile 5 */}
            <div className="bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider">
                Train Interval
              </span>
              <div className="my-3">
                <div className="font-data-tabular-md text-sm font-bold text-[#13201A]">2016-01-15</div>
                <div className="font-label-sm text-xs text-[#434845]">to 2017-07-16</div>
              </div>
              <span className="font-body-sm text-[11px] text-[#737875]">18 months cadence</span>
            </div>

            {/* Tile 6 */}
            <div className="bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider">
                Validation Window
              </span>
              <div className="my-3">
                <div className="font-data-tabular-md text-sm font-bold text-[#416659]">2017-07-17</div>
                <div className="font-label-sm text-xs text-[#434845]">to 2017-08-15</div>
              </div>
              <span className="font-body-sm text-[11px] text-[#737875]">30-day holdout</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Benchmark Table & Visual Comparison Split */}
      <section className="px-6 lg:px-12 pb-8 bg-[#FBF9F0]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table (8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-[#FFFFFF] border border-[#C3C8C3]">
            <div className="p-4 border-b border-[#C3C8C3] flex items-center justify-between bg-[#F6F4EB]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#183D32]" />
                <h2 className="font-headline-sm text-base font-bold text-[#13201A]">
                  Model Architecture Benchmark Results
                </h2>
              </div>
              <span className="font-label-sm text-xs text-[#434845] uppercase">
                Sorted by WAPE (Ascending)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#C3C8C3] font-label-sm text-xs uppercase text-[#434845] bg-[#F0EEE5]">
                    <th className="py-3 px-4">Architecture</th>
                    <th className="py-3 px-3 text-right">WAPE (%)</th>
                    <th className="py-3 px-3 text-right">MAE</th>
                    <th className="py-3 px-3 text-right">RMSE</th>
                    <th className="py-3 px-4">Characteristics &amp; Features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C3C8C3]/60 font-body-sm text-[#1B1C17]">
                  {/* HistGradientBoosting */}
                  <tr className="bg-[#C0E8D8]/20 hover:bg-[#C0E8D8]/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#183D32] inline-block"></span>
                        <div>
                          <div className="font-label-lg text-xs font-bold text-[#13201A]">
                            HistGradientBoosting
                          </div>
                          <span className="inline-block font-label-sm uppercase bg-[#183D32] text-[#FAF9F5] px-1 py-0.2 text-[9px]">
                            Selected Champion
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm font-bold text-[#416659]">
                      {hgbWape.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm font-medium text-[#13201A]">
                      {hgbMae.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm font-medium text-[#13201A]">
                      {hgbRmse.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 font-body-sm text-xs text-[#434845] max-w-xs">
                      Histogram-based gradient boosting across 9 perishable product families; native handling of integer/categorical encodings.
                    </td>
                  </tr>

                  {/* Random Forest */}
                  <tr className="hover:bg-[#F6F4EB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-label-lg text-xs font-semibold text-[#13201A]">
                        Random Forest Regressor
                      </div>
                      <span className="font-label-sm text-[10px] text-[#737875]">Ensemble model</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A] font-medium">
                      {rfWape.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A]">
                      53.790
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A]">
                      119.594
                    </td>
                    <td className="py-3.5 px-4 font-body-sm text-xs text-[#434845] max-w-xs">
                      Strong variance reduction; robust ensemble baseline against non-linear perishable demand series.
                    </td>
                  </tr>

                  {/* Ridge Regression */}
                  <tr className="hover:bg-[#F6F4EB] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-label-lg text-xs font-semibold text-[#13201A]">
                        Ridge Regression
                      </div>
                      <span className="font-label-sm text-[10px] text-[#737875]">L2 Regularized Linear</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A] font-medium">
                      {ridgeWape.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A]">
                      62.283
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A]">
                      126.712
                    </td>
                    <td className="py-3.5 px-4 font-body-sm text-xs text-[#434845] max-w-xs">
                      Linear baseline with regularized penalties; limited in modeling complex seasonal interaction dynamics.
                    </td>
                  </tr>

                  {/* Lag-7 Naive Baseline */}
                  <tr className="hover:bg-[#F6F4EB] transition-colors bg-[#F6F4EB]/40">
                    <td className="py-3.5 px-4">
                      <div className="font-label-lg text-xs font-semibold text-[#13201A]">
                        Lag-7 Naive Baseline
                      </div>
                      <span className="font-label-sm text-[10px] text-[#737875]">Deterministic week-over-week</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#BA1A1A] font-bold">
                      {naiveWape.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A]">
                      69.331
                    </td>
                    <td className="py-3.5 px-3 text-right font-data-tabular-md text-sm text-[#13201A]">
                      153.235
                    </td>
                    <td className="py-3.5 px-4 font-body-sm text-xs text-[#434845] max-w-xs">
                      Identical shift assignment: ŷ(t) = y(t-7). Algorithmic baseline floor for lift verification.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#F6F4EB] border-t border-[#C3C8C3] flex items-center justify-between text-[#434845] font-label-sm text-xs">
              <span>* Evaluations conducted on Store 1 across 270 perishable category validation samples</span>
              <span className="font-medium text-[#13201A]">Store 1 · Quito (Pichincha, Ecuador)</span>
            </div>
          </div>

          {/* Comparative Error Dynamics (4 cols) */}
          <div className="lg:col-span-4 flex flex-col bg-[#FFFFFF] border border-[#C3C8C3] p-5">
            <div className="flex flex-col gap-1 pb-3 border-b border-[#C3C8C3]">
              <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider">
                Comparative Error Dynamics
              </span>
              <h3 className="font-headline-sm text-base font-bold text-[#13201A]">
                Error Rate Reduction (WAPE)
              </h3>
              <p className="font-body-sm text-xs text-[#434845]">
                Relative performance enhancement across iterations down to the champion architecture.
              </p>
            </div>

            <div className="my-4 p-3 bg-[#C0E8D8]/30 border-l-2 border-[#183D32] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-xs uppercase text-[#183D32] font-bold">
                  WAPE Improvement
                </span>
                <span className="font-body-sm text-xs text-[#1B1C17]">Champion vs. Naive Baseline</span>
              </div>
              <div className="font-data-tabular-lg text-xl font-bold text-[#183D32]">{wapeDelta}% pts</div>
            </div>

            {/* Error Bars */}
            <div className="flex flex-col gap-3 mt-1">
              {/* HistGB */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-label-sm text-xs">
                  <span className="font-bold text-[#13201A] flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#183D32] inline-block"></span> HistGradientBoosting
                  </span>
                  <span className="font-data-tabular-md font-bold text-[#416659]">{hgbWape.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-[#EAE8DF] h-5 relative flex items-center">
                  <div
                    className="h-full bg-[#183D32] flex items-center px-2 transition-all duration-500"
                    style={{ width: `${(hgbWape / naiveWape) * 100}%` }}
                  >
                    <span className="text-[9px] font-label-sm text-[#FAF9F5] font-bold">CHAMPION</span>
                  </div>
                </div>
              </div>

              {/* Random Forest */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-label-sm text-xs">
                  <span className="text-[#1B1C17]">Random Forest</span>
                  <span className="font-data-tabular-md text-[#13201A]">{rfWape.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-[#EAE8DF] h-5 relative flex items-center">
                  <div
                    className="h-full bg-[#416659] flex items-center px-2 opacity-80"
                    style={{ width: `${(rfWape / naiveWape) * 100}%` }}
                  />
                </div>
              </div>

              {/* Ridge */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-label-sm text-xs">
                  <span className="text-[#1B1C17]">Ridge Regression (L2)</span>
                  <span className="font-data-tabular-md text-[#13201A]">{ridgeWape.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-[#EAE8DF] h-5 relative flex items-center">
                  <div
                    className="h-full bg-[#737875] flex items-center px-2 opacity-70"
                    style={{ width: `${(ridgeWape / naiveWape) * 100}%` }}
                  />
                </div>
              </div>

              {/* Naive Baseline */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-label-sm text-xs">
                  <span className="text-[#434845]">Lag-7 Naive Baseline</span>
                  <span className="font-data-tabular-md text-[#BA1A1A] font-bold">{naiveWape.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-[#EAE8DF] h-5 relative flex items-center">
                  <div className="h-full bg-[#BA1A1A] flex items-center px-2 opacity-60 w-full">
                    <span className="text-[9px] font-label-sm text-[#FAF9F5] font-medium">BASELINE FLOOR</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#C3C8C3] flex flex-col gap-1.5 font-body-sm text-xs text-[#434845]">
              <div className="flex justify-between items-center">
                <span>Champion MAE (Verified):</span>
                <span className="font-data-tabular-md font-bold text-[#13201A]">{hgbMae.toFixed(3)} units/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Champion RMSE (Verified):</span>
                <span className="font-data-tabular-md font-bold text-[#13201A]">{hgbRmse.toFixed(3)} units/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Validation Window:</span>
                <span className="font-data-tabular-md text-[#1B1C17]">30 Days (270 Samples)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Methodology, Rigor & Limitations (3 Academic Editorial Blocks) */}
      <section className="px-6 lg:px-12 pb-16 bg-[#FBF9F0]">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-[#183D32] pb-3">
            <span className="font-label-sm text-xs uppercase tracking-wider text-[#183D32] font-bold">
              Model Governance &amp; Protocol Integrity
            </span>
            <h2 className="font-headline-md text-2xl font-bold text-[#13201A]">
              Methodology, Validation Rigor &amp; Operational Boundaries
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#FFFFFF] p-6 border-t-4 border-[#183D32] border-x border-b border-[#C3C8C3] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-data-tabular-md text-base font-bold text-[#13201A]">01</span>
                <h3 className="font-label-lg text-xs font-bold text-[#13201A] uppercase tracking-wide">
                  Data Leakage Prevention
                </h3>
              </div>
              <div className="h-px bg-[#C3C8C3] w-full" />
              <p className="font-body-md text-xs text-[#1B1C17] leading-relaxed">
                Strict chronological holdout validation: training through July 16, 2017; validation July 17
                through August 15, 2017. Features, categorical target encodings, and temporal aggregations
                are constructed strictly using training data prior to each evaluation slice, ensuring zero
                lookahead leakage into the 30-day validation window.
              </p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-[#434845] font-label-sm text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#183D32]" />
                <span>Zero lookahead temporal integrity</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FFFFFF] p-6 border-t-4 border-[#416659] border-x border-b border-[#C3C8C3] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-data-tabular-md text-base font-bold text-[#416659]">02</span>
                <h3 className="font-label-lg text-xs font-bold text-[#13201A] uppercase tracking-wide">
                  Model Selection Rationale
                </h3>
              </div>
              <div className="h-px bg-[#C3C8C3] w-full" />
              <p className="font-body-md text-xs text-[#1B1C17] leading-relaxed">
                HistGradientBoosting achieved the lowest WAPE (10.69%) across the 270 perishable evaluation
                samples, demonstrating superior non-linear pattern capture over regularized linear models
                (Ridge 13.08%) and outperforming Random Forest (11.29%).
              </p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-[#434845] font-label-sm text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#416659]" />
                <span>Champion across 9 perishable families</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FFFFFF] p-6 border-t-4 border-[#737875] border-x border-b border-[#C3C8C3] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-data-tabular-md text-base font-bold text-[#737875]">03</span>
                <h3 className="font-label-lg text-xs font-bold text-[#13201A] uppercase tracking-wide">
                  Known Limitations &amp; Boundaries
                </h3>
              </div>
              <div className="h-px bg-[#C3C8C3] w-full" />
              <p className="font-body-md text-xs text-[#1B1C17] leading-relaxed">
                Evaluation is strictly confined to Store 1 (Quito, Pichincha, Ecuador) holdout partition (270
                samples). Results demonstrate relative model performance under controlled historical
                conditions and do not claim universal generalization across differing geographical store clusters.
              </p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-[#434845] font-label-sm text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#BA1A1A]" />
                <span>Single-store holdout constraint</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
