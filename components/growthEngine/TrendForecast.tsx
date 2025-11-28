"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ContactTrendForecast } from "@/app/api/growthEngine/contacts/[contactId]/trend-forecast/route";

declare global {
  interface Window {
    Chart?: any;
  }
}

let chartJsLoader: Promise<any> | null = null;

const loadChartJs = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Chart) return Promise.resolve(window.Chart);
  if (!chartJsLoader) {
    chartJsLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.async = true;
      script.onload = () => resolve(window.Chart);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    }).catch((err) => {
      console.error("Failed to load Chart.js", err);
      return null;
    });
  }
  return chartJsLoader;
};

interface TrendForecastProps {
  trend: ContactTrendForecast;
}

export function TrendForecast({ trend }: TrendForecastProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);

  const forecastPoints = useMemo(() => {
    const data = Array.isArray(trend.daily_forecast) ? trend.daily_forecast : [];
    return data
      .filter((item) => item?.date)
      .sort((a, b) => {
        const aTime = new Date(a?.date ?? "").getTime();
        const bTime = new Date(b?.date ?? "").getTime();
        return aTime - bTime;
      });
  }, [trend.daily_forecast]);

  useEffect(() => {
    let isMounted = true;

    const buildChart = async () => {
      const ChartCtor = await loadChartJs();
      if (!isMounted || !ChartCtor || !canvasRef.current || forecastPoints.length === 0) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      chartRef.current?.destroy();

      const formatLabel = (value?: string | null) => {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric" }).format(d);
      };

      const labels = forecastPoints.map((item) => formatLabel(item.date));

      const toNumber = (value: unknown, fallback: number) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const predicted = forecastPoints.map((item) => toNumber(item.predicted_events, 0));
      const lower = forecastPoints.map((item, idx) =>
        toNumber(item.lower_bound, predicted[idx] ?? 0)
      );
      const upper = forecastPoints.map((item, idx) =>
        toNumber(item.upper_bound, predicted[idx] ?? 0)
      );

      chartRef.current = new ChartCtor(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Lower Bound",
              data: lower,
              borderColor: "transparent",
              pointRadius: 0,
              tension: 0.3,
              order: 0,
            },
            {
              label: "Forecast Range",
              data: upper,
              borderColor: "transparent",
              backgroundColor: "rgba(59, 130, 246, 0.18)",
              pointRadius: 0,
              fill: 0,
              tension: 0.3,
              order: 1,
            },
            {
              label: "Predicted Activity",
              data: predicted,
              borderColor: "#0ea5e9",
              backgroundColor: "#0ea5e9",
              pointRadius: 3,
              pointBackgroundColor: "#0ea5e9",
              pointBorderColor: "#0ea5e9",
              tension: 0.3,
              order: 2,
            },
          ],
        },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  filter: (item) => item.text === "Predicted Activity" || item.text === "Range",
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
              filter: (tooltipItem) => tooltipItem.datasetIndex === 2,
            },
            title: {
              display: true,
              text: "Activity Forecast",
            },
          },
            interaction: {
              mode: "nearest",
              axis: "x",
              intersect: false,
            },
            scales: {
              x: {
                title: { display: true, text: "Date" },
                grid: { display: false },
                ticks: {
                  maxRotation: 0,
                  autoSkipPadding: 16,
                },
              },
              y: {
                title: { display: true, text: "Activity" },
              },
            },
        },
      });
    };

    buildChart();

    return () => {
      isMounted = false;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [forecastPoints]);

  const changePercent = Number(trend.trend_change_percent);
  const directionLabel = (trend.trend_direction ?? "").toString().toLowerCase();
  const hasChangeValue = Number.isFinite(changePercent);
  const isTrendingUp =
    directionLabel === "increasing" ||
    directionLabel === "up" ||
    (hasChangeValue && changePercent > 0);
  const isTrendingDown =
    directionLabel === "decreasing" ||
    directionLabel === "down" ||
    (hasChangeValue && changePercent < 0);
  const isTrendingFlat = !isTrendingUp && !isTrendingDown;

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2);
  };

  const hasForecastChart = forecastPoints.length > 0;
  const base = Number(trend.current_avg_daily_activity);
  const forecast = Number(trend.forecasted_avg_daily_activity);
  const ratio = Number.isFinite(base) && base !== 0 && Number.isFinite(forecast) ? forecast / base : null;
  const engagementLabel = (() => {
    if (!ratio || !Number.isFinite(ratio)) return "No baseline to compare";
    if (ratio >= 1.1) return "Strong lift projected";
    if (ratio >= 0.95) return "Holding steady";
    return "Needs lift";
  })();
  const engagementTone = (() => {
    if (!ratio || !Number.isFinite(ratio)) return "bg-slate-200 text-slate-700";
    if (ratio >= 1.1) return "text-green-700 bg-green-500/10";
    if (ratio >= 0.95) return "text-amber-700 bg-amber-500/10";
    return "text-red-700 bg-red-500/10";
  })();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-muted bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Average Daily Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {formatNumber(trend.forecasted_avg_daily_activity)}
              </p>
              <p className="text-xs text-muted-foreground">
                Current avg: {formatNumber(trend.current_avg_daily_activity)}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold",
                isTrendingUp && "bg-green-500/10 text-green-700",
                isTrendingDown && "bg-red-500/10 text-red-700",
                isTrendingFlat && "bg-amber-500/10 text-amber-700"
              )}
            >
              {isTrendingUp && <TrendingUp className="w-4 h-4" />}
              {isTrendingDown && <TrendingDown className="w-4 h-4" />}
              {isTrendingFlat && <Minus className="w-4 h-4" />}
              {isTrendingUp && "Increasing"}
              {isTrendingDown && "Decreasing"}
              {isTrendingFlat && "Flat"}
              {Number.isFinite(changePercent) && (
                <span className="text-sm font-semibold opacity-80">
                  ({changePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-muted bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Engagement Quality</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isTrendingUp ? "Heating up" : isTrendingDown ? "Cooling down" : "Flat"}
              </p>
              <p className="text-xs text-muted-foreground">Momentum based on recent trend</p>
            </div>
            <div
              className={cn(
                "px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-2",
                isTrendingUp && "bg-green-500/10 text-green-700",
                isTrendingDown && "bg-red-500/10 text-red-700",
                isTrendingFlat && "bg-amber-500/10 text-amber-700"
              )}
            >
              {isTrendingUp && <TrendingUp className="w-4 h-4" />}
              {isTrendingDown && <TrendingDown className="w-4 h-4" />}
              {isTrendingFlat && <Minus className="w-4 h-4" />}
              {isTrendingUp ? "Upward" : isTrendingDown ? "Downward" : "Stable"}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-muted bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Engagement Outlook</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold text-foreground">
                {ratio && Number.isFinite(ratio) ? `${(ratio * 100).toFixed(0)}% of baseline` : "Not enough data"}
              </p>
              <p className="text-xs text-muted-foreground">Projected activity vs current baseline</p>
            </div>
            <div className={cn("px-3 py-1 rounded-full text-sm font-semibold", engagementTone)}>
              {engagementLabel === "Strong lift projected" && "Lift expected"}
              {engagementLabel === "Holding steady" && "Holding steady"}
              {engagementLabel === "Needs lift" && "Needs boost"}
              {engagementLabel === "No baseline to compare" && "No baseline yet"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-muted">
        <CardContent className="p-4">
          {hasForecastChart ? (
            <div className="h-[340px]">
              <canvas ref={canvasRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              No forecast points available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
