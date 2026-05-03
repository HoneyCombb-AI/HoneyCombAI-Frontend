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
import { Loading } from "@/components/loading";
import DOMPurify from "dompurify";
import { ScaledEmailPreview } from "@/components/emails/ScaledEmailPreview";

interface ApprovalDetailProps {
    item: ApprovalItem | null;
    loading?: boolean;
}



export function ApprovalDetail({ item, loading }: ApprovalDetailProps) {
    const sanitizedBody = useMemo(() => {
        if (!item) return "";
        const snapshot = item.snapshot;
        if (isEmailSnapshot(snapshot)) {
            return DOMPurify.sanitize(snapshot.body || "");
        }
        return "";
    }, [item]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
                <Loading />
                <p className="text-sm text-muted-foreground mt-4">Loading Details...</p>
            </div>
        );
    }

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
            <div className="shrink-0 border-b bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                        {/* Contact name + company */}
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-900 truncate">
                                {contactName}
                            </h2>
                            {item.company_name && (
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {item.company_name}
                                </span>
                            )}
                        </div>

                        {/* To / CC / Provider — labeled rows */}
                        <div className="space-y-1.5">
                            {isEmail && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 font-medium w-8 shrink-0">To</span>
                                    <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                    <span className="text-gray-900 font-medium">{snapshot.contact_email}</span>
                                </div>
                            )}
                            {isEmail && snapshot.cc && snapshot.cc.length > 0 && (
                                <div className="flex items-start gap-2 text-sm min-w-0">
                                    <span className="text-gray-400 font-medium w-8 shrink-0">CC</span>
                                    <AtSign className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-700 flex flex-wrap gap-x-0 gap-y-0.5 min-w-0">
                                        {snapshot.cc.map((email, i) => (
                                            <span key={email} className="break-all">
                                                {email}
                                                {i < snapshot.cc!.length - 1 && <span className="text-gray-300 mx-1">·</span>}
                                            </span>
                                        ))}
                                    </span>
                                </div>
                            )}
                            {isEmail && snapshot.account_provider && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 font-medium w-8 shrink-0">Via</span>
                                    <Send className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                    <span className="text-gray-700">{snapshot.account_provider === "gmail" ? "Gmail" : "Outlook"}</span>
                                </div>
                            )}
                        </div>

                        {/* Submitted by + date */}
                        <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
                            <span className="flex items-center gap-1.5 text-sm text-gray-900">
                                <User className="h-3.5 w-3.5 text-gray-600" />
                                <span className="font-semibold">{item.submitted_by_name}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(item.submitted_at), "MMM d, yyyy · h:mm a")}
                            </span>
                        </div>
                    </div>

                    {/* Status Badge — only for approved/rejected */}
                    <div className="shrink-0">
                        {item.status === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
                                <Check className="h-3 w-3" />
                                Approved
                            </span>
                        )}
                        {item.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                                <X className="h-3 w-3" />
                                Rejected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50 px-6 py-4 pb-28 min-h-0">
                {isEmail ? (
                    <div className="space-y-4">
                        {/* Subject */}
                        <div className="bg-white rounded-lg border px-5 py-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</p>
                            <p className="text-sm font-semibold text-gray-900">{snapshot.subject}</p>
                        </div>

                        {/* Body */}
                        <div className="bg-white rounded-lg border px-5 py-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Email Body</p>
                            <ScaledEmailPreview html={sanitizedBody} />
                        </div>
                    </div>
                ) : (
                    /* LinkedIn content */
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg border px-5 py-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Message</p>
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
