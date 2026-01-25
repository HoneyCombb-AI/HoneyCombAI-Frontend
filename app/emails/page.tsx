"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { EmailList } from "@/components/emails/EmailList";
import { EmailViewer } from "@/components/emails/EmailViewer";
import { EmailFilters } from "@/components/emails/EmailFilters";
import { EmailComposer } from "@/components/emails/EmailComposer";
import { type EmailsResponse, type ContactEmail } from "@/app/api/emails/route";
import { ContactMessage } from "@/app/api/emails/[contactId]/messages/route";

export default function EmailsPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);

    // Data State
    const [emails, setEmails] = useState<ContactEmail[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [replyToMessage, setReplyToMessage] = useState<ContactMessage | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const [composerHeight, setComposerHeight] = useState(0);
    const [composerRect, setComposerRect] = useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    });

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

    const fetchMessages = useCallback(async (contactId: string) => {
        try {
            setMessageLoading(true);
            setMessageError(null);
            const response = await axios.get(`/api/emails/${contactId}/messages`);
            setMessages(response.data.messages || []);
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                setMessageError(e.response?.data?.error || e.message);
            } else {
                setMessageError(e instanceof Error ? e.message : "Failed to load messages");
            }
            setMessages([]);
        } finally {
            setMessageLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedEmail?.id) {
            fetchMessages(selectedEmail.id);
        } else {
            setMessages([]);
        }
    }, [selectedEmail?.id, fetchMessages]);

    useEffect(() => {
        setReplyToMessage(null);
    }, [selectedId]);

    useEffect(() => {
        if (!composerRef.current) return;
        const element = composerRef.current;
        const updateHeight = () => {
            setComposerHeight(element.getBoundingClientRect().height);
        };
        updateHeight();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => updateHeight());
        observer.observe(element);
        return () => observer.disconnect();
    }, [selectedId, replyToMessage?.id]);

    const updateComposerRect = useCallback(() => {
        if (!viewerRef.current) return;
        const rect = viewerRef.current.getBoundingClientRect();
        setComposerRect({ left: rect.left, width: rect.width });
    }, []);

    useLayoutEffect(() => {
        updateComposerRect();
    }, [updateComposerRect, selectedId]);

    useEffect(() => {
        updateComposerRect();
        window.addEventListener("resize", updateComposerRect);
        return () => window.removeEventListener("resize", updateComposerRect);
    }, [updateComposerRect]);

    useEffect(() => {
        if (!viewerRef.current || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => updateComposerRect());
        observer.observe(viewerRef.current);
        return () => observer.disconnect();
    }, [updateComposerRect]);

    const composerStyle = composerRect.width
        ? { left: composerRect.left, width: composerRect.width }
        : { left: 0, width: "100%" };

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
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden min-h-0">
                    {/* Email List - Independently scrollable */}
                    <div className="border-r bg-white lg:col-span-1 overflow-y-auto h-full min-h-0">
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
                    <div ref={viewerRef} className="lg:col-span-2 overflow-hidden h-full min-h-0 relative">
                        <EmailViewer
                            email={selectedEmail}
                            messages={messages}
                            loading={messageLoading}
                            error={messageError}
                            onReply={setReplyToMessage}
                            bottomInset={composerHeight}
                        />

                        {selectedEmail && (
                            <div
                                ref={composerRef}
                                className="fixed bottom-0 z-50"
                                style={composerStyle}
                            >
                                <EmailComposer
                                    contact={selectedEmail}
                                    replyToMessage={replyToMessage}
                                    lastMessageSubject={messages.length > 0 ? messages[messages.length - 1].subject : undefined}
                                    onSent={() => fetchMessages(selectedEmail.id)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
