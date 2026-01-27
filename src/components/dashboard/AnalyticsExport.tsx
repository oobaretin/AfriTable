"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type AnalyticsData = {
  netRevenue: number;
  revenueGrowth: number;
  loyaltyRate: number;
  peakHours: number[];
  period: string;
};

type AnalyticsResp = {
  analytics: AnalyticsData;
};

export function AnalyticsExport() {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const exportRef = React.useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<AnalyticsResp>({
    queryKey: ["ownerAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/analytics");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load analytics");
      return data as AnalyticsResp;
    },
  });

  const analytics = data?.analytics;

  async function exportToPDF() {
    if (!exportRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // Create a clone of the element to avoid affecting the original
      const element = exportRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: "#F9F7F2", // brand-paper
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        onclone: (clonedDoc) => {
          // Ensure all images are loaded
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            if (img.src && !img.complete) {
              img.crossOrigin = "anonymous";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      const xOffset = (pdfWidth - imgScaledWidth) / 2;
      const yOffset = (pdfHeight - imgScaledHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgScaledWidth, imgScaledHeight);

      // Add page if content is taller than one page
      const remainingHeight = imgScaledHeight - pdfHeight;
      if (remainingHeight > 0) {
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          xOffset,
          yOffset - pdfHeight,
          imgScaledWidth,
          imgScaledHeight,
        );
      }

      const fileName = `AfriTable-Performance-Report-${format(new Date(), "yyyy-MM")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <Skeleton className="h-96 rounded-[3rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <Alert variant="destructive">
          <AlertDescription>Failed to load analytics. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const revenueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(analytics.netRevenue);

  const growthColor = analytics.revenueGrowth >= 0 ? "text-brand-green" : "text-brand-mutedRed";
  const growthSymbol = analytics.revenueGrowth >= 0 ? "↑" : "↓";

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10">
      <div ref={exportRef} className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 lg:p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-sm font-black text-brand-bronze uppercase tracking-[0.2em] mb-2">
              Performance Report
            </h2>
            <h3 className="text-4xl font-black text-brand-dark tracking-tighter uppercase">
              Monthly <span className="text-brand-forest">Impact</span>
            </h3>
            <p className="text-sm text-slate-500 mt-2">{analytics.period}</p>
          </div>
          <Button
            onClick={exportToPDF}
            disabled={isGeneratingPDF}
            className="btn-bronze flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-brand-bronze/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Export PDF Report
              </>
            )}
          </Button>
        </div>

        {/* Analytics Grid */}
        <div className="p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-slate-50/30">
          {/* Revenue Insight */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-6xl font-black text-brand-dark">$</span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Net Revenue (Est.)
            </p>
            <p className="text-4xl font-black text-brand-dark mb-2">{revenueFormatted}</p>
            <p className={`text-sm font-bold ${growthColor} flex items-center gap-1`}>
              <span>{growthSymbol}</span> {Math.abs(analytics.revenueGrowth)}% vs Last Month
            </p>
          </div>

          {/* Retention Insight */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-6xl font-black text-brand-dark">🤝</span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Loyalty Rate</p>
            <p className="text-4xl font-black text-brand-dark mb-2">{analytics.loyaltyRate}%</p>
            <p className="text-sm font-bold text-brand-ochre">Top 5% of Diaspora Dining</p>
          </div>

          {/* Booking Heatmap Mini */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Peak Dining Hours
            </p>
            <div className="flex items-end gap-2 h-20">
              {analytics.peakHours.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-lg ${
                    h > 75 ? "bg-brand-mutedRed" : "bg-brand-bronze/30"
                  }`}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
              <span>5PM</span>
              <span>11PM</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-12 py-6 bg-brand-paper flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 italic">
            Certified by AfriTable Insights Engine • {format(new Date(), "MMM yyyy")}
          </p>
          <img
            src="/logo.png"
            className="h-6 opacity-30 grayscale"
            alt="Sankofa Seal"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
}
