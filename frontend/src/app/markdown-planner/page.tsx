"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Scale,
  CheckCircle2,
  Info,
  Ban,
  Calculator,
} from "lucide-react";

interface MarkdownResult {
  product_family: string;
  risk_category: string;
  expected_surplus_units: number;
  original_price: number;
  unit_cost: number;
  min_margin_pct: number;
  proposed_discount_pct: number;
  final_discount_pct: number;
  final_price: number;
  floor_price: number;
  margin_safeguard_triggered: boolean;
  explanation: string;
}

export default function MarkdownDecisionPlannerPage() {
  const [productFamily, setProductFamily] = useState("PRODUCE");
  const [riskCategory, setRiskCategory] = useState("CRITICAL");
  const [unitPrice, setUnitPrice] = useState(2.99);
  const [unitCost, setUnitCost] = useState(1.20);
  const [minMarginPct, setMinMarginPct] = useState(0.15);
  const [surplusUnits, setSurplusUnits] = useState(480);
  const [rec, setRec] = useState<MarkdownResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateRecommendation = async (
    fam: string,
    risk: string,
    surplus: number,
    price: number,
    cost: number,
    margin: number
  ) => {
    try {
      setLoading(true);
      const res = await fetch("/api/markdown-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_family: fam,
          risk_category: risk,
          expected_surplus_units: surplus,
          unit_price: price,
          unit_cost: cost,
          min_margin_pct: margin,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to calculate recommendation");
      }

      const json: MarkdownResult = await res.json();
      setRec(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRecommendation(
      productFamily,
      riskCategory,
      surplusUnits,
      unitPrice,
      unitCost,
      minMarginPct
    );
  }, [productFamily, riskCategory, surplusUnits, unitPrice, unitCost, minMarginPct]);

  const floorPrice = Number((unitCost * (1 + minMarginPct)).toFixed(2));
  const proposedDiscount =
    riskCategory === "CRITICAL"
      ? 0.50
      : riskCategory === "HIGH"
      ? 0.30
      : riskCategory === "MODERATE"
      ? 0.15
      : 0.0;
  const proposedPrice = Number((unitPrice * (1 - proposedDiscount)).toFixed(2));
  const isBreached = proposedPrice < floorPrice;

  // Visual Spectrum positions (0 to unitPrice scale)
  const costPct = Math.min(Math.max((unitCost / unitPrice) * 100, 0), 100);
  const floorPct = Math.min(Math.max((floorPrice / unitPrice) * 100, 0), 100);
  const finalPrice = rec?.final_price ?? (isBreached ? floorPrice : proposedPrice);
  const authPricePct = Math.min(Math.max((finalPrice / unitPrice) * 100, 0), 100);

  return (
    <div className="flex flex-col w-full bg-[#FBF9F0]">
      {/* 1. Disclaimer Banner */}
      <div className="bg-[#EAE8DF] px-6 lg:px-12 py-2.5 flex items-start gap-3 shadow-none border-b border-[#C3C8C3]">
        <Info className="w-4 h-4 text-[#737875] shrink-0 mt-0.5" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
          <p className="font-body-sm text-xs text-[#434845]">
            <span className="font-label-sm uppercase font-semibold text-[#13201A] tracking-wider mr-2">
              Simulation Model Disclaimer:
            </span>
            Markdown rates reflect mathematical risk tier classifications and non-breaching margin cost
            floors. Does not model price elasticity, unverified consumer demand uplift, or certified
            store-level waste reduction claims.
          </p>
          <span className="font-label-sm text-[10px] uppercase tracking-wider text-[#737875] whitespace-nowrap">
            Decision Support · Non-Production
          </span>
        </div>
      </div>

      <div className="p-6 lg:p-12 flex flex-col gap-8">
        {/* 2. Header & Context Area */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col gap-1 max-w-3xl">
            <div className="flex items-center gap-2 text-[#416659]">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-label-sm text-xs uppercase tracking-wider font-semibold">
                Margin Safeguard Protocol
              </span>
              <span className="text-[#C3C8C3] text-xs">·</span>
              <span className="font-label-sm text-xs text-[#434845]">
                Store 1 (Quito, Ecuador) · {productFamily} Simulation
              </span>
            </div>
            <h1 className="font-headline-lg text-3xl lg:text-4xl text-[#13201A] tracking-tight">
              Dynamic Markdown Decision Planner
            </h1>
            <p className="font-body-lg text-base lg:text-lg text-[#434845] mt-1 leading-relaxed">
              Evaluates rules-based markdown discount tiers (0%, 15%, 30%, 50%) under strict margin
              constraint equations:{" "}
              <code className="bg-[#E4E3DA] px-1 font-mono text-[#13201A]">
                Minimum Permitted Price = Unit Cost × (1 + Minimum Margin)
              </code>.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setUnitPrice(2.99);
                setUnitCost(1.20);
                setMinMarginPct(0.15);
                setRiskCategory("CRITICAL");
              }}
              className="bg-[#F0EEE5] hover:bg-[#EAE8DF] text-[#1B1C17] px-4 py-2 font-label-md text-xs tracking-wider uppercase transition-colors border border-[#C3C8C3] cursor-pointer"
            >
              Reset Defaults
            </button>
            <button
              id="commitBtn"
              type="button"
              onClick={() =>
                calculateRecommendation(
                  productFamily,
                  riskCategory,
                  surplusUnits,
                  unitPrice,
                  unitCost,
                  minMarginPct
                )
              }
              className="bg-[#13201A] hover:bg-[#28352F] text-[#FAF9F5] px-4 py-2 font-label-md text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-[#A8BE78]" />
              <span>Calculate Recommendation</span>
            </button>
          </div>
        </div>

        {/* 3. Main Workspace Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Live Calculator: Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* SKU Profile & Safeguard Engine Card */}
            <div className="bg-[#FFFFFF] p-6 border border-[#C3C8C3] flex flex-col gap-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-xs uppercase tracking-wider text-[#737875] font-semibold">
                      Simulation Benchmark SKU
                    </span>
                    <span className="bg-[#F0EEE5] px-2 py-0.5 text-xs text-[#737875] font-semibold uppercase">
                      Store 1 · Quito
                    </span>
                  </div>
                  <h2 className="font-headline-md text-xl text-[#13201A] font-bold mt-1">
                    Fresh Produce Basket: Organic Strawberries (Demonstration Item)
                  </h2>
                  <span className="font-body-sm text-xs text-[#434845] mt-0.5">
                    Family: {productFamily} · Configured Baseline Case Study · Perishable Simulation
                  </span>
                </div>

                <div className="bg-[#FAF9F5] px-3 py-1 border border-[#C3C8C3] flex items-center gap-2 self-start">
                  <span className="w-2 h-2 bg-[#BA1A1A]"></span>
                  <span className="font-label-sm text-xs font-semibold text-[#BA1A1A] uppercase tracking-wide">
                    {riskCategory} Risk Tier ({proposedDiscount * 100}% Off Proposed)
                  </span>
                </div>
              </div>

              {/* Parameter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* MSRP */}
                <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3] flex flex-col">
                  <span className="font-label-sm text-xs uppercase text-[#737875]">Configured MSRP</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-data-tabular-lg text-2xl text-[#13201A] font-bold">
                      ${unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-body-sm text-xs text-[#434845] mt-1">Base retail selling price</span>
                </div>

                {/* Wholesale Cost */}
                <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3] flex flex-col">
                  <span className="font-label-sm text-xs uppercase text-[#737875]">Unit Wholesale Cost</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-data-tabular-lg text-2xl text-[#13201A] font-bold">
                      ${unitCost.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-body-sm text-xs text-[#434845] mt-1">Net procurement cost</span>
                </div>

                {/* Minimum Margin Floor Toggles */}
                <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3] flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-xs uppercase text-[#737875]">Min Margin Floor</span>
                    <span className="font-label-sm text-xs text-[#416659] font-bold">
                      {(minMarginPct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {[0.10, 0.15, 0.20].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinMarginPct(m)}
                        className={`py-1 font-label-sm text-xs uppercase transition-colors cursor-pointer ${
                          minMarginPct === m
                            ? "bg-[#13201A] text-[#FAF9F5] font-bold"
                            : "bg-[#FFFFFF] text-[#1B1C17] border border-[#C3C8C3] hover:bg-[#EAE8DF]"
                        }`}
                      >
                        {(m * 100).toFixed(0)}%
                      </button>
                    ))}
                  </div>
                  <span className="font-body-sm text-xs text-[#737875] mt-1.5">
                    Regulated hurdle constraint
                  </span>
                </div>
              </div>

              {/* Cost Floor Governing Equation Ledger */}
              <div className="bg-[#FAF9F5] p-4 border border-[#C3C8C3] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-xs uppercase tracking-wider text-[#416659] font-bold flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    <span>Cost Floor Governing Equation</span>
                  </span>
                  <span className="font-label-sm text-xs text-[#737875] font-data-tabular-md">
                    Rule: Cost × (1 + Margin)
                  </span>
                </div>

                <div
                  id="equationDisplay"
                  className="bg-[#F0EEE5] p-3 font-data-tabular-md text-xs text-[#13201A] overflow-x-auto whitespace-nowrap border border-[#C3C8C3]"
                >
                  Minimum Permitted Price = Unit Cost × (1 + Minimum Margin) = ${unitCost.toFixed(2)} × (1 +{" "}
                  {minMarginPct.toFixed(2)}) = <strong>${floorPrice.toFixed(2)}</strong>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="bg-[#F6F4EB] p-2.5 border border-[#C3C8C3] flex flex-col">
                    <span className="font-label-sm text-[10px] text-[#737875] uppercase font-semibold">LOW Risk</span>
                    <span className="font-data-tabular-md text-sm text-[#13201A] font-bold">0% Off</span>
                    <span className="font-body-sm text-[11px] text-[#737875]">${unitPrice.toFixed(2)} / unit</span>
                  </div>
                  <div className="bg-[#F6F4EB] p-2.5 border border-[#C3C8C3] flex flex-col">
                    <span className="font-label-sm text-[10px] text-[#737875] uppercase font-semibold">MODERATE Risk</span>
                    <span className="font-data-tabular-md text-sm text-[#13201A] font-bold">15% Off</span>
                    <span className="font-body-sm text-[11px] text-[#737875]">
                      ${(unitPrice * 0.85).toFixed(2)} / unit
                    </span>
                  </div>
                  <div className="bg-[#F6F4EB] p-2.5 border border-[#C3C8C3] flex flex-col">
                    <span className="font-label-sm text-[10px] text-[#737875] uppercase font-semibold">HIGH Risk</span>
                    <span className="font-data-tabular-md text-sm text-[#13201A] font-bold">30% Off</span>
                    <span className="font-body-sm text-[11px] text-[#737875]">
                      ${(unitPrice * 0.70).toFixed(2)} / unit
                    </span>
                  </div>
                  <div className="bg-[#EAE8DF] p-2.5 border-2 border-[#183D32] flex flex-col">
                    <span className="font-label-sm text-[10px] text-[#183D32] font-bold uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#BA1A1A]"></span> CRITICAL
                    </span>
                    <span className="font-data-tabular-md text-sm text-[#13201A] font-bold">50% Off</span>
                    <span className="font-body-sm text-[11px] text-[#183D32] font-bold">
                      ${(unitPrice * 0.50).toFixed(2)} / unit
                    </span>
                  </div>
                </div>
              </div>

              {/* Proposed vs Permitted Comparison Card */}
              <div
                id="comparisonCard"
                className="bg-[#FAF9F5] p-5 border border-[#C3C8C3] flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b pb-3 border-[#C3C8C3]">
                  <span className="font-label-md text-xs uppercase tracking-wider font-semibold text-[#13201A]">
                    Safeguard Arbitration &amp; Evaluation Check
                  </span>
                  {!isBreached ? (
                    <span
                      id="approvalBadge"
                      className="bg-[#C0E8D8] text-[#183D32] border border-[#416659] px-2.5 py-0.5 font-label-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Approved (Within Margin Boundary)
                    </span>
                  ) : (
                    <span
                      id="approvalBadge"
                      className="bg-[#FFDAD6] text-[#93000A] border border-[#BA1A1A] px-2.5 py-0.5 font-label-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" /> Safeguard Clamped (Margin Floor Protected)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex flex-col">
                    <span className="font-label-sm uppercase text-[#737875]">Proposed Tier Discount</span>
                    <span className="font-data-tabular-lg text-lg text-[#13201A] font-bold mt-1">
                      {(proposedDiscount * 100).toFixed(1)}% ({riskCategory})
                    </span>
                    <p className="font-body-sm text-[#434845] mt-1">
                      Baseline ${unitPrice.toFixed(2)} → Proposed raw calculation:{" "}
                      <strong className="text-[#13201A]">${proposedPrice.toFixed(2)}</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-label-sm uppercase text-[#737875]">Cost Floor Check</span>
                    <span
                      id="floorCheckDisplay"
                      className={`font-data-tabular-lg text-lg font-bold mt-1 ${
                        !isBreached ? "text-[#416659]" : "text-[#BA1A1A]"
                      }`}
                    >
                      ${proposedPrice.toFixed(2)} {!isBreached ? "≥" : "<"} ${floorPrice.toFixed(2)}
                    </span>
                    <p id="floorNarrative" className="font-body-sm text-[#434845] mt-1">
                      {!isBreached
                        ? `Passes safeguard: Effective wholesale margin clears required ${(minMarginPct * 100).toFixed(0)}% hurdle floor.`
                        : `Breaches safeguard: Raw discount would yield negative margin. Equation automatically clamps price.`}
                    </p>
                  </div>

                  <div className="flex flex-col bg-[#F0EEE5] p-3 border border-[#C3C8C3]">
                    <span className="font-label-sm uppercase text-[#737875] font-semibold">
                      Recommended Decision Price
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        id="finalPriceDisplay"
                        className="font-display-lg text-3xl leading-none text-[#13201A] font-bold"
                      >
                        ${finalPrice.toFixed(2)}
                      </span>
                      <span className="font-label-sm text-xs text-[#416659] font-bold uppercase">
                        {rec ? `${rec.final_discount_pct}% Off` : "Approved"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#737875] font-body-sm text-[11px] mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#183D32]" />
                      <span>Compliant with minimum cost floor rule</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price vs Cost Floor Spectrum Visual Chart */}
              <div className="bg-[#FFFFFF] p-5 border border-[#C3C8C3] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-label-md uppercase tracking-wider font-semibold text-[#13201A]">
                    Price vs Cost Floor Spectrum · {productFamily} (Strawberries Demonstration)
                  </span>
                  <span className="font-label-sm text-[#737875] font-data-tabular-md">
                    Wholesale Cost: ${unitCost.toFixed(2)} | Baseline MSRP: ${unitPrice.toFixed(2)}
                  </span>
                </div>

                {/* Graphic Visual Spectrum Bar */}
                <div className="relative w-full h-12 bg-[#F6F4EB] flex items-center px-4 my-2 border border-[#C3C8C3] overflow-hidden">
                  {/* Cost Zone */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#BA1A1A]/15 flex items-center px-2"
                    style={{ width: `${costPct}%` }}
                  >
                    <span className="font-label-sm text-[10px] text-[#BA1A1A] uppercase font-bold truncate">
                      Wholesale Cost Zone (${unitCost.toFixed(2)})
                    </span>
                  </div>

                  {/* Margin Floor Buffer */}
                  <div
                    className="absolute top-0 bottom-0 bg-[#C0E8D8]/50 flex items-center px-2"
                    style={{ left: `${costPct}%`, width: `${Math.max(floorPct - costPct, 0)}%` }}
                  />

                  {/* Floor Line Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#13201A] z-10 flex flex-col justify-between"
                    style={{ left: `${floorPct}%` }}
                  >
                    <span className="bg-[#13201A] text-[#FAF9F5] font-label-sm text-[9px] px-1 -translate-x-1/2">
                      Floor ${floorPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Authorized Price Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#183D32] z-20 flex flex-col items-center justify-end pb-1"
                    style={{ left: `${authPricePct}%` }}
                  >
                    <span className="bg-[#183D32] text-[#FAF9F5] font-label-sm text-[9px] px-1 -translate-x-1/2 font-bold whitespace-nowrap">
                      Auth ${finalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Original MSRP Marker */}
                  <div className="absolute right-4 top-0 bottom-0 flex items-center">
                    <span className="font-data-tabular-md text-xs text-[#737875] font-bold">
                      MSRP ${unitPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[#737875] font-body-sm text-[11px]">
                  <span>$0.00 Net</span>
                  <span>${unitCost.toFixed(2)} Cost Floor</span>
                  <span>${floorPrice.toFixed(2)} Safeguard ({(minMarginPct * 100).toFixed(0)}%)</span>
                  <span>${finalPrice.toFixed(2)} Final Markdown</span>
                  <span>${unitPrice.toFixed(2)} Full MSRP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Counter Test Case Demonstration & Intelligence Brief (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Counter Test Case: System Safeguard Intervenes */}
            <div className="bg-[#FFFFFF] p-6 border border-[#C3C8C3] flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[#BA1A1A]">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="font-label-sm text-xs font-bold uppercase tracking-wider">
                      Safeguard Breach Simulation
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-base text-[#13201A] font-bold mt-1">
                    Organic Vine Tomatoes 1kg
                  </h3>
                  <span className="font-body-sm text-xs text-[#434845]">
                    Family: PRODUCE · Store 1 Scenario Item
                  </span>
                </div>
                <span className="bg-[#BA1A1A] text-[#FAF9F5] px-2 py-0.5 font-label-sm text-[10px] font-bold uppercase tracking-wider">
                  Override Clamped
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#F6F4EB] p-3 border border-[#C3C8C3] text-xs">
                <div>
                  <span className="font-label-sm text-[#737875] uppercase block">Unit Cost</span>
                  <span className="font-data-tabular-md text-sm text-[#13201A] font-bold">$3.20</span>
                </div>
                <div>
                  <span className="font-label-sm text-[#737875] uppercase block">Base MSRP</span>
                  <span className="font-data-tabular-md text-sm text-[#13201A] font-bold">$4.50</span>
                </div>
                <div>
                  <span className="font-label-sm text-[#737875] uppercase block">Min Margin</span>
                  <span className="font-data-tabular-md text-sm text-[#416659] font-bold">20%</span>
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-4 border border-[#C3C8C3] flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#1B1C17]">Proposed CRITICAL Discount (50% Off):</span>
                  <span className="font-data-tabular-md text-[#BA1A1A] line-through font-bold">$2.25</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1B1C17]">Minimum Permitted Floor ($3.20 × 1.20):</span>
                  <span className="font-data-tabular-md text-[#13201A] font-bold">$3.84</span>
                </div>

                <div className="p-3 bg-[#FFDAD6]/60 border border-[#BA1A1A] text-[#93000A] mt-1">
                  <div className="flex items-start gap-2">
                    <Ban className="w-4 h-4 text-[#BA1A1A] shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-[#BA1A1A]">
                        Cost Floor Violation Prevented
                      </span>
                      <p className="font-body-sm text-xs mt-1 text-[#1B1C17] leading-relaxed">
                        Raw 50% discount would liquidate item at $2.25, generating a negative -$0.95 gross
                        margin per unit. The equation automatically clamps markdown to protect the retailer
                        at <strong className="font-bold text-[#13201A]">$3.84</strong> (or 0% discount if discrete
                        tiers strictly applied).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#C3C8C3]">
                  <span className="font-label-sm text-xs uppercase text-[#737875]">
                    Clamped Safe Minimum Price
                  </span>
                  <span className="font-data-tabular-lg text-lg text-[#13201A] font-bold">$3.84</span>
                </div>
              </div>
            </div>

            {/* Viva Defense Knowledge Brief */}
            <div className="bg-[#F0EEE5] border-l-4 border-[#183D32] p-5 flex flex-col gap-2">
              <span className="font-label-sm text-xs uppercase tracking-widest text-[#183D32] font-bold">
                Viva Defense Rationale: Why Rule-Based Floors?
              </span>
              <p className="font-body-md text-xs text-[#1B1C17] leading-relaxed">
                In real-world retail food waste mitigation, aggressive unconstrained discounting can cannibalize
                revenue faster than physical spoilage losses. By mathematically coupling the discount rate to
                procurement costs, FreshTrack provides a safe boundary that prevents algorithmic loss-making.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
