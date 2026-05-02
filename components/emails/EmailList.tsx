"use client";

import { ContactEmail } from "@/types/emails";
import { cn } from "@/lib/utils";
import { Mail, Loader2, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailListProps {
    emails: ContactEmail[];
    selectedId: string | null;
    onSelectEmail: (id: string) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    loadingMore: boolean;
}

function relativeTime(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
}

export function EmailList({
    emails,
    selectedId,
    onSelectEmail,
    hasMore,
    onLoadMore,
    loadingMore,
}: EmailListProps) {
    if (emails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
                <Mail className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm text-muted-foreground">No contact emails found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="divide-y overflow-y-auto">
                {emails.map((email) => {
                    const isSelected = email.id === selectedId;
                    const hasDraft = !!email.draft_id;
                    const hasApproval = email.has_pending_approval;
                    const time = relativeTime(email.last_interaction_at);

                    return (
                        <button
                            key={email.id}
                            onClick={() => onSelectEmail(email.id)}
                            className={cn(
                                "w-full px-4 py-1.5 pt-3 text-left transition-colors hover:bg-gray-50 flex flex-col gap-3 cursor-pointer border-l-4",
                                hasDraft
                                    ? "border-l-violet-400"
                                    : hasApproval
                                    ? "border-l-amber-400"
                                    : isSelected
                                    ? "border-l-blue-500"
                                    : "border-l-transparent",
                                isSelected && "bg-blue-50 hover:bg-blue-50"
                            )}
                        >
                            {/* Row 1: Name + relative time */}
                            <div className="flex items-baseline justify-between gap-2 w-full">
                                <span className="font-semibold text-sm text-gray-900 truncate">
                                    {email.full_name}
                                </span>
                                {time && (
                                    <span className="text-[11px] text-gray-400 shrink-0">
                                        {time}
                                    </span>
                                )}
                            </div>

                            {/* Row 2: Subject + status icon */}
                            <div className="flex items-center gap-2 w-full min-w-0">
                                <p className="text-xs text-gray-500 truncate flex-1 min-w-0">
                                    {email.last_message_subject ?? "No messages yet"}
                                </p>
                                {hasDraft && (
                                    <Clock className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                                )}
                                {!hasDraft && hasApproval && (
                                    <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {hasMore && (
                <div className="p-4 border-t flex justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className="w-full gap-2 text-sm font-medium border-dashed text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:cursor-pointer"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                Load More
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
