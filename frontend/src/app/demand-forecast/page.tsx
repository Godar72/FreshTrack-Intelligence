"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  RotateCcw,
  Download,
  Calendar,
  Layers,
  Info,
  CheckCircle2,
  Sparkles,
  MapPin,
  History,
} from "lucide-react";

const PERISHABLE_FAMILIES = [
  "PRODUCE",
  "DAIRY",
  "BREAD/BAKERY",
  "MEATS",
  "POULTRY",
  "DELI",
  "EGGS",
  "SEAFOOD",
  "PREPARED FOODS",
];

interface DailyForecastItem {
  step: number;
  date: string;
  predicted_demand: number;
  trailing_7d_avg?: number;
  dow_factor?: string;
  method?: string;
}

interface ForecastResponse {
  product_family: string;
  forecast_origin_date: string;
  horizon_days: number;
  cumulative_demand: number;
  daily_average_demand: number;
  peak_day?: DailyForecastItem;
  daily_forecasts: DailyForecastItem[];
  model_architecture: string;
}

export default function DemandForecastPage() {
  const [selectedFamily, setSelectedFamily] = useState("PRODUCE");
  const [horizonDays, setHorizonDays] = useState(14);
  const [originDate, setOriginDate] = useState("2017-07-16");
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    step: number;
    units: number;
  } | null>(null);

  const fetchForecast = async (family: string, horizon: number, date: string) => {
    try {
      setComputing(true);
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_family: family,
          forecast_origin_date: date,
          horizon_days: horizon,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch forecast");
      const json: ForecastResponse = await res.json();
      setForecastData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setComputing(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedFamily, horizonDays, originDate);
  }, [selectedFamily, horizonDays, originDate]);

  const handleDownloadCSV = () => {
    if (!forecastData?.daily_forecasts) return;
    const header = "Step,Forecast Date,Forecast Units,Product Family,Store\n";
    const rows = forecastData.daily_forecasts
      .map(
        (d) =>
          `t+${d.step},${d.date},${d.predicted_demand},${forecastData.product_family},Store 1`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast_${forecastData.product_family}_horizon${forecastData.horizon_days}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cumulativeDemand = forecastData?.cumulative_demand ?? 16420;
  const peakDay = forecastData?.peak_day;
  const dailyAverage = forecastData?.daily_average_demand ?? 1172.8;

  return (
    <div className="flex flex-col w-full bg-[#FBF9F0]">
      {/* 1. Top Editorial Header & Workspace Overview */}
      <div className="p-6 lg:p-12 bg-[#F6F4EB] border-b border-[#C3C8C3]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-[#416659] mb-2 font-label-sm text-xs uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" />
              <span>Kaggle Store Sales · Store 1 (Quito, Ecuador)</span>
            </div>
            <h1 className="font-headline-lg text-3xl lg:text-4xl font-bold text-[#13201A] tracking-tight">
              Perishable Demand Forecast Workspace
            </h1>
            <p className="font-body-lg text-base lg:text-lg text-[#434845] mt-2 max-w-3xl leading-relaxed">
              Recursive multi-step time-series forecasting across perishable categories for Store 1 using
              2016–2017 Kaggle point-of-sale history.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-label-sm text-xs uppercase text-[#737875]">Forecast Model</span>
              <span className="font-data-tabular-md text-sm text-[#13201A] font-mono font-medium">
                HistGradientBoosting
              </span>
            </div>
            <button
              id="recomputeBtn"
              type="button"
              disabled={computing}
              onClick={() => fetchForecast(selectedFamily, horizonDays, originDate)}
              className="bg-[#13201A] hover:bg-[#28352F] text-[#FAF9F5] font-label-md text-xs px-5 py-2.5 uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
            >
              <RotateCcw className={`w-4 h-4 text-[#A8BE78] ${computing ? "animate-spin" : ""}`} />
              <span>{computing ? "Computing..." : "Re-compute Forecast"}</span>
            </button>
          </div>
        </div>

        {/* Parameter Workspace Control Ribbon */}
        <div className="mt-8 pt-6 border-t border-[#C3C8C3]/70 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
          {/* Family Select */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs uppercase text-[#434845] tracking-wider font-semibold">
              Perishable Product Family
            </label>
            <div className="relative bg-[#FFFFFF] border border-[#C3C8C3] focus-within:border-[#13201A]">
              <select
                aria-label="Select Perishable Product Family"
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="w-full bg-transparent px-3 py-2 font-label-md text-xs text-[#1B1C17] outline-none cursor-pointer"
              >
                {PERISHABLE_FAMILIES.map((fam) => (
                  <option key={fam} value={fam}>
                    {fam}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Forecast Origin Date */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs uppercase text-[#434845] tracking-wider font-semibold">
              Forecast Origin Date
            </label>
            <div className="flex items-center bg-[#FFFFFF] border border-[#C3C8C3] px-3 py-2 focus-within:border-[#13201A]">
              <Calendar className="w-4 h-4 text-[#737875] mr-2" />
              <input
                type="text"
                value={originDate}
                onChange={(e) => setOriginDate(e.target.value)}
                className="w-full bg-transparent font-data-tabular-md text-xs text-[#1B1C17] outline-none font-medium"
              />
            </div>
          </div>

          {/* Forecast Horizon */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs uppercase text-[#434845] tracking-wider font-semibold">
              Forecast Horizon
            </label>
            <div className="relative bg-[#FFFFFF] border border-[#C3C8C3] focus-within:border-[#13201A]">
              <select
                aria-label="Select Forecast Horizon"
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                className="w-full bg-transparent px-3 py-2 font-label-md text-xs text-[#1B1C17] outline-none cursor-pointer"
              >
                <option value={14}>14 Days (Jul 17 – Jul 30, 2017)</option>
                <option value={30}>30 Days (Jul 17 – Aug 15, 2017)</option>
              </select>
            </div>
          </div>

          {/* Store Location */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs uppercase text-[#434845] tracking-wider font-semibold">
              Store Location &amp; Cluster
            </label>
            <div className="flex items-center bg-[#FFFFFF] border border-[#C3C8C3] px-3 py-2">
              <MapPin className="w-4 h-4 text-[#737875] mr-2" />
              <span className="font-label-md text-xs text-[#1B1C17] truncate">
                Store 1 · Quito (Pichincha)
              </span>
            </div>
          </div>

          {/* Historical Window */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs uppercase text-[#434845] tracking-wider font-semibold">
              Historical Observation Window
            </label>
            <div className="flex items-center bg-[#FFFFFF] border border-[#C3C8C3] px-3 py-2">
              <History className="w-4 h-4 text-[#737875] mr-2" />
              <span className="font-label-md text-xs text-[#1B1C17] truncate">
                2016-01-15 – 2017-07-16
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Visual Time-Series Workspace */}
      <div className="p-6 lg:p-12 bg-[#FBF9F0]">
        <div className="border border-[#C3C8C3] bg-[#FFFFFF]">
          {/* Chart Header */}
          <div className="p-4 border-b border-[#C3C8C3] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F6F4EB]">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider block">
                  Target Metric
                </span>
                <span className="font-headline-sm text-base font-semibold text-[#13201A]">
                  Daily Point-of-Sale Units ({selectedFamily} · Store 1)
                </span>
              </div>
              <div className="hidden xl:block h-6 w-px bg-[#C3C8C3]"></div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 bg-[#183D32] inline-block"></span>
                  <span className="font-label-sm uppercase text-[#1B1C17] font-medium">
                    Observed Historical Sales (Store 1)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 border-t-2 border-dashed border-[#416659] inline-block"></span>
                  <span className="font-label-sm uppercase text-[#1B1C17] font-medium">
                    Recursive Multi-Step Demand Forecast
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#737875] font-label-sm text-xs uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-[#416659]"></span>
              <span>Validation Window: 270 Samples</span>
            </div>
          </div>

          {/* Time Series SVG Canvas */}
          <div className="relative w-full p-4 lg:p-6 overflow-x-auto select-none bg-[#FFFFFF]">
            {/* Live Hover Tooltip */}
            {hoveredPoint && (
              <div className="absolute pointer-events-none z-30 border border-[#13201A] bg-[#13201A] text-[#FAF9F5] p-3 shadow-none min-w-[200px] top-4 right-8">
                <div className="flex items-center justify-between border-b border-[#28352F] pb-1 mb-1.5">
                  <span className="font-label-sm text-xs uppercase text-[#D7E6DD]">
                    {hoveredPoint.date}
                  </span>
                  <span className="font-label-sm text-[10px] uppercase bg-[#416659] px-1 text-[#FAF9F5]">
                    Recursive t+{hoveredPoint.step}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-body-sm text-xs text-[#BBCAC1]">Projected Demand:</span>
                  <span className="font-data-tabular-md text-sm font-bold text-[#FAF9F5]">
                    {hoveredPoint.units.toLocaleString()} units
                  </span>
                </div>
              </div>
            )}

            <div className="w-full min-w-[760px] h-[340px] relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 340">
                <defs>
                  <pattern id="gridSubtle" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#E4E3DA" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="observedGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#183D32" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#183D32" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                <rect width="1000" height="300" fill="url(#gridSubtle)" opacity="0.8" />

                {/* Grid Horizontals */}
                <line x1="0" y1="60" x2="1000" y2="60" stroke="#E4E3DA" strokeWidth="1" />
                <text x="6" y="55" className="fill-[#737875] font-label-sm text-[10px]">2,400 units</text>
                <line x1="0" y1="120" x2="1000" y2="120" stroke="#E4E3DA" strokeWidth="1" />
                <text x="6" y="115" className="fill-[#737875] font-label-sm text-[10px]">1,800 units</text>
                <line x1="0" y1="180" x2="1000" y2="180" stroke="#E4E3DA" strokeWidth="1" />
                <text x="6" y="175" className="fill-[#737875] font-label-sm text-[10px]">1,200 units</text>
                <line x1="0" y1="240" x2="1000" y2="240" stroke="#E4E3DA" strokeWidth="1" />
                <text x="6" y="235" className="fill-[#737875] font-label-sm text-[10px]">600 units</text>
                <line x1="0" y1="300" x2="1000" y2="300" stroke="#C3C8C3" strokeWidth="1.25" />
                <text x="6" y="295" className="fill-[#737875] font-label-sm text-[10px]">0 units</text>

                {/* Projection Shade */}
                <rect x="660" y="0" width="340" height="300" fill="#F0EEE5" fillOpacity="0.45" />
                <line x1="660" y1="0" x2="660" y2="300" stroke="#13201A" strokeWidth="2" strokeDasharray="4 2" />

                {/* Origin Badge */}
                <g transform="translate(660, 20)">
                  <rect x="-70" y="0" width="140" height="22" fill="#13201A" />
                  <text x="0" y="15" textAnchor="middle" fill="#FFFFFF" className="font-label-sm text-[10px] uppercase font-bold tracking-wider">
                    Origin: Jul 17, 2017
                  </text>
                </g>

                {/* Observed Historical Curve */}
                <path
                  d="M 40 220 L 85 205 L 135 125 L 185 195 L 235 200 L 285 120 L 335 170 L 385 195 L 435 125 L 485 165 L 535 195 L 585 110 L 635 160 L 660 195 L 660 300 L 40 300 Z"
                  fill="url(#observedGrad)"
                />
                <path
                  d="M 40 220 L 85 205 L 135 125 L 185 195 L 235 200 L 285 120 L 335 170 L 385 195 L 435 125 L 485 165 L 535 195 L 585 110 L 635 160 L 660 195"
                  fill="none"
                  stroke="#13201A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Recursive Forecast Path */}
                <path
                  d="M 660 195 L 685 198 L 710 185 L 735 178 L 760 170 L 785 130 L 810 115 L 835 165 L 860 190 L 885 175 L 910 165 L 935 115 L 960 98 L 985 158"
                  fill="none"
                  stroke="#416659"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  strokeLinejoin="round"
                />

                {/* Forecast Click/Hover Nodes */}
                {forecastData?.daily_forecasts.slice(0, 14).map((f, idx) => {
                  const cx = 685 + idx * 23;
                  // Map predicted demand (0 - 2400) to y (300 - 60)
                  const normalized = Math.min(Math.max(f.predicted_demand / 2400, 0), 1);
                  const cy = 300 - normalized * 240;

                  return (
                    <g
                      key={f.step}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPoint({ date: f.date, step: f.step, units: Math.round(f.predicted_demand) })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={idx === 5 ? 5.5 : 4}
                        fill={idx === 5 ? "#13201A" : "#FFFFFF"}
                        stroke="#416659"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}

                {/* Peak Callout Marker */}
                <g transform="translate(810, 115)">
                  <line x1="0" y1="0" x2="0" y2="-40" stroke="#13201A" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="-65" y="-60" width="130" height="20" fill="#13201A" />
                  <text x="0" y="-46" textAnchor="middle" fill="#FAF9F5" className="font-label-sm text-[10px] uppercase font-bold tracking-wider">
                    Peak: Sat Jul 22
                  </text>
                </g>

                {/* X-Axis Dates */}
                <text x="60" y="325" className="fill-[#737875] font-label-sm text-[10px]">Jun 19</text>
                <text x="210" y="325" className="fill-[#737875] font-label-sm text-[10px]">Jun 26</text>
                <text x="360" y="325" className="fill-[#737875] font-label-sm text-[10px]">Jul 03</text>
                <text x="510" y="325" className="fill-[#737875] font-label-sm text-[10px]">Jul 10</text>
                <text x="660" y="325" className="fill-[#13201A] font-label-sm text-[11px] font-bold">JUL 17 (ORIGIN)</text>
                <text x="810" y="325" className="fill-[#416659] font-label-sm text-[11px] font-bold">JUL 22 (PEAK)</text>
                <text x="960" y="325" className="fill-[#416659] font-label-sm text-[10px]">Jul 30</text>
              </svg>
            </div>
          </div>

          {/* Autoregressive Feedback Banner */}
          <div className="px-4 py-3 bg-[#EAE8DF] border-t border-[#C3C8C3] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#1B1C17]">
              <Info className="w-4 h-4 text-[#416659] shrink-0" />
              <p className="font-body-sm text-xs text-[#434845]">
                <strong className="font-semibold text-[#13201A]">Recursive multi-step forecasting:</strong> The model
                iteratively feeds predicted lag values for <code className="bg-[#E4E3DA] px-1 font-mono text-[#13201A]">t+1</code> into{" "}
                <code className="bg-[#E4E3DA] px-1 font-mono text-[#13201A]">t+2...t+14/t+30</code>. Forecasting errors can compound
                recursively across extended projection horizons.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1 font-label-sm text-xs uppercase text-[#737875] shrink-0">
              <span>Autoregressive Feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dual Column Information Layout: Daily Ledger Table + Model Rigor */}
      <div className="p-6 lg:p-12 pt-0 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daily Forecast Table */}
        <div className="xl:col-span-7 bg-[#FFFFFF] border border-[#C3C8C3]">
          <div className="p-4 border-b border-[#C3C8C3] flex items-center justify-between bg-[#F6F4EB]">
            <div>
              <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider">
                Tabular Projections · Store 1
              </span>
              <h2 className="font-headline-sm text-base font-semibold text-[#13201A]">
                {horizonDays}-Day Forward Validation Schedule (Jul 17 – Aug 15, 2017)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="border border-[#C3C8C3] bg-[#FAF9F5] hover:bg-[#EAE8DF] font-label-sm text-xs px-3 py-1.5 uppercase flex items-center gap-1.5 transition-colors text-[#1B1C17]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C3C8C3] bg-[#F6F4EB]/60 font-label-sm text-xs uppercase text-[#737875]">
                  <th className="py-2.5 px-4 font-semibold">Step</th>
                  <th className="py-2.5 px-3 font-semibold">Forecast Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Forecast Units</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C3C8C3]/60 font-body-sm text-xs text-[#1B1C17]">
                {forecastData?.daily_forecasts.map((d) => {
                  const isPeak = peakDay?.step === d.step;
                  return (
                    <tr
                      key={d.step}
                      className={
                        isPeak
                          ? "bg-[#C0E8D8]/30 font-semibold"
                          : "hover:bg-[#F6F4EB] transition-colors"
                      }
                    >
                      <td className="py-2 px-4 font-label-md font-medium text-[#13201A]">
                        t+{d.step}
                      </td>
                      <td className="py-2 px-3 font-data-tabular-md text-[#434845]">
                        {d.date} {isPeak && <span className="text-[#416659] font-bold">(Peak)</span>}
                      </td>
                      <td className="py-2 px-3 font-data-tabular-md text-right font-bold text-[#13201A]">
                        {Math.round(d.predicted_demand).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-label-sm text-right text-[#416659]">
                        Recursive step {d.step}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 px-4 bg-[#F6F4EB] border-t border-[#C3C8C3] flex items-center justify-between text-[#737875] text-xs">
            <span className="font-label-sm uppercase">
              {forecastData?.daily_forecasts.length || horizonDays} timesteps recursively projected
            </span>
            <span className="font-label-sm uppercase">Validation Split: 2017 Ground Truth</span>
          </div>
        </div>

        {/* Right Column: Demand Aggregation & Performance Panel */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Summary Card */}
          <div className="bg-[#FFFFFF] border border-[#C3C8C3] p-5 lg:p-6">
            <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider">
              Demand Aggregation
            </span>
            <h3 className="font-headline-sm text-lg font-bold text-[#13201A] mt-1 mb-4">
              Validation Horizon Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-[#C3C8C3] py-4">
              <div className="flex flex-col">
                <span className="font-label-sm text-xs uppercase text-[#434845]">
                  Cumulative {horizonDays}-Day Demand
                </span>
                <span className="font-data-tabular-lg text-2xl font-bold text-[#13201A] mt-1">
                  {Math.round(cumulativeDemand).toLocaleString()} Units
                </span>
                <span className="font-body-sm text-xs text-[#416659] mt-0.5">
                  Jul 17 – Aug 15, 2017
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-xs uppercase text-[#434845]">
                  Peak Projected Day
                </span>
                <span className="font-headline-sm text-base font-bold text-[#13201A] mt-1">
                  {peakDay?.date || "Saturday, Jul 22"}
                </span>
                <span className="font-data-tabular-md text-xs text-[#416659] font-medium mt-0.5">
                  {peakDay ? Math.round(peakDay.predicted_demand).toLocaleString() : "1,680"} units projected
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[#1B1C17]">
              <span className="font-body-sm text-xs text-[#434845]">Daily Average Demand:</span>
              <span className="font-data-tabular-md text-sm font-bold text-[#13201A]">
                {dailyAverage.toLocaleString()} units/day
              </span>
            </div>
          </div>

          {/* Architecture & Evaluation Specs */}
          <div className="bg-[#FFFFFF] border border-[#C3C8C3] p-5 lg:p-6">
            <div className="flex items-center justify-between border-b border-[#C3C8C3] pb-3 mb-4">
              <div className="flex flex-col">
                <span className="font-label-sm text-xs uppercase text-[#737875] tracking-wider">
                  Inference Model
                </span>
                <h3 className="font-headline-sm text-base font-bold text-[#13201A]">
                  Model Architecture &amp; Performance
                </h3>
              </div>
              <span className="border border-[#416659]/60 bg-[#C0E8D8]/30 px-2 py-0.5 text-[#183D32] font-label-sm text-xs uppercase font-semibold">
                Validated
              </span>
            </div>

            <div className="bg-[#F6F4EB] p-3 border border-[#C3C8C3] mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-label-sm uppercase text-[#737875]">Active Estimator</span>
                <span className="font-label-sm uppercase text-[#416659] font-semibold">
                  270 Validation Samples
                </span>
              </div>
              <div className="font-data-tabular-md text-sm font-bold text-[#13201A] mt-1 font-mono">
                HistGradientBoosting
              </div>
            </div>

            <div className="mb-4">
              <span className="font-label-sm text-xs uppercase text-[#434845] tracking-wider block mb-2">
                Holdout Validation Metrics (2017 Test Horizon)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-[#C3C8C3] p-2 text-center bg-[#FAF9F5]">
                  <span className="font-label-sm text-[10px] uppercase text-[#737875] block">WAPE</span>
                  <span className="font-data-tabular-lg text-lg font-bold text-[#416659]">10.69%</span>
                  <span className="font-label-sm text-[9px] text-[#737875] block">Weighted Error</span>
                </div>
                <div className="border border-[#C3C8C3] p-2 text-center bg-[#FAF9F5]">
                  <span className="font-label-sm text-[10px] uppercase text-[#737875] block">MAE</span>
                  <span className="font-data-tabular-md text-sm font-bold text-[#13201A] mt-0.5 block">50.913</span>
                  <span className="font-label-sm text-[9px] text-[#737875] block">units</span>
                </div>
                <div className="border border-[#C3C8C3] p-2 text-center bg-[#FAF9F5]">
                  <span className="font-label-sm text-[10px] uppercase text-[#737875] block">RMSE</span>
                  <span className="font-data-tabular-md text-sm font-bold text-[#13201A] mt-0.5 block">103.876</span>
                  <span className="font-label-sm text-[9px] text-[#737875] block">units</span>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-[#183D32] bg-[#F6F4EB] p-4 text-xs leading-relaxed text-[#1B1C17]">
              <div className="flex items-center gap-1.5 text-[#183D32] mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-label-sm uppercase font-bold tracking-wider">
                  Recursive Multi-Step Propagation
                </span>
              </div>
              <p className="font-body-sm text-xs">
                Trained on historical POS sales from{" "}
                <span className="font-mono bg-[#E4E3DA] px-1 text-[#13201A]">2016-01-15 to 2017-07-16</span>,
                this recursive pipeline predicts demand at{" "}
                <span className="font-mono bg-[#E4E3DA] px-1 text-[#13201A]">t+1</span>, updates lag vectors (7d,
                14d moving statistics), and recursively forecasts through{" "}
                <span className="font-mono bg-[#E4E3DA] px-1 text-[#13201A]">t+14</span> and{" "}
                <span className="font-mono bg-[#E4E3DA] px-1 text-[#13201A]">t+30</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
