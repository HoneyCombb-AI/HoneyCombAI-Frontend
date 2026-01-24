"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { EmailList } from "@/components/emails/EmailList";
import { EmailViewer } from "@/components/emails/EmailViewer";
import { EmailFilters } from "@/components/emails/EmailFilters";
import { type EmailsResponse, type ContactEmail } from "@/app/api/emails/route";

export default function EmailsPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [emails, setEmails] = useState<ContactEmail[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Filter State
    const [search, setSearch] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    // Debounce search so we don't spam API
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchEmails = useCallback(async (isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const currentPage = isLoadMore ? page + 1 : 1;

            const response = await axios.get<EmailsResponse>("/api/emails", {
                params: {
                    search: debouncedSearch.trim() || undefined,
                    tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
                    page: currentPage,
                    limit: LIMIT,
                },
            });

            const result = response.data;

            if (isLoadMore) {
                setEmails(prev => [...prev, ...result.emails]);
                setPage(prev => prev + 1);
            } else {
                setEmails(result.emails);
                setPage(1);
                // Auto-select first email if none selected
                if (result.emails.length > 0 && !selectedId) {
                    setSelectedId(result.emails[0].id);
                }
            }

            setHasMore(result.hasMore);
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                setError(e.response?.data?.error || e.message);
            } else {
                setError(e instanceof Error ? e.message : "Failed to load emails");
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [debouncedSearch, selectedTags, page, selectedId]);

    // Initial Load & Filter Change
    useEffect(() => {
        if (!authLoading) {
            // Reset and fetch when filters change
            fetchEmails(false);
        }
    }, [authLoading, debouncedSearch, selectedTags]); // Removing fetchEmails from dependency to avoid loop if not handled carefully, relying on stable fetchEmails or just these deps

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchEmails(true);
        }
    };

    const selectedEmail = useMemo(
        () => emails.find((e) => e.id === selectedId) || null,
        [emails, selectedId]
    );

    const handleSelectEmail = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-gray-50/50 overflow-hidden">
            {/* Filter Bar - Fixed at top */}
            <div className="flex-shrink-0 border-b bg-white shadow-sm">
                <EmailFilters
                    search={search}
                    onSearchChange={setSearch}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                />
            </div>

            {authLoading || (loading && page === 1) ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">
                        Loading contact emails...
                    </p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
                    {/* Email List - Independently scrollable */}
                    <div className="border-r bg-white lg:col-span-1 overflow-y-auto h-full">
                        <EmailList
                            emails={emails}
                            selectedId={selectedId}
                            onSelectEmail={handleSelectEmail}
                            hasMore={hasMore}
                            onLoadMore={loadMore}
                            loadingMore={loadingMore}
                        />
                    </div>

                    {/* Email Viewer - Independently scrollable */}
                    <div className="lg:col-span-2 overflow-y-auto h-full">
                        <EmailViewer email={selectedEmail} />
                    </div>
                </div>
            )}
        </div>
    );
}
