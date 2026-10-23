import Link from "next/link";
import { AlertCircle, ArrowLeft, LayoutGrid } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 min-h-[70vh] flex items-center justify-center p-6 bg-[#FBF9F0]">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#C3C8C3] p-8 text-center flex flex-col items-center">
        <div className="w-12 h-12 bg-[#FFDAD6] border border-[#BA1A1A] flex items-center justify-center text-[#93000A] mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>

        <span className="font-label-sm text-xs uppercase tracking-widest text-[#737875] mb-1">
          Error 404 · Unmapped Route
        </span>
        <h1 className="font-headline-md text-2xl font-bold text-[#13201A] mb-2">
          Page Not Located
        </h1>
        <p className="font-body-md text-xs text-[#434845] leading-relaxed mb-6">
          The requested path is not registered in the FreshTrack Perishable Operations ledger. Return to the
          operational overview or navigate through the side menu.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 bg-[#13201A] hover:bg-[#28352F] text-[#FAF9F5] py-2.5 px-4 font-label-md text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4 text-[#A8BE78]" />
            <span>Overview Dashboard</span>
          </Link>
          <Link
            href="/demand-forecast"
            className="flex-1 bg-[#FAF9F5] hover:bg-[#EAE8DF] border border-[#C3C8C3] text-[#13201A] py-2.5 px-4 font-label-md text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Demand Forecast</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
