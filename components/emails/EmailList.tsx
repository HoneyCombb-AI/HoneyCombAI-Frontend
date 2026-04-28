"use client";

import { ContactEmail } from "@/types/emails";
import { cn } from "@/lib/utils";
import { Mail, Loader2, ChevronDown, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface EmailListProps {
    emails: ContactEmail[];
    selectedId: string | null;
    onSelectEmail: (id: string) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    loadingMore: boolean;
}

export function EmailList({
    emails,
    selectedId,
    onSelectEmail,
    hasMore,
    onLoadMore,
    loadingMore
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
            <div className="divide-y">
                {emails.map((email) => {
                    const isSelected = email.id === selectedId;
                    const nameInitials = (email.full_name || "")
                        .split(" ")
                        .map((part) => part.trim().charAt(0))
                        .join("")
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toUpperCase()
                        .slice(0, 2);
                    const fallbackInitials = (email.email || "")
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toUpperCase()
                        .slice(0, 2);
                    const initials = nameInitials || fallbackInitials || "?";

                    return (
                        <button
                            key={email.id}
                            onClick={() => onSelectEmail(email.id)}
                            className={cn(
                                "w-full p-4 text-left transition-colors hover:bg-gray-50 flex flex-col gap-2 cursor-pointer group",
                                isSelected && "bg-blue-50 hover:bg-blue-50 border-l-4 border-blue-500"
                            )}
                        >
                            <div className="flex items-start gap-3 w-full">
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="font-medium truncate text-sm text-gray-900">
                                            {email.full_name}
                                        </span>
                                        {/* Tags - Top Right */}
                                        {email.tags && email.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-end max-w-[40%] shrink-0">
                                                {email.tags.slice(0, 2).map((tag, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            borderColor: tag.color,
                                                            color: tag.color
                                                        }}
                                                        className="px-1.5 py-0.5 rounded-md text-[10px] border bg-transparent flex items-center gap-1 font-medium whitespace-nowrap max-w-[60px] truncate"
                                                    >
                                                        <span className="truncate">{tag.name}</span>
                                                    </div>
                                                ))}
                                                {email.tags.length > 2 && (
                                                    <span className="text-[10px] text-muted-foreground self-center bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
                                                        +{email.tags.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground truncate mb-1">
                                        {email.email}
                                    </p>

                                    {email.email_account_name && (
                                        <div className="flex items-center gap-1 mb-1">
                                            <User className="h-3 w-3 text-gray-400" />
                                            <span className="text-[10px] text-gray-500 truncate">
                                                via {email.email_account_name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-muted-foreground truncate">
                                            {email.company_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 shrink-0 overflow-hidden">
                                            {email.draft_id && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-800 border border-violet-300 animate-pulse whitespace-nowrap" title="Pending Draft">
                                                    <Clock className="h-3 w-3 shrink-0" />
                                                    <span className="truncate max-w-[80px]">Pending Draft</span>
                                                </span>
                                            )}
                                            {email.has_pending_approval && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap" title="Awaiting Approval">
                                                    <Clock className="h-3 w-3 shrink-0" />
                                                    <span className="truncate max-w-[80px]">Awaiting Approval</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Load More Button */}
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
