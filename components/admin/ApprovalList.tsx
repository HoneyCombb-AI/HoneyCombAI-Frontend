"use client";

import { ApprovalListItem } from "@/types/admin";
import { cn } from "@/lib/utils";
import { ShieldCheck, Loader2, ChevronDown, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ApprovalListProps {
    items: ApprovalListItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    loadingMore: boolean;
    activeTab: string;
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return format(new Date(dateStr), "MMM d");
}

export function ApprovalList({
    items,
    selectedId,
    onSelect,
    hasMore,
    onLoadMore,
    loadingMore,
    activeTab,
}: ApprovalListProps) {

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
                <ShieldCheck className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm text-muted-foreground">No {activeTab} items</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="divide-y overflow-y-auto">
                {items.map((item) => {
                    const isSelected = item.id === selectedId;
                    const subject = item.subject;
                    const time = relativeTime(item.submitted_at);

                    const borderColor =
                        item.status === "pending"
                            ? "border-l-amber-400"
                            : item.status === "approved"
                                ? "border-l-green-400"
                                : item.status === "rejected"
                                    ? "border-l-red-400"
                                    : "border-l-transparent";

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                "w-full px-5 py-4 text-left transition-colors hover:bg-gray-50 flex flex-col gap-3 cursor-pointer border-l-4",
                                borderColor,
                                isSelected && "bg-blue-50 hover:bg-blue-50 border-l-blue-500"
                            )}
                        >
                            {/* Row 1: contact name + issue indicator + relative time */}
                            <div className="flex items-baseline justify-between gap-2 w-full">
                                <span className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-semibold text-sm text-gray-900 truncate">
                                        {item.contact_name || "Unknown Contact"}
                                    </span>
                                    {item.has_issue && (
                                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                            Issue
                                        </span>
                                    )}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-gray-600 shrink-0">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                </span>
                            </div>

                            {/* Row 2: subject */}
                            <p className="text-xs text-gray-500 truncate w-full min-w-0">
                                {subject || "—"}
                            </p>

                            {/* Row 3: submitted-by */}
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-800 shrink-0">
                                <User className="h-3 w-3 text-gray-600" />
                                {item.submitted_by_name}
                            </span>
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
