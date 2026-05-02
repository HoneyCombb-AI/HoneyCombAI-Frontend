"use client";

import { useRef, useState } from "react";
import { RejectedApprovalItem } from "@/types/emails";
import { XCircle, ChevronDown, X, Loader2, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DOMPurify from "dompurify";

interface RejectedApprovalBannerProps {
    rejectedApproval: RejectedApprovalItem;
    onResubmit: (subject: string, body: string) => Promise<void>;
}

export function RejectedApprovalBanner({ rejectedApproval, onResubmit }: RejectedApprovalBannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editSubject, setEditSubject] = useState(rejectedApproval.subject || "");
    const editorRef = useRef<HTMLDivElement>(null);
    const [submitting, setSubmitting] = useState(false);

    const isHtml = /<[a-z][\s\S]*>/i.test(rejectedApproval.body || "");
    const sanitizedPreview = DOMPurify.sanitize(rejectedApproval.body || "");

    const handleStartEdit = () => {
        setEditing(true);
        setIsOpen(true);
        requestAnimationFrame(() => {
            if (editorRef.current) {
                editorRef.current.innerHTML = isHtml ? rejectedApproval.body : rejectedApproval.body;
            }
        });
    };

    const handleCancel = () => {
        setEditSubject(rejectedApproval.subject || "");
        setEditing(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const editedBody = editorRef.current?.innerHTML ?? rejectedApproval.body;
            await onResubmit(editSubject, editedBody);
            setEditing(false);
            setIsOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border-b border-red-200 bg-white/95 shadow-sm">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {/* Header row */}
                <div className="flex items-center">
                    <CollapsibleTrigger
                        type="button"
                        className="group flex flex-1 items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-red-50/50 min-w-0"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 border border-red-200 shrink-0">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-sm font-semibold text-red-900">Email Rejected</span>
                                {!isOpen && rejectedApproval.rejection_reason && (
                                    <p className="text-xs text-red-600 mt-0.5 truncate">
                                        {rejectedApproval.rejection_reason}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-red-400 shrink-0">
                            <span className="hidden sm:inline">
                                {isOpen ? "Collapse" : "Expand"}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </div>
                    </CollapsibleTrigger>

                    {!isOpen && !editing && (
                        <div className="pr-5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className="gap-1.5 text-red-800 border-red-300 bg-red-100 hover:bg-red-200 hover:border-red-400 cursor-pointer"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Edit & Resubmit
                            </Button>
                        </div>
                    )}
                </div>

                {/* Expanded content */}
                <CollapsibleContent className="border-t border-red-200 bg-red-50/30 overflow-hidden">
                    <div className="max-h-[50vh] overflow-y-auto">
                        {editing ? (
                            <div className="p-5 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-red-700 mb-1 block">Subject</label>
                                    <input
                                        type="text"
                                        value={editSubject}
                                        onChange={(e) => setEditSubject(e.target.value)}
                                        className="w-full p-2.5 text-sm rounded-lg border border-red-300 bg-white
                                            focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                                            placeholder:text-red-400"
                                        placeholder="Email subject..."
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-red-700 mb-1 block">Body</label>
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="w-full min-h-[150px] max-h-[40vh] overflow-y-auto p-3 text-sm rounded-lg border border-red-300 bg-white
                                            focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                                            [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline"
                                    />
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={submitting}
                                        className="gap-1.5 text-gray-600 cursor-pointer disabled:opacity-40"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="gap-1.5 bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-40"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Submitting...</>
                                        ) : (
                                            <><RotateCcw className="h-3.5 w-3.5" />Resubmit for Approval</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-3">
                                {rejectedApproval.rejection_reason && (
                                    <div className="flex items-start gap-2 rounded-lg bg-red-100 border border-red-200 px-3 py-2">
                                        <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-red-700">{rejectedApproval.rejection_reason}</p>
                                    </div>
                                )}

                                {rejectedApproval.subject && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                        <span className="text-sm font-medium text-red-900">
                                            {rejectedApproval.subject}
                                        </span>
                                    </div>
                                )}

                                <div className="text-sm text-red-900 bg-white rounded-lg p-4 border border-red-200/80 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline">
                                    {sanitizedPreview ? (
                                        <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
                                    ) : (
                                        <span className="text-red-400 italic">No content</span>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleStartEdit}
                                        className="gap-1.5 text-red-800 border-red-300 bg-red-100 hover:bg-red-200 hover:border-red-400 cursor-pointer"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Edit & Resubmit
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
