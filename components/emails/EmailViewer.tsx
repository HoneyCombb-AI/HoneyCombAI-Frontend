"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContactEmail, ContactMessage, MessageThread, PendingApprovalItem, PendingDraftItem, RejectedApprovalItem } from "@/types/emails";
import { Info, Mail, Reply } from "lucide-react";
import { ScaledEmailPreview } from "./ScaledEmailPreview";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { EmailStatusBanner } from "./EmailStatusBanner";
import type { ResubmitData } from "./EmailStatusBanner";
import DOMPurify from "dompurify";

interface EmailViewerProps {
    email: ContactEmail | null;
    threads: MessageThread[];
    loading: boolean;
    error: string | null;
    onReply: (message: ContactMessage) => void;
    onThreadSelect?: (message: ContactMessage | null) => void;
    onDraftSave?: (draftId: string, updates: { subject?: string; body?: string }) => Promise<void>;
    bottomInset?: number;
    pendingDraft?: PendingDraftItem | null;
    pendingApproval?: PendingApprovalItem | null;
    rejectedApproval?: RejectedApprovalItem | null;
    contactEmails?: import("@/types/emails").ContactEmailAddress[];
    onResubmit?: (data: ResubmitData) => Promise<void>;
    onDiscard?: () => Promise<void>;
}

function threadKey(thread: MessageThread, idx: number): string {
    return thread.thread_id ?? thread.messages[0]?.id ?? String(idx);
}

// ── Expanded message panel ───────────────────────────────────────────────────

interface MessagePanelProps {
    message: ContactMessage;
    isExpanded: boolean;
    onToggle: () => void;
    onReply: (message: ContactMessage) => void;
}

function MessagePanel({ message, isExpanded, onToggle, onReply }: MessagePanelProps) {
    const isSent = message.direction === "outbound";
    const rawBody = (message.body || "").trim();
    const isHtml = /<[a-z][\s\S]*>/i.test(rawBody);
    const isFullHtml = /<(html|body|table|doctype)[\s>]/i.test(rawBody);
    const sanitizedBody = DOMPurify.sanitize(rawBody);
    const plainPreview = rawBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);

    return (
        <div className={`rounded-lg overflow-hidden text-sm border max-w-[75%] ${isSent
                ? "ml-auto border-blue-200 bg-blue-50/20"
                : "border-gray-200 bg-white"
            }`}>
            {!isExpanded && (
                <button
                    type="button"
                    onClick={onToggle}
                    className={`w-full flex items-center px-3 py-2.5 text-left transition-colors ${isSent ? "hover:bg-blue-50/40" : "hover:bg-gray-50"
                        }`}
                >
                    <span className={`text-xs truncate flex-1 ${isSent ? "text-blue-700" : "text-gray-500"}`}>
                        {plainPreview || <span className="italic opacity-50">No content</span>}
                    </span>
                </button>
            )}

            {isExpanded && (
                <div className={`space-y-3 ${isSent ? "border-blue-100" : "border-gray-100"}`}>
                    <div className={`overflow-hidden ${(!isHtml || !isFullHtml) ? "px-4 pt-3" : ""}`}>
                        {isHtml ? (
                            <ScaledEmailPreview html={sanitizedBody} />
                        ) : (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
                                {rawBody || <span className="italic text-gray-400">No content</span>}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-gray-100">
                        {message.replied_at ? (
                            <span className="text-xs text-gray-400">
                                ✓ Replied {format(new Date(message.replied_at), "MMM d, h:mm a")}
                            </span>
                        ) : <span />}
                        {!isSent && (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onReply(message); }}
                                className="h-7 px-3 text-xs gap-1.5 cursor-pointer"
                            >
                                <Reply className="h-3 w-3" />
                                Reply
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Thread row (circle + line design) ───────────────────────────────────────

interface ThreadRowProps {
    thread: MessageThread;
    isOpen: boolean;
    onToggle: () => void;
    onReply: (message: ContactMessage) => void;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
}

function ThreadRow({ thread, isOpen, onToggle, onReply, scrollRef }: ThreadRowProps) {
    const msgs = thread.messages;
    const lastMsg = msgs[msgs.length - 1];

    const senderName = msgs.find(m => m.direction === "outbound")?.sender_name
        || msgs.find(m => m.direction === "outbound")?.sender_email
        || "You";
    const contactName = msgs.find(m => m.direction === "inbound")?.contact_email
        || thread.messages[0]?.contact_email
        || "";

    const threadCc = Array.from(new Set(
        msgs.flatMap(m => (m.direction === "outbound" && m.cc?.length) ? m.cc : [])
    ));

    const [expandedIds, setExpandedIds] = useState<Set<string>>(
        () => new Set(lastMsg ? [lastMsg.id] : [])
    );
    const [showMiddle, setShowMiddle] = useState(false);

    const toggleMessage = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    useEffect(() => {
        if (isOpen) {
            setExpandedIds(new Set(lastMsg ? [lastMsg.id] : []));
            setShowMiddle(false);
        }
    }, [isOpen, lastMsg?.id]);

    const renderMessages = () => {
        if (msgs.length <= 3) {
            return msgs.map(m => (
                <MessagePanel
                    key={m.id}
                    message={m}
                    isExpanded={expandedIds.has(m.id)}
                    onToggle={() => toggleMessage(m.id)}
                    onReply={onReply}
                />
            ));
        }

        const first = msgs[0];
        const middle = msgs.slice(1, msgs.length - 1);
        const last = msgs[msgs.length - 1];

        return (
            <>
                <MessagePanel
                    key={first.id}
                    message={first}
                    isExpanded={expandedIds.has(first.id)}
                    onToggle={() => toggleMessage(first.id)}
                    onReply={onReply}
                />
                {showMiddle ? (
                    middle.map(m => (
                        <MessagePanel
                            key={m.id}
                            message={m}
                            isExpanded={expandedIds.has(m.id)}
                            onToggle={() => toggleMessage(m.id)}
                            onReply={onReply}
                        />
                    ))
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowMiddle(true)}
                        className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 flex items-center gap-2 transition-colors"
                    >
                        <span className="flex gap-0.5">
                            {[0, 1, 2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-gray-400 inline-block" />)}
                        </span>
                        {middle.length} more {middle.length === 1 ? "message" : "messages"}
                    </button>
                )}
                <MessagePanel
                    key={last.id}
                    message={last}
                    isExpanded={expandedIds.has(last.id)}
                    onToggle={() => toggleMessage(last.id)}
                    onReply={onReply}
                />
            </>
        );
    };

    const subject = thread.subject || "No subject";

    return (
        <div ref={scrollRef}>
            <button
                type="button"
                onClick={onToggle}
                className="w-full group cursor-pointer text-left"
            >
                <div className="relative h-11">
                    {/* Line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
                        <div className="w-10 shrink-0" />
                        <div className={`flex-1 h-[1.5px] transition-colors ${isOpen ? "bg-gray-900" : "bg-gray-300 group-hover:bg-gray-600"}`} />
                    </div>

                    {/* Circle */}
                    <div className={`
                        absolute left-1 top-1/2 -translate-y-1/2
                        w-8 h-8 rounded-full border-2 bg-white
                        flex items-center justify-center transition-colors z-10
                        ${isOpen ? "border-gray-900 text-gray-800" : "border-gray-400 text-gray-500 group-hover:border-gray-800 group-hover:text-gray-800"}
                    `}>
                        <span className="text-xs font-bold leading-none">{msgs.length}</span>
                    </div>

                    {/* Above line: Sent via (left) + Date (right) */}
                    <div className="absolute left-14 right-0 bottom-1/2 mb-1.5 flex items-end justify-between gap-2">
                        <div className="flex items-end gap-1.5 min-w-0">
                            <span className="text-xs leading-none text-gray-400 shrink-0">Sent via</span>
                            <span className="text-xs font-semibold leading-none text-gray-800 group-hover:text-black transition-colors truncate">
                                {senderName}
                            </span>
                        </div>
                        {lastMsg && (
                            <span className="text-xs leading-none text-gray-800 font-medium shrink-0">
                                {format(new Date(lastMsg.sent_at), "MMM d, h:mm a")}
                            </span>
                        )}
                    </div>

                    {/* Below line: Subject + CC icon (left) + contact email (right) */}
                    <div className="absolute left-14 right-0 top-1/2 mt-1.5 flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-medium leading-none text-gray-800 group-hover:text-gray-800 transition-colors truncate">
                                {subject}
                            </span>
                            {threadCc.length > 0 && (
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                                        <span className="shrink-0 cursor-default">
                                            <Info className={`h-3 w-3 transition-colors ${isOpen ? "text-gray-700 hover:text-gray-900" : "text-gray-400 hover:text-gray-600"}`} />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="bg-white border border-gray-200 text-gray-700 shadow-md max-w-[260px] [&>svg]:fill-white [&>svg]:stroke-gray-200"
                                    >
                                        <p className="text-xs font-semibold mb-1 text-gray-500">CC</p>
                                        <div className="pb-1.5">
                                            {threadCc.map(email => (
                                                <p key={email} className="text-xs text-gray-700">{email}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                        {contactName && (
                            <span className="text-xs font-medium leading-none text-blue-500 group-hover:text-blue-600 transition-colors shrink-0">
                                {contactName}
                            </span>
                        )}
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="pl-14 mt-4 space-y-2">
                    {renderMessages()}
                </div>
            )}
        </div>
    );
}

// ── EmailViewer ───────────────────────────────────────────────────────────────

export function EmailViewer({
    email,
    threads,
    loading,
    error,
    onReply,
    onThreadSelect,
    onDraftSave,
    bottomInset = 0,
    pendingDraft = null,
    pendingApproval = null,
    rejectedApproval = null,
    contactEmails = [],
    onResubmit,
    onDiscard,
}: EmailViewerProps) {
    const lastThreadKey = useMemo(() => {
        if (threads.length === 0) return null;
        const latest = threads.reduce((a, b) =>
            new Date(a.last_sent_at) >= new Date(b.last_sent_at) ? a : b
        );
        return threadKey(latest, threads.indexOf(latest));
    }, [threads]);

    const SCROLL_TOP_OFFSET = 15; // px breathing room from top edge

    const [openKey, setOpenKey] = useState<string | null>(lastThreadKey);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [scrollAreaHeight, setScrollAreaHeight] = useState(0);
    const [lastThreadHeight, setLastThreadHeight] = useState(0);

    // Dynamically track scroll container height — re-init when email appears (scroll container mounts)
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const update = () => setScrollAreaHeight(el.clientHeight);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [!!email]);

    // Dynamically track the last thread's height so the spacer adapts
    useEffect(() => {
        const el = bottomRef.current;
        if (!el) { setLastThreadHeight(0); return; }
        const update = () => setLastThreadHeight(el.offsetHeight);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [threads, openKey]);

    useEffect(() => {
        setOpenKey(lastThreadKey);
    }, [lastThreadKey]);

    useEffect(() => {
        if (!loading && threads.length > 0) {
            setTimeout(() => {
                const container = scrollContainerRef.current;
                const el = bottomRef.current;
                if (!container || !el) return;
                const containerRect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const currentOffset = elRect.top - containerRect.top;
                container.scrollTo({
                    top: container.scrollTop + currentOffset - SCROLL_TOP_OFFSET,
                    behavior: "smooth",
                });
            }, 150);
        }
    }, [loading, threads]);

    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Mail className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-sm text-muted-foreground">Select a contact to view messages</p>
            </div>
        );
    }

    const toggleThread = (key: string, thread: MessageThread) => {
        const isOpening = openKey !== key;
        if (isOpening && onThreadSelect) {
            const msgs = thread.messages;
            onThreadSelect(msgs.length > 0 ? msgs[msgs.length - 1] : null);
        }
        setOpenKey(prev => prev === key ? null : key);
    };

    const isDraftAwaiting = pendingDraft?.status === "awaiting_approval";

    return (
        <div className="flex flex-col h-full relative min-h-0">
            {/* Banners */}
            {pendingDraft && onDraftSave && !isDraftAwaiting && (
                <div className="shrink-0">
                    <EmailStatusBanner
                        key={pendingDraft.id}
                        variant="violet"
                        title="Pending Email Draft"
                        subject={pendingDraft.subject}
                        body={pendingDraft.body}
                        badge={pendingDraft.position ? `Step ${pendingDraft.position}` : "Follow-up"}
                        accountName={pendingDraft.email_account_name}
                        editable
                        editButtonLabel="Edit"
                        saveButtonLabel="Save Draft"
                        successMessage="Draft saved — updated email will be sent."
                        onSave={(subject, body) => onDraftSave(pendingDraft.id, { subject, body })}
                    />
                </div>
            )}
            {(isDraftAwaiting || (pendingApproval && !pendingDraft)) && (
                <div className="shrink-0">
                    <EmailStatusBanner
                        key={isDraftAwaiting ? pendingDraft!.id : pendingApproval!.id}
                        variant="amber"
                        title="Awaiting Admin Approval"
                        subject={isDraftAwaiting ? pendingDraft!.subject : pendingApproval!.subject}
                        body={isDraftAwaiting ? pendingDraft!.body : pendingApproval!.body}
                        badge={isDraftAwaiting && pendingDraft!.position ? `Step ${pendingDraft!.position}` : undefined}
                        accountName={isDraftAwaiting ? pendingDraft!.email_account_name : undefined}
                        editable={false}
                    />
                </div>
            )}
            {rejectedApproval && onResubmit && (
                <div className="shrink-0">
                    <EmailStatusBanner
                        key={rejectedApproval.id}
                        variant="red"
                        title="Email Rejected"
                        subject={rejectedApproval.subject}
                        body={rejectedApproval.body}
                        rejectionReason={rejectedApproval.rejection_reason}
                        editable
                        editButtonLabel="Edit & Resubmit"
                        contactEmails={contactEmails}
                        initialTo={rejectedApproval.contact_email}
                        initialCc={rejectedApproval.cc}
                        accountProvider={rejectedApproval.account_provider}
                        accountEmail={rejectedApproval.account_email}
                        onResubmit={onResubmit}
                        onDiscard={onDiscard}
                    />
                </div>
            )}

            {/* Thread list */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar bg-white px-8 py-6 min-h-0"
                style={{ paddingBottom: bottomInset ? bottomInset + 24 : undefined }}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                        <Loading />
                        <p className="text-sm text-muted-foreground mt-4">Loading messages...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                        <Mail className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-sm text-muted-foreground">No messages found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {threads.map((thread, idx) => {
                            const key = threadKey(thread, idx);
                            const isLast = idx === threads.length - 1;
                            return (
                                <ThreadRow
                                    key={key}
                                    thread={thread}
                                    isOpen={openKey === key}
                                    onToggle={() => toggleThread(key, thread)}
                                    onReply={onReply}
                                    scrollRef={isLast ? bottomRef : undefined}
                                />
                            );
                        })}
                        {/* Dynamic spacer — accounts for space-y-6 gap (24px) + bottom padding (bottomInset + 24px) */}
                        <div style={{ minHeight: Math.max(0, scrollAreaHeight - lastThreadHeight - SCROLL_TOP_OFFSET - 48 - bottomInset) }} />
                    </div>
                )}
            </div>
        </div>
    );
}
