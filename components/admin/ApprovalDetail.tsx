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
    AlertTriangle,
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
            {/* Header - Compact Contact Info */}
            <div className="shrink-0 border-b bg-white px-6 py-3">
                {/* Row 1: Name + Company + Badge */}
                <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 truncate">
                            {contactName}
                        </h2>
                        {item.company_name && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                                <Building2 className="h-3 w-3" />
                                {item.company_name}
                            </span>
                        )}
                    </div>
                    <div className="shrink-0">
                        {item.status === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-800 border border-green-200">
                                <Check className="h-3 w-3" />
                                Approved
                            </span>
                        )}
                        {item.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                                <X className="h-3 w-3" />
                                Rejected
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 2: To · CC · Via · Submitted by · Date — all inline */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    {isEmail && (
                        <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="font-semibold text-gray-900">{snapshot.contact_email}</span>
                        </span>
                    )}
                    {isEmail && snapshot.cc && snapshot.cc.length > 0 && (
                        <span className="group relative flex items-center gap-1 cursor-pointer">
                            <AtSign className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">CC: {snapshot.cc.length}</span>
                            {/* Hover tooltip */}
                            <span className="hidden group-hover:block absolute left-0 top-full pt-1 z-50">
                                <span className="block bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 w-max max-w-xs">
                                    {snapshot.cc.map(email => (
                                        <span key={email} className="block text-xs text-gray-700 py-0.5">{email}</span>
                                    ))}
                                </span>
                            </span>
                        </span>
                    )}
                    {isEmail && snapshot.bcc && snapshot.bcc.length > 0 && (
                        <span className="group relative flex items-center gap-1 cursor-pointer">
                            <AtSign className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">BCC: {snapshot.bcc.length}</span>
                            {/* Hover tooltip */}
                            <span className="hidden group-hover:block absolute left-0 top-full pt-1 z-50">
                                <span className="block bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 w-max max-w-xs">
                                    {snapshot.bcc.map(email => (
                                        <span key={email} className="block text-xs text-gray-700 py-0.5">{email}</span>
                                    ))}
                                </span>
                            </span>
                        </span>
                    )}
                    {isEmail && snapshot.account_provider && (
                        <span className="flex items-center gap-1">
                            <Send className="h-3 w-3 text-gray-400" />
                            <span>{snapshot.account_provider === "gmail" ? "Gmail" : "Outlook"}</span>
                        </span>
                    )}
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="font-semibold text-gray-900">{item.submitted_by_name}</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {format(new Date(item.submitted_at), "MMM d, yyyy · h:mm a")}
                    </span>
                </div>
            </div>

            {/* Validation warning banner */}
            {item.validation_status && item.validation_status !== 'valid' && (
                <div className="shrink-0 flex items-start gap-2.5 px-6 py-3 bg-amber-50 border-b border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                        {item.validation_status === 'contact_deleted' && 'The contact this email was addressed to has been deleted. This approval cannot be sent.'}
                        {item.validation_status === 'email_deleted' && 'The recipient email address has been removed from this contact. Please select a new email below before approving.'}
                        {item.validation_status === 'email_changed' && `The recipient email has changed since submission${item.current_email ? ` to "${item.current_email}"` : ''}. Please select the correct email below before approving.`}
                    </p>
                </div>
            )}

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
