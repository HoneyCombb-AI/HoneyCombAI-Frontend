"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/components/ui/sidebar";
import { Loading } from "@/components/loading";
import { EmailList } from "@/components/emails/EmailList";
import { EmailViewer } from "@/components/emails/EmailViewer";
import { EmailFilters } from "@/components/emails/EmailFilters";
import { EmailComposer } from "@/components/emails/EmailComposer";
import {
    type EmailsResponse,
    type ContactEmail,
    type ContactMessage,
    type ContactEmailAddress,
    type MessageThread,
    type RejectedApprovalItem,
    type PendingApprovalItem,
    type PendingDraftItem,
} from "@/types/emails";
import { useSearchParams } from "next/navigation";

export default function EmailsPage() {
    const { loading: authLoading } = useAuth();
    const { state: sidebarState } = useSidebar();
    const searchParams = useSearchParams();
    const contactIdParam = searchParams.get('contactId');
    const handledContactIdRef = useRef<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);

    // Data State
    const [emails, setEmails] = useState<ContactEmail[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [replyToMessage, setReplyToMessage] = useState<ContactMessage | null>(null);
    const [contactEmails, setContactEmails] = useState<ContactEmailAddress[]>([]);
    const [pendingDraft, setPendingDraft] = useState<PendingDraftItem | null>(null);
    const [pendingApproval, setPendingApproval] = useState<PendingApprovalItem | null>(null);
    const [rejectedApproval, setRejectedApproval] = useState<RejectedApprovalItem | null>(null);
    const [senderAccountId, setSenderAccountId] = useState<string | null>(null);
    const [senderEmail, setSenderEmail] = useState<string | null>(null);
    const [senderProvider, setSenderProvider] = useState<"gmail" | "outlook" | null>(null);
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
    const [hasReply, setHasReply] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showRejected, setShowRejected] = useState(false);
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const normalized = search.toLowerCase();
        const timer = setTimeout(() => setDebouncedSearch(normalized), 500);
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
                    search: debouncedSearch.trim().toLowerCase() || undefined,
                    tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
                    hasReply: hasReply || undefined,
                    userId: selectedUserId || undefined,
                    showRejected: showRejected || undefined,
                    page: currentPage,
                    limit: LIMIT,
                    _t: Date.now(),
                },
                headers: { 'Cache-Control': 'no-cache' },
            });

            const result = response.data;

            if (isLoadMore) {
                setEmails(prev => [...prev, ...result.emails]);
                setPage(prev => prev + 1);
            } else {
                setEmails(result.emails);
                setPage(1);
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
    }, [debouncedSearch, selectedTags, hasReply, selectedUserId, showRejected, page, selectedId]);

    // Initial Load & Filter Change
    useEffect(() => {
        if (!authLoading) {
            fetchEmails(false);
        }
    }, [authLoading, debouncedSearch, selectedTags, hasReply, selectedUserId, showRejected]);

    // Handle ?contactId= query param — auto-select or inject the contact
    useEffect(() => {
        if (!contactIdParam || authLoading || loading) return;
        if (handledContactIdRef.current === contactIdParam) return;

        const existing = emails.find(e => e.id === contactIdParam);
        if (existing) {
            setEmails(prev => [existing, ...prev.filter(e => e.id !== contactIdParam)]);
            setSelectedId(contactIdParam);
            handledContactIdRef.current = contactIdParam;
            return;
        }

        let cancelled = false;
        const injectContact = async () => {
            try {
                const res = await axios.get('/api/contacts/' + contactIdParam, {
                    headers: { 'Cache-Control': 'no-cache' },
                    params: { _t: Date.now() },
                });
                if (cancelled) return;
                const c = res.data?.contact;
                if (c) {
                    const minimalContact: ContactEmail = {
                        id: c.id,
                        full_name: c.full_name || '',
                        last_message_subject: null,
                        last_interaction_at: null,
                        email_account_id: null,
                        has_pending_approval: false,
                        has_rejected: false,
                        has_draft: false,
                    };
                    setEmails(prev => {
                        if (prev.some(e => e.id === minimalContact.id)) return prev;
                        return [minimalContact, ...prev];
                    });
                    setSelectedId(minimalContact.id);
                }
            } catch { /* contact not found — ignore */ }
            if (!cancelled) handledContactIdRef.current = contactIdParam;
        };
        injectContact();
        return () => { cancelled = true; };
    }, [contactIdParam, authLoading, loading, emails]);

    // Fetch current user's sender account
    useEffect(() => {
        const loadSender = async () => {
            try {
                const res = await axios.get("/api/emails/sender", {
                    headers: { 'Cache-Control': 'no-cache' },
                    params: { _t: Date.now() },
                });
                if (res.data?.isConnected && res.data?.account_id) {
                    setSenderAccountId(res.data.account_id);
                    setSenderEmail(res.data.email ?? null);
                    setSenderProvider(res.data.provider ?? null);
                } else {
                    setSenderAccountId(null);
                    setSenderEmail(null);
                    setSenderProvider(null);
                }
            } catch {
                setSenderAccountId(null);
                setSenderEmail(null);
                setSenderProvider(null);
            }
        };
        loadSender();
    }, []);

    const loadMore = () => {
        if (!loadingMore && hasMore) fetchEmails(true);
    };

    const selectedEmail = useMemo(
        () => emails.find((e) => e.id === selectedId) || null,
        [emails, selectedId]
    );

    const [lastMessage, setLastMessage] = useState<ContactMessage | null>(null);

    const handleSelectEmail = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    const handleThreadSelect = useCallback((message: ContactMessage | null) => {
        setLastMessage(message);
        setReplyToMessage(prev => {
            if (!prev) return null;
            if (!message) return null;

            const prevThreadKey = prev.thread_id ?? prev.id;
            const nextThreadKey = message.thread_id ?? message.id;

            return prevThreadKey === nextThreadKey ? prev : null;
        });
    }, []);

    const fetchMessages = useCallback(async (contactId: string) => {
        try {
            setMessageLoading(true);
            setMessageError(null);
            const response = await axios.get(`/api/emails/${contactId}/messages`, {
                headers: { 'Cache-Control': 'no-cache' },
                params: { _t: Date.now() },
            });

            const draft    = response.data.draft            || null;
            const approval = response.data.pending_approval || null;
            const rejected = response.data.rejected_approval || null;

            const loadedThreads: MessageThread[] = response.data.threads || [];
            setThreads(loadedThreads);
            setContactEmails(response.data.contact_emails || []);

            // Default selected thread to the latest one
            if (loadedThreads.length > 0) {
                const latest = loadedThreads.reduce((a, b) =>
                    new Date(a.last_sent_at) >= new Date(b.last_sent_at) ? a : b
                );
                const msgs = latest.messages;
                setLastMessage(msgs.length > 0 ? msgs[msgs.length - 1] : null);
            } else {
                setLastMessage(null);
            }
            setPendingDraft(draft);
            setPendingApproval(approval);
            setRejectedApproval(rejected);

            // Sync status flags back into the list item
            setEmails(prev => prev.map(e => {
                if (e.id !== contactId) return e;
                return {
                    ...e,
                    has_pending_approval: !!approval,
                    has_rejected: !!rejected,
                    has_draft: !!draft,
                };
            }));
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                setMessageError(e.response?.data?.error || e.message);
            } else {
                setMessageError(e instanceof Error ? e.message : "Failed to load messages");
            }
            setThreads([]);
        } finally {
            setMessageLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedEmail?.id) {
            fetchMessages(selectedEmail.id);
        } else {
            setThreads([]);
        }
    }, [selectedEmail?.id, fetchMessages]);

    const handleDraftSave = useCallback(async (
        draftId: string,
        updates: { subject?: string; body?: string }
    ) => {
        if (!selectedEmail) return;
        await axios.patch(`/api/emails/${selectedEmail.id}/draft`, {
            draft_id: draftId,
            ...updates,
        });
        setPendingDraft(prev => prev ? {
            ...prev,
            subject: updates.subject ?? prev.subject,
            body: updates.body ?? prev.body,
        } : null);
    }, [selectedEmail]);

    const handleResubmit = useCallback(async (data: { subject: string; body: string; contact_email_id: string; contact_email: string; cc: string[]; bcc: string[] }) => {
        if (!selectedEmail || !rejectedApproval) throw new Error("No rejected approval");
        await axios.patch(`/api/emails/${selectedEmail.id}/approval/${rejectedApproval.id}`, data);
        await fetchMessages(selectedEmail.id);
    }, [selectedEmail, rejectedApproval, fetchMessages]);

    const handleDiscard = useCallback(async () => {
        if (!selectedEmail || !rejectedApproval) return;
        await axios.delete(`/api/emails/${selectedEmail.id}/approval/${rejectedApproval.id}`);
        setRejectedApproval(null);
        setEmails(prev => prev.map(e =>
            e.id === selectedEmail.id ? { ...e, has_rejected: false } : e
        ));
    }, [selectedEmail, rejectedApproval]);

    // Clear viewer state on contact change
    useEffect(() => {
        setThreads([]);
        setContactEmails([]);
        setLastMessage(null);
        setReplyToMessage(null);
        setPendingDraft(null);
        setPendingApproval(null);
        setRejectedApproval(null);
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
        const timer = setTimeout(() => updateComposerRect(), 220);
        return () => clearTimeout(timer);
    }, [sidebarState, updateComposerRect]);

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

    const composerStyle: CSSProperties = composerRect.width
        ? { left: composerRect.left, width: composerRect.width }
        : { left: 0, visibility: "hidden", pointerEvents: "none" };

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="text-base font-medium text-red-500">Something went wrong</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-gray-50/50 overflow-hidden">
            <EmailFilters
                search={search}
                onSearchChange={setSearch}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                hasReply={hasReply}
                onHasReplyChange={setHasReply}
                selectedUserId={selectedUserId}
                onUserIdChange={setSelectedUserId}
                showRejected={showRejected}
                onShowRejectedChange={setShowRejected}
            />

            {authLoading || (loading && page === 1) ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">
                        Loading contact emails...
                    </p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 overflow-hidden min-h-0">
                    {/* Email List */}
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

                    {/* Email Viewer */}
                    <div ref={viewerRef} className="lg:col-span-3 overflow-hidden h-full min-h-0 relative">
                        <EmailViewer
                            email={selectedEmail}
                            threads={threads}
                            loading={messageLoading}
                            error={messageError}
                            onReply={setReplyToMessage}
                            onThreadSelect={handleThreadSelect}
                            onDraftSave={handleDraftSave}
                            bottomInset={composerHeight}
                            pendingDraft={pendingDraft}
                            pendingApproval={pendingApproval}
                            rejectedApproval={rejectedApproval}
                            contactEmails={contactEmails}
                            onResubmit={handleResubmit}
                            onDiscard={handleDiscard}
                        />

                        {selectedEmail && (
                            (() => {
                                const isOwnAccount = !selectedEmail.email_account_id || selectedEmail.email_account_id === senderAccountId;
                                if (!isOwnAccount) return null;
                                return (
                                    <div
                                        ref={composerRef}
                                        className="fixed bottom-0 z-50"
                                        style={composerStyle}
                                    >
                                        <EmailComposer
                                            contact={selectedEmail}
                                            contactEmails={contactEmails}
                                            replyToMessage={replyToMessage}
                                            lastMessage={lastMessage}
                                            lastMessageSubject={lastMessage?.subject}
                                            onSent={() => {
                                                fetchMessages(selectedEmail.id);
                                            }}
                                            onClearReply={() => setReplyToMessage(null)}
                                            senderEmail={senderEmail}
                                            senderProvider={senderProvider}
                                            senderAccountId={senderAccountId}
                                        />
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
