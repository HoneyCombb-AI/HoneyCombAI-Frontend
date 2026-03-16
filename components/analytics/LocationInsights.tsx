"use client";

import { Eye, MousePointerClick, MapPin, Globe } from "lucide-react";
import { GeolocationMetric } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading";

interface LocationGroup {
    location: string;
    total_opens: number;
    total_clicks: number;
    steps: GeolocationMetric[];
}

interface LocationInsightsProps {
    geoMetrics: GeolocationMetric[];
    loading: boolean;
    maxSteps: number; // Dynamic grid columns based on total steps across all locations
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

export function LocationInsights({ geoMetrics, loading, maxSteps }: LocationInsightsProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loading />
            </div>
        );
    }

    if (geoMetrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Globe className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No location data available</p>
            </div>
        );
    }

    // Group by location
    const locationGroups: Record<string, LocationGroup> = {};
    geoMetrics.forEach(m => {
        if (!locationGroups[m.location]) {
            locationGroups[m.location] = { location: m.location, total_opens: 0, total_clicks: 0, steps: [] };
        }
        locationGroups[m.location].total_opens += m.open_count;
        locationGroups[m.location].total_clicks += m.click_count;
        locationGroups[m.location].steps.push(m);
    });

    const sortedLocations = Object.entries(locationGroups)
        .sort((a, b) => (b[1].total_opens + b[1].total_clicks) - (a[1].total_opens + a[1].total_clicks));

    const gridClass = getGridClass(maxSteps);

    return (
        <div className="space-y-3 max-w-6xl mx-auto pb-20">
            {sortedLocations.map(([location, data]) => (
                <Card key={location} className="overflow-hidden shadow-sm border border-gray-200 bg-white">
                    <div className="px-4 py-2.5 border-b bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1.5 text-green-700">
                                <Eye className="w-4 h-4" /> {data.total_opens}
                            </span>
                            <span className="flex items-center gap-1.5 text-blue-700">
                                <MousePointerClick className="w-4 h-4" /> {data.total_clicks}
                            </span>
                        </div>
                    </div>
                    <div className={`p-3 grid ${gridClass} gap-2`}>
                        {data.steps.sort((a, b) => a.step - b.step).map(stepData => (
                            <div key={stepData.step} className="border border-gray-100 rounded-md p-2.5 bg-gray50/30">
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
                </Card>
            ))}
        </div>
    );
}
