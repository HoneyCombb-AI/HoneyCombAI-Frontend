"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { StepMetric, StepContact, GeolocationGroupItem, GeolocationPaginatedResponse } from "@/types/analytics";
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
    const [geoMetrics, setGeoMetrics] = useState<GeolocationGroupItem[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [geoPage, setGeoPage] = useState(1);
    const [geoLimit, setGeoLimit] = useState(30);
    const [geoPagination, setGeoPagination] = useState<PaginationInfo | null>(null);
    const [groupBy, setGroupBy] = useState<'country' | 'region' | 'city'>('country');

    // Store last fetched parameters to prevent duplicate/unnecessary API calls
    const lastFetchedGeoParams = useRef({ page: 0, limit: 0, groupBy: '' });

    // Calculate max steps for dynamic grid
    const maxSteps = useMemo(() => {
        const steps = new Set<number>();
        const extractSteps = (item: any) => {
            if (item.step_metrics) {
                item.step_metrics.forEach((sm: any) => steps.add(sm.step));
            }
            if (item.cities) item.cities.forEach(extractSteps);
            if (item.regions) item.regions.forEach(extractSteps);
        };
        geoMetrics.forEach(extractSteps);
        return steps.size;
    }, [geoMetrics]);

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

            if (mappedData.length > 0) {
                const defaultStep = mappedData.find(m => m.step === 1)?.step || mappedData[0].step;
                setSelectedStep(defaultStep);
                setContactPage(1);
                fetchStepContacts(defaultStep, 1, 30); // 30 is the default contactLimit
            }
        } catch (err: any) {
            console.error("Error fetching step metrics:", err);
        } finally {
            setLoadingMetrics(false);
        }
    }, [fetchStepContacts]);

    // Fetch Location Metrics
    const fetchGeoMetrics = useCallback(async (page: number, limit: number, group: 'country' | 'region' | 'city' = 'country') => {
        try {
            setLoadingGeo(true);
            const params: any = { page, limit, group_by: group };

            const response = await axios.get<GeolocationPaginatedResponse>('/api/analytics/geolocation', { params });
            setGeoMetrics(response.data.data || []);
            setGeoPagination(response.data.pagination || null);
        } catch (err: any) {
            console.error("Error fetching geo metrics:", err);
        } finally {
            setLoadingGeo(false);
        }
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        fetchStepMetrics();
    }, [fetchStepMetrics]);

    useEffect(() => {
        if (activeTab === 'geo') {
            const currentParams = { page: geoPage, limit: geoLimit, groupBy };
            if (
                lastFetchedGeoParams.current.page !== currentParams.page ||
                lastFetchedGeoParams.current.limit !== currentParams.limit ||
                lastFetchedGeoParams.current.groupBy !== currentParams.groupBy
            ) {
                lastFetchedGeoParams.current = currentParams;
                fetchGeoMetrics(currentParams.page, currentParams.limit, currentParams.groupBy);
            }
        }
    }, [fetchGeoMetrics, activeTab, geoPage, geoLimit, groupBy]);

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
            <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-sm">
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
                <div className="flex items-center gap-3">
                    {activeTab === 'geo' && (
                        <Select value={groupBy} onValueChange={(val: any) => {
                            setGroupBy(val);
                            setGeoPage(1); // Reset page on group change
                        }}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Group by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="country">Group: Country</SelectItem>
                                <SelectItem value="region">Group: Region</SelectItem>
                                <SelectItem value="city">Group: City</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Select value={activeTab === 'feed' ? contactLimit.toString() : geoLimit.toString()} onValueChange={(val) => {
                        const numVal = parseInt(val);
                        if (activeTab === 'feed') handleContactLimitChange(numVal);
                        else handleGeoLimitChange(numVal);
                    }}>
                        <SelectTrigger className="w-[120px] h-9">
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
                <div className="flex-1 flex-col  bg-white shadow-sm p-6 flex items-center justify-center min-h-0">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">Loading your Analytics...</p>
                </div>
            ) : (
                <div className="flex-1 bg-white shadow-sm p-6 flex flex-col min-h-0">
                    {activeTab === 'geo' ? (
                        <LocationInsights
                            geoMetrics={geoMetrics}
                            groupBy={groupBy}
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
