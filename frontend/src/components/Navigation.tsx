"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  TrendingUp,
  ShieldAlert,
  Tag,
  Gauge,
  LogOut,
  Menu,
  X,
  FileDown,
  Store,
  Calendar,
  User,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/overview", icon: <LayoutGrid className="w-5 h-5" /> },
  { name: "Demand Forecast", href: "/demand-forecast", icon: <TrendingUp className="w-5 h-5" /> },
  { name: "Inventory Risk", href: "/inventory-risk", icon: <ShieldAlert className="w-5 h-5" /> },
  { name: "Markdown Planner", href: "/markdown-planner", icon: <Tag className="w-5 h-5" /> },
  { name: "Model Performance", href: "/model-performance", icon: <Gauge className="w-5 h-5" /> },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    email: string;
  }>({
    name: "Store Operations Manager",
    role: "Store Manager",
    email: "manager@freshtrack.retail",
  });

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Fetch active session info if not on login page
    if (!isLoginPage) {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setCurrentUser({
              name: data.user.name || "Store Operations Manager",
              role: data.user.role === "store_manager" ? "Store Manager" : "Floor Supervisor",
              email: data.user.email || "manager@freshtrack.retail",
            });
          }
        })
        .catch(() => {});
    }
  }, [isLoginPage]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed with client redirect regardless
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F0] text-[#1B1C17] flex overflow-x-hidden max-w-full w-full">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#183D32] focus:text-[#FAF9F5] focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Desktop Aside Navigation (Permanent on lg+ viewports) */}
      {!isLoginPage && (
        <aside
          aria-label="Main Navigation"
          className="hidden lg:flex fixed left-0 top-0 h-full w-[260px] bg-[#13201A] text-[#FAF9F5] z-50 flex-col justify-between border-r border-[#28352F]"
        >
          <div className="flex flex-col">
            {/* Monogram Brand Header */}
            <div className="px-4 pt-6 pb-4 border-b border-[#28352F]">
              <Link
                href="/overview"
                className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-[#A8BE78]"
              >
                <div className="w-8 h-8 bg-[#183D32] border border-[#416659] flex items-center justify-center text-[#A8BE78] font-bold text-sm tracking-wider">
                  FT
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-lg font-bold tracking-tight text-[#FAF9F5] leading-tight group-hover:text-[#A8BE78] transition-colors">
                    FreshTrack
                  </span>
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-[#BBCAC1]">
                    Retail Operations · v1.4
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1 py-4 px-2" aria-label="Desktop screen routes">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href === "/overview" && pathname === "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
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

          {/* Aside Footer / User Status & Operations Context */}
          <div className="flex flex-col border-t border-[#28352F]">
            <div className="px-4 py-3 flex flex-col gap-1 bg-[#13201A]/80 text-[#8F9E96] text-[11px]">
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#737875]">Location</span>
                <span className="text-[#FAF9F5]">Store 1 · Quito</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase text-[#737875]">Model State</span>
                <span className="text-[#D7E6DD] font-medium">HistGB (10.69% WAPE)</span>
              </div>
              <div className="mt-1 inline-flex items-center justify-center border border-[#416659] bg-[#183D32]/40 py-1 px-2 text-[#A8BE78] text-[9px] font-semibold tracking-wider uppercase">
                Store Operations · Active
              </div>
            </div>

            {/* User Session & Logout */}
            <div className="p-3 border-t border-[#28352F] flex items-center justify-between bg-[#0F1A15]">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 bg-[#28352F] border border-[#737875] flex items-center justify-center text-[#A8BE78] text-xs font-bold shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs text-[#FAF9F5] font-semibold leading-none truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#BBCAC1] mt-0.5 truncate">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of operations session"
                aria-label="Sign out"
                className="p-1.5 text-[#8F9E96] hover:text-[#FFDAD6] hover:bg-[#28352F] transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-h-screen overflow-x-hidden max-w-full ${
          !isLoginPage ? "lg:pl-[260px] pb-20 lg:pb-0" : "w-full"
        }`}
      >
        {/* Top Header Bar (When Not on Login) */}
        {!isLoginPage && (
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

            {/* Context Indicators & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="hidden xl:flex items-center gap-1.5 bg-[#FAF9F5] border border-[#C3C8C3] px-2.5 py-1 text-[#1B1C17]">
                <Store className="w-3.5 h-3.5 text-[#737875]" />
                <span>Store 1 · Quito</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 bg-[#FAF9F5] border border-[#C3C8C3] px-2.5 py-1 text-[#1B1C17]">
                <Calendar className="w-3.5 h-3.5 text-[#737875]" />
                <span>Validation Window: 30-Day Holdout</span>
              </div>

              <div className="flex items-center gap-1.5 border border-[#416659]/60 bg-[#C0E8D8]/40 px-2 py-1 sm:px-2.5 text-[#183D32] font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#183D32] inline-block animate-pulse"></span>
                <span>10.69% WAPE</span>
              </div>

              <a
                href="/api/metrics"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 bg-[#13201A] text-[#FAF9F5] px-2.5 py-1 sm:px-3 sm:py-1.5 font-label-md text-[11px] hover:bg-[#28352F] transition-colors tracking-wider uppercase"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Metrics</span>
              </a>

              {/* Mobile Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign out of operations session"
                className="lg:hidden p-1.5 text-[#434845] hover:text-[#BA1A1A] hover:bg-[#EAE8DF] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
                    Operational Scope
                  </span>
                  <p className="font-label-md text-xs font-bold text-[#13201A] mt-0.5">
                    Store 1 · Quito
                  </p>
                  <p className="font-body-sm text-[11px] text-[#434845] mt-0.5">
                    HistGradientBoosting 10.69% WAPE · 9 Perishable Families
                  </p>
                </div>

                {/* Links */}
                <nav className="flex flex-col px-2 py-1" aria-label="Mobile menu links">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href || (item.href === "/overview" && pathname === "/");
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
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer with User & Sign Out */}
              <div className="p-4 border-t border-[#C3C8C3] bg-[#F6F4EB] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#13201A] text-xs">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-[#737875]">{currentUser.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFDAD6] border border-[#BA1A1A] text-[#93000A] font-label-sm text-[10px] uppercase font-bold tracking-wider"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
                <div className="text-[10px] text-[#737875] border-t border-[#C3C8C3] pt-2">
                  Perishable demand forecasting &amp; dynamic markdown safeguard system.
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content Viewport */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 flex flex-col ${!isLoginPage ? "pt-16" : ""}`}
        >
          {children}
        </main>

        {/* Automatic Mobile Sticky Bottom Navigation Bar (Visible on < lg screens) */}
        {!isLoginPage && (
          <nav
            aria-label="Mobile Navigation Bar"
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#F6F4EB] border-t border-[#C3C8C3] h-16 flex items-center justify-around z-40 pb-safe shadow-sm"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href === "/overview" && pathname === "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] transition-colors ${
                    isActive ? "text-[#183D32] font-bold" : "text-[#737875] hover:text-[#183D32]"
                  }`}
                >
                  <span className={isActive ? "text-[#183D32]" : "text-[#737875]"}>
                    {item.icon}
                  </span>
                  <span
                    className={`font-label-sm text-[9px] uppercase mt-0.5 ${
                      isActive ? "font-bold text-[#183D32]" : ""
                    }`}
                  >
                    {item.name.replace("Demand ", "").replace("Model ", "").replace("Markdown ", "")}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
