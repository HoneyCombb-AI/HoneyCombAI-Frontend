"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Eye, MousePointerClick, MapPin, Globe, LinkedinIcon, CalendarClock, Mail, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { PaginatedTrackingGroup } from "@/app/api/analytics/tracking/route";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function EmailAnalyticsPage() {
    const [emailGroups, setEmailGroups] = useState<PaginatedTrackingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters and Pagination State
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageLimit, setPageLimit] = useState<number>(30);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get<{ data: PaginatedTrackingGroup[], pagination: PaginationInfo }>('/api/analytics/tracking', {
                params: {
                    limit: pageLimit,
                    page: currentPage,
                    search: searchTerm
                }
            });
            setEmailGroups(response.data.data || []);
            setPagination(response.data.pagination);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching tracking events:", err);
            setError(err.response?.data?.error || err.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    }, [pageLimit, currentPage, searchTerm]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleSearchSubmit = () => {
        setSearchTerm(searchInput);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleLimitChange = (newLimit: number) => {
        setPageLimit(newLimit);
        setCurrentPage(1);
    };

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-gray-50/50">
            {/* Header/Filter Bar matching EmailFilters style */}
            <div className="p-4 flex flex-col justify-between sm:flex-row items-center gap-4 border-b bg-white shrink-0 z-10 sticky top-0 shadow-sm">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[320px] shrink-0">
                    <Globe
                        onClick={handleSearchSubmit}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:cursor-pointer hover:text-black transition-colors"
                    />
                    <Input
                        placeholder="Search across all activity..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearchSubmit();
                        }}
                        className="pl-9 bg-white w-full h-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-sm h-9">
                                <span>Show {pageLimit}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleLimitChange(30)}>
                                30 per page
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleLimitChange(50)}>
                                50 per page
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleLimitChange(100)}>
                                100 per page
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-gray-400 flex-1">
                    <Loading />
                    <p className="mt-4">Loading analytics...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center p-24 text-gray-500 flex-1">
                    <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-lg text-center border border-red-100 shadow-sm">
                        <p className="font-semibold mb-2 flex items-center justify-center gap-2">
                            <span>⚠️</span> Error loading tracking events
                        </p>
                        <p className="text-sm">{error}</p>
                        <div className="mt-4 pt-4 border-t border-red-200/50">
                            <p className="text-sm mt-1">Try refreshing the page or adjusting your search.</p>
                        </div>
                    </div>
                </div>
            ) : emailGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 text-gray-400 flex-1">
                    <Globe className="w-12 h-12 mb-4 opacity-20" />
                    <p>No tracking activity found matching your criteria.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                        <div className="space-y-6 max-w-5xl mx-auto w-full">
                            <div className="space-y-4">
                                {emailGroups.map((group) => {
                                    // Calculate action aggregates client-side for displaying inside the card
                                    const actionMap = new Map<string, {
                                        count: number;
                                        type: string;
                                        location: string | null;
                                        ip: string;
                                        url: string | null;
                                        last_time: string;
                                    }>();

                                    group.raw_events.forEach(e => {
                                        const actionKey = `${e.event_type}-${e.ip_address}-${e.clicked_url || ''}`;
                                        if (!actionMap.has(actionKey)) {
                                            actionMap.set(actionKey, {
                                                count: 0,
                                                type: e.event_type,
                                                location: e.location || null, // from updated route mapping
                                                ip: e.ip_address,
                                                url: e.clicked_url,
                                                last_time: e.created_at,
                                            });
                                        }
                                        const agg = actionMap.get(actionKey)!;
                                        agg.count += 1;
                                        if (new Date(e.created_at) > new Date(agg.last_time)) {
                                            agg.last_time = e.created_at;
                                        }
                                    });

                                    const aggregatedActions = Array.from(actionMap.values())
                                        .sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());

                                    return (
                                        <Card key={`${group.contact_id}-${group.subject}`} className="overflow-hidden flex flex-col shadow-xs border border-gray-200 bg-white">
                                            {/* Header Section: Left (Contact) / Right (Subject) */}
                                            <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-start justify-between gap-4">

                                                {/* Top Left: Contact Info (No Avatar) */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {group.contact_name}
                                                        </h4>
                                                        {group.contact_linkedin && (
                                                            <a href={group.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:opacity-80">
                                                                <LinkedinIcon className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {group.contact_email}
                                                    </p>
                                                </div>

                                                {/* Top Right: Subject & Sent Date */}
                                                <div className="shrink-0 md:text-right md:max-w-[50%]">
                                                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 md:line-clamp-1">
                                                        {group.subject}
                                                    </p>
                                                    {group.sent_at && (
                                                        <p className="text-xs text-gray-500 font-medium mt-1 md:justify-end flex">
                                                            Originally sent on <span className="ml-1 font-semibold">{format(parseISO(group.sent_at), "MMM d, yyyy 'at' h:mm a")}</span>
                                                        </p>
                                                    )}
                                                </div>

                                            </div>

                                            {/* Tracking Details Grid */}
                                            <div className="px-5 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {aggregatedActions.map((action, idx) => {
                                                        const isOpen = action.type === 'open';
                                                        return (
                                                            <div key={idx} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 shadow-xs text-sm hover:border-gray-200 hover:bg-white transition-colors">
                                                                <div className="flex flex-col space-y-1.5 w-full">
                                                                    <div className="flex items-center gap-2">
                                                                        {isOpen ? (
                                                                            <span className="flex items-center gap-1.5 font-medium text-green-700 bg-green-50/50 px-2 py-0.5 rounded-sm w-fit shrink-0">
                                                                                <Eye className="w-3.5 h-3.5" /> Opened {action.count > 1 ? `${action.count}x` : ''}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center gap-1.5 font-medium text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded-sm w-fit shrink-0">
                                                                                <MousePointerClick className="w-3.5 h-3.5" /> Clicked {action.count > 1 ? `${action.count}x` : ''}
                                                                            </span>
                                                                        )}

                                                                        <span className="text-gray-700 flex items-center gap-1 min-w-0 font-medium">
                                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                                            <span className="truncate" title={action.location || 'Unknown Location'}>
                                                                                {action.location || 'Unknown Location'}
                                                                            </span>
                                                                        </span>
                                                                    </div>

                                                                    {!isOpen && action.url && (
                                                                        <a href={action.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-xs truncate w-full" title={action.url}>
                                                                            {action.url}
                                                                        </a>
                                                                    )}

                                                                    <div className="flex border-t border-gray-100 pt-2 items-center gap-4 text-xs text-gray-600 mt-2 font-medium">
                                                                        <span className="flex items-center gap-1 shrink-0">
                                                                            <CalendarClock className="w-3.5 h-3.5" />
                                                                            {format(parseISO(action.last_time), "MMM d 'at' h:mm a")}
                                                                        </span>
                                                                        <span className="flex items-center gap-1 truncate">
                                                                            <Globe className="w-3.5 h-3.5" />
                                                                            {action.ip || "Unknown IP"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Pagination Controls - Footer Style */}
                    {pagination && pagination.totalPages > 1 && (
                        <footer className="border-t bg-white px-6 py-4 mt-auto shrink-0 z-10 sticky bottom-0 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600">
                                    Showing{" "}
                                    {(pagination.page - 1) * pagination.limit + 1}{" "}
                                    to{" "}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                                    of <span className="font-semibold text-gray-900">{pagination.total}</span> emails
                                </div>

                                <div className="flex items-center gap-2">
                                    {pagination.hasPrev && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className="gap-2"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="hidden sm:inline">Previous</span>
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-1">
                                        {Array.from(
                                            {
                                                length: Math.min(5, pagination.totalPages),
                                            },
                                            (_, i) => {
                                                const pageNum =
                                                    Math.max(
                                                        1,
                                                        Math.min(
                                                            pagination.totalPages - 4,
                                                            Math.max(1, currentPage - 2)
                                                        )
                                                    ) + i;

                                                if (pageNum <= pagination.totalPages) {
                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            variant={pageNum === currentPage ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className="w-8 h-8 p-0"
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                }
                                                return null;
                                            }
                                        )}
                                    </div>
                                    {pagination.hasNext && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className="gap-2"
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                            </div>
                        </footer>
                    )}
                </div>
            )}
        </div>
    );
}
