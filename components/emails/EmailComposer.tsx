"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ContactEmail } from "@/types/emails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronUp, Loader2, Sparkles, Send, ShieldCheck } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";
import { useAuth } from "@/lib/auth-context";

interface ContactMessage {
    id: string;
    subject: string;
    thread_id: string;
    message_id: string;
    direction: string;
}

interface EmailComposerProps {
    contact: ContactEmail | null;
    replyToMessage?: ContactMessage | null;
    lastMessageSubject?: string;
    mode?: "compose" | "reply" | "followup";
    onSent: () => void;
    senderEmail?: string | null;
    senderProvider?: "gmail" | "outlook" | null;
    senderAccountId?: string | null;
    senderFirstName?: string | null;
}

export function EmailComposer({
    contact,
    replyToMessage,
    lastMessageSubject,
    mode = "compose",
    onSent,
    senderEmail = null,
    senderProvider = null,
    senderAccountId = null,
    senderFirstName = null,
}: EmailComposerProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const prevContactIdRef = useRef<string | null>(null);
    const prevReplyIdRef = useRef<string | null>(null);
    const { role, approvalRequired } = useAuth();
    const needsApproval = approvalRequired && role === 'user';

    const resolvedMode = replyToMessage ? "reply" : mode;
    const isReply = resolvedMode === "reply";

    const defaultSubject = useMemo(() => {
        if (isReply && replyToMessage) {
            return replyToMessage.subject.startsWith("Re:")
                ? replyToMessage.subject
                : `Re: ${replyToMessage.subject}`;
        }
        if (lastMessageSubject) {
            return lastMessageSubject.startsWith("Re:")
                ? lastMessageSubject
                : `Re: ${lastMessageSubject}`;
        }
        return "";
    }, [isReply, replyToMessage?.subject, lastMessageSubject]);

    useEffect(() => {
        const contactId = contact?.id ?? null;
        const replyId = replyToMessage?.id ?? null;
        const contactChanged = prevContactIdRef.current !== contactId;
        const replyChanged = prevReplyIdRef.current !== replyId;

        if (contactChanged) {
            setBody("");
        }

        setSubject(defaultSubject);

        if (replyChanged && replyId) {
            setIsOpen(true);
        }

        prevContactIdRef.current = contactId;
        prevReplyIdRef.current = replyId;
    }, [contact?.id, replyToMessage?.id, defaultSubject]);


    // Add signature to body
    const addSignature = useCallback((content: string) => {
        const rawName = senderFirstName?.replace(/[<>]/g, "") || "HoneyComb";
        const signature = `<p>${rawName}</p>`;
        return content + signature;
    }, [senderFirstName]);

    // Generate AI draft
    const handleGenerateDraft = async () => {
        if (!contact) return;
        if (!senderProvider || !senderAccountId) {
            toast.error("Connect an email account to generate drafts.");
            return;
        }

        setGenerating(true);
        try {
            const response = await axios.post(`/api/emails/${contact.id}/generate-draft`);

            setSubject(response.data.subject);
            setBody(addSignature(response.data.body));

            toast.success("Draft generated successfully!");
        } catch (error) {
            console.error("Error generating draft:", error);

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 403) {
                    const detail = error.response?.data?.detail || "No connected email account.";
                    toast.error(detail);
                    return;
                }
                if (status === 429) {
                    const resetTime = error.response?.data?.resetTime;
                    const retryIn = resetTime
                        ? formatDistanceToNowStrict(new Date(resetTime), { addSuffix: true })
                        : "later";
                    toast.error(`Rate limit exceeded. Try again ${retryIn}.`);
                    return;
                }
            }

            toast.error("Failed to generate draft");
        } finally {
            setGenerating(false);
        }
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
    const canSend = hasSubject && hasBody && !!senderProvider && !!senderAccountId && !sending;

    const subjectLabel =
        subject.trim() ||
        (resolvedMode === "reply"
            ? "Reply draft"
            : resolvedMode === "followup"
                ? "Follow-up draft"
                : "New message");
    const triggerLabel =
        resolvedMode === "reply"
            ? "Reply"
            : resolvedMode === "followup"
                ? "Continuing"
                : "Compose";
    const subjectFieldLabel =
        resolvedMode === "reply"
            ? "Replying:"
            : resolvedMode === "followup"
                ? "Continuing:"
                : "Subject:";

    // Send email
    const handleSend = async () => {
        if (!contact || !hasSubject || !hasBody || !senderProvider || !senderAccountId) return;

        setSending(true);
        try {
            const res = await axios.post(`/api/emails/${contact.id}/send`, {
                subject,
                body,
                account_id: senderAccountId,
                account_provider: senderProvider,
                thread_id: replyToMessage?.thread_id,
                reply_to_message_id: replyToMessage?.message_id,
            });

            if (res.data?.status === 'queued_for_approval') {
                toast.success("Email submitted for admin approval");
            } else {
                toast.success("Email sent successfully!");
            }
            onSent();
            // Clear form after send
            setSubject("");
            setBody("");
        } catch (error: unknown) {
            console.error("Error sending email:", error);
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
                <CollapsibleTrigger
                    type="button"
                    className="group flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-gray-50"
                >
                    <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {triggerLabel}
                        </div>
                        {senderEmail && (
                            <div className="text-xs text-gray-500">
                                From: {senderEmail}
                                {senderProvider ? ` (${senderProvider})` : ""}
                            </div>
                        )}
                        {!isOpen && (
                            <div className="truncate text-sm font-medium text-gray-900">
                                {subjectLabel}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="hidden sm:inline">
                            {isOpen ? "Collapse" : "Expand"}
                        </span>
                        <ChevronUp
                            className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                        />
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-gray-200 bg-white overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
                        {/* Header / Subject Line */}
                        <div className="px-6 py-3 border-b flex items-center gap-4 bg-gray-50">
                            <span className="text-sm font-medium text-gray-500 w-20">
                                {subjectFieldLabel}
                            </span>
                            <Input
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="flex-1 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-sm h-9 px-3 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:border-gray-300"
                            />
                        </div>

                        {/* Editor Area */}
                        <div className="p-4 bg-white">
                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                placeholder="Write your message..."
                            />
                        </div>

                        {/* Action Bar */}
                        <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerateDraft}
                                disabled={generating || sending}
                                className="border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 cursor-pointer transition-all duration-200 focus:ring-1 focus:ring-purple-200 shadow-sm"
                            >
                                {generating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                AI Generate
                            </Button>

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
