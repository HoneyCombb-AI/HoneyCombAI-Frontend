"use client";

import { useRef, useState, useMemo } from "react";
import { Mail, XCircle, FileText, ChevronDown, Edit3, Save, X, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DOMPurify from "dompurify";
import { toast } from "sonner";

type BannerVariant = "violet" | "amber" | "red";

export interface EmailStatusBannerProps {
    variant: BannerVariant;
    title: string;
    subject: string;
    body: string;
    badge?: string;
    accountName?: string | null;
    rejectionReason?: string | null;
    editable?: boolean;
    editButtonLabel?: string;
    saveButtonLabel?: string;
    successMessage?: string;
    onSave?: (subject: string, body: string) => Promise<void>;
}

const STYLES: Record<BannerVariant, {
    wrapper: string; trigger: string; iconWrap: string; iconColor: string;
    title: string; chevron: string; expanded: string; expandedBorder: string;
    subjectPreview: string; body: string; bodyBorder: string;
    editBtn: string; saveBtn: string; inputClass: string;
    badge: string; account: string; dot: string;
}> = {
    violet: {
        wrapper:       "border-violet-200 bg-white/95",
        trigger:       "hover:bg-violet-50/50",
        iconWrap:      "bg-violet-100 border-violet-200",
        iconColor:     "text-violet-700",
        title:         "text-violet-900",
        chevron:       "text-violet-500",
        expanded:      "bg-violet-50/30",
        expandedBorder:"border-violet-200",
        subjectPreview:"text-violet-700",
        body:          "text-violet-900",
        bodyBorder:    "border-violet-200/80",
        editBtn:       "text-violet-800 border-violet-300 bg-violet-100 hover:bg-violet-200 hover:border-violet-400",
        saveBtn:       "bg-violet-600 hover:bg-violet-700",
        inputClass:    "border-violet-300 focus:ring-violet-400 focus:border-violet-400 placeholder:text-violet-400",
        badge:         "bg-violet-200 text-violet-800",
        account:       "text-violet-600",
        dot:           "text-violet-400",
    },
    amber: {
        wrapper:       "border-amber-200 bg-amber-50/50",
        trigger:       "hover:bg-amber-50/50",
        iconWrap:      "bg-violet-100 border-violet-200",
        iconColor:     "text-violet-700",
        title:         "text-amber-900",
        chevron:       "text-amber-400",
        expanded:      "bg-amber-50/30",
        expandedBorder:"border-amber-200",
        subjectPreview:"text-amber-700",
        body:          "text-amber-900",
        bodyBorder:    "border-amber-200/80",
        editBtn:       "text-amber-800 border-amber-300 bg-amber-100 hover:bg-amber-200 hover:border-amber-400",
        saveBtn:       "bg-amber-600 hover:bg-amber-700",
        inputClass:    "border-amber-300 focus:ring-amber-400 focus:border-amber-400 placeholder:text-amber-400",
        badge:         "bg-amber-200 text-amber-800",
        account:       "text-amber-600",
        dot:           "text-amber-400",
    },
    red: {
        wrapper:       "border-red-200 bg-white/95",
        trigger:       "hover:bg-red-50/50",
        iconWrap:      "bg-red-100 border-red-200",
        iconColor:     "text-red-600",
        title:         "text-red-900",
        chevron:       "text-red-400",
        expanded:      "bg-red-50/30",
        expandedBorder:"border-red-200",
        subjectPreview:"text-red-700",
        body:          "text-red-900",
        bodyBorder:    "border-red-200/80",
        editBtn:       "text-red-800 border-red-300 bg-red-100 hover:bg-red-200 hover:border-red-400",
        saveBtn:       "bg-red-600 hover:bg-red-700",
        inputClass:    "border-red-300 focus:ring-red-400 focus:border-red-400 placeholder:text-red-400",
        badge:         "bg-red-200 text-red-800",
        account:       "text-red-600",
        dot:           "text-red-400",
    },
};

function splitHtmlBody(html: string): { before: string; inner: string; after: string } {
    const bodyOpenMatch = html.match(/(<body[^>]*>)/i);
    const bodyCloseMatch = html.match(/<\/body>/i);
    if (bodyOpenMatch && bodyOpenMatch.index !== undefined && bodyCloseMatch && bodyCloseMatch.index !== undefined) {
        const bodyOpenEnd = bodyOpenMatch.index + bodyOpenMatch[0].length;
        return {
            before: html.substring(0, bodyOpenEnd),
            inner:  html.substring(bodyOpenEnd, bodyCloseMatch.index),
            after:  html.substring(bodyCloseMatch.index),
        };
    }
    return { before: "", inner: html, after: "" };
}

export function EmailStatusBanner({
    variant,
    title,
    subject,
    body,
    badge,
    accountName,
    rejectionReason,
    editable = false,
    editButtonLabel = "Edit",
    saveButtonLabel = "Save",
    successMessage = "Saved successfully.",
    onSave,
}: EmailStatusBannerProps) {
    const s = STYLES[variant];
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editSubject, setEditSubject] = useState(subject);
    const [saving, setSaving] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const htmlParts = useMemo(() => splitHtmlBody(body), [body]);
    const sanitizedPreview = useMemo(() => DOMPurify.sanitize(body), [body]);

    const handleStartEdit = () => {
        setEditing(true);
        setIsOpen(true);
        requestAnimationFrame(() => {
            if (editorRef.current) editorRef.current.innerHTML = htmlParts.inner;
        });
    };

    const handleCancel = () => {
        setEditSubject(subject);
        setEditing(false);
    };

    const handleSave = async () => {
        if (!onSave) return;
        setSaving(true);
        try {
            const editedInner = editorRef.current?.innerHTML ?? body;
            const fullHtml = htmlParts.before
                ? htmlParts.before + editedInner + htmlParts.after
                : editedInner;
            await onSave(editSubject, fullHtml);
            toast.success(successMessage);
            setEditing(false);
        } catch {
            toast.error("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const BannerIcon = variant === "red" ? XCircle : Mail;
    const EditIcon  = variant === "red" ? RotateCcw : Edit3;
    const SaveIcon  = variant === "red" ? RotateCcw : Save;

    return (
        <div className={`border-b shadow-sm ${s.wrapper}`}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex items-center">
                    <CollapsibleTrigger
                        type="button"
                        className={`group flex flex-1 items-center justify-between gap-3 px-5 py-3 text-left transition-colors min-w-0 ${s.trigger}`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${s.iconWrap}`}>
                                <BannerIcon className={`h-4 w-4 ${s.iconColor}`} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold ${s.title}`}>{title}</span>
                                    {badge && (
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${s.badge}`}>
                                            {badge}
                                        </span>
                                    )}
                                </div>
                                {!isOpen && (
                                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                        {accountName && (
                                            <span className={`text-xs shrink-0 ${s.account}`}>via {accountName}</span>
                                        )}
                                        {accountName && subject && (
                                            <span className={`text-xs shrink-0 ${s.dot}`}>·</span>
                                        )}
                                        {subject && (
                                            <span className={`text-xs truncate ${s.subjectPreview}`}>{subject}</span>
                                        )}
                                        {rejectionReason && !subject && (
                                            <span className={`text-xs truncate ${s.subjectPreview}`}>{rejectionReason}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 text-xs shrink-0 ${s.chevron}`}>
                            <span className="hidden sm:inline">{isOpen ? "Collapse" : "Expand"}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
                        </div>
                    </CollapsibleTrigger>

                    {editable && !isOpen && !editing && (
                        <div className="pr-5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className={`gap-1.5 cursor-pointer ${s.editBtn}`}
                            >
                                <EditIcon className="h-3 w-3" />
                                {editButtonLabel}
                            </Button>
                        </div>
                    )}
                </div>

                <CollapsibleContent className={`border-t overflow-hidden ${s.expandedBorder} ${s.expanded}`}>
                    <div className="max-h-[50vh] overflow-y-auto">
                        {editing ? (
                            <div className="p-5 space-y-3">
                                <div>
                                    <label className={`text-xs font-medium mb-1 block ${s.title}`}>Subject</label>
                                    <input
                                        type="text"
                                        value={editSubject}
                                        onChange={(e) => setEditSubject(e.target.value)}
                                        className={`w-full p-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${s.inputClass}`}
                                        placeholder="Email subject..."
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs font-medium mb-1 block ${s.title}`}>Body</label>
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        className={`w-full min-h-[150px] max-h-[40vh] overflow-y-auto p-3 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline ${s.inputClass}`}
                                    />
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="gap-1.5 text-gray-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`gap-1.5 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${s.saveBtn}`}
                                    >
                                        {saving ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                                        ) : (
                                            <><SaveIcon className="h-3.5 w-3.5" />{saveButtonLabel}</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-3">
                                {rejectionReason && (
                                    <div className="flex items-start gap-2 rounded-lg bg-red-100 border border-red-200 px-3 py-2">
                                        <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-red-700">{rejectionReason}</p>
                                    </div>
                                )}
                                {accountName && (
                                    <div className={`text-xs ${s.account}`}>Sending via {accountName}</div>
                                )}
                                {subject && (
                                    <div className="flex items-center gap-2">
                                        <FileText className={`h-3.5 w-3.5 shrink-0 ${s.iconColor}`} />
                                        <span className={`text-sm font-medium ${s.body}`}>{subject}</span>
                                    </div>
                                )}
                                <div className={`text-sm bg-white rounded-lg p-4 border [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-blue-600 [&_a]:underline ${s.bodyBorder} ${s.body}`}>
                                    {sanitizedPreview ? (
                                        <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
                                    ) : (
                                        <span className="italic opacity-60">No content</span>
                                    )}
                                </div>
                                {editable && (
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleStartEdit}
                                            className={`gap-1.5 cursor-pointer ${s.editBtn}`}
                                        >
                                            <EditIcon className="h-3.5 w-3.5" />
                                            {editButtonLabel}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
