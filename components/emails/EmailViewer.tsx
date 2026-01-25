"use client";

import { ContactEmail } from "@/app/api/emails/route";
import { Mail, Send, Inbox, Reply } from "lucide-react";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ContactMessage } from "@/app/api/emails/[contactId]/messages/route";

interface EmailViewerProps {
    email: ContactEmail | null;
    messages: ContactMessage[];
    loading: boolean;
    error: string | null;
    onReply: (message: ContactMessage) => void;
    bottomInset?: number;
}

export function EmailViewer({
    email,
    messages,
    loading,
    error,
    onReply,
    bottomInset = 0,
}: EmailViewerProps) {

    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Mail className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-sm text-muted-foreground">
                    Select a contact to view messages
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative min-h-0">
            <div
                className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 min-h-0"
                style={{ paddingBottom: bottomInset ? bottomInset + 24 : undefined }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loading />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Mail className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-sm text-muted-foreground">No messages found</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-4xl mx-auto pb-4">
                        {messages.map((message) => {
                            const isSent = message.direction === 'outbound';

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex",
                                        isSent ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-2xl p-4 shadow-sm",
                                            isSent
                                                ? "bg-gray-100 border border-gray-200"
                                                : "bg-white border border-gray-200"
                                        )}
                                    >
                                        {/* Message Header */}
                                        <div className="flex items-center gap-2 mb-3">
                                            {isSent ? (
                                                <Send className="h-3.5 w-3.5 text-gray-500" />
                                            ) : (
                                                <Inbox className="h-3.5 w-3.5 text-gray-500" />
                                            )}
                                            <span className="text-sm font-semibold text-gray-900">
                                                {message.subject}
                                            </span>
                                        </div>

                                        {/* Message Body */}
                                        <div
                                            className="text-sm text-gray-700 leading-relaxed mb-3 break-words [&_img]:max-w-full overflow-hidden whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: message.body }}
                                        />

                                        {/* Message Footer */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                                            <div className="flex items-center gap-4">
                                                <span>
                                                    {format(new Date(message.sent_at), "MMM d, h:mm a")}
                                                </span>
                                                {!isSent && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onReply(message)}
                                                        className="h-6 px-2 text-xs"
                                                    >
                                                        <Reply className="h-3 w-3 mr-1" />
                                                        Reply
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {message.replied_at && (
                                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                                ✓ Replied {format(new Date(message.replied_at), "MMM d, h:mm a")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
