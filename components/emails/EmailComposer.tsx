"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ContactEmail } from "@/app/api/emails/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronUp, Loader2, Sparkles, Send } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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
    onSent: () => void;
}

export function EmailComposer({
    contact,
    replyToMessage,
    lastMessageSubject,
    onSent,
}: EmailComposerProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const isReply = !!replyToMessage;

    // Auto-fill subject for replies
    // Auto-fill subject for replies
    useEffect(() => {
        if (isReply && replyToMessage) {
            const replySubject = replyToMessage.subject.startsWith("Re:")
                ? replyToMessage.subject
                : `Re: ${replyToMessage.subject}`;
            setSubject(replySubject);
        } else if (lastMessageSubject) {
            // Default to last message subject if available
            const defaultSubject = lastMessageSubject.startsWith("Re:")
                ? lastMessageSubject
                : `Re: ${lastMessageSubject}`;
            setSubject(defaultSubject);
        } else {
            // If cleaning contact or fresh state
            if (!subject && contact) setSubject("");
        }
    }, [isReply, replyToMessage, lastMessageSubject, contact?.id]);

    // Reset form when contact changes
    useEffect(() => {
        setSubject("");
        setBody("");
    }, [contact?.id]);

    useEffect(() => {
        setIsOpen(true);
    }, [contact?.id, replyToMessage?.id]);


    // Add signature to body
    const addSignature = useCallback((content: string) => {
        // Just "HoneyComb" in a para tag as requested
        const signature = `<p>HoneyComb</p>`;
        return content + signature;
    }, []);

    // Generate AI draft
    const handleGenerateDraft = async () => {
        if (!contact) return;

        setGenerating(true);
        try {
            const response = await axios.post(`/api/emails/${contact.id}/generate-draft`);

            setSubject(response.data.subject);
            setBody(addSignature(response.data.body));

            toast.success("Draft generated successfully!");
        } catch (error) {
            console.error("Error generating draft:", error);
            toast.error("Failed to generate draft");
        } finally {
            setGenerating(false);
        }
    };

    // Send email
    const handleSend = async () => {
        if (!contact || !body.trim()) return;

        setSending(true);
        try {
            await axios.post(`/api/emails/${contact.id}/send`, {
                subject,
                body,
                thread_id: replyToMessage?.thread_id,
                reply_to_message_id: replyToMessage?.message_id,
            });

            toast.success("Email sent successfully!");
            onSent();
            // Clear form after send
            setSubject("");
            setBody("");
        } catch (error: any) {
            console.error("Error sending email:", error);
            const errorMessage = error.response?.data?.detail || "Failed to send email";
            toast.error(errorMessage);
        } finally {
            setSending(false);
        }
    };

    const canSend = body.trim().length > 0 && !sending;

    const subjectLabel = subject.trim() || (isReply ? "Reply draft" : "New message");
    const bodyPreview = useMemo(() => {
        const stripped = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        return stripped.length > 0 ? stripped : "";
    }, [body]);

    if (!contact) return null;

    return (
        <div className="w-full border-t border-gray-200 bg-white/95 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger
                    type="button"
                    className="group flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-gray-50"
                >
                    <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {isReply ? "Reply" : "Compose"}
                        </div>
                        <div className="truncate text-sm font-medium text-gray-900">
                            {subjectLabel}
                        </div>
                        {bodyPreview && (
                            <div className="truncate text-xs text-gray-500">
                                {bodyPreview}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="hidden sm:inline">
                            {isOpen ? "Collapse" : "Expand"}
                        </span>
                        <ChevronUp
                            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                        />
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-gray-200 bg-white max-h-[70vh] overflow-y-auto">
                    {/* Header / Subject Line */}
                    <div className="px-6 py-3 border-b flex items-center gap-4 bg-gray-50">
                        <span className="text-sm font-medium text-gray-500 w-16">
                            {isReply ? "Replying:" : "Subject:"}
                        </span>
                        <Input
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="flex-1 bg-transparent border-none focus-visible:ring-0 px-0 h-auto font-medium"
                        />
                    </div>

                    {/* Editor Area */}
                    <div className="p-4 bg-white">
                        <RichTextEditor
                            value={body}
                            onChange={setBody}
                            placeholder="Write your message... (HoneyComb signature added automatically)"
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

                        {canSend && (
                            <Button
                                onClick={handleSend}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent hover:border-blue-800 cursor-pointer transition-all duration-200 active:scale-95"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send
                            </Button>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
