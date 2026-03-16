"use client";

import { Eye, MousePointerClick, MapPin, Globe, ChevronDown, ChevronRight } from "lucide-react";
import { GeolocationGroupItem, CityGroup, RegionGroup, CountryGroup, StepMetricDetail } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading";
import { useState } from "react";

interface LocationInsightsProps {
    geoMetrics: GeolocationGroupItem[];
    groupBy: 'country' | 'region' | 'city';
    loading: boolean;
    maxSteps: number;
}

function getStepBadgeColor(step: number) {
    const colors = [
        "bg-blue-100 text-blue-800",
        "bg-emerald-100 text-emerald-800",
        "bg-amber-100 text-amber-800",
        "bg-purple-100 text-purple-800",
        "bg-rose-100 text-rose-800",
    ];
    return colors[(step - 1) % colors.length];
}

function getGridClass(stepCount: number) {
    if (stepCount <= 1) return "grid-cols-1";
    if (stepCount === 2) return "grid-cols-2";
    if (stepCount === 3) return "grid-cols-3";
    return "grid-cols-4";
}

// Sub-component to render the lowest level (Step Metrics)
function StepMetricsGrid({ metrics, maxSteps }: { metrics: StepMetricDetail[], maxSteps: number }) {
    if (!metrics || metrics.length === 0) return null;
    const gridClass = getGridClass(maxSteps);

    return (
        <div className={`p-3 grid ${gridClass} gap-2 bg-white rounded-b-md`}>
            {metrics.sort((a, b) => a.step - b.step).map(stepData => (
                <div key={stepData.step} className="border border-gray-100 rounded-md p-2.5 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                        <Badge className={getStepBadgeColor(stepData.step)} variant="secondary">
                            {stepData.step === 1 ? 'First Email' :
                                stepData.step === 2 ? 'First Follow-up' :
                                    stepData.step === 3 ? 'Second Follow-up' :
                                        `Step ${stepData.step}`}
                        </Badge>
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Opens</span>
                            <span className="font-semibold">{stepData.open_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Clicks</span>
                            <span className="font-semibold">{stepData.click_count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Component to render a City row
function CityRow({ city, maxSteps }: { city: CityGroup, maxSteps: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-gray-100 rounded-md overflow-hidden bg-white shadow-sm">
            <div
                className="px-4 py-2 bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-sm text-gray-800">{city.city}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-700 font-medium">
                        <Eye className="w-3.5 h-3.5" /> {city.total_open_count}
                    </span>
                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                        <MousePointerClick className="w-3.5 h-3.5" /> {city.total_click_count}
                    </span>
                </div>
            </div>
            {expanded && city.step_metrics && (
                <div className="border-t border-gray-100">
                    <StepMetricsGrid metrics={city.step_metrics} maxSteps={maxSteps} />
                </div>
            )}
        </div>
    );
}

// Component to render a Region row (with nested Cities)
function RegionRow({ region, maxSteps }: { region: RegionGroup, maxSteps: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
            <div
                className="px-4 py-2.5 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <span className="font-semibold text-sm text-gray-900">{region.region}</span>
                    {region.parent_country && <span className="text-xs text-gray-400">({region.parent_country})</span>}
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-green-700 font-medium">
                        <Eye className="w-4 h-4" /> {region.total_open_count}
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                        <MousePointerClick className="w-4 h-4" /> {region.total_click_count}
                    </span>
                </div>
            </div>
            {expanded && region.cities && region.cities.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/30 space-y-2">
                    {region.cities.map((city, idx) => (
                        <CityRow key={`${city.city}-${idx}`} city={city} maxSteps={maxSteps} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function LocationInsights({ geoMetrics, loading, maxSteps }: LocationInsightsProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loading />
            </div>
        );
    }

    if (!geoMetrics || geoMetrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Globe className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No location data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full pb-20">
            {geoMetrics.map((item, idx) => {
                // Determine item type based on presence of unique keys
                const isCountry = 'country' in item;
                const isRegion = 'region' in item;
                const isCity = 'city' in item;

                if (isCountry) {
                    const countryItem = item as CountryGroup;
                    return (
                        <Card key={`${countryItem.country}-${idx}`} className="overflow-hidden shadow-sm border border-gray-200 bg-white">
                            <div className="px-5 py-3.5 border-b bg-gray-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Globe className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold text-lg text-gray-900">{countryItem.country}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-green-700 font-medium bg-green-50 px-2.5 py-1 rounded-md">
                                        <Eye className="w-4 h-4" /> {countryItem.total_open_count} <span className="text-xs text-green-600/70 ml-1">opens</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded-md">
                                        <MousePointerClick className="w-4 h-4" /> {countryItem.total_click_count} <span className="text-xs text-blue-600/70 ml-1">clicks</span>
                                    </span>
                                </div>
                            </div>
                            {countryItem.regions && countryItem.regions.length > 0 && (
                                <div className="p-4 space-y-3 bg-white">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Regions</h4>
                                    {countryItem.regions.map((region, rIdx) => (
                                        <RegionRow key={`${region.region}-${rIdx}`} region={region} maxSteps={maxSteps} />
                                    ))}
                                </div>
                            )}
                        </Card>
                    );
                }

                if (isRegion) {
                    const regionItem = item as RegionGroup;
                    return (
                        <Card key={`${regionItem.region}-${idx}`} className="overflow-hidden shadow-sm border border-gray-200">
                            <RegionRow region={regionItem} maxSteps={maxSteps} />
                        </Card>
                    );
                }

                if (isCity) {
                    const cityItem = item as CityGroup;
                    return (
                        <Card key={`${cityItem.city}-${idx}`} className="overflow-hidden shadow-sm border border-gray-200">
                            <CityRow city={cityItem} maxSteps={maxSteps} />
                        </Card>
                    );
                }

                return null;
            })}
        </div>
    );
}
