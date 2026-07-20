"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { StepMetric, StepContact, GeolocationGroupItem, GeolocationPaginatedResponse, CampaignListItem } from "@/types/analytics";
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
import { DatePicker } from "@/components/ui/date-picker";

export default function EmailAnalyticsPage() {
    // State
    const [activeTab, setActiveTab] = useState<'feed' | 'geo'>('feed');

    // Filter State
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [campaignId, setCampaignId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);

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

    // Search expand/collapse
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    // Fetch campaigns list on mount
    useEffect(() => {
        async function fetchCampaigns() {
            try {
                const response = await axios.get<{ data: CampaignListItem[] }>('/api/campaigns/list');
                setCampaigns(response.data.data || []);
            } catch (err) {
                console.error('Failed to load campaigns:', err);
            }
        }
        fetchCampaigns();
    }, []);

    // Store last fetched parameters to prevent duplicate/unnecessary API calls
    const lastFetchedGeoParams = useRef({ page: 0, limit: 0, groupBy: '' });

    // AbortController refs to cancel in-flight requests
    const contactAbortRef = useRef<AbortController | null>(null);
    const geoAbortRef = useRef<AbortController | null>(null);


    // Fetch Contacts for Selected Step
    const fetchStepContacts = useCallback(async (step: number, page: number, limit: number, filters?: { start_date?: string; end_date?: string; campaign_id?: string; status?: string }) => {
        // Cancel any previous in-flight request
        contactAbortRef.current?.abort();
        const controller = new AbortController();
        contactAbortRef.current = controller;

        try {
            setLoadingContacts(true);
            const params: Record<string, any> = { page, limit };
            if (filters?.start_date) params.start_date = filters.start_date;
            if (filters?.end_date) params.end_date = filters.end_date;
            if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
            if (filters?.status) params.status = filters.status;

            const response = await axios.get<{ data: StepContact[], pagination: PaginationInfo }>(
                `/api/analytics/steps/${step}`,
                { params, signal: controller.signal }
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

    // Build filter params object
    const buildFilterParams = useCallback(() => {
        const filters: Record<string, string> = {};
        if (startDate) filters.start_date = startDate;
        if (endDate) filters.end_date = endDate;
        if (campaignId) filters.campaign_id = campaignId;
        if (statusFilter) filters.status = statusFilter;
        return filters;
    }, [startDate, endDate, campaignId, statusFilter]);

    // Fetch Step Metrics
    const fetchStepMetrics = useCallback(async () => {
        try {
            setLoadingMetrics(true);
            const params = buildFilterParams();
            const response = await axios.get<{ data: StepMetric[] }>('/api/analytics/steps', { params });
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
                fetchStepContacts(defaultStep, 1, 30, params);
            } else {
                setSelectedStep(null);
                setStepContacts([]);
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
    }, [fetchStepContacts, buildFilterParams]);

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

    // Refetch when filters or tab change
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
            fetchStepContacts(step, 1, contactLimit, buildFilterParams());
        }
    };

    // Handle Contact Page Change
    const handleContactPageChange = (newPage: number) => {
        setContactPage(newPage);
        if (selectedStep !== null) {
            fetchStepContacts(selectedStep, newPage, contactLimit, buildFilterParams());
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
            fetchStepContacts(selectedStep, 1, newLimit, buildFilterParams());
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
                {/* Header Bar — single row */}
                <div className="sticky top-0 z-40 flex items-center gap-2 border-b bg-white px-6 py-3 shadow-sm">
                    {/* Left group */}
                    <Select value={activeTab} onValueChange={(val) => setActiveTab(val as 'feed' | 'geo')}>
                        <SelectTrigger className="w-[150px] h-9 bg-white shrink-0">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="feed">Activity Feed</SelectItem>
                            <SelectItem value="geo">Location Insights</SelectItem>
                        </SelectContent>
                    </Select>

                    {activeTab === 'feed' && (
                        <>
                            <Select value={campaignId || 'all'} onValueChange={(val) => setCampaignId(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-[160px] h-9 bg-white shrink-0">
                                    <SelectValue placeholder="All Emails" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    <SelectItem value="all">All Emails</SelectItem>
                                    {campaigns.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <DatePicker
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="Start date"
                                className="shrink-0"
                            />
                            <DatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="End date"
                                className="shrink-0"
                            />

                            <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                                <SelectTrigger className="w-[140px] h-9 bg-white shrink-0">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="opened">Opened</SelectItem>
                                    <SelectItem value="clicked">Clicked</SelectItem>
                                    <SelectItem value="bounced">Bounced</SelectItem>
                                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                                </SelectContent>
                            </Select>

                            {(startDate || endDate || campaignId || statusFilter) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setStartDate(''); setEndDate(''); setCampaignId(''); setStatusFilter(''); }}
                                    className="h-9 w-9 shrink-0 text-gray-400 hover:text-gray-600"
                                    title="Clear filters"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}

                            {/* Expandable search */}
                            {searchOpen ? (
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        ref={searchInputRef}
                                        value={contactSearch}
                                        onChange={(event) => setContactSearch(event.target.value)}
                                        onBlur={() => { if (!contactSearch) setSearchOpen(false); }}
                                        placeholder="Search name or email"
                                        className="h-9 w-[200px] pl-9 bg-white"
                                        autoFocus
                                    />
                                    {hasContactSearch && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => { setContactSearch(''); setSearchOpen(false); }}
                                            className="h-7 w-7 ml-1 text-gray-400"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSearchOpen(true)}
                                    className="h-9 w-9 shrink-0"
                                    title="Search contacts"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}

                    {activeTab === 'geo' && (
                        <Select value={groupBy} onValueChange={(val: any) => {
                            setGroupBy(val);
                            setGeoPage(1);
                        }}>
                            <SelectTrigger className="h-9 shrink-0">
                                <SelectValue placeholder="Group by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="country">Group: Country</SelectItem>
                                <SelectItem value="region">Group: Region</SelectItem>
                                <SelectItem value="city">Group: City</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {/* Right side — pushed to end */}
                    <div className="flex items-center gap-2 ml-auto shrink-0">
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
