"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  Play,
  RotateCcw,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowRight,
} from "lucide-react";

const PERISHABLE_FAMILIES = [
  "PRODUCE",
  "DAIRY",
  "MEATS",
  "BREAD/BAKERY",
  "SEAFOOD",
  "DELI",
  "POULTRY",
  "EGGS",
  "PREPARED FOODS",
];

interface SimulationResult {
  product_family: string;
  store_nbr: number;
  forecast_origin_date: string;
  remaining_shelf_life_days: number;
  starting_inventory: number;
  cumulative_forecast_demand: number;
  expected_surplus_units: number;
  surplus_percentage: number;
  demand_coverage_ratio: number;
  risk_category: string;
  daily_forecasts: Array<{
    date: string;
    step: number;
    predicted_demand: number;
  }>;
}

function InventoryRiskInner() {
  const searchParams = useSearchParams();
  const initialFamily = searchParams.get("family") || "PRODUCE";

  const [productFamily, setProductFamily] = useState(initialFamily);
  const [stock, setStock] = useState(1850);
  const [shelfLife, setShelfLife] = useState(4);
  const [originDate] = useState("2017-07-16");
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (fam: string, stockUnits: number, days: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/simulate-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_family: fam,
          starting_inventory: stockUnits,
          remaining_shelf_life_days: days,
          forecast_origin_date: originDate,
        }),
      });

      if (!res.ok) {
        throw new Error(`Simulation failed: ${res.statusText}`);
      }

      const json: SimulationResult = await res.json();
      setSimResult(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to execute inventory simulation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(productFamily, stock, shelfLife);
  }, []);

  const handleReset = () => {
    setStock(1850);
    setShelfLife(4);
    setProductFamily("PRODUCE");
    runSimulation("PRODUCE", 1850, 4);
  };

  const isCritical = simResult?.risk_category === "CRITICAL";
  const isHigh = simResult?.risk_category === "HIGH";
  const isModerate = simResult?.risk_category === "MODERATE";

  // Build burn-down table from forecasts
  let runningInventory = stock;
  const burnDownRows =
    simResult?.daily_forecasts.map((d) => {
      const consumed = Math.min(runningInventory, d.predicted_demand);
      runningInventory = Math.max(0, runningInventory - d.predicted_demand);
      return {
        step: d.step,
        date: d.date,
        demand: Math.round(d.predicted_demand),
        remainingStock: Math.round(runningInventory),
      };
    }) || [];

  return (
    <div className="flex flex-col w-full bg-[#FBF9F0]">
      {/* 1. Simulation Advisory Notice Banner */}
      <div className="w-full bg-[#EAE8DF] px-6 lg:px-12 py-2.5 flex items-center justify-between border-b border-[#C3C8C3]">
        <div className="flex items-center gap-2 text-[#1B1C17]">
          <Info className="w-4 h-4 text-[#416659] shrink-0" />
          <p className="font-label-md text-xs uppercase tracking-wider">
            <strong className="font-semibold text-[#13201A]">Simulation Environment:</strong> Starting
            inventory and shelf-life parameters are user-configured test inputs for scenario evaluation, NOT
            actual physical warehouse sensor or live telemetry measurements.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-1 font-label-sm text-xs text-[#737875] uppercase tracking-widest">
          <span>Deterministic Scenario Simulation</span>
        </div>
      </div>

      {/* 2. Header & Context Area */}
      <div className="px-6 lg:px-12 pt-8 pb-6 bg-[#FBF9F0] border-b border-[#C3C8C3]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-label-sm text-xs uppercase tracking-widest text-[#416659] font-bold">
                Module 03
              </span>
              <span className="text-[#C3C8C3] font-label-sm">|</span>
              <span className="font-label-sm text-xs uppercase tracking-wider text-[#737875]">
                Deterministic Inventory Risk Matrix
              </span>
            </div>
            <h1 className="font-headline-lg text-3xl lg:text-4xl text-[#13201A] tracking-tight font-medium">
              Perishable Inventory Risk Simulation
            </h1>
            <p className="font-body-lg text-base lg:text-lg text-[#434845] mt-2 leading-relaxed max-w-3xl">
              Simulate spoilage vulnerability by evaluating user-configured on-hand stock and remaining
              shelf life against recursive demand curves.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start lg:self-auto border border-[#C3C8C3] bg-[#FFFFFF] p-3">
            <div className="flex flex-col">
              <span className="font-label-sm text-xs uppercase text-[#737875]">Simulation Anchor</span>
              <span className="font-data-tabular-md text-sm text-[#13201A] font-medium">
                2017-07-17 00:00 UTC
              </span>
            </div>
            <div className="h-8 w-px bg-[#C3C8C3]"></div>
            <div className="flex flex-col">
              <span className="font-label-sm text-xs uppercase text-[#737875]">Target Category</span>
              <span className="font-data-tabular-md text-sm text-[#13201A] font-medium">
                {productFamily} (Store 1)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="px-6 lg:px-12 py-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Parameter Configurator */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-[#FFFFFF] border border-[#C3C8C3] flex flex-col">
            <div className="p-4 border-b border-[#C3C8C3] bg-[#F6F4EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-lg text-xs uppercase tracking-wider text-[#13201A] font-bold">
                  Simulation Parameters
                </span>
              </div>
              <span className="font-label-sm text-[10px] uppercase bg-[#FAF9F5] border border-[#C3C8C3] px-2 py-0.5 text-[#737875]">
                User Input
              </span>
            </div>

            <form
              id="simForm"
              onSubmit={(e) => {
                e.preventDefault();
                runSimulation(productFamily, stock, shelfLife);
              }}
              className="p-6 flex flex-col gap-5"
            >
              {/* Product Family */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-[#434845] uppercase tracking-wider flex justify-between font-semibold">
                  <span>Perishable Family (Kaggle Taxonomy)</span>
                  <span className="text-[#737875] font-label-sm">9 Perishable Classes</span>
                </label>
                <div className="relative">
                  <select
                    id="paramProductFamily"
                    aria-label="Perishable Family (Kaggle Taxonomy)"
                    value={productFamily}
                    onChange={(e) => setProductFamily(e.target.value)}
                    className="w-full bg-[#F6F4EB] border border-[#C3C8C3] text-[#13201A] font-label-lg text-xs px-3 py-2 focus:outline-none focus:border-[#13201A]"
                  >
                    {PERISHABLE_FAMILIES.map((fam) => (
                      <option key={fam} value={fam}>
                        {fam}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="font-body-sm text-xs text-[#737875]">
                  Baseline velocity dynamically computed using recursive HistGB inference.
                </p>
              </div>

              {/* Starting On-Hand Inventory */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-xs text-[#434845] uppercase tracking-wider font-semibold">
                    Starting Inventory (User Input)
                  </label>
                  <div className="flex items-baseline gap-1">
                    <span className="font-data-tabular-lg text-xl font-bold text-[#13201A]">
                      {stock.toLocaleString()}
                    </span>
                    <span className="font-label-sm text-xs text-[#737875]">units</span>
                  </div>
                </div>
                <input
                  id="paramStockSlider"
                  aria-label="Starting Inventory (User Input)"
                  type="range"
                  min={800}
                  max={3500}
                  step={50}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full accent-[#183D32] h-2 bg-[#EAE8DF] cursor-pointer"
                />
                <div className="flex justify-between font-label-sm text-[10px] text-[#737875]">
                  <span>800 min input</span>
                  <span>{stock} current</span>
                  <span>3,500 max input</span>
                </div>
              </div>

              {/* Usable Shelf Life */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-xs text-[#434845] uppercase tracking-wider font-semibold">
                    Usable Shelf Life (User Input)
                  </label>
                  <div className="flex items-baseline gap-1">
                    <span className="font-data-tabular-lg text-xl font-bold text-[#13201A]">
                      {shelfLife}
                    </span>
                    <span className="font-label-sm text-xs text-[#737875]">Days</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setShelfLife(days)}
                      className={`py-2 text-center font-label-md text-xs transition-colors cursor-pointer ${
                        shelfLife === days
                          ? "border-2 border-[#13201A] bg-[#13201A] text-[#FAF9F5] font-bold"
                          : "border border-[#C3C8C3] bg-[#FAF9F5] text-[#1B1C17] hover:border-[#13201A]"
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
                <p className="font-body-sm text-xs text-[#737875]">
                  Hypothetical remaining shelf horizon for evaluation, not sensor telemetry.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-[#C3C8C3]">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#13201A] hover:bg-[#28352F] text-[#FAF9F5] py-2.5 px-4 flex items-center justify-center gap-2 font-label-lg text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-70"
                >
                  <Play className="w-4 h-4 fill-current text-[#A8BE78]" />
                  <span>{loading ? "Simulating..." : "Run Inventory Simulation"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full bg-[#F6F4EB] hover:bg-[#EAE8DF] border border-[#C3C8C3] text-[#1B1C17] py-2.5 px-4 flex items-center justify-center gap-2 font-label-md text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#737875]" />
                  <span>Reset to Baseline</span>
                </button>
              </div>
            </form>
          </div>

          {/* Axiom Block */}
          <div className="bg-[#F0EEE5] border-l-4 border-[#183D32] p-4 flex flex-col gap-1">
            <span className="font-label-sm text-xs uppercase tracking-widest text-[#416659] font-bold">
              Algorithmic Axiom
            </span>
            <p className="font-body-md text-xs text-[#1B1C17] leading-relaxed">
              The recursive model strictly isolates batch volume against demand velocity. Because biological
              perishability decays monotonically without secondary shelf interventions, cumulative demand
              functions as a ceiling cap.
            </p>
          </div>
        </div>

        {/* Right Column: Simulation Results & Burn-Down Matrix */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Main Assessment Outcome Banner */}
          <div className="bg-[#FFFFFF] border border-[#C3C8C3] p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C3C8C3] pb-4">
              <div>
                <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider block">
                  Simulated Risk Outcome
                </span>
                <h3 className="font-headline-sm text-xl font-bold text-[#13201A]">
                  {simResult?.product_family} · {shelfLife}-Day Expiry Assessment
                </h3>
              </div>

              <div>
                {isCritical ? (
                  <span className="inline-block px-3 py-1.5 bg-[#BA1A1A] text-[#FAF9F5] font-label-sm text-xs uppercase font-bold tracking-wider">
                    Critical Spoilage Risk
                  </span>
                ) : isHigh ? (
                  <span className="inline-block px-3 py-1.5 bg-[#E4E3DA] border-2 border-[#D99A38] text-[#D99A38] font-label-sm text-xs uppercase font-bold tracking-wider">
                    High Surplus Risk
                  </span>
                ) : isModerate ? (
                  <span className="inline-block px-3 py-1.5 bg-[#F0EEE5] border border-[#C3C8C3] text-[#434845] font-label-sm text-xs uppercase font-medium tracking-wider">
                    Moderate Surplus Risk
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1.5 bg-[#C0E8D8] border border-[#416659] text-[#183D32] font-label-sm text-xs uppercase font-medium tracking-wider">
                    Low Risk · Optimal Stock
                  </span>
                )}
              </div>
            </div>

            {/* 3 Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3]">
                <span className="font-label-sm text-xs uppercase text-[#737875] block">
                  Expected Surplus
                </span>
                <span
                  className={`font-data-tabular-lg text-2xl font-bold mt-1 block ${
                    isCritical ? "text-[#BA1A1A]" : isHigh ? "text-[#D99A38]" : "text-[#13201A]"
                  }`}
                >
                  +{simResult ? Math.round(simResult.expected_surplus_units).toLocaleString() : "0"} units
                </span>
                <span className="font-body-sm text-xs text-[#737875] mt-1 block">
                  {simResult ? simResult.surplus_percentage.toFixed(1) : 0}% of starting batch
                </span>
              </div>

              <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3]">
                <span className="font-label-sm text-xs uppercase text-[#737875] block">
                  Cumulative Horizon Demand
                </span>
                <span className="font-data-tabular-lg text-2xl font-bold text-[#13201A] mt-1 block">
                  {simResult ? Math.round(simResult.cumulative_forecast_demand).toLocaleString() : "0"} units
                </span>
                <span className="font-body-sm text-xs text-[#416659] mt-1 block">
                  Store 1 projected consumption
                </span>
              </div>

              <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3]">
                <span className="font-label-sm text-xs uppercase text-[#737875] block">
                  Demand Coverage Ratio
                </span>
                <span className="font-data-tabular-lg text-2xl font-bold text-[#13201A] mt-1 block">
                  {simResult ? (simResult.demand_coverage_ratio * 100).toFixed(1) : 0}%
                </span>
                <span className="font-body-sm text-xs text-[#737875] mt-1 block">
                  Demand ÷ Starting Stock
                </span>
              </div>
            </div>

            {/* Markdown Recommendation Lead */}
            <div className="p-4 bg-[#F0EEE5] border-l-4 border-[#13201A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-label-sm text-xs uppercase font-bold text-[#13201A] block">
                  Automated Markdown Recommendation Policy
                </span>
                <p className="font-body-sm text-xs text-[#434845] mt-0.5">
                  Based on risk tier ({simResult?.risk_category || "LOW"}), the dynamic pricing safeguard recommends{" "}
                  <strong className="text-[#13201A]">
                    {isCritical ? "50% markdown" : isHigh ? "30% markdown" : isModerate ? "15% markdown" : "0% (regular price)"}
                  </strong>{" "}
                  subject to minimum wholesale margin floor verification.
                </p>
              </div>

              <a
                href={`/markdown-planner?family=${encodeURIComponent(productFamily)}`}
                className="bg-[#13201A] text-[#FAF9F5] px-4 py-2 font-label-md text-xs uppercase tracking-wider hover:bg-[#28352F] transition-colors whitespace-nowrap"
              >
                Open Markdown Planner
              </a>
            </div>
          </div>

          {/* Daily Burn-Down Ledger Table */}
          <div className="bg-[#FFFFFF] border border-[#C3C8C3] flex flex-col">
            <div className="p-4 border-b border-[#C3C8C3] bg-[#F6F4EB]">
              <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider block">
                Deterministic Consumption Ledger
              </span>
              <h4 className="font-headline-sm text-base font-bold text-[#13201A]">
                Day-by-Day Batch Burn-Down Trajectory
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#C3C8C3] bg-[#F0EEE5] font-label-sm text-xs uppercase text-[#737875]">
                    <th className="py-2.5 px-4 font-semibold">Horizon Step</th>
                    <th className="py-2.5 px-3 font-semibold">Calendar Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Projected Demand</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Remaining On-Hand Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C3C8C3]/60 font-body-sm text-[#1B1C17]">
                  {burnDownRows.map((r, i) => (
                    <tr key={r.step} className="hover:bg-[#F6F4EB] transition-colors">
                      <td className="py-2.5 px-4 font-label-md text-[#13201A]">t+{r.step}</td>
                      <td className="py-2.5 px-3 font-data-tabular-md text-[#434845]">{r.date}</td>
                      <td className="py-2.5 px-3 font-data-tabular-md text-right text-[#416659] font-medium">
                        -{r.demand.toLocaleString()} units
                      </td>
                      <td className="py-2.5 px-4 font-data-tabular-md text-right font-bold text-[#13201A]">
                        {r.remainingStock.toLocaleString()} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 px-4 bg-[#F6F4EB] border-t border-[#C3C8C3] text-xs text-[#737875] font-body-sm">
              Terminal balance at shelf expiration (t+{shelfLife}):{" "}
              <strong className="text-[#13201A]">
                {simResult ? Math.round(simResult.expected_surplus_units).toLocaleString() : 0} surplus units
              </strong>{" "}
              subject to markdown liquidation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryRiskSimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] p-8 flex items-center justify-center font-mono text-sm text-[#183D32]">
          Loading Inventory Risk Simulator...
        </div>
      }
    >
      <InventoryRiskInner />
    </Suspense>
  );
}
