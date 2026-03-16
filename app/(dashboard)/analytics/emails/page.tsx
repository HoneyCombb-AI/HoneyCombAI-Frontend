"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { StepMetric, StepContact, GeolocationMetric } from "@/types/analytics";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ActivityFeed } from "@/components/analytics/ActivityFeed";
import { LocationInsights } from "@/components/analytics/LocationInsights";
import { PaginationFooter, PaginationInfo } from "@/components/analytics/PaginationFooter";
import { Loading } from "@/components/loading";

// Get unique countries/cities/regions from geo metrics for filter dropdowns
function extractLocationParts(metrics: GeolocationMetric[]) {
    const countries = new Set<string>();
    const cities = new Set<string>();
    const regions = new Set<string>();

    metrics.forEach(m => {
        const parts = m.location.split(',').map(p => p.trim());
        if (parts.length >= 3) {
            countries.add(parts[2]);
            regions.add(parts[1]);
            cities.add(parts[0]);
        } else if (parts.length === 2) {
            countries.add(parts[1]);
            regions.add(parts[1]);
        } else if (parts.length === 1) {
            countries.add(parts[0]);
        }
    });

    return {
        countries: Array.from(countries).sort(),
        cities: Array.from(cities).sort(),
        regions: Array.from(regions).sort()
    };
}

export default function EmailAnalyticsPage() {
    // State
    const [activeTab, setActiveTab] = useState<'feed' | 'geo'>('feed');

    // Step Metrics State
    const [stepMetrics, setStepMetrics] = useState<StepMetric[]>([]);
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    // Selected Step Contacts State
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [stepContacts, setStepContacts] = useState<StepContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactPagination, setContactPagination] = useState<PaginationInfo | null>(null);
    const [, setContactPage] = useState(1);
    const [contactLimit, setContactLimit] = useState(30);
    const [expandedContact, setExpandedContact] = useState<string | null>(null);

    // Location Insights State
    const [geoMetrics, setGeoMetrics] = useState<GeolocationMetric[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [geoPage, setGeoPage] = useState(1);
    const [geoLimit, setGeoLimit] = useState(30);
    const [geoPagination, setGeoPagination] = useState<PaginationInfo | null>(null);
    const [countryFilter, setCountryFilter] = useState<string>("all");
    const [cityFilter, setCityFilter] = useState<string>("all");
    const [regionFilter, setRegionFilter] = useState<string>("all");

    // Extracted location parts for filters
    const locationParts = useMemo(() => extractLocationParts(geoMetrics), [geoMetrics]);

    // Calculate max steps for dynamic grid
    const maxSteps = useMemo(() => {
        const steps = new Set<number>();
        geoMetrics.forEach(m => steps.add(m.step));
        return steps.size;
    }, [geoMetrics]);

    // Fetch Step Metrics
    const fetchStepMetrics = useCallback(async () => {
        try {
            setLoadingMetrics(true);
            const response = await axios.get<{ data: StepMetric[] }>('/api/analytics/steps');
            const data = response.data.data || [];
            const mappedData = data.map(m => ({
                ...m,
                step_label: m.step_label === 'Initial Email' ? 'First Email' : m.step_label
            }));
            setStepMetrics(mappedData);
        } catch (err: any) {
            console.error("Error fetching step metrics:", err);
        } finally {
            setLoadingMetrics(false);
        }
    }, []);

    // Fetch Contacts for Selected Step
    const fetchStepContacts = useCallback(async (step: number, page: number, limit: number) => {
        try {
            setLoadingContacts(true);
            const response = await axios.get<{ data: StepContact[], pagination: PaginationInfo }>(
                `/api/analytics/steps/${step}`,
                { params: { page, limit } }
            );
            setStepContacts(response.data.data || []);
            setContactPagination(response.data.pagination);
        } catch (err: any) {
            console.error("Error fetching step contacts:", err);
        } finally {
            setLoadingContacts(false);
        }
    }, []);

    // Fetch Location Metrics
    const fetchGeoMetrics = useCallback(async (page: number, limit: number) => {
        try {
            setLoadingGeo(true);
            const params: any = { page, limit };
            if (countryFilter !== "all") params.country = countryFilter;
            if (cityFilter !== "all") params.city = cityFilter;
            if (regionFilter !== "all") params.region = regionFilter;

            // Updated expectation from backend to return data + pagination
            const response = await axios.get<{ data: GeolocationMetric[], pagination?: PaginationInfo }>('/api/analytics/geolocation', { params });
            setGeoMetrics(response.data.data || []);
            if (response.data.pagination) setGeoPagination(response.data.pagination);
            // Optional: fallback fake pagination generation if needed depending on backend state
            else setGeoPagination(null);
        } catch (err: any) {
            console.error("Error fetching geo metrics:", err);
        } finally {
            setLoadingGeo(false);
        }
    }, [countryFilter, cityFilter, regionFilter]);

    // Initial Data Fetch
    useEffect(() => {
        fetchStepMetrics();
    }, [fetchStepMetrics]);

    useEffect(() => {
        fetchGeoMetrics(geoPage, geoLimit);
    }, [fetchGeoMetrics, geoPage, geoLimit]);

    // Handle Step Selection
    const handleStepClick = (step: number) => {
        if (selectedStep === step) {
            setSelectedStep(null);
            setStepContacts([]);
        } else {
            setSelectedStep(step);
            setContactPage(1);
            fetchStepContacts(step, 1, contactLimit);
        }
    };

    // Handle Contact Page Change
    const handleContactPageChange = (newPage: number) => {
        setContactPage(newPage);
        if (selectedStep) {
            fetchStepContacts(selectedStep, newPage, contactLimit);
        }
    };

    // Handle Geo Page Change
    const handleGeoPageChange = (newPage: number) => {
        setGeoPage(newPage);
    };

    // Handle Contact Limit Change
    const handleContactLimitChange = (newLimit: number) => {
        setContactLimit(newLimit);
        setContactPage(1);
        if (selectedStep) {
            fetchStepContacts(selectedStep, 1, newLimit);
        }
    };

    // Handle Geo Limit Change
    const handleGeoLimitChange = (newLimit: number) => {
        setGeoLimit(newLimit);
        setGeoPage(1);
    };

    return (
        <div className="flex flex-1 flex-col w-full bg-gray-50/50 min-w-0 min-h-0">
            {/* Header Bar */}
            <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Tab Select */}
                    <Select value={activeTab} onValueChange={(val) => setActiveTab(val as 'feed' | 'geo')}>
                        <SelectTrigger className="w-[180px] h-9 bg-white">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="feed">Activity Feed</SelectItem>
                            <SelectItem value="geo">Location Insights</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Right side controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {activeTab === 'geo' && (
                        <>
                            <Select value={countryFilter} onValueChange={setCountryFilter}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {locationParts.countries.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={cityFilter} onValueChange={setCityFilter}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="City" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    <SelectItem value="all">All Cities</SelectItem>
                                    {locationParts.cities.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={regionFilter} onValueChange={setRegionFilter}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Region" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    <SelectItem value="all">All Regions</SelectItem>
                                    {locationParts.regions.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </>
                    )}
                    <Select value={activeTab === 'feed' ? contactLimit.toString() : geoLimit.toString()} onValueChange={(val) => {
                        const numVal = parseInt(val);
                        if (activeTab === 'feed') handleContactLimitChange(numVal);
                        else handleGeoLimitChange(numVal);
                    }}>
                        <SelectTrigger className="w-full h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="30">Show 30</SelectItem>
                            <SelectItem value="50">Show 50</SelectItem>
                            <SelectItem value="100">Show 100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Content Area */}
            {loadingMetrics ? (
                <div className="flex-1 bg-white shadow-sm p-6 flex items-center justify-center min-h-0">
                    <Loading />
                </div>
            ) : (
                <div className="flex-1 bg-white shadow-sm p-6 flex flex-col min-h-0">
                    {activeTab === 'geo' ? (
                        <LocationInsights
                            geoMetrics={geoMetrics}
                            loading={loadingGeo}
                            maxSteps={maxSteps}
                        />
                    ) : (
                        <ActivityFeed
                            stepMetrics={stepMetrics}
                            selectedStep={selectedStep}
                            stepContacts={stepContacts}
                            loadingContacts={loadingContacts}
                            contactPagination={contactPagination}
                            expandedContact={expandedContact}
                            onStepClick={handleStepClick}
                            onExpandedChange={setExpandedContact}
                        />
                    )}
                </div>
            )}

            {/* Pagination Footers - Pushed to the bottom */}
            {activeTab === 'feed' && selectedStep && (
                <PaginationFooter
                    pagination={contactPagination}
                    onPageChange={handleContactPageChange}
                />
            )}

            {activeTab === 'geo' && (
                <PaginationFooter
                    pagination={geoPagination}
                    onPageChange={handleGeoPageChange}
                />
            )}
        </div>
    );
}
