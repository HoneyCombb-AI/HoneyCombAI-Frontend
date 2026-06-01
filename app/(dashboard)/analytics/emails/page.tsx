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
import { Button } from "@/components/ui/button";
import { Download, Loader2, Search, X } from "lucide-react";
import { ActivityFeed } from "@/components/analytics/ActivityFeed";
import { LocationInsights } from "@/components/analytics/LocationInsights";
import { PaginationFooter, PaginationInfo } from "@/components/analytics/PaginationFooter";
import { Loading } from "@/components/loading";
import { Input } from "@/components/ui/input";

export default function EmailAnalyticsPage() {
    // State
    const [activeTab, setActiveTab] = useState<'feed' | 'geo'>('feed');

    // Step Metrics State
    const [stepMetrics, setStepMetrics] = useState<StepMetric[]>([]);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected Step Contacts State
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [stepContacts, setStepContacts] = useState<StepContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactPagination, setContactPagination] = useState<PaginationInfo | null>(null);
    const [, setContactPage] = useState(1);
    const [contactLimit, setContactLimit] = useState(30);
    const [expandedContact, setExpandedContact] = useState<string | null>(null);
    const [contactSearch, setContactSearch] = useState("");

    // Location Insights State
    const [geoMetrics, setGeoMetrics] = useState<GeolocationGroupItem[]>([]);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [geoPage, setGeoPage] = useState(1);
    const [geoLimit, setGeoLimit] = useState(30);
    const [geoPagination, setGeoPagination] = useState<PaginationInfo | null>(null);
    const [groupBy, setGroupBy] = useState<'country' | 'region' | 'city'>('country');

    // Export State
    const [exportLoading, setExportLoading] = useState(false);

    const normalizedContactSearch = contactSearch.trim().toLowerCase();
    const hasContactSearch = normalizedContactSearch.length > 0;
    const filteredStepContacts = useMemo(() => {
        if (!normalizedContactSearch) return stepContacts;

        return stepContacts.filter((contact) => {
            const name = contact.contact_name?.toLowerCase() || "";
            const email = contact.contact_email?.toLowerCase() || "";
            return name.includes(normalizedContactSearch) || email.includes(normalizedContactSearch);
        });
    }, [stepContacts, normalizedContactSearch]);

    const handleClearContactSearch = useCallback(() => {
        setContactSearch("");
    }, []);

    // Store last fetched parameters to prevent duplicate/unnecessary API calls
    const lastFetchedGeoParams = useRef({ page: 0, limit: 0, groupBy: '' });

    // AbortController refs to cancel in-flight requests
    const contactAbortRef = useRef<AbortController | null>(null);
    const geoAbortRef = useRef<AbortController | null>(null);


    // Fetch Contacts for Selected Step
    const fetchStepContacts = useCallback(async (step: number, page: number, limit: number) => {
        // Cancel any previous in-flight request
        contactAbortRef.current?.abort();
        const controller = new AbortController();
        contactAbortRef.current = controller;

        try {
            setLoadingContacts(true);
            const response = await axios.get<{ data: StepContact[], pagination: PaginationInfo }>(
                `/api/analytics/steps/${step}`,
                { params: { page, limit }, signal: controller.signal }
            );
            setStepContacts(response.data.data || []);
            setContactPagination(response.data.pagination);
        } catch (err: any) {
            if (axios.isCancel(err)) return; // Stale request — ignore
            console.error("Error fetching step contacts:", err);
        } finally {
            // Only clear loading if this controller is still the active one
            if (contactAbortRef.current === controller) {
                setLoadingContacts(false);
            }
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
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || err.message);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load analytics');
            }
        } finally {
            setLoadingMetrics(false);
        }
    }, [fetchStepContacts]);

    // Fetch Location Metrics
    const fetchGeoMetrics = useCallback(async (page: number, limit: number, group: 'country' | 'region' | 'city' = 'country') => {
        // Cancel any previous in-flight request
        geoAbortRef.current?.abort();
        const controller = new AbortController();
        geoAbortRef.current = controller;

        try {
            setLoadingGeo(true);
            const params: any = { page, limit, group_by: group };

            const response = await axios.get<GeolocationPaginatedResponse>('/api/analytics/geolocation', { params, signal: controller.signal });
            setGeoMetrics(response.data.data || []);
            setGeoPagination(response.data.pagination || null);
            return true; // Signal success so the caller can advance lastFetchedGeoParams
        } catch (err: any) {
            if (axios.isCancel(err)) return false; // Stale request — ignore
            console.error("Error fetching geo metrics:", err);
            return false; // Failed — caller should NOT advance lastFetchedGeoParams
        } finally {
            // Only clear loading if this controller is still the active one
            if (geoAbortRef.current === controller) {
                setLoadingGeo(false);
            }
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
                // Only advance the cache after a successful response so that
                // failed requests can be retried with the same params.
                fetchGeoMetrics(currentParams.page, currentParams.limit, currentParams.groupBy)
                    .then((succeeded) => {
                        if (succeeded) {
                            lastFetchedGeoParams.current = currentParams;
                        }
                    });
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
        if (selectedStep !== null) {
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
        if (selectedStep !== null) {
            fetchStepContacts(selectedStep, 1, newLimit);
        }
    };

    // Handle Geo Limit Change
    const handleGeoLimitChange = (newLimit: number) => {
        setGeoLimit(newLimit);
        setGeoPage(1);
    };

    // Handle CSV Export
    const handleExport = async () => {
        try {
            setExportLoading(true);
            const response = await axios.get('/api/analytics/export', { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `email-analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col w-full bg-gray-50/50 min-w-0 min-h-0">
            {error ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-base font-medium text-red-500">Something went wrong</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            ) : (<>
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

                        {activeTab === 'feed' && (
                            <>
                                <div className="relative w-[260px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={contactSearch}
                                        onChange={(event) => setContactSearch(event.target.value)}
                                        placeholder="Search name or email"
                                        className="h-9 pl-9 bg-white"
                                    />
                                </div>
                                {hasContactSearch && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearContactSearch}
                                        className="gap-2 text-gray-500"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="hidden sm:inline">Clear</span>
                                    </Button>
                                )}
                            </>
                        )}
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={exportLoading}
                            className="h-9 gap-2"
                        >
                            {exportLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Main Content Area — each tab uses its own loading state */}
                <div className="flex-1 bg-white shadow-sm p-6 flex flex-col min-h-0">
                    {activeTab === 'geo' ? (
                        // Geo tab is independent of step-metrics; uses its own loadingGeo state
                        <LocationInsights
                            geoMetrics={geoMetrics}
                            groupBy={groupBy}
                            loading={loadingGeo}
                        />
                    ) : (
                        // Feed tab depends on step metrics — show spinner until ready
                        loadingMetrics ? (
                            <div className="flex flex-1 flex-col items-center justify-center">
                                <Loading />
                                <p className="text-sm text-muted-foreground mt-4">Loading your Analytics...</p>
                            </div>
                        ) : (
                            <ActivityFeed
                                stepMetrics={stepMetrics}
                                selectedStep={selectedStep}
                                stepContacts={filteredStepContacts}
                                loadingContacts={loadingContacts}
                                contactPagination={contactPagination}
                                expandedContact={expandedContact}
                                onStepClick={handleStepClick}
                                onExpandedChange={setExpandedContact}
                                isFilteringContacts={hasContactSearch}
                            />
                        )
                    )}
                </div>

                {/* Pagination Footers - Pushed to the bottom */}
                {activeTab === 'feed' && selectedStep !== null && (
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
            </>
            )}
        </div>
    );
}
