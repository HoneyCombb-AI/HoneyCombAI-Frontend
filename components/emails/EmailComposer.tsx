"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ContactEmail, ContactMessage, ContactEmailAddress } from "@/types/emails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronUp, Loader2, Send, ShieldCheck, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type ThreadMode = "continue" | "new";

interface EmailComposerProps {
    contact: ContactEmail | null;
    contactEmails?: ContactEmailAddress[];
    replyToMessage?: ContactMessage | null;
    lastMessage?: ContactMessage | null;
    lastMessageSubject?: string;
    onSent: () => void;
    onClearReply?: () => void;
    senderEmail?: string | null;
    senderProvider?: "gmail" | "outlook" | null;
    senderAccountId?: string | null;
    prefillSubject?: string | null;
    prefillBody?: string | null;
}

export function EmailComposer({
    contact,
    contactEmails = [],
    replyToMessage,
    lastMessage,
    lastMessageSubject,
    onSent,
    onClearReply,
    senderEmail = null,
    senderProvider = null,
    senderAccountId = null,
    prefillSubject = null,
    prefillBody = null,
}: EmailComposerProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [selectedContactEmailId, setSelectedContactEmailId] = useState("");
    const [threadMode, setThreadMode] = useState<ThreadMode>("continue");
    const [cc, setCc] = useState<string[]>([]);
    const [ccInput, setCcInput] = useState("");
    const [showCc, setShowCc] = useState(false);
    const [bcc, setBcc] = useState<string[]>([]);
    const [bccInput, setBccInput] = useState("");
    const [showBcc, setShowBcc] = useState(false);
    const [sending, setSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const ccInputRef = useRef<HTMLInputElement>(null);
    const bccInputRef = useRef<HTMLInputElement>(null);
    const prevContactIdRef = useRef<string | null>(null);
    const prevReplyIdRef = useRef<string | null>(null);

    const selectedContactEmail = useMemo(
        () => contactEmails.find(ce => ce.id === selectedContactEmailId) ?? null,
        [contactEmails, selectedContactEmailId]
    );
    const toEmail = selectedContactEmail?.email ?? "";

    // Reset recipient to match the thread's email when contact changes
    // (falls back to primary if no thread history exists)
    useEffect(() => {
        const threadEmail = lastMessage?.contact_email
            ? contactEmails.find(ce => ce.email === lastMessage.contact_email)
            : null;
        const primary = contactEmails.find(ce => ce.is_primary) ?? contactEmails[0] ?? null;
        setSelectedContactEmailId((threadEmail ?? primary)?.id ?? "");
    }, [contact?.id, contactEmails, lastMessage?.contact_email]);

    // Reset threadMode, CC when contact changes
    useEffect(() => {
        setThreadMode("continue");
        setCc([]);
        setCcInput("");
        setShowCc(false);
        setBcc([]);
        setBccInput("");
        setShowBcc(false);
    }, [contact?.id]);

    // Auto-switch mode based on whether selected email matches the thread
    useEffect(() => {
        if (!lastMessage?.contact_email || !toEmail) return;
        if (toEmail !== lastMessage.contact_email) {
            setThreadMode("new");
        } else {
            setThreadMode("continue");
        }
    }, [toEmail, lastMessage?.contact_email]);

    const { role, approvalRequired } = useAuth();
    const needsApproval = approvalRequired && role === "user";

    const isReply = !!replyToMessage;
    const hasHistory = !!lastMessage;

    const defaultSubject = useMemo(() => {
        if (isReply && replyToMessage) {
            return replyToMessage.subject.startsWith("Re:")
                ? replyToMessage.subject
                : `Re: ${replyToMessage.subject}`;
        }
        if (lastMessageSubject && threadMode === "continue") {
            return lastMessageSubject.startsWith("Re:")
                ? lastMessageSubject
                : `Re: ${lastMessageSubject}`;
        }
        return "";
    }, [isReply, replyToMessage?.subject, lastMessageSubject, threadMode]);

    useEffect(() => {
        const contactId = contact?.id ?? null;
        const replyId = replyToMessage?.id ?? null;
        const contactChanged = prevContactIdRef.current !== contactId;
        const replyChanged = prevReplyIdRef.current !== replyId;

        if (contactChanged) {
            setBody(prefillBody || "");
        }

        setSubject(prefillSubject || defaultSubject);

        if (replyChanged && replyId) {
            setIsOpen(true);
        }

        prevContactIdRef.current = contactId;
        prevReplyIdRef.current = replyId;
    }, [contact?.id, replyToMessage?.id, defaultSubject, prefillSubject, prefillBody]);

    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const addCcTag = (raw: string) => {
        const candidates = raw.split(/[,;\s]+/).map(s => s.trim()).filter(s => s.length > 0);
        const valid = candidates.filter(isValidEmail);
        if (valid.length === 0) {
            setCcInput("");
            return;
        }
        setCc(prev => {
            const next = [...prev];
            for (const e of valid) {
                if (!next.includes(e)) next.push(e);
            }
            return next;
        });
        setCcInput("");
    };

    const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
            e.preventDefault();
            addCcTag(ccInput);
        } else if (e.key === "Backspace" && ccInput === "") {
            setCc(prev => prev.slice(0, -1));
        }
    };

    const handleCcBlur = () => {
        if (ccInput.trim()) addCcTag(ccInput);
    };

    const addBccTag = (raw: string) => {
        const candidates = raw.split(/[,;\s]+/).map(s => s.trim()).filter(s => s.length > 0);
        const valid = candidates.filter(isValidEmail);
        if (valid.length === 0) {
            setBccInput("");
            return;
        }
        setBcc(prev => {
            const next = [...prev];
            for (const e of valid) {
                if (!next.includes(e)) next.push(e);
            }
            return next;
        });
        setBccInput("");
    };

    const handleBccKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
            e.preventDefault();
            addBccTag(bccInput);
        } else if (e.key === "Backspace" && bccInput === "") {
            setBcc(prev => prev.slice(0, -1));
        }
    };

    const handleBccBlur = () => {
        if (bccInput.trim()) addBccTag(bccInput);
    };

    const bodyText = useMemo(() => {
        return body
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }, [body]);

    const hasSubject = subject.trim().length > 0;
    const hasBody = bodyText.length > 0;
    const canSend = hasSubject && hasBody && !!senderProvider && !!senderAccountId && !!selectedContactEmailId && !sending;

    // Thread IDs derived from mode
    const sendThreadId = isReply
        ? (replyToMessage?.thread_id ?? null)
        : threadMode === "continue" ? (lastMessage?.thread_id ?? null) : null;
    const sendReplyToMessageId = isReply 
        ? (replyToMessage?.message_id ?? null) 
        : threadMode === "continue" ? (lastMessage?.message_id ?? null) : null;

    const subjectFieldLabel = isReply
        ? "Replying:"
        : hasHistory && threadMode === "continue"
            ? "Continuing:"
            : "Subject:";

    const threadCcs = useMemo(() => {
        if (isReply && replyToMessage?.cc?.length) return replyToMessage.cc;
        if (threadMode === "continue" && lastMessage?.cc?.length) return lastMessage.cc;
        return [];
    }, [isReply, replyToMessage, threadMode, lastMessage]);

    const missingThreadCcs = useMemo(() => {
        return threadCcs.filter(c => !cc.includes(c));
    }, [threadCcs, cc]);

    const handleSend = async () => {
        if (!contact || !hasSubject || !hasBody || !senderProvider || !senderAccountId) return;

        setSending(true);
        try {
            const res = await axios.post(`/api/emails/${contact.id}/send`, {
                subject,
                body,
                account_id: senderAccountId,
                account_provider: senderProvider,
                thread_id: sendThreadId || undefined,
                reply_to_message_id: sendReplyToMessageId || undefined,
                contact_email_id: selectedContactEmailId || undefined,
                contact_email: toEmail || undefined,
                cc: cc.length ? cc : undefined,
                bcc: bcc.length ? bcc : undefined,
            });

            if (res.data?.status === "queued_for_approval") {
                toast.success("Email submitted for admin approval");
            } else {
                toast.success("Email sent successfully!");
            }
            onSent();
            setSubject("");
            setBody("");
            setCc([]);
            setCcInput("");
            setShowCc(false);
            setBcc([]);
            setBccInput("");
            setShowBcc(false);
        } catch (error: unknown) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.detail || "Failed to send email"
                : "Failed to send email";
            toast.error(errorMessage);
        } finally {
            setSending(false);
        }
    };

    if (!contact) return null;

    return (
        <div className="w-full border-t border-gray-200 bg-white/95 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur supports-backdrop-filter:bg-white/80">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {/* Header — custom div so mode toggle buttons can nest without HTML violations */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsOpen(v => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setIsOpen(v => !v)}
                    className="flex w-full flex-col px-6 py-3 text-left transition-colors hover:bg-gray-50 cursor-pointer select-none"
                >
                    {/* Row 1: mode label (left) + collapse chevron (right) */}
                    <div className="flex items-center justify-between w-full">
                        {/* Collapsed: plain text label. Expanded: interactive toggle */}
                        {!isOpen ? (
                            <span className={`text-[11px] font-semibold uppercase tracking-wide ${isReply ? "text-blue-600" : "text-gray-500"}`}>
                                {isReply ? "↩ Reply" : hasHistory ? (threadMode === "continue" ? "Continue" : "New Message") : "Compose"}
                            </span>
                        ) : isReply ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">↩ Reply</span>
                                {onClearReply && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onClearReply(); }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Cancel reply"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ) : hasHistory ? (
                            <div
                                className="flex items-center bg-gray-100 rounded-full p-0.5"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => setThreadMode("continue")}
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                                        threadMode === "continue" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    Continue
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setThreadMode("new")}
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                                        threadMode === "new" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    New
                                </button>
                            </div>
                        ) : (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Compose</span>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="hidden sm:inline">{isOpen ? "Collapse" : "Expand"}</span>
                            <ChevronUp className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
                        </div>
                    </div>

                    {/* Row 2: From (left) + To (right) */}
                    {(senderEmail || toEmail) && (
                        <div className="flex items-center justify-between w-full mt-2">
                            <div className="text-xs text-gray-400">
                                From:{" "}
                                <span className="font-semibold text-gray-700">
                                    {senderEmail ?? "—"}
                                    {senderProvider && (
                                        <span className="ml-1 font-normal text-gray-400">({senderProvider})</span>
                                    )}
                                </span>
                            </div>
                            {/* Collapsed: plain text. Expanded: select if multiple emails */}
                            {!isOpen || contactEmails.length <= 1 ? (
                                toEmail ? (
                                    <div className="hidden sm:block text-xs text-gray-400">
                                        To:{" "}
                                        <span className="font-semibold text-gray-700">{toEmail}</span>
                                    </div>
                                ) : null
                            ) : (
                                <div
                                    className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400"
                                    onClick={e => e.stopPropagation()}
                                >
                                    To:{" "}
                                    <Select value={selectedContactEmailId} onValueChange={setSelectedContactEmailId}>
                                        <SelectTrigger
                                            size="sm"
                                            className="h-auto py-0.5 px-2 text-xs font-semibold text-gray-700 border-gray-200 bg-white shadow-none gap-1"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contactEmails.map(ce => (
                                                <SelectItem key={ce.id} value={ce.id}>
                                                    {ce.email}{ce.label ? ` (${ce.label})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                <CollapsibleContent className="border-t border-gray-200 bg-white overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
                        {/* Subject */}
                        <div className="px-6 py-3 border-b flex items-center gap-4 bg-gray-50">
                            <span className="text-sm font-medium text-gray-500 w-20 shrink-0">
                                {subjectFieldLabel}
                            </span>
                            {isReply || (hasHistory && threadMode === "continue") ? (
                                <span className="flex-1 text-sm font-medium text-gray-700 truncate px-3 py-1.5">
                                    {subject}
                                </span>
                            ) : (
                                <Input
                                    placeholder="Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="flex-1 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-sm h-9 px-3 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:border-gray-300"
                                />
                            )}
                            <div className="flex items-center gap-4 shrink-0">
                                {missingThreadCcs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCc(prev => [...prev, ...missingThreadCcs]);
                                            setShowCc(true);
                                        }}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide cursor-pointer"
                                    >
                                        + Reply All ({missingThreadCcs.length})
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCc(v => {
                                            if (!v) setTimeout(() => ccInputRef.current?.focus(), 50);
                                            return !v;
                                        });
                                    }}
                                    className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wide cursor-pointer"
                                >
                                    {showCc ? "− CC" : "+ CC"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBcc(v => {
                                            if (!v) setTimeout(() => bccInputRef.current?.focus(), 50);
                                            return !v;
                                        });
                                    }}
                                    className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wide cursor-pointer"
                                >
                                    {showBcc ? "− BCC" : "+ BCC"}
                                </button>
                            </div>
                        </div>

                        {/* CC row */}
                        {showCc && (
                            <div className="px-6 py-2.5 border-b bg-gray-50 flex items-start gap-4">
                                <span className="text-sm font-medium text-gray-500 w-20 shrink-0 pt-1.5">CC:</span>
                                <div
                                    className="flex-1 flex flex-wrap items-center gap-1.5 min-h-9 bg-white border border-gray-200 rounded-md px-2 py-1.5 shadow-sm cursor-text focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-300"
                                    onClick={() => ccInputRef.current?.focus()}
                                >
                                    {cc.map((email) => (
                                        <span
                                            key={email}
                                            className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium rounded px-2 py-0.5"
                                        >
                                            {email}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setCc(prev => prev.filter(c => c !== email)); }}
                                                className="text-gray-400 hover:text-gray-600 transition-colors leading-none"
                                                aria-label={`Remove ${email}`}
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        ref={ccInputRef}
                                        type="email"
                                        multiple
                                        value={ccInput}
                                        onChange={e => setCcInput(e.target.value)}
                                        onKeyDown={handleCcKeyDown}
                                        onBlur={handleCcBlur}
                                        placeholder={cc.length === 0 ? "Add CC recipients…" : ""}
                                        className="flex-1 min-w-[140px] text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none border-none py-0.5"
                                    />
                                </div>
                            </div>
                        )}

                        {/* BCC row */}
                        {showBcc && (
                            <div className="px-6 py-2.5 border-b bg-gray-50 flex items-start gap-4">
                                <span className="text-sm font-medium text-gray-500 w-20 shrink-0 pt-1.5">BCC:</span>
                                <div
                                    className="flex-1 flex flex-wrap items-center gap-1.5 min-h-9 bg-white border border-gray-200 rounded-md px-2 py-1.5 shadow-sm cursor-text focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-300"
                                    onClick={() => bccInputRef.current?.focus()}
                                >
                                    {bcc.map((email) => (
                                        <span
                                            key={email}
                                            className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium rounded px-2 py-0.5"
                                        >
                                            {email}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setBcc(prev => prev.filter(c => c !== email)); }}
                                                className="text-gray-400 hover:text-gray-600 transition-colors leading-none"
                                                aria-label={`Remove ${email}`}
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        ref={bccInputRef}
                                        type="email"
                                        multiple
                                        value={bccInput}
                                        onChange={e => setBccInput(e.target.value)}
                                        onKeyDown={handleBccKeyDown}
                                        onBlur={handleBccBlur}
                                        placeholder={bcc.length === 0 ? "Add BCC recipients…" : ""}
                                        className="flex-1 min-w-[140px] text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none border-none py-0.5"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Editor */}
                        <div className="p-4 bg-white">
                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                placeholder="Write your message..."
                            />
                        </div>

                        {/* Action bar */}
                        <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-end">
                            <Button
                                onClick={handleSend}
                                disabled={!canSend}
                                className="bg-slate-800 text-white hover:cursor-pointer shadow-sm border border-transparent hover:bg-green-800 hover:border-slate-950 transition-all duration-200 active:scale-95 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed disabled:hover:bg-slate-300"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : needsApproval ? (
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                {needsApproval ? "Submit for Approval" : "Send"}
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
