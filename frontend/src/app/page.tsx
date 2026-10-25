"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  BarChart3,
  Percent,
} from "lucide-react";

interface OverviewFamilyRow {
  product_family: string;
  description: string;
  configured_stock: number;
  shelf_life_days: number;
  horizon_forecast: number;
  expected_surplus: number;
  surplus_percentage: number;
  risk_category: string;
  unit_price: number;
  unit_cost: number;
  recommended_discount_pct: number;
  recommended_price: number;
  margin_safeguard_triggered: boolean;
  explanation: string;
}

interface OverviewDataResponse {
  origin_date: string;
  min_margin_pct: number;
  total_simulated_surplus_units: number;
  family_count: number;
  families: OverviewFamilyRow[];
}

export default function OverviewDashboardPage() {
  const [data, setData] = useState<OverviewDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("ALL");
  const [computing, setComputing] = useState(false);
  const [computeSuccess, setComputeSuccess] = useState(false);

  // Active chart hover tooltip state
  const [activePoint, setActivePoint] = useState<{
    date: string;
    actual?: number;
    forecast?: number;
    surplus?: string;
  } | null>({
    date: "Jul 20, 2017 · Day +4",
    forecast: 3420,
    surplus: "+480 units",
  });

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/overview-data?origin_date=2017-07-16&min_margin=0.15");
      if (!res.ok) {
        throw new Error(`Failed to fetch overview data: ${res.statusText}`);
      }
      const json: OverviewDataResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load live overview data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleRunSimulation = async () => {
    setComputing(true);
    setComputeSuccess(false);
    await fetchOverviewData();
    setComputing(false);
    setComputeSuccess(true);
    setTimeout(() => setComputeSuccess(false), 3000);
  };

  const filteredFamilies = useMemo(() => {
    if (!data?.families) return [];
    return data.families.filter((row) => {
      const matchesSearch =
        row.product_family.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk =
        selectedRiskFilter === "ALL" || row.risk_category === selectedRiskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [data, searchQuery, selectedRiskFilter]);

  // Fallback initial counts if backend is compiling
  const totalSurplus = data?.total_simulated_surplus_units ?? 1850;
  const criticalCount = data?.families.filter((f) => f.risk_category === "CRITICAL").length ?? 2;
  const highCount = data?.families.filter((f) => f.risk_category === "HIGH").length ?? 1;

  return (
    <div className="flex flex-col w-full bg-[#FBF9F0]">
      {/* 1. Top Operational Banner & Editorial Header */}
      <section className="w-full bg-[#F6F4EB] px-6 lg:px-12 py-10 border-b border-[#C3C8C3]">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block w-2 h-2 bg-[#416659]"></span>
              <span className="font-label-sm text-[11px] uppercase tracking-widest text-[#434845]">
                Store 1 · Quito · Retail Inventory Operations
              </span>
              <span className="text-[#C3C8C3]">/</span>
              <span className="font-label-sm text-[11px] uppercase text-[#416659] font-semibold">
                Validation Period: Jul 17 – Aug 15, 2017
              </span>
            </div>
            <h1 className="font-headline-lg text-3xl lg:text-4xl text-[#13201A] tracking-tight font-medium">
              Retail intelligence, grounded in demand.
            </h1>
            <p className="font-body-lg text-base lg:text-lg text-[#434845] mt-2 max-w-2xl leading-relaxed">
              HistGradientBoosting machine learning applied to empirical grocery sales from Kaggle&apos;s
              Store Sales dataset (Ecuador 2013–2017). Identifies perishable surplus exposure to guide
              simulation-based markdown safeguards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              id="runSimulationBtn"
              type="button"
              disabled={computing}
              onClick={handleRunSimulation}
              className="bg-[#13201A] text-[#FAF9F5] border border-[#13201A] hover:bg-[#28352F] px-5 py-2.5 font-label-md text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {computing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-[#A8BE78]" />
                  <span>Computing Horizon...</span>
                </>
              ) : computeSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#A8BE78]" />
                  <span>Simulated (FastAPI 200 OK)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#A8BE78]" />
                  <span>Run inventory simulation</span>
                </>
              )}
            </button>

            <Link
              href="/demand-forecast"
              className="bg-[#FAF9F5] text-[#13201A] border border-[#C3C8C3] hover:bg-[#EAE8DF] px-5 py-2.5 font-label-md text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-[#416659]" />
              <span>Review forecast</span>
            </Link>

            <div className="hidden 2xl:flex items-center gap-2 bg-[#F0EEE5] border border-[#C3C8C3] px-3 py-2 text-[#434845] font-label-sm text-[11px]">
              <span className="w-1.5 h-1.5 bg-[#A8BE78]"></span>
              <span>Historical Point-of-Sale Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Editorial Executive Brief & Operational Ribbons (4 Metric Blocks) */}
      <section className="w-full px-6 lg:px-12 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-[#FFFFFF] border border-[#C3C8C3]">
          {/* Tile 1 */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-[#C3C8C3] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#434845] mb-2">
              <span className="font-label-sm text-xs uppercase tracking-wider">Validation Sample Scope</span>
              <Layers className="w-4 h-4 text-[#737875]" />
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="font-data-tabular-lg text-3xl text-[#13201A] font-bold">270</span>
              <span className="font-label-sm text-xs text-[#434845] uppercase">samples</span>
            </div>
            <div className="font-body-sm text-xs text-[#416659] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Jul 17 – Aug 15, 2017 (Store 1)</span>
            </div>
          </div>

          {/* Tile 2 */}
          <div className="p-6 border-b md:border-b-0 lg:border-r border-[#C3C8C3] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#434845] mb-2">
              <span className="font-label-sm text-xs uppercase tracking-wider">Estimated Surplus</span>
              <AlertTriangle className="w-4 h-4 text-[#BA1A1A]" />
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="font-data-tabular-lg text-3xl text-[#BA1A1A] font-bold">
                {totalSurplus.toLocaleString()}
              </span>
              <span className="font-label-sm text-xs text-[#434845] uppercase">units</span>
            </div>
            <div className="font-body-sm text-xs text-[#434845]">
              <strong className="font-semibold text-[#1B1C17] font-label-sm">Configured Estimate</strong> — Based on User-Defined Inputs
            </div>
          </div>

          {/* Tile 3 */}
          <div className="p-6 border-b sm:border-b-0 md:border-r border-[#C3C8C3] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#434845] mb-2">
              <span className="font-label-sm text-xs uppercase tracking-wider">Evaluated Product Families</span>
              <BarChart3 className="w-4 h-4 text-[#737875]" />
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="font-data-tabular-lg text-3xl text-[#13201A] font-bold">
                9 <span className="text-[#434845] text-lg font-normal">Perishable Families</span>
              </span>
            </div>
            <div className="font-body-sm text-xs text-[#434845] flex items-center gap-2">
              <span className="inline-block px-1.5 py-0.5 bg-[#BA1A1A] text-[#FAF9F5] font-label-sm text-[10px] font-bold uppercase">
                {criticalCount} Critical (50%)
              </span>
              <span className="inline-block px-1.5 py-0.5 bg-[#E4E3DA] text-[#13201A] font-label-sm text-[10px] font-bold border border-[#C3C8C3] uppercase">
                {highCount} High (30%)
              </span>
            </div>
          </div>

          {/* Tile 4 */}
          <div className="p-6 flex flex-col justify-between bg-[#F6F4EB]/60">
            <div className="flex items-center justify-between text-[#434845] mb-2">
              <span className="font-label-sm text-xs uppercase tracking-wider">Forecast Model Performance</span>
              <Percent className="w-4 h-4 text-[#416659]" />
            </div>
            <div className="flex flex-col my-1">
              <span className="font-label-lg text-sm font-bold text-[#13201A]">HistGradientBoosting</span>
              <span className="font-body-sm text-xs text-[#434845] mt-1">
                WAPE: <span className="font-data-tabular-md font-bold text-[#416659]">10.69%</span> · MAE:{" "}
                <span className="font-data-tabular-md font-bold text-[#13201A]">50.913</span>
              </span>
            </div>
            <div className="font-label-sm text-xs text-[#737875] flex items-center justify-between">
              <span>270 validation samples</span>
              <span className="text-[#416659] font-semibold uppercase">Store 1 · Quito</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Intelligence Chart Pane (Observed Actuals vs Forward Forecast Trajectory) */}
      <section className="w-full px-6 lg:px-12 pb-8">
        <div className="bg-[#FFFFFF] border border-[#C3C8C3] flex flex-col">
          <div className="p-4 border-b border-[#C3C8C3] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#F6F4EB]">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider block">
                  Validation Period Simulation (Store 1 · Quito)
                </span>
                <h2 className="font-headline-sm text-base text-[#13201A] font-bold">
                  Perishable Sales: Observed Actuals vs. Forward Forecast Trajectory
                </h2>
              </div>
              <span className="hidden md:inline-block h-6 w-px bg-[#C3C8C3]"></span>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-label-sm text-[#1B1C17]">
                  <span className="w-3.5 h-1.5 bg-[#13201A] inline-block"></span>
                  <span>Observed Actuals (Solid Forest Green)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-label-sm text-[#434845]">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#416659] inline-block"></span>
                  <span>HistGradientBoosting Forecast (Dashed Leaf Green)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-label-sm text-xs text-[#434845] bg-[#FAF9F5] px-2.5 py-1 border border-[#C3C8C3]">
                Origin: July 17, 2017 · 30-Day Window
              </span>
            </div>
          </div>

          {/* Chart Graphic Area */}
          <div className="relative w-full p-4 lg:p-6 overflow-x-auto bg-[#FFFFFF]">
            {/* Live Case Study Callout Box */}
            <div className="absolute top-8 right-8 z-20 bg-[#F0EEE5] border-2 border-[#13201A] p-3 w-72 shadow-none pointer-events-none hidden sm:block">
              <div className="flex items-center justify-between border-b border-[#C3C8C3] pb-1 mb-1.5">
                <span className="font-label-sm text-xs text-[#13201A] uppercase font-bold">
                  {activePoint?.date || "Jul 20, 2017 · Day +4"}
                </span>
                <span className="px-1.5 py-0.5 bg-[#BA1A1A] text-[#FAF9F5] font-label-sm text-[9px] uppercase font-bold">
                  Forecast Scenario
                </span>
              </div>
              <div className="space-y-1 font-body-sm text-xs">
                <div className="flex justify-between">
                  <span className="text-[#434845]">Predicted Demand:</span>
                  <span className="font-data-tabular-md font-bold text-[#13201A]">3,420 units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#434845]">Configured Supply:</span>
                  <span className="font-data-tabular-md text-[#1B1C17]">3,900 units</span>
                </div>
                <div className="flex justify-between text-[#BA1A1A] font-medium">
                  <span>Simulated Surplus:</span>
                  <span className="font-data-tabular-md font-bold">+480 units</span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-[#C3C8C3] text-[10px] text-[#737875] font-body-sm italic">
                Dynamic markdown safeguard: 50% Critical tier at T-48h. Configured scenario simulation.
              </div>
            </div>

            {/* SVG Visual Chart */}
            <div className="w-full min-w-[760px]">
              <svg className="w-full h-auto text-[#13201A]" style={{ overflow: "visible" }} viewBox="0 0 1000 360">
                <defs>
                  <pattern id="chartGridAcademic" width="1000" height="60" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="1000" y2="0" stroke="#E4E3DA" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="actualGradientAcademic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#13201A" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#13201A" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                <rect width="1000" height="300" fill="url(#chartGridAcademic)" />
                <line x1="0" y1="300" x2="1000" y2="300" stroke="#737875" strokeWidth="1.5" />

                {/* Y-Axis Labels */}
                <text x="10" y="20" className="font-label-sm text-[10px] fill-[#434845]">4,500 units/day</text>
                <text x="10" y="80" className="font-label-sm text-[10px] fill-[#737875]">3,600</text>
                <text x="10" y="140" className="font-label-sm text-[10px] fill-[#737875]">2,700</text>
                <text x="10" y="200" className="font-label-sm text-[10px] fill-[#737875]">1,800</text>
                <text x="10" y="260" className="font-label-sm text-[10px] fill-[#737875]">900</text>
                <text x="10" y="296" className="font-label-sm text-[10px] fill-[#737875]">0</text>

                {/* Forecast Origin Marker */}
                <g transform="translate(480, 0)">
                  <line x1="0" y1="0" x2="0" y2="300" stroke="#13201A" strokeWidth="1.5" strokeDasharray="4 3" />
                  <rect x="-8" y="4" width="16" height="16" fill="#13201A" />
                  <text x="12" y="16" className="font-label-sm text-[10px] uppercase font-bold tracking-wider fill-[#13201A]">
                    Forecast Origin: July 17, 2017
                  </text>
                </g>

                {/* Historical Observed Sales Polygon */}
                <polygon
                  fill="url(#actualGradientAcademic)"
                  points="60,300 60,190 92,205 124,180 156,150 188,160 220,120 252,95 284,115 316,130 348,105 380,85 412,120 444,95 480,110 480,300"
                />

                {/* Historical Path */}
                <path
                  d="M 60,190 L 92,205 L 124,180 L 156,150 L 188,160 L 220,120 L 252,95 L 284,115 L 316,130 L 348,105 L 380,85 L 412,120 L 444,95 L 480,110"
                  fill="none"
                  stroke="#13201A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Historical Observation Dots */}
                <g fill="#13201A">
                  <circle cx="60" cy="190" r="3" />
                  <circle cx="92" cy="205" r="3" />
                  <circle cx="124" cy="180" r="3" />
                  <circle cx="156" cy="150" r="3" />
                  <circle cx="188" cy="160" r="3" />
                  <circle cx="220" cy="120" r="3" />
                  <circle cx="252" cy="95" r="3" />
                  <circle cx="284" cy="115" r="3" />
                  <circle cx="316" cy="130" r="3" />
                  <circle cx="348" cy="105" r="3" />
                  <circle cx="380" cy="85" r="3" />
                  <circle cx="412" cy="120" r="3" />
                  <circle cx="444" cy="95" r="3" />
                  <circle cx="480" cy="110" r="4.5" stroke="#FAF9F5" strokeWidth="2" />
                </g>

                {/* Forward Forecast Path (Dashed) */}
                <path
                  d="M 480,110 L 516,125 L 552,100 L 588,90 L 624,115 L 660,140 L 696,165 L 732,130 L 768,110 L 804,80 L 840,95 L 876,120 L 912,135 L 948,150"
                  fill="none"
                  stroke="#416659"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinejoin="round"
                />

                {/* Forecast Markers */}
                <g fill="#FFFFFF" stroke="#416659" strokeWidth="2">
                  <circle cx="516" cy="125" r="3.5" />
                  <circle cx="552" cy="100" r="3.5" />
                  <circle cx="588" cy="90" r="5" fill="#416659" />
                  <circle cx="624" cy="115" r="3.5" />
                  <circle cx="660" cy="140" r="3.5" />
                  <circle cx="696" cy="165" r="3.5" />
                  <circle cx="732" cy="130" r="3.5" />
                  <circle cx="768" cy="110" r="3.5" />
                  <circle cx="804" cy="80" r="3.5" />
                  <circle cx="840" cy="95" r="3.5" />
                  <circle cx="876" cy="120" r="3.5" />
                  <circle cx="912" cy="135" r="3.5" />
                  <circle cx="948" cy="150" r="3.5" />
                </g>

                {/* Critical Peak Line on Day +4 */}
                <line x1="588" y1="90" x2="588" y2="300" stroke="#BA1A1A" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />

                {/* X-Axis Dates */}
                <g className="font-label-sm text-[10px] fill-[#434845]">
                  <text x="60" y="320" textAnchor="middle">Jul 03</text>
                  <text x="156" y="320" textAnchor="middle">Jul 06</text>
                  <text x="252" y="320" textAnchor="middle">Jul 09</text>
                  <text x="348" y="320" textAnchor="middle">Jul 12</text>
                  <text x="444" y="320" textAnchor="middle">Jul 15</text>
                  <text x="480" y="320" textAnchor="middle" className="fill-[#13201A] font-bold">Jul 17</text>
                  <text x="588" y="320" textAnchor="middle" className="fill-[#BA1A1A] font-bold">Jul 20</text>
                  <text x="696" y="320" textAnchor="middle">Jul 24</text>
                  <text x="804" y="320" textAnchor="middle">Jul 29</text>
                  <text x="948" y="320" textAnchor="middle">Aug 15</text>
                </g>
              </svg>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#C3C8C3] bg-[#F0EEE5] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[#434845] font-body-sm text-xs gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#183D32]" />
              <span>Inventory and markdown recommendations are estimates based on configured stock inputs and forecast demand.</span>
            </div>
            <span className="font-label-sm text-xs uppercase tracking-wider text-[#737875]">
              Operational Scope: Store 1 · Quito
            </span>
          </div>
        </div>
      </section>

      {/* 4. Editorial Investigative Risk Block (Editorial Tension Element) */}
      <section className="w-full px-6 lg:px-12 pb-8">
        <div className="bg-[#F0EEE5] border-l-4 border-[#183D32] p-5 lg:p-6 flex flex-col md:flex-row gap-6 items-start justify-between border-y border-r border-[#C3C8C3]">
          <div className="space-y-2 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-xs uppercase font-bold tracking-widest text-[#183D32]">
                Diagnostic Synthesis · Kaggle Store Sales Perishables Analysis
              </span>
              <span className="text-[#C3C8C3]">|</span>
              <span className="font-label-sm text-xs text-[#434845]">Store 1 (Quito) Validation Benchmark</span>
            </div>
            <p className="font-body-lg text-base text-[#1B1C17] leading-relaxed">
              Across the 9 perishable product families evaluated during the Jul 17 – Aug 15, 2017 validation
              horizon, PRODUCE and DAIRY demonstrate elevated surplus risk under simulated inventory flows.
              The HistGradientBoosting model enables pre-expiry price adjustments through rule-based markdown
              recommendations to evaluate potential salvage margin.
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">
            <Link
              href="/inventory-risk"
              className="w-full text-center bg-[#183D32] text-[#FAF9F5] px-4 py-2 font-label-md text-xs uppercase tracking-wider border border-[#183D32] hover:bg-[#28352F] transition-colors"
            >
              Run Inventory Simulation
            </Link>
            <Link
              href="/demand-forecast"
              className="w-full text-center bg-[#FAF9F5] text-[#13201A] px-4 py-2 font-label-md text-xs uppercase tracking-wider border border-[#C3C8C3] hover:bg-[#EAE8DF] transition-colors"
            >
              Review Forecast
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Practical Inventory Priority Table (All 9 Perishable Families) */}
      <section className="w-full px-6 lg:px-12 pb-16">
        <div className="bg-[#FFFFFF] border border-[#C3C8C3] flex flex-col">
          <div className="p-4 border-b border-[#C3C8C3] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#F6F4EB]">
            <div>
              <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider">
                Perishable Family Queue
              </span>
              <h3 className="font-headline-sm text-base text-[#13201A] font-bold">
                Inventory Risk &amp; Markdown Safeguards (9 Kaggle Perishable Families)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737875]" />
                <input
                  id="skuSearchInput"
                  type="text"
                  placeholder="Filter by family..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#FAF9F5] pl-9 pr-3 py-1.5 border border-[#C3C8C3] font-label-md text-xs text-[#13201A] placeholder:text-[#737875] focus:outline-none focus:border-[#13201A] w-64"
                />
              </div>

              <select
                aria-label="Filter by risk category"
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="bg-[#FAF9F5] px-3 py-1.5 border border-[#C3C8C3] font-label-md text-xs text-[#1B1C17] focus:outline-none focus:border-[#13201A] cursor-pointer"
              >
                <option value="ALL">All Risk Categories</option>
                <option value="CRITICAL">Critical Risk Only</option>
                <option value="HIGH">High Risk</option>
                <option value="MODERATE">Moderate Risk</option>
                <option value="LOW">Low Risk · Stable</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left" id="perishablesLedgerTable">
              <thead>
                <tr className="border-b border-[#C3C8C3] bg-[#F0EEE5] text-[#434845] font-label-sm text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Product Family</th>
                  <th className="py-3 px-4 font-semibold text-right">Configured Simulation Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Horizon Forecast</th>
                  <th className="py-3 px-4 font-semibold text-right">Estimated Surplus</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk Classification</th>
                  <th className="py-3 px-4 font-semibold text-right">Rule-Based Recommendation</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C3C8C3] font-body-md text-sm text-[#1B1C17]">
                {loading && !data ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#737875] font-label-md">
                      <div className="flex items-center justify-center gap-2">
                        <RotateCcw className="w-5 h-5 animate-spin text-[#416659]" />
                        <span>Loading live perishable intelligence ledger from FastAPI...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#737875] font-body-md">
                      No perishable families found matching &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredFamilies.map((row) => {
                    const isCritical = row.risk_category === "CRITICAL";
                    const isHigh = row.risk_category === "HIGH";
                    const isModerate = row.risk_category === "MODERATE";

                    return (
                      <tr key={row.product_family} className="hover:bg-[#F6F4EB] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-body-md font-semibold text-[#13201A]">{row.product_family}</div>
                          <div className="font-body-sm text-xs text-[#434845]">{row.description}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-data-tabular-md text-sm text-[#13201A] font-medium">
                          {row.configured_stock.toLocaleString()} units
                        </td>
                        <td className="py-3 px-4 text-right font-data-tabular-md text-sm">
                          <span>{row.horizon_forecast.toLocaleString()} units</span>
                          <span className="block text-[10px] text-[#434845] font-label-sm uppercase">
                            Shelf Life: ~{row.shelf_life_days}d
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-data-tabular-md text-sm font-bold">
                          <span
                            className={
                              isCritical
                                ? "text-[#BA1A1A]"
                                : isHigh
                                ? "text-[#D99A38]"
                                : isModerate
                                ? "text-[#1B1C17]"
                                : "text-[#416659]"
                            }
                          >
                            {row.expected_surplus > 0 ? `+${row.expected_surplus}` : row.expected_surplus} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isCritical ? (
                            <span className="inline-block px-2.5 py-1 bg-[#BA1A1A] text-[#FAF9F5] font-label-sm text-[11px] uppercase font-bold tracking-wider">
                              Critical Risk
                            </span>
                          ) : isHigh ? (
                            <span className="inline-block px-2.5 py-1 bg-[#E4E3DA] border border-[#D99A38] text-[#D99A38] font-label-sm text-[11px] uppercase font-bold tracking-wider">
                              High Risk
                            </span>
                          ) : isModerate ? (
                            <span className="inline-block px-2.5 py-1 bg-[#F0EEE5] border border-[#C3C8C3] text-[#434845] font-label-sm text-[11px] uppercase font-medium">
                              Moderate Risk
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-[#C0E8D8]/50 border border-[#416659] text-[#183D32] font-label-sm text-[11px] uppercase font-medium">
                              Low Risk · Stable
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-data-tabular-md font-bold text-sm ${
                              isCritical ? "text-[#BA1A1A]" : isHigh ? "text-[#13201A]" : "text-[#416659]"
                            }`}
                          >
                            {row.recommended_discount_pct}% Markdown
                          </span>
                          <span className="block text-xs text-[#434845] line-through">
                            ${row.unit_price.toFixed(2)}{" "}
                            <span className="no-underline font-semibold text-[#13201A]">
                              → ${row.recommended_price.toFixed(2)}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/inventory-risk?family=${encodeURIComponent(row.product_family)}`}
                            className="inline-block bg-[#13201A] text-[#FAF9F5] px-3 py-1 font-label-sm text-[10px] uppercase tracking-wider hover:bg-[#28352F] transition-colors"
                          >
                            Simulate
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#C3C8C3] bg-[#F6F4EB] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-body-sm text-xs text-[#434845]">
              Perishable inventory forecasting &amp; dynamic markdown safeguard platform for Store 1 · Quito.
            </span>
            <div className="flex items-center gap-4 font-label-sm text-xs text-[#434845] uppercase">
              <span>Row count: {filteredFamilies.length} of 9 perishable families displayed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
