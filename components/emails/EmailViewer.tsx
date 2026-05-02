"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContactEmail, ContactMessage, MessageThread, PendingApprovalItem, PendingDraftItem, RejectedApprovalItem } from "@/types/emails";
import { Mail, Reply } from "lucide-react";
import { ScaledEmailPreview } from "./ScaledEmailPreview";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { EmailStatusBanner } from "./EmailStatusBanner";
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
    onResubmit?: (subject: string, body: string) => Promise<void>;
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
    const sanitizedBody = DOMPurify.sanitize(rawBody);
    const senderLabel = isSent
        ? (message.sender_name || message.sender_email || "You")
        : (message.contact_email || "Contact");

    return (
        <div className={`rounded-lg overflow-hidden text-sm border ${
            isSent
                ? "ml-8 border-blue-200 bg-blue-50/20"
                : "mr-8 border-gray-200 bg-white"
        }`}>
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isSent ? "hover:bg-blue-50/40" : "hover:bg-gray-50"
                }`}
            >
                <span className={`font-medium flex-1 truncate ${isSent ? "text-blue-800" : "text-gray-800"}`}>
                    {senderLabel}
                </span>
                {!isExpanded && (
                    <span className="text-gray-400 truncate max-w-[200px] hidden sm:block text-xs">
                        {rawBody.replace(/<[^>]+>/g, "").slice(0, 60)}
                    </span>
                )}
                <span className="text-xs text-gray-400 shrink-0">
                    {format(new Date(message.sent_at), "MMM d, h:mm a")}
                </span>
            </button>

            {isExpanded && (
                <div className={`border-t px-4 py-3 space-y-3 ${isSent ? "border-blue-100" : "border-gray-100"}`}>
                    <div className="overflow-hidden">
                        {isHtml ? (
                            <ScaledEmailPreview html={sanitizedBody} />
                        ) : (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
                                {rawBody || <span className="italic text-gray-400">No content</span>}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {message.replied_at ? (
                            <span className="text-xs text-gray-400">
                                ✓ Replied {format(new Date(message.replied_at), "MMM d, h:mm a")}
                            </span>
                        ) : <span />}
                        {!isSent && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onReply(message); }}
                                className="h-7 px-3 text-xs gap-1.5"
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
                            {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-gray-400 inline-block" />)}
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
                        <div className={`flex-1 h-[1.5px] transition-colors ${isOpen ? "bg-gray-800" : "bg-gray-300 group-hover:bg-gray-600"}`} />
                    </div>

                    {/* Circle */}
                    <div className={`
                        absolute left-1 top-1/2 -translate-y-1/2
                        w-8 h-8 rounded-full border-2 bg-white
                        flex items-center justify-center transition-colors z-10
                        ${isOpen ? "border-gray-800 text-gray-800" : "border-gray-400 text-gray-500 group-hover:border-gray-800 group-hover:text-gray-800"}
                    `}>
                        <span className="text-xs font-bold leading-none">{msgs.length}</span>
                    </div>

                    {/* "Sent via [Name]" — above line */}
                    <div className="absolute left-14 right-0 bottom-1/2 mb-1.5 flex items-end gap-1.5">
                        <span className="text-xs leading-none text-gray-400 shrink-0">Sent via</span>
                        <span className="text-xs font-semibold leading-none text-gray-800 group-hover:text-black transition-colors truncate">
                            {senderName}
                        </span>
                    </div>

                    {/* Subject + contact email — below line */}
                    <div className="absolute left-14 right-0 top-1/2 mt-1.5 flex items-start gap-2 min-w-0">
                        <span className="text-xs font-medium leading-none text-gray-600 group-hover:text-gray-800 transition-colors truncate">
                            {subject}
                        </span>
                        {contactName && (
                            <>
                                <span className="text-xs leading-none text-gray-300 shrink-0">·</span>
                                <span className="text-xs font-medium leading-none text-blue-500 group-hover:text-blue-600 transition-colors shrink-0">
                                    {contactName}
                                </span>
                            </>
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
    onResubmit,
}: EmailViewerProps) {
    const lastThreadKey = useMemo(
        () => threads.length > 0 ? threadKey(threads[threads.length - 1], threads.length - 1) : null,
        [threads]
    );

    const [openKey, setOpenKey] = useState<string | null>(lastThreadKey);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setOpenKey(lastThreadKey);
    }, [lastThreadKey]);

    useEffect(() => {
        if (!loading && threads.length > 0) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 150);
        }
    }, [loading, threads.length]);

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
                        saveButtonLabel="Resubmit for Approval"
                        successMessage="Email resubmitted for approval."
                        onSave={onResubmit}
                    />
                </div>
            )}

            {/* Thread list */}
            <div
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
                    </div>
                )}
            </div>
        </div>
    );
}
