"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Store,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("manager@freshtrack.retail");
  const [password, setPassword] = useState("FreshTrack2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState("/overview");

  useEffect(() => {
    // Check if redirect query param is present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        setRedirectPath(redirect);
      }
    }
  }, []);

  const handleAutofill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please verify credentials.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Authentication successful. Opening retail operations ledger...");
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Login submission error:", err);
      setErrorMessage("Network error during authentication. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F0] text-[#1B1C17] flex flex-col justify-between selection:bg-[#C0E8D8] selection:text-[#183D32]">
      {/* Top Header */}
      <header className="h-16 w-full px-6 lg:px-12 border-b border-[#C3C8C3] bg-[#F6F4EB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#183D32] border border-[#416659] flex items-center justify-center text-[#A8BE78] font-bold text-xs tracking-wider">
            FT
          </div>
          <span className="font-label-lg text-xs uppercase tracking-wider text-[#13201A] font-bold">
            FreshTrack Intelligence
          </span>
          <span className="text-[#737875] text-xs">/</span>
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-[#434845] px-2 py-0.5 bg-[#EAE8DF]">
            Retail Operations
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#FAF9F5] border border-[#C3C8C3] px-2.5 py-1 text-[#1B1C17]">
            <Store className="w-3.5 h-3.5 text-[#737875]" />
            <span>Store 1 · Quito</span>
          </div>
          <div className="flex items-center gap-1.5 border border-[#416659]/60 bg-[#C0E8D8]/40 px-2.5 py-1 text-[#183D32] font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#183D32] inline-block animate-pulse"></span>
            <span>10.69% WAPE Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-4 sm:px-6 lg:px-12 py-10 flex-1 flex items-center justify-center">
        <div className="max-w-[1080px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Sign-in Form */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#FFFFFF] p-6 sm:p-10 border border-[#C3C8C3]">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F0EEE5] text-[#183D32] font-label-sm text-xs uppercase tracking-widest font-semibold border border-[#C3C8C3]">
                  <span className="w-2 h-2 bg-[#183D32] inline-block"></span>
                  <span>Store Operations Gateway</span>
                </span>
                <span className="font-label-sm text-[11px] text-[#737875] tracking-wider uppercase">
                  Production v1.4
                </span>
              </div>

              <div className="space-y-1 mb-6">
                <h1 className="font-headline-lg text-2xl lg:text-3xl text-[#13201A] font-bold tracking-tight">
                  Sign In to FreshTrack
                </h1>
                <p className="font-body-md text-sm text-[#434845]">
                  AI-powered perishable inventory forecasting &amp; margin-safeguarded dynamic markdowns.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="bg-[#FFDAD6] border border-[#BA1A1A] text-[#93000A] p-4 mb-6 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-body-sm leading-relaxed">
                    <strong className="font-label-sm uppercase tracking-wider block font-bold mb-0.5">
                      Authentication Failed
                    </strong>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div
                  role="status"
                  className="bg-[#C0E8D8]/50 border border-[#416659] text-[#183D32] p-4 mb-6 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-body-sm leading-relaxed">
                    <strong className="font-label-sm uppercase tracking-wider block font-bold mb-0.5">
                      Session Verified
                    </strong>
                    {successMessage}
                  </div>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="operator-email"
                    className="block font-label-sm text-xs uppercase tracking-wider text-[#13201A] mb-1 font-semibold"
                  >
                    Operator Email
                  </label>
                  <input
                    id="operator-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@freshtrack.retail"
                    className="w-full bg-[#FAF9F5] border border-[#C3C8C3] px-3.5 py-2.5 text-sm text-[#1B1C17] placeholder:text-[#737875] focus:outline-none focus:border-[#183D32] focus:ring-1 focus:ring-[#183D32] transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="operator-password"
                      className="block font-label-sm text-xs uppercase tracking-wider text-[#13201A] font-semibold"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-[#416659] hover:text-[#183D32] flex items-center gap-1 font-label-sm uppercase tracking-wider focus:outline-none"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="operator-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#FAF9F5] border border-[#C3C8C3] px-3.5 py-2.5 pr-10 text-sm text-[#1B1C17] placeholder:text-[#737875] focus:outline-none focus:border-[#183D32] focus:ring-1 focus:ring-[#183D32] transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737875] pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#183D32] hover:bg-[#13201A] text-[#FAF9F5] py-3 px-4 font-label-md text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-[#183D32] disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#FAF9F5] border-t-transparent rounded-full animate-spin"></span>
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Operations</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Demo Credentials Assistant */}
            <div className="mt-8 pt-6 border-t border-[#C3C8C3]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-[#737875] font-semibold">
                  Authorized Retail Roles
                </span>
                <span className="text-[10px] text-[#416659] bg-[#C0E8D8]/50 px-2 py-0.5 font-label-sm uppercase">
                  Click to Autofill
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAutofill("manager@freshtrack.retail", "FreshTrack2026!")
                  }
                  className="text-left p-2.5 bg-[#F6F4EB] hover:bg-[#EAE8DF] border border-[#C3C8C3] transition-colors flex flex-col focus:outline-none focus:ring-1 focus:ring-[#183D32]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-xs font-bold text-[#13201A]">
                      Store Manager
                    </span>
                    <UserCheck className="w-3.5 h-3.5 text-[#183D32]" />
                  </div>
                  <span className="font-mono text-[11px] text-[#434845] mt-1">
                    manager@freshtrack.retail
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAutofill("supervisor@freshtrack.retail", "FreshTrack2026!")
                  }
                  className="text-left p-2.5 bg-[#F6F4EB] hover:bg-[#EAE8DF] border border-[#C3C8C3] transition-colors flex flex-col focus:outline-none focus:ring-1 focus:ring-[#183D32]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-xs font-bold text-[#13201A]">
                      Floor Supervisor
                    </span>
                    <UserCheck className="w-3.5 h-3.5 text-[#183D32]" />
                  </div>
                  <span className="font-mono text-[11px] text-[#434845] mt-1">
                    supervisor@freshtrack.retail
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Platform Overview & Security Highlights */}
          <div className="lg:col-span-5 bg-[#13201A] text-[#FAF9F5] p-6 sm:p-10 flex flex-col justify-between border border-[#28352F]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#A8BE78]" />
                <span className="font-label-sm text-xs uppercase tracking-widest text-[#A8BE78] font-bold">
                  Enterprise Security
                </span>
              </div>

              <h2 className="font-headline-md text-xl lg:text-2xl font-bold tracking-tight text-[#FAF9F5] mb-4">
                Perishable Retail Decision Platform
              </h2>

              <p className="font-body-md text-xs text-[#BBCAC1] leading-relaxed mb-6">
                FreshTrack delivers daily recursive multi-step demand forecasting for Store 1
                (Quito, Pichincha) across 9 perishable food categories. Predictions directly inform
                inventory spoilage risk calculations and dynamic margin safeguards.
              </p>

              <div className="space-y-3 border-t border-[#28352F] pt-6 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#183D32] border border-[#416659] flex items-center justify-center text-[#A8BE78] text-[10px] font-bold shrink-0 mt-0.5">
                    01
                  </div>
                  <div>
                    <strong className="block text-[#FAF9F5] font-semibold">
                      HistGradientBoosting Forecasting
                    </strong>
                    <span className="text-[#8F9E96] text-[11px]">
                      Trained on empirical 2016–2017 Kaggle Store Sales data with 10.69% holdout WAPE.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#183D32] border border-[#416659] flex items-center justify-center text-[#A8BE78] text-[10px] font-bold shrink-0 mt-0.5">
                    02
                  </div>
                  <div>
                    <strong className="block text-[#FAF9F5] font-semibold">
                      Deterministic Inventory Risk
                    </strong>
                    <span className="text-[#8F9E96] text-[11px]">
                      Monitors usable shelf horizons (2–5 days) to quantify pre-expiry surplus exposure.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#183D32] border border-[#416659] flex items-center justify-center text-[#A8BE78] text-[10px] font-bold shrink-0 mt-0.5">
                    03
                  </div>
                  <div>
                    <strong className="block text-[#FAF9F5] font-semibold">
                      Margin-Safeguarded Markdowns
                    </strong>
                    <span className="text-[#8F9E96] text-[11px]">
                      Enforces cost-floor constraint equation P &ge; C &times; (1 + Margin) to eliminate algorithmic losses.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#28352F] flex items-center justify-between text-[11px] text-[#8F9E96]">
              <span>Store 1 · Quito Node</span>
              <span className="text-[#A8BE78] font-mono">HMAC-SHA256 Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 lg:px-12 py-4 border-t border-[#C3C8C3] bg-[#F6F4EB] text-[11px] text-[#737875] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>FreshTrack Intelligence · Retail Decision Support System</span>
        <span>Authorized Operations Personnel Only · Session Timeout: 8 Hours</span>
      </footer>
    </div>
  );
}
