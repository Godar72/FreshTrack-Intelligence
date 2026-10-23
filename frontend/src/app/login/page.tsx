"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Shield,
  RotateCcw,
  KeyRound,
  FileText,
} from "lucide-react";

type AuthState = "default" | "error" | "reset" | "register" | "loading";

export default function LoginPage() {
  const [authState, setAuthState] = useState<AuthState>("default");
  const [email, setEmail] = useState("researcher@quitorisk.edu.ec");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authState === "error") {
      return;
    }
    setAuthState("loading");
    setTimeout(() => {
      setAuthState("default");
      setSimulatedSuccess(true);
      setTimeout(() => setSimulatedSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F0] text-[#1B1C17] flex flex-col justify-between selection:bg-[#C0E8D8]">
      {/* Top Header */}
      <header className="h-16 w-full px-6 lg:px-12 border-b border-[#C3C8C3] bg-[#F6F4EB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-label-lg text-xs uppercase tracking-wider text-[#13201A] font-bold">
            FreshTrack Intelligence
          </Link>
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-[#434845] px-2 py-0.5 bg-[#EAE8DF]">
            Ledger v1.4
          </span>
        </div>
        <nav className="flex items-center gap-6 text-xs uppercase font-label-md" aria-label="Terminal sub-navigation">
          <Link href="/model-performance" className="text-[#434845] hover:text-[#13201A] transition-colors">
            Academic Benchmark
          </Link>
          <span className="text-[#13201A] font-bold border-b-2 border-[#183D32] pb-1">
            Terminal Access
          </span>
        </nav>
      </header>

      {/* Main Container */}
      <main className="w-full px-6 lg:px-12 py-10 flex-1 flex items-center justify-center">
        <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Form & Prototype State Inspector */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between bg-[#FFFFFF] p-6 lg:p-10 border border-[#C3C8C3]">
            <div>
              {/* Metatag & Header */}
              <div className="flex items-center justify-between gap-2 mb-6">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F0EEE5] text-[#434845] font-label-sm text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 bg-[#416659] inline-block"></span>
                  <span>Terminal Interface (Mock Scope)</span>
                </span>
                <span className="font-label-sm text-xs text-[#737875] tracking-wider uppercase">
                  Proto Auth v0.9.4
                </span>
              </div>

              <div className="space-y-1 mb-6">
                <h1 className="font-headline-lg text-2xl lg:text-3xl text-[#13201A] font-bold tracking-tight">
                  FreshTrack Terminal Access
                </h1>
                <p className="font-body-md text-sm text-[#434845]">
                  Demand forecasting &amp; perishable inventory decision support.
                </p>
              </div>

              {/* Mandatory Academic Disclosure Box */}
              <div className="bg-[#F6F4EB] p-4 border border-[#C3C8C3] mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#183D32] shrink-0 mt-0.5" />
                <div className="text-xs text-[#1B1C17] leading-relaxed">
                  <strong className="font-label-sm uppercase tracking-wider block text-[#13201A] mb-1">
                    Frontend Prototype Interface Notice
                  </strong>
                  Evaluative authentication interface awaiting production identity provider integration.
                  No live credentials, backend directory lookups, or user accounts are connected. Interactive
                  controls demonstrate UI validation and state handling only.
                </div>
              </div>

              {/* Reviewer State Switcher Bar */}
              <div className="mb-6 bg-[#F0EEE5] p-2 border border-[#C3C8C3]">
                <div className="flex items-center justify-between px-2 py-1 text-xs">
                  <span className="font-label-sm uppercase tracking-widest text-[#434845] font-semibold">
                    Reviewer State Matrix:
                  </span>
                  <span className="font-label-sm text-xs text-[#416659] font-bold uppercase">
                    Current: {authState.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-1 text-xs font-label-sm">
                  {(["default", "error", "reset", "register", "loading"] as AuthState[]).map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setAuthState(state)}
                      className={`py-1.5 text-center uppercase tracking-wider transition-colors cursor-pointer ${
                        authState === state
                          ? "bg-[#13201A] text-[#FAF9F5] font-bold"
                          : "text-[#434845] hover:bg-[#EAE8DF] bg-[#FAF9F5] border border-[#C3C8C3]"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Alerts */}
              {authState === "error" && (
                <div className="mb-6 bg-[#FFDAD6] border border-[#BA1A1A] p-4 text-[#93000A] flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#BA1A1A] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-label-md font-bold uppercase text-[#BA1A1A]">
                      Authentication Verification Failed
                    </p>
                    <p className="font-body-sm text-[#1B1C17] mt-0.5">
                      The credentials entered do not match authorized access parameters. (Prototype state:
                      simulated invalid credentials test).
                    </p>
                  </div>
                </div>
              )}

              {authState === "reset" && (
                <div className="mb-6 bg-[#C0E8D8]/50 border border-[#416659] p-4 text-[#183D32] flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-[#416659] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-label-md font-bold uppercase text-[#183D32]">
                      Password Reset Workflow (Prototype)
                    </p>
                    <p className="font-body-sm text-[#1B1C17] mt-0.5">
                      Enter your institutional email to simulate recovery flow. Note: No emails or recovery
                      tokens are dispatched in this prototype mode.
                    </p>
                  </div>
                </div>
              )}

              {authState === "register" && (
                <div className="mb-6 bg-[#F6F4EB] border border-[#C3C8C3] p-4 text-[#13201A] flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#183D32] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-label-md font-bold uppercase text-[#13201A]">
                      Institutional Provisioning Request
                    </p>
                    <p className="font-body-sm text-[#434845] mt-0.5">
                      Accounts are provisioned by laboratory supervisors. Fill in institutional credentials
                      to request audit clearance.
                    </p>
                  </div>
                </div>
              )}

              {simulatedSuccess && (
                <div className="mb-6 bg-[#C0E8D8] border border-[#416659] p-4 text-[#183D32] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#183D32] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-label-md font-bold uppercase text-[#183D32]">
                      Verification Validated (Mock Mode)
                    </p>
                    <p className="font-body-sm text-[#1B1C17] mt-0.5">
                      Session simulation active. You can now explore all forecast, simulation, and markdown
                      screens.
                    </p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md uppercase text-[#434845] tracking-wider font-semibold">
                    Academic / Operator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#C3C8C3] px-3 py-2 font-data-tabular-md text-xs text-[#13201A] focus:outline-none focus:border-[#13201A]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md uppercase text-[#434845] tracking-wider font-semibold">
                      Access Passphrase
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthState("reset")}
                      className="font-label-sm text-[#416659] uppercase hover:underline cursor-pointer"
                    >
                      Forgot Passphrase?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#C3C8C3] px-3 py-2 font-data-tabular-md text-xs text-[#13201A] focus:outline-none focus:border-[#13201A] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2.5 text-[#737875] hover:text-[#13201A] p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={authState === "loading"}
                    className="w-full bg-[#13201A] hover:bg-[#28352F] text-[#FAF9F5] py-2.5 px-4 font-label-md text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {authState === "loading" ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin text-[#A8BE78]" />
                        <span>Verifying Security Parameters...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#A8BE78]" />
                        <span>Authorize Terminal Session</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/"
                    className="w-full bg-[#F6F4EB] hover:bg-[#EAE8DF] border border-[#C3C8C3] text-[#13201A] py-2.5 px-4 font-label-md text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Proceed Directly to Dashboard (Reviewer Bypass)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </form>
            </div>

            <div className="pt-6 mt-6 border-t border-[#C3C8C3] flex items-center justify-between text-[#737875] text-[11px]">
              <span>Session timeout: 30 minutes idle</span>
              <span className="font-semibold uppercase text-[#13201A]">Store 1 (Quito) Terminal</span>
            </div>
          </div>

          {/* Right Column: Architectural Governance Brief */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between bg-[#F6F4EB] p-6 lg:p-10 border border-[#C3C8C3]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 border-b border-[#C3C8C3] pb-4">
                <span className="font-label-sm text-xs uppercase tracking-wider text-[#416659] font-bold">
                  Security Architecture &amp; Single-User Scope
                </span>
                <h2 className="font-headline-sm text-xl font-bold text-[#13201A]">
                  Academic Evaluation Gateway
                </h2>
              </div>

              <div className="space-y-4 text-xs font-body-md text-[#1B1C17] leading-relaxed">
                <p>
                  In accordance with Requirement 5, this application is engineered as an academic research
                  demonstrator for Store 1 (Quito, Pichincha, Ecuador).
                </p>
                <div className="p-4 bg-[#FFFFFF] border border-[#C3C8C3] space-y-2">
                  <div className="flex items-center gap-2 font-label-sm uppercase font-bold text-[#13201A]">
                    <Shield className="w-4 h-4 text-[#183D32]" />
                    <span>No Insecure Custom User DB</span>
                  </div>
                  <p className="text-[#434845]">
                    We strictly avoid storing plaintext or custom unsalted password databases. When deployed
                    in production enterprise settings, authorization must integrate with established providers
                    (Clerk, Auth0, or Firebase) with server-side session cookies and MFA.
                  </p>
                </div>

                <div className="p-4 bg-[#FFFFFF] border border-[#C3C8C3] space-y-2">
                  <div className="flex items-center gap-2 font-label-sm uppercase font-bold text-[#13201A]">
                    <FileText className="w-4 h-4 text-[#416659]" />
                    <span>Audit Trail Compliance</span>
                  </div>
                  <p className="text-[#434845]">
                    All API endpoints enforce server-side input boundary validation, type checking, and
                    margin safeguards to prevent unauthorized price liquidation.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#C3C8C3] text-xs text-[#737875] flex items-center justify-between">
              <span>Academic Defense Ready</span>
              <span className="font-bold text-[#416659]">Zero Leakage Architecture</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 w-full px-6 lg:px-12 border-t border-[#C3C8C3] bg-[#F6F4EB] flex items-center justify-between text-xs text-[#737875]">
        <span>FreshTrack Intelligence Platform · Academic Research Project</span>
        <span>Kaggle Store Sales Benchmark (Ecuador 2013–2017)</span>
      </footer>
    </div>
  );
}
