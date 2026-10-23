"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  TrendingUp,
  ShieldAlert,
  Tag,
  Gauge,
  Smartphone,
  Lock,
  Menu,
  X,
  FileDown,
  Store,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/", icon: <LayoutGrid className="w-5 h-5" /> },
  { name: "Demand Forecast", href: "/demand-forecast", icon: <TrendingUp className="w-5 h-5" /> },
  { name: "Inventory Risk", href: "/inventory-risk", icon: <ShieldAlert className="w-5 h-5" /> },
  { name: "Markdown Planner", href: "/markdown-planner", icon: <Tag className="w-5 h-5" /> },
  { name: "Model Performance", href: "/model-performance", icon: <Gauge className="w-5 h-5" /> },
  { name: "Mobile Dashboard", href: "/mobile", icon: <Smartphone className="w-5 h-5" />, badge: "Dedicated" },
  { name: "Terminal Login", href: "/login", icon: <Lock className="w-5 h-5" />, badge: "Mock Scope" },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // If on dedicated mobile screen or login screen, allow full screen custom layout if desired
  const isDedicatedMobilePage = pathname === "/mobile";
  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen bg-[#FBF9F0] text-[#1B1C17] flex overflow-x-hidden max-w-full w-full">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#183D32] focus:text-[#FAF9F5] focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Desktop Aside (Hidden on small screens or when viewing dedicated mobile dashboard) */}
      {!isDedicatedMobilePage && !isLoginPage && (
        <aside
          aria-label="Main Navigation"
          className="hidden lg:flex fixed left-0 top-0 h-full w-[260px] bg-[#13201A] text-[#FAF9F5] z-50 flex-col justify-between border-r border-[#28352F]"
        >
          <div className="flex flex-col">
            {/* Monogram Brand Header */}
            <div className="px-4 pt-6 pb-4 border-b border-[#28352F]">
              <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-[#A8BE78]">
                <div className="w-8 h-8 bg-[#183D32] border border-[#416659] flex items-center justify-center text-[#A8BE78] font-bold text-sm tracking-wider">
                  FT
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-lg font-bold tracking-tight text-[#FAF9F5] leading-tight group-hover:text-[#A8BE78] transition-colors">
                    FreshTrack
                  </span>
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-[#BBCAC1]">
                    Retail Decision Support · v1.4
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1 py-4 px-2" aria-label="Desktop screen routes">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                      isActive
                        ? "bg-[#28352F] text-[#FAF9F5] border-l-2 border-[#A8BE78] font-semibold"
                        : "text-[#8F9E96] hover:bg-[#28352F]/60 hover:text-[#FAF9F5]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-[#A8BE78]" : "text-[#8F9E96]"}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#183D32] text-[#A8BE78] border border-[#416659]/60 uppercase">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Aside Footer / Academic Context */}
          <div className="flex flex-col border-t border-[#28352F]">
            <div className="px-4 py-3 flex flex-col gap-1.5 bg-[#13201A]/80 text-[#8F9E96] text-[11px]">
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#737875]">Dataset</span>
                <span className="text-[#D7E6DD] font-medium">Kaggle Store Sales</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#737875]">Scope</span>
                <span className="text-[#FAF9F5]">Store 1 · Quito (EC)</span>
              </div>
              <div className="mt-1 inline-flex items-center justify-center border border-[#416659] bg-[#183D32]/40 py-1 px-2 text-[#A8BE78] text-[9px] font-semibold tracking-wider uppercase">
                Academic Research Prototype
              </div>
            </div>

            <div className="p-3 border-t border-[#28352F] flex items-center justify-between bg-[#0F1A15]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#28352F] border border-[#737875] flex items-center justify-center text-[#A8BE78] text-xs font-bold">
                  S1
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#FAF9F5] font-semibold leading-none">
                    Quito Research Node
                  </span>
                  <span className="text-[10px] text-[#BBCAC1] mt-0.5">
                    HistGB Champion (10.69%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-h-screen overflow-x-hidden max-w-full ${
          !isDedicatedMobilePage && !isLoginPage ? "lg:pl-[260px]" : "w-full"
        }`}
      >
        {/* Top Header Bar (When Not on Dedicated Mobile View or Login) */}
        {!isDedicatedMobilePage && !isLoginPage && (
          <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-16 bg-[#F6F4EB] border-b border-[#C3C8C3] z-40 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Drawer Toggle */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open operational navigation drawer"
                className="lg:hidden p-2 text-[#13201A] hover:bg-[#EAE8DF] transition-colors focus:outline-none"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-label-lg text-xs font-bold text-[#13201A] uppercase tracking-wider">
                  FreshTrack
                </span>
                <span className="text-[#737875] text-xs">/</span>
                <span className="font-label-md text-xs text-[#434845] uppercase tracking-wider hidden sm:inline-block">
                  Perishable Operations
                </span>
              </div>
            </div>

            {/* Context Indicators & Action */}
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden xl:flex items-center gap-1.5 bg-[#FAF9F5] border border-[#C3C8C3] px-2.5 py-1 text-[#1B1C17]">
                <Store className="w-3.5 h-3.5 text-[#737875]" />
                <span>Store 1 — Quito, Pichincha, Ecuador</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 bg-[#FAF9F5] border border-[#C3C8C3] px-2.5 py-1 text-[#1B1C17]">
                <Calendar className="w-3.5 h-3.5 text-[#737875]" />
                <span>Validation: Jul 17 – Aug 15, 2017</span>
              </div>

              <div className="flex items-center gap-1.5 border border-[#416659]/60 bg-[#C0E8D8]/40 px-2.5 py-1 text-[#183D32] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#183D32] inline-block animate-pulse"></span>
                <span>10.69% WAPE</span>
              </div>

              <a
                href="/api/metrics"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 bg-[#13201A] text-[#FAF9F5] px-3 py-1.5 font-label-md text-[11px] hover:bg-[#28352F] transition-colors tracking-wider uppercase ml-1"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Model Metrics</span>
              </a>
            </div>
          </header>
        )}

        {/* Mobile Slide-Over Drawer Modal */}
        {mobileDrawerOpen && (
          <div
            id="operational-drawer-backdrop"
            className="fixed inset-0 bg-[#13201A]/60 backdrop-blur-xs z-50 flex justify-end"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <aside
              id="operational-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
              className="w-[82%] max-w-[320px] h-full bg-[#FBF9F0] text-[#1B1C17] border-l border-[#C3C8C3] shadow-none flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {/* Drawer Header */}
                <div className="h-16 px-4 border-b border-[#C3C8C3] flex items-center justify-between bg-[#F6F4EB]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#183D32] text-[#A8BE78] flex items-center justify-center font-bold text-xs">
                      FT
                    </div>
                    <span className="font-label-lg text-xs tracking-wider text-[#13201A] uppercase font-bold">
                      FreshTrack Menu
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Close navigation menu"
                    className="p-2 text-[#434845] hover:text-[#13201A] transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scope Context */}
                <div className="p-3 bg-[#F0EEE5] m-3 border-l-2 border-[#183D32]">
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-[#183D32] font-semibold block">
                    Validation Scope
                  </span>
                  <p className="font-label-md text-xs font-bold text-[#13201A] mt-0.5">
                    Store 1 · Quito (Pichincha)
                  </p>
                  <p className="font-body-sm text-[11px] text-[#434845] mt-0.5">
                    HistGradientBoosting 10.69% WAPE · 9 Perishable Categories
                  </p>
                </div>

                {/* Links */}
                <nav className="flex flex-col px-2 py-1" aria-label="Mobile menu links">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`h-11 flex items-center justify-between px-3 text-xs uppercase tracking-wider transition-colors ${
                          isActive
                            ? "bg-[#183D32] text-[#FAF9F5] font-semibold"
                            : "text-[#434845] hover:bg-[#EAE8DF] hover:text-[#13201A]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] px-1 py-0.2 bg-[#F0EEE5] text-[#183D32] border border-[#C3C8C3]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#C3C8C3] text-[#434845] text-[11px] bg-[#F6F4EB] flex flex-col gap-1">
                <span className="font-bold text-[#13201A] uppercase font-label-md">
                  FreshTrack Intelligence v1.4
                </span>
                <span>Academic prototype · Retail demand & markdown simulation.</span>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content Viewport */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 flex flex-col ${
            !isDedicatedMobilePage && !isLoginPage ? "pt-16" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
