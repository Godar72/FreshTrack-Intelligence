import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "FreshTrack Intelligence | AI Perishable Inventory & Markdown Safeguard",
  description:
    "AI-Based retail food waste prediction and dynamic markdown recommendation system evaluated on Kaggle Store Sales benchmark (Store 1, Quito, Pichincha, Ecuador).",
  keywords: [
    "food waste reduction",
    "demand forecasting",
    "dynamic markdown",
    "machine learning",
    "perishable inventory",
    "HistGradientBoosting",
    "retail operations",
  ],
  authors: [{ name: "FreshTrack Operations" }],
  openGraph: {
    title: "FreshTrack Intelligence Platform",
    description:
      "Perishable food waste prediction & margin-guarded dynamic markdown planner. HistGradientBoosting champion (10.69% WAPE).",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#C0E8D8] selection:text-[#183D32]">
        <Navigation>{children}</Navigation>
      </body>
    </html>
  );
}
