"use client";

import { useMemo } from "react";
import {
    Mail,
    ShieldCheck,
    Check,
    X,
    User,
    Clock,
    Building2,
    Send,
    AtSign,
} from "lucide-react";
import { format } from "date-fns";
import type { ApprovalItem, LinkedInSnapshot } from "@/types/admin";
import { isEmailSnapshot } from "@/types/admin";
import DOMPurify from "dompurify";

interface ApprovalDetailProps {
    item: ApprovalItem | null;
}



export function ApprovalDetail({ item }: ApprovalDetailProps) {
    const sanitizedBody = useMemo(() => {
        if (!item) return "";
        const snapshot = item.snapshot;
        if (isEmailSnapshot(snapshot)) {
            return DOMPurify.sanitize(snapshot.body || "");
        }
        return "";
    }, [item]);

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ShieldCheck className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-sm text-muted-foreground">
                    Select an item to review
                </p>
            </div>
        );
    }

    const snapshot = item.snapshot;
    const isEmail = isEmailSnapshot(snapshot);
    const contactName = item.contact_name || "Unknown Contact";

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header - Contact Info */}
            <div className="shrink-0 border-b bg-white px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                            <h2 className="text-base font-semibold text-gray-900 truncate">
                                {contactName}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {item.company_name && (
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {item.company_name}
                                </span>
                            )}
                            {isEmail && (
                                <span className="flex items-center gap-1">
                                    <AtSign className="h-3 w-3" />
                                    {snapshot.contact_email}
                                </span>
                            )}
                            {isEmail && snapshot.account_provider && (
                                <span className="flex items-center gap-1">
                                    <Send className="h-3 w-3" />
                                    via {snapshot.account_provider === "gmail" ? "Gmail" : "Outlook"}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Submitted by {item.submitted_by_name}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(item.submitted_at), "MMM d, yyyy · h:mm a")}
                            </span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                        {item.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="h-3 w-3" />
                                Pending Review
                            </span>
                        )}
                        {item.status === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
                                <Check className="h-3 w-3" />
                                Approved
                            </span>
                        )}
                        {item.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                                <X className="h-3 w-3" />
                                Rejected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 min-h-0">
                {isEmail ? (
                    <div className="space-y-4">
                        {/* Subject */}
                        <div className="bg-white rounded-lg border px-4 py-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                            <p className="text-sm font-medium text-gray-900">{snapshot.subject}</p>
                        </div>

                        {/* Body */}
                        <div className="bg-white rounded-lg border p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Email Body</p>
                            <div
                                className="prose prose-sm max-w-none text-gray-800 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline"
                                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                            />
                        </div>
                    </div>
                ) : (
                    /* LinkedIn content */
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg border p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Message</p>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                {(snapshot as LinkedInSnapshot).draft_message ||
                                 (snapshot as LinkedInSnapshot).connection_note ||
                                 "No content"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection reason display */}
                {item.status === "rejected" && item.rejection_reason && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                        <span className="font-medium">Rejection Reason:</span>{" "}
                        &quot;{item.rejection_reason}&quot;
                    </div>
                )}

                {/* Review info for completed items */}
                {item.status !== "pending" && item.reviewed_at && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        Reviewed by {item.reviewed_by_name || "Admin"} on{" "}
                        {format(new Date(item.reviewed_at), "MMM d, yyyy · h:mm a")}
                    </p>
                )}
            </div>
        </div>
    );
}
