"use client";

import { useState, useMemo } from "react";
import { ContactEmail } from "@/types/emails";
import { Mail, FileText, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DOMPurify from "dompurify";

interface PendingApprovalBannerProps {
    contact: ContactEmail;
}


/**
 * Shows a read-only banner for emails awaiting admin approval.
 * Same visual pattern as PendingDraftBanner (violet styling).
 */
export function PendingApprovalBanner({ contact }: PendingApprovalBannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const sanitizedPreview = useMemo(
        () => DOMPurify.sanitize(contact.pending_approval_body || ""),
        [contact.pending_approval_body]
    );

    if (!contact.pending_approval_id) return null;

    return (
        <div className="border-b shadow-sm border-violet-200 bg-white/95">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {/* Header row */}
                <div className="flex items-center">
                    <CollapsibleTrigger
                        type="button"
                        className="group flex flex-1 items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-violet-50/50 min-w-0"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 shrink-0">
                                <Mail className="h-4 w-4 text-violet-700" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-amber-900">
                                        Awaiting Admin Approval
                                    </span>
                                </div>
                                {!isOpen && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {contact.pending_approval_subject && (
                                            <span className="text-xs text-violet-700 truncate">
                                                {contact.pending_approval_subject}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-violet-500 shrink-0">
                            <span className="hidden sm:inline">
                                {isOpen ? "Collapse" : "Expand"}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </div>
                    </CollapsibleTrigger>
                </div>

                {/* Expanded Content */}
                <CollapsibleContent className="border-t border-violet-200 bg-violet-50/30 overflow-hidden">
                    <div className="max-h-[50vh] overflow-y-auto">
                        <div className="p-5 space-y-3">
                            {/* Subject preview */}
                            {contact.pending_approval_subject && (
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                                    <span className="text-sm font-medium text-violet-900">
                                        {contact.pending_approval_subject}
                                    </span>
                                </div>
                            )}

                            {/* Body preview - rendered HTML */}
                            <div className="text-sm text-violet-900 bg-white rounded-lg p-4 border border-violet-200/80 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-violet-600 [&_a]:underline">
                                {sanitizedPreview ? (
                                    <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
                                ) : (
                                    <span className="text-violet-500 italic">No content</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
