"use client";

import { Eye, MousePointerClick, MapPin, Map, Flag, ChevronDown, Mail } from "lucide-react";
import { GeolocationGroupItem, CityGroup, RegionGroup, CountryGroup, StepMetricDetail } from "@/types/analytics";
import { Loading } from "@/components/loading";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LocationInsightsProps {
    geoMetrics: GeolocationGroupItem[];
    groupBy: 'country' | 'region' | 'city';
    loading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step metric label helper
// ─────────────────────────────────────────────────────────────────────────────
function stepLabel(step: number): string {
    if (step === 1) return 'First Email';
    if (step === 2) return 'First Follow-up';
    if (step === 3) return 'Second Follow-up';
    if (step === 4) return 'Third Follow-up';
    if (step === 5) return 'Fourth Follow-up';
    return `Step ${step}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Metrics Grid — shown directly inside each row when expanded
// ─────────────────────────────────────────────────────────────────────────────
function StepMetricsGrid({ metrics }: { metrics: StepMetricDetail[] }) {
    if (!metrics || metrics.length === 0) return null;

    const sorted = [...metrics].sort((a, b) => a.step - b.step);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-3 pb-2">
            {sorted.map(stepData => (
                <div
                    key={stepData.step}
                    className="flex flex-col gap-2 w-full h-full p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors bg-white/50 backdrop-blur-sm"
                >
                    {/* Step - Primary Focus */}
                    <div className="flex items-start gap-2.5 text-gray-900">
                        <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span className="font-semibold text-sm wrap-break-word leading-tight">{stepLabel(stepData.step)}</span>
                    </div>

                    {/* Opens - Secondary Focus */}
                    <div className="flex items-start gap-2.5 text-gray-800">
                        <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-sm leading-tight wrap-break-word">
                            {stepData.open_count} {stepData.open_count === 1 ? 'Open' : 'Opens'}
                        </span>
                    </div>

                    {/* Clicks - Muted */}
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-xs font-mono tracking-tight">
                            {stepData.click_count} {stepData.click_count === 1 ? 'Click' : 'Clicks'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-location pills (region/city names shown as read-only tags)
// ─────────────────────────────────────────────────────────────────────────────
function SubLocationPills({ items, label }: { items: string[]; label: string }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider self-center mr-1">{label}:</span>
            {items.map((name) => (
                <span
                    key={name}
                    className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                >
                    {name}
                </span>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Totals badge (opens + clicks)
// ─────────────────────────────────────────────────────────────────────────────
function TotalsBadge({
    opens,
    clicks,
    borderColor = "border-gray-200",
    dividerColor = "border-gray-100",
}: {
    opens: number;
    clicks: number;
    borderColor?: string;
    dividerColor?: string;
}) {
    return (
        <div className={cn("flex bg-white border rounded-md shadow-sm overflow-hidden shrink-0", borderColor)}>
            <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 border-r flex-1", dividerColor)}>
                <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-700">{opens}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 flex-1">
                <MousePointerClick className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-700">{clicks}</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic expandable row — used for country, region, and city
// ─────────────────────────────────────────────────────────────────────────────
interface ExpandableRowProps {
    icon: React.ReactNode;
    iconBg: string;
    iconBorder: string;
    rowBorder: string;
    headerBg: string;
    headerHover: string;
    title: string;
    subtitle?: string | null;
    opens: number;
    clicks: number;
    totalsBorderColor?: string;
    totalsDividerColor?: string;
    pills?: { items: string[]; label: string }[];
    stepMetrics: StepMetricDetail[];
}

function ExpandableRow({
    icon,
    iconBg,
    iconBorder,
    rowBorder,
    headerBg,
    headerHover,
    title,
    subtitle,
    opens,
    clicks,
    totalsBorderColor,
    totalsDividerColor,
    pills = [],
    stepMetrics,
}: ExpandableRowProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={cn("rounded-xl border bg-white shadow-sm overflow-hidden transition-all hover:shadow-md", rowBorder)}>
            {/* Header row */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "w-full px-5 py-4 flex items-center gap-4 text-left transition-colors",
                    headerBg,
                    headerHover
                )}
            >
                {/* Icon */}
                <div className={cn("p-2 rounded-lg shrink-0 flex items-center justify-center border", iconBg, iconBorder)}>
                    {icon}
                </div>

                {/* Title + subtitle + pills */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg text-gray-900 truncate">{title}</span>
                        {subtitle && (
                            <span className="text-xs text-gray-400 font-medium truncate shrink-0">{subtitle}</span>
                        )}
                    </div>
                    {pills.map((p) => (
                        <SubLocationPills key={p.label} items={p.items} label={p.label} />
                    ))}
                </div>

                {/* Totals + chevron */}
                <div className="flex items-center gap-3 shrink-0">
                    <TotalsBadge
                        opens={opens}
                        clicks={clicks}
                        borderColor={totalsBorderColor}
                        dividerColor={totalsDividerColor}
                    />
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-gray-400 transition-transform duration-200",
                            open && "rotate-180"
                        )}
                    />
                </div>
            </button>

            {/* Step metrics — shown when expanded */}
            {open && stepMetrics && stepMetrics.length > 0 && (
                <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/40">
                    <StepMetricsGrid metrics={stepMetrics} />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export function LocationInsights({ geoMetrics, loading }: LocationInsightsProps) {
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <Loading />
                <p className="text-sm text-muted-foreground mt-4">Loading your GeoActivity...</p>
            </div>
        );
    }

    if (!geoMetrics || geoMetrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 border border-dashed border-gray-300 rounded-xl bg-white/50">
                <Flag className="w-8 h-8 mb-4 opacity-40 text-gray-400" />
                <p className="text-[15px] font-medium text-gray-900">No location data yet</p>
                <p className="text-sm text-gray-500 mt-1">Detailed tracking data is not available.</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-2 flex flex-col gap-3">
            {geoMetrics.map((item, idx) => {
                const isCountry = 'country' in item;
                const isRegion = 'region' in item && !('country' in item);
                const isCity = 'city' in item;

                // ── Country row (Gray theme)
                if (isCountry) {
                    const c = item as CountryGroup;
                    return (
                        <ExpandableRow
                            key={`country-${c.country}-${idx}`}
                            icon={<Flag className="w-4 h-4 text-gray-600" />}
                            iconBg="bg-gray-50"
                            iconBorder="border-gray-200"
                            rowBorder="border-gray-200"
                            headerBg="bg-white"
                            headerHover="hover:bg-gray-50/50"
                            title={c.country}
                            opens={c.total_open_count}
                            clicks={c.total_click_count}
                            pills={[
                                { items: c.regions ?? [], label: "Regions" },
                                { items: c.cities ?? [], label: "Cities" },
                            ]}
                            stepMetrics={c.step_metrics ?? []}
                        />
                    );
                }

                // ── Region row (Blue theme)
                if (isRegion) {
                    const r = item as RegionGroup;
                    return (
                        <ExpandableRow
                            key={`region-${r.region}-${idx}`}
                            icon={<Map className="w-4 h-4 text-blue-700" />}
                            iconBg="bg-blue-50"
                            iconBorder="border-blue-200"
                            rowBorder="border-blue-200"
                            headerBg="bg-blue-50/30"
                            headerHover="hover:bg-blue-50/60"
                            title={r.region}
                            subtitle={r.parent_country ? `· ${r.parent_country}` : null}
                            opens={r.total_open_count}
                            clicks={r.total_click_count}
                            totalsBorderColor="border-blue-100"
                            totalsDividerColor="border-blue-50"
                            pills={[
                                { items: r.cities ?? [], label: "Cities" },
                            ]}
                            stepMetrics={r.step_metrics ?? []}
                        />
                    );
                }

                // ── City row (Indigo theme)
                if (isCity) {
                    const city = item as CityGroup;
                    const sub = [city.parent_region, city.parent_country].filter(Boolean).join(', ');
                    return (
                        <ExpandableRow
                            key={`city-${city.city}-${idx}`}
                            icon={<MapPin className="w-4 h-4 text-indigo-700" />}
                            iconBg="bg-indigo-50"
                            iconBorder="border-indigo-200"
                            rowBorder="border-indigo-200"
                            headerBg="bg-indigo-50/30"
                            headerHover="hover:bg-indigo-50/60"
                            title={city.city}
                            subtitle={sub ? `· ${sub}` : null}
                            opens={city.total_open_count}
                            clicks={city.total_click_count}
                            totalsBorderColor="border-indigo-100"
                            totalsDividerColor="border-indigo-50"
                            stepMetrics={city.step_metrics ?? []}
                        />
                    );
                }

                return null;
            })}
        </div>
    );
}
