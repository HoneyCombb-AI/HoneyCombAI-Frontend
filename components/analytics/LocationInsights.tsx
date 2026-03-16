"use client";

import { Eye, MousePointerClick, MapPin, Map, Flag } from "lucide-react";
import { GeolocationGroupItem, CityGroup, RegionGroup, CountryGroup, StepMetricDetail } from "@/types/analytics";
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
// Sub-component to render the lowest level (Step Metrics)
function StepMetricsGrid({ metrics }: { metrics: StepMetricDetail[], maxSteps: number }) {
    if (!metrics || metrics.length === 0) return null;

    const visibleMetrics = metrics.slice().sort((a, b) => a.step - b.step).slice(0, 4);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
            {visibleMetrics.map(stepData => (
                <div
                    key={stepData.step}
                    className="flex flex-col gap-2 w-full h-full p-3 border border-gray-100 rounded-lg bg-white shadow-sm hover:border-gray-200 transition-colors"
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {stepData.step === 1 ? 'First Email' :
                                stepData.step === 2 ? 'First Follow-up' :
                                    stepData.step === 3 ? 'Second Follow-up' :
                                        `Step ${stepData.step}`}
                        </div>
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

// Component to render a City row (Indigo Theme)
function CityRow({ city, maxSteps, valueKey }: { city: CityGroup, maxSteps: number, valueKey: string }) {
    return (
        <AccordionItem value={valueKey} className="bg-white rounded-lg border border-indigo-200 shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
            <AccordionTrigger className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between gap-4 bg-indigo-50/50 hover:no-underline hover:bg-indigo-100/50 transition-colors">
                <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                    <div className="p-2 rounded-lg shrink-0 flex items-center justify-center bg-indigo-100 border border-indigo-200">
                        <MapPin className="w-4 h-4 text-indigo-700" />
                    </div>
                    <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                        <span className="font-semibold text-[14px] text-gray-900 truncate max-w-full">{city.city}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex bg-white border border-indigo-100 rounded-md shadow-sm overflow-hidden">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-indigo-50 flex-1">
                            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{city.total_open_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 flex-1">
                            <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{city.total_click_count}</span>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            {city.step_metrics && (
                <AccordionContent className="border-t border-indigo-100 px-0 py-0 m-0 bg-white">
                    <StepMetricsGrid metrics={city.step_metrics} maxSteps={maxSteps} />
                </AccordionContent>
            )}
        </AccordionItem>
    );
}

// Component to render a Region row (with nested Cities) (Blue Theme)
function RegionRow({ region, maxSteps, valueKey }: { region: RegionGroup, maxSteps: number, valueKey: string }) {
    return (
        <AccordionItem value={valueKey} className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
            <AccordionTrigger className="px-4 py-3 border-b border-blue-100 flex items-center justify-between gap-4 bg-blue-50/50 hover:no-underline hover:bg-blue-100/50 transition-colors">
                <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                    <div className="p-2 rounded-lg shrink-0 flex items-center justify-center bg-blue-100 border border-blue-200">
                        <Map className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px] text-gray-900 truncate max-w-full">{region.region}</span>
                            {region.parent_country && <span className="text-xs text-blue-600 font-medium truncate shrink-0">-{region.parent_country}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex bg-white border border-blue-100 rounded-md shadow-sm overflow-hidden">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-blue-50 flex-1">
                            <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{region.total_open_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1.5 flex-1">
                            <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">{region.total_click_count}</span>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            {region.cities && region.cities.length > 0 && (
                <AccordionContent className="border-t border-blue-100 px-0 py-0 m-0 bg-white">
                    <div className="p-5">
                        <h4 className="text-sm font-semibold text-indigo-700/80 mb-3 px-1 uppercase tracking-wider">Cities</h4>
                        <Accordion type="single" collapsible className="flex flex-col gap-3">
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
        <div className="w-full pb-2">
            <Accordion type="single" collapsible className="space-y-4">
                {geoMetrics.map((item, idx) => {
                    const isCountry = 'country' in item;
                    const isRegion = 'region' in item;
                    const isCity = 'city' in item;

                    // Level 1: Country - Neutral Gray Theme
                    if (isCountry) {
                        const countryItem = item as CountryGroup;
                        return (
                            <AccordionItem key={`country-${countryItem.country}-${idx}`} value={`country-${countryItem.country}-${idx}`} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
                                <AccordionTrigger className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 hover:no-underline bg-white hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                                        <div className="p-2 rounded-lg shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600">
                                            <Flag className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                                            <span className="font-semibold text-[15px] text-gray-900 truncate max-w-full">{countryItem.country}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-1.5 px-3 py-2 border-r border-gray-100 flex-1">
                                                <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="text-sm font-semibold text-gray-700">{countryItem.total_open_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-2 flex-1">
                                                <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="text-sm font-semibold text-gray-700">{countryItem.total_click_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                {countryItem.regions && countryItem.regions.length > 0 && (
                                    <AccordionContent className="border-t border-gray-100 px-0 py-0 m-0 bg-white">
                                        <div className="p-6">
                                            <h4 className="text-sm font-semibold text-blue-700/80 mb-4 px-1 uppercase tracking-wider">Regions</h4>
                                            <Accordion type="single" collapsible className="flex flex-col gap-4">
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
