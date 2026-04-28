"use client";

import { ApprovalItem } from "@/types/admin";
import { cn } from "@/lib/utils";
import { User, ShieldCheck, Loader2, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ApprovalListProps {
    items: ApprovalItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    loadingMore: boolean;
    activeTab: string;
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
                <p className="text-sm text-muted-foreground">
                    No {activeTab} items
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="divide-y">
                {items.map((item) => {
                    const isSelected = item.id === selectedId;

                    const contactName = item.contact_name || "Unknown Contact";
                    const initials = contactName
                        .split(" ")
                        .map((p) => p.charAt(0))
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?";

                    const snapshot = item.snapshot as unknown as Record<string, unknown>;
                    const subject = (snapshot?.subject as string) || "";

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                "w-full p-4 text-left transition-colors hover:bg-gray-50 flex flex-col gap-1.5 cursor-pointer group",
                                isSelected && "bg-blue-50 hover:bg-blue-50 border-l-4 border-blue-500"
                            )}
                        >
                            <div className="flex items-start gap-3 w-full">
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarFallback>
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-medium truncate text-sm text-gray-900">
                                            {contactName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                            {format(new Date(item.submitted_at), "MMM d")}
                                        </span>
                                    </div>

                                    {item.company_name && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {item.company_name}
                                        </p>
                                    )}

                                    {subject && (
                                        <p className="text-xs text-gray-600 truncate mt-0.5">
                                            {subject}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            {item.submitted_by_name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Load More */}
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
