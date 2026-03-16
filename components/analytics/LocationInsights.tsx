"use client";

import { Eye, MousePointerClick, MapPin, Map, Flag } from "lucide-react";
import { GeolocationGroupItem, CityGroup, RegionGroup, CountryGroup, StepMetricDetail } from "@/types/analytics";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

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
    if (stepCount === 2) return "grid-cols-2 lg:grid-cols-2";
    if (stepCount === 3) return "grid-cols-1 md:grid-cols-3 lg:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
}

// Sub-component to render the lowest level (Step Metrics)
function StepMetricsGrid({ metrics, maxSteps }: { metrics: StepMetricDetail[], maxSteps: number }) {
    if (!metrics || metrics.length === 0) return null;
    const gridClass = getGridClass(maxSteps);

    return (
        <div className={`grid ${gridClass} gap-4 p-5`}>
            {metrics.sort((a, b) => a.step - b.step).map(stepData => (
                <div key={stepData.step} className="flex flex-col gap-2 w-full h-full p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors bg-white/50 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <Badge className={getStepBadgeColor(stepData.step)} variant="secondary">
                            {stepData.step === 1 ? 'First Email' :
                                stepData.step === 2 ? 'First Follow-up' :
                                    stepData.step === 3 ? 'Second Follow-up' :
                                        `Step ${stepData.step}`}
                        </Badge>
                    </div>
                    <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between text-[15px]">
                            <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-emerald-600" /> Opens
                            </span>
                            <span className="font-semibold text-gray-900">{stepData.open_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-[15px]">
                            <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                <MousePointerClick className="w-4 h-4 text-blue-600" /> Clicks
                            </span>
                            <span className="font-semibold text-gray-900">{stepData.click_count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Component to render a City row
function CityRow({ city, maxSteps, valueKey }: { city: CityGroup, maxSteps: number, valueKey: string }) {
    return (
        <AccordionItem value={valueKey} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
            <AccordionTrigger className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white hover:no-underline">
                <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                    <div className="p-2 rounded-lg shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200">
                        <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                        <span className="font-semibold text-[14px] text-gray-900 truncate max-w-full">{city.city}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex bg-white border rounded-md shadow-sm overflow-hidden">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-gray-100 bg-gray-50/50">
                            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{city.total_open_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50/50">
                            <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{city.total_click_count}</span>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            {city.step_metrics && (
                <AccordionContent className="border-t border-gray-100 px-0 py-0 m-0 bg-gray-50/50">
                    <StepMetricsGrid metrics={city.step_metrics} maxSteps={maxSteps} />
                </AccordionContent>
            )}
        </AccordionItem>
    );
}

// Component to render a Region row (with nested Cities)
function RegionRow({ region, maxSteps, valueKey }: { region: RegionGroup, maxSteps: number, valueKey: string }) {
    return (
        <AccordionItem value={valueKey} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
            <AccordionTrigger className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white hover:no-underline">
                <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                    <div className="p-2 rounded-lg shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200">
                        <Map className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px] text-gray-900 truncate max-w-full">{region.region}</span>
                            {region.parent_country && <span className="text-xs text-gray-500 font-medium truncate shrink-0">({region.parent_country})</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex bg-white border rounded-md shadow-sm overflow-hidden">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-gray-100 bg-gray-50/50">
                            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{region.total_open_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50/50">
                            <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{region.total_click_count}</span>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            {region.cities && region.cities.length > 0 && (
                <AccordionContent className="border-t border-gray-100 px-0 py-0 m-0">
                    <div className="p-4 bg-gray-50/80">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 px-1">Cities</h4>
                        <Accordion type="multiple" className="flex flex-col gap-3">
                            {region.cities.map((city, idx) => (
                                <CityRow key={`${city.city}-${idx}`} city={city} maxSteps={maxSteps} valueKey={`city-${city.city}-${idx}`} />
                            ))}
                        </Accordion>
                    </div>
                </AccordionContent>
            )}
        </AccordionItem>
    );
}

export function LocationInsights({ geoMetrics, loading, maxSteps }: LocationInsightsProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loading />
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
        <div className="w-full pb-2">
            <Accordion type="multiple" className="space-y-2">
                {geoMetrics.map((item, idx) => {
                    const isCountry = 'country' in item;
                    const isRegion = 'region' in item;
                    const isCity = 'city' in item;

                    if (isCountry) {
                        const countryItem = item as CountryGroup;
                        return (
                            <AccordionItem key={`country-${countryItem.country}-${idx}`} value={`country-${countryItem.country}-${idx}`} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
                                <AccordionTrigger className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white hover:no-underline rounded-t-lg">
                                    <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                                        <div className="p-2 rounded-lg shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200">
                                            <Flag className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                                            <span className="font-semibold text-[15px] text-gray-900 truncate max-w-full">{countryItem.country}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex bg-white border rounded-md shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-gray-100 bg-gray-50/50">
                                                <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="text-sm font-semibold text-gray-700">{countryItem.total_open_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50/50">
                                                <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="text-sm font-semibold text-gray-700">{countryItem.total_click_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                {countryItem.regions && countryItem.regions.length > 0 && (
                                    <AccordionContent className="border-t border-gray-100 px-0 py-0 m-0">
                                        <div className="px-5 pb-5 pt-4 bg-gray-50/80">
                                            <h4 className="text-sm font-medium text-gray-700 mb-4 px-1">Regions</h4>
                                            <Accordion type="multiple" className="flex flex-col gap-3">
                                                {countryItem.regions.map((region, rIdx) => (
                                                    <RegionRow key={`${region.region}-${rIdx}`} region={region} maxSteps={maxSteps} valueKey={`region-${region.region}-${rIdx}`} />
                                                ))}
                                            </Accordion>
                                        </div>
                                    </AccordionContent>
                                )}
                            </AccordionItem>
                        );
                    }

                    if (isRegion) {
                        const regionItem = item as RegionGroup;
                        return <RegionRow key={`root-region-${regionItem.region}-${idx}`} region={regionItem} maxSteps={maxSteps} valueKey={`root-region-${regionItem.region}-${idx}`} />;
                    }

                    if (isCity) {
                        const cityItem = item as CityGroup;
                        return <CityRow key={`root-city-${cityItem.city}-${idx}`} city={cityItem} maxSteps={maxSteps} valueKey={`root-city-${cityItem.city}-${idx}`} />;
                    }

                    return null;
                })}
            </Accordion>
        </div>
    );
}
