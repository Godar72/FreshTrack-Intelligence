"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  TrendingUp,
  ShieldAlert,
  Tag,
  Gauge,
  LayoutGrid,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Store,
  Layers,
  Percent,
} from "lucide-react";

interface OverviewFamilyRow {
  product_family: string;
  description: string;
  configured_stock: number;
  shelf_life_days: number;
  horizon_forecast: number;
  expected_surplus: number;
  risk_category: string;
  unit_price: number;
  recommended_discount_pct: number;
  recommended_price: number;
}

export default function DedicatedMobileDashboardPage() {
  const [families, setFamilies] = useState<OverviewFamilyRow[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview-data?origin_date=2017-07-16&min_margin=0.15")
      .then((res) => res.json())
      .then((data) => {
        if (data.families) setFamilies(data.families);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const criticalFamilies = families.filter((f) => f.risk_category === "CRITICAL");
  const highFamilies = families.filter((f) => f.risk_category === "HIGH");

  return (
    <div className="flex flex-col w-full max-w-[430px] mx-auto min-h-screen bg-[#FBF9F0] text-[#1B1C17] relative pb-24 overflow-x-hidden selection:bg-[#C0E8D8]">
      {/* Mobile Header Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#FBF9F0]/95 backdrop-blur-xs border-b border-[#C3C8C3] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open mobile navigation menu"
            className="w-10 h-10 -ml-2 flex items-center justify-center text-[#13201A] hover:bg-[#EAE8DF] focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="font-label-lg text-xs tracking-wider text-[#13201A] uppercase font-bold">
              FreshTrack
            </span>
            <span className="font-label-sm text-[9px] text-[#434845] uppercase">
              Store 1 · Quito (Pilot)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#C0E8D8] border border-[#416659] text-[#183D32] font-label-sm text-[10px] font-bold">
            10.69% WAPE
          </span>
        </div>
      </header>

      {/* Slide-over Drawer for Mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-[#13201A]/60 backdrop-blur-xs z-50 flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="w-[80%] max-w-[320px] h-full bg-[#FBF9F0] text-[#1B1C17] border-l border-[#C3C8C3] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="h-14 px-4 border-b border-[#C3C8C3] flex items-center justify-between bg-[#F6F4EB]">
                <span className="font-label-lg text-xs uppercase font-bold text-[#13201A]">
                  FreshTrack Menu
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-[#434845] hover:text-[#13201A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col px-2 py-3" aria-label="Mobile menu navigation">
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="h-11 flex items-center gap-3 px-3 text-xs uppercase tracking-wider text-[#434845] hover:bg-[#EAE8DF]"
                >
                  <LayoutGrid className="w-4 h-4 text-[#183D32]" />
                  <span>Desktop Overview</span>
                </Link>
                <Link
                  href="/demand-forecast"
                  onClick={() => setDrawerOpen(false)}
                  className="h-11 flex items-center gap-3 px-3 text-xs uppercase tracking-wider text-[#434845] hover:bg-[#EAE8DF]"
                >
                  <TrendingUp className="w-4 h-4 text-[#416659]" />
                  <span>Demand Forecast</span>
                </Link>
                <Link
                  href="/inventory-risk"
                  onClick={() => setDrawerOpen(false)}
                  className="h-11 flex items-center gap-3 px-3 text-xs uppercase tracking-wider text-[#434845] hover:bg-[#EAE8DF]"
                >
                  <ShieldAlert className="w-4 h-4 text-[#D99A38]" />
                  <span>Inventory Risk</span>
                </Link>
                <Link
                  href="/markdown-planner"
                  onClick={() => setDrawerOpen(false)}
                  className="h-11 flex items-center gap-3 px-3 text-xs uppercase tracking-wider text-[#434845] hover:bg-[#EAE8DF]"
                >
                  <Tag className="w-4 h-4 text-[#BA1A1A]" />
                  <span>Markdown Planner</span>
                </Link>
                <Link
                  href="/model-performance"
                  onClick={() => setDrawerOpen(false)}
                  className="h-11 flex items-center gap-3 px-3 text-xs uppercase tracking-wider text-[#434845] hover:bg-[#EAE8DF]"
                >
                  <Gauge className="w-4 h-4 text-[#183D32]" />
                  <span>Model Performance</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="h-11 flex items-center gap-3 px-3 text-xs uppercase tracking-wider text-[#434845] hover:bg-[#EAE8DF]"
                >
                  <span>Terminal Access</span>
                </Link>
              </nav>
            </div>

            <div className="p-4 border-t border-[#C3C8C3] bg-[#F6F4EB] text-[11px] text-[#434845]">
              <span className="font-bold text-[#13201A] block">Store 1 · Quito</span>
              <span>Kaggle Store Sales Perishable Pilot</span>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-4 pt-3 gap-4">
        {/* Briefing Header */}
        <section className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-label-sm uppercase tracking-wider text-[#416659] font-bold">
              Operational Briefing
            </span>
            <span className="font-label-sm text-[#737875] uppercase">
              Jul 17 – Aug 15, 2017
            </span>
          </div>

          <h1 className="font-headline-lg-mobile text-2xl text-[#13201A] font-bold tracking-tight">
            Retail overview
          </h1>
          <p className="font-body-md text-xs text-[#434845]">
            Store 1, Quito, Ecuador <span className="text-[#737875]">(Kaggle Store Sales pilot)</span>
          </p>

          <div className="p-2.5 bg-[#F6F4EB] border border-[#C3C8C3] flex items-center gap-2 mt-1">
            <CheckCircle2 className="w-4 h-4 text-[#183D32] shrink-0" />
            <p className="font-label-sm text-[11px] text-[#13201A] leading-snug">
              <strong>9 Perishable Families</strong> · HistGradientBoosting Champion Benchmark
            </p>
          </div>
        </section>

        {/* 2x2 Metric Grid */}
        <section className="grid grid-cols-2 gap-2">
          {/* Tile 1 */}
          <div className="bg-[#FFFFFF] p-3 border border-[#C3C8C3] flex flex-col justify-between">
            <span className="font-label-sm text-[10px] uppercase text-[#737875]">Cumulative Forecast</span>
            <span className="font-data-tabular-lg text-xl font-bold text-[#13201A] my-1">
              16,420 u
            </span>
            <span className="font-body-sm text-[10px] text-[#416659]">14-Day Horizon</span>
          </div>

          {/* Tile 2 */}
          <div className="bg-[#FFFFFF] p-3 border border-[#C3C8C3] flex flex-col justify-between">
            <span className="font-label-sm text-[10px] uppercase text-[#737875]">Surplus Exposure</span>
            <span className="font-data-tabular-lg text-xl font-bold text-[#BA1A1A] my-1">
              +1,850 u
            </span>
            <span className="font-body-sm text-[10px] text-[#BA1A1A]">Critical Risk Tier</span>
          </div>

          {/* Tile 3 */}
          <div className="bg-[#FFFFFF] p-3 border border-[#C3C8C3] flex flex-col justify-between">
            <span className="font-label-sm text-[10px] uppercase text-[#737875]">Margin Safeguard</span>
            <span className="font-data-tabular-lg text-xl font-bold text-[#183D32] my-1">
              15% Floor
            </span>
            <span className="font-body-sm text-[10px] text-[#183D32]">100% Protected</span>
          </div>

          {/* Tile 4 */}
          <div className="bg-[#FFFFFF] p-3 border border-[#C3C8C3] flex flex-col justify-between">
            <span className="font-label-sm text-[10px] uppercase text-[#737875]">Champion WAPE</span>
            <span className="font-data-tabular-lg text-xl font-bold text-[#416659] my-1">
              10.69%
            </span>
            <span className="font-body-sm text-[10px] text-[#416659]">HistGradientBoost</span>
          </div>
        </section>

        {/* Priority Perishable Items Feed */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-xs uppercase font-bold text-[#13201A]">
              Urgent Perishable Items
            </span>
            <Link href="/" className="font-label-sm text-xs text-[#416659] uppercase hover:underline">
              View All 9 →
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {families.slice(0, 4).map((f) => {
              const isCrit = f.risk_category === "CRITICAL";
              const isH = f.risk_category === "HIGH";

              return (
                <div
                  key={f.product_family}
                  className="bg-[#FFFFFF] p-3 border border-[#C3C8C3] flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[#13201A]">{f.product_family}</span>
                    <span className="font-body-sm text-[11px] text-[#434845]">
                      Surplus: +{f.expected_surplus} units · ~{f.shelf_life_days}d shelf
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`font-label-sm font-bold uppercase text-[10px] px-1.5 py-0.5 ${
                        isCrit
                          ? "bg-[#BA1A1A] text-[#FAF9F5]"
                          : isH
                          ? "bg-[#E4E3DA] text-[#D99A38] border border-[#D99A38]"
                          : "bg-[#C0E8D8] text-[#183D32]"
                      }`}
                    >
                      {f.recommended_discount_pct}% Off
                    </span>
                    <span className="font-data-tabular-md font-semibold text-[#13201A] mt-0.5">
                      ${f.recommended_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Action Navigation Buttons */}
        <section className="flex flex-col gap-2 pt-2">
          <Link
            href="/inventory-risk"
            className="w-full bg-[#183D32] text-[#FAF9F5] p-3 text-xs uppercase font-label-md tracking-wider flex items-center justify-between hover:bg-[#28352F] transition-colors"
          >
            <span>Run Inventory Risk Simulation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/markdown-planner"
            className="w-full bg-[#FFFFFF] border border-[#C3C8C3] text-[#13201A] p-3 text-xs uppercase font-label-md tracking-wider flex items-center justify-between hover:bg-[#EAE8DF] transition-colors"
          >
            <span>Open Dynamic Markdown Planner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/model-performance"
            className="w-full bg-[#FFFFFF] border border-[#C3C8C3] text-[#13201A] p-3 text-xs uppercase font-label-md tracking-wider flex items-center justify-between hover:bg-[#EAE8DF] transition-colors"
          >
            <span>Model Validation Benchmark (WAPE)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Bar"
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#F6F4EB] border-t border-[#C3C8C3] h-16 flex items-center justify-around z-40 pb-safe"
      >
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-[#183D32] min-w-[54px] min-h-[44px]"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="font-label-sm text-[9px] uppercase mt-0.5 font-bold">Overview</span>
        </Link>
        <Link
          href="/demand-forecast"
          className="flex flex-col items-center justify-center text-[#737875] hover:text-[#183D32] min-w-[54px] min-h-[44px]"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-label-sm text-[9px] uppercase mt-0.5">Forecast</span>
        </Link>
        <Link
          href="/inventory-risk"
          className="flex flex-col items-center justify-center text-[#737875] hover:text-[#183D32] min-w-[54px] min-h-[44px]"
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="font-label-sm text-[9px] uppercase mt-0.5">Risk</span>
        </Link>
        <Link
          href="/markdown-planner"
          className="flex flex-col items-center justify-center text-[#737875] hover:text-[#183D32] min-w-[54px] min-h-[44px]"
        >
          <Tag className="w-5 h-5" />
          <span className="font-label-sm text-[9px] uppercase mt-0.5">Markdown</span>
        </Link>
        <Link
          href="/model-performance"
          className="flex flex-col items-center justify-center text-[#737875] hover:text-[#183D32] min-w-[54px] min-h-[44px]"
        >
          <Gauge className="w-5 h-5" />
          <span className="font-label-sm text-[9px] uppercase mt-0.5">Metrics</span>
        </Link>
      </nav>
    </div>
  );
}
