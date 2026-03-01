"use client";

import { useState } from "react";
import { ContactEmail } from "@/app/api/emails/route";
import { Edit3, Save, X, Mail, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RichTextEditor } from "./RichTextEditor";
import DOMPurify from "dompurify";

interface PendingDraftBannerProps {
    contact: ContactEmail;
    onSave: (draftId: string, updates: { subject?: string; body?: string }) => Promise<void>;
}

export function PendingDraftBanner({ contact, onSave }: PendingDraftBannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editSubject, setEditSubject] = useState(contact.draft_subject || "");
    const [editBody, setEditBody] = useState(contact.draft_body || "");
    const [saving, setSaving] = useState(false);

    if (!contact.draft_id) return null;

    const handleSave = async () => {
        if (!contact.draft_id) return;
        setSaving(true);
        try {
            await onSave(contact.draft_id, {
                subject: editSubject,
                body: editBody,
            });
            setEditing(false);
        } catch {
            // Error is handled by parent
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditSubject(contact.draft_subject || "");
        setEditBody(contact.draft_body || "");
        setEditing(false);
    };

    const handleStartEdit = () => {
        setEditing(true);
        setIsOpen(true);
    };

    const stepLabel = contact.draft_position
        ? `Step ${contact.draft_position}`
        : "Follow-up";

    const sanitizedPreview = DOMPurify.sanitize(contact.draft_body || "");

    return (
        <div className="border-b border-violet-200 bg-white/95 shadow-sm">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {/* Header row: trigger + edit button side by side */}
                <div className="flex items-center">
                    <CollapsibleTrigger
                        type="button"
                        className="group flex flex-1 items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-violet-50/50 min-w-0"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex-shrink-0">
                                <Mail className="h-4 w-4 text-violet-700" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-violet-900">
                                        Pending Email Draft
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-200 text-violet-800 uppercase tracking-wide">
                                        {stepLabel}
                                    </span>
                                </div>
                                {!isOpen && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {contact.email_account_name && (
                                            <span className="text-xs text-violet-600">
                                                via {contact.email_account_name}
                                            </span>
                                        )}
                                        {contact.draft_subject && (
                                            <>
                                                {contact.email_account_name && (
                                                    <span className="text-xs text-violet-400">·</span>
                                                )}
                                                <span className="text-xs text-violet-700 truncate">
                                                    {contact.draft_subject}
                                                </span>
                                            </>
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

                    {/* Edit button outside the trigger to avoid nested <button> */}
                    {!isOpen && !editing && (
                        <div className="pr-5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className="gap-1.5 text-violet-800 border-violet-300 bg-violet-100 hover:bg-violet-200 hover:border-violet-400 cursor-pointer"
                            >
                                <Edit3 className="h-3 w-3" />
                                Edit
                            </Button>
                        </div>
                    )}
                </div>

                {/* Expanded Content */}
                <CollapsibleContent className="border-t border-violet-200 bg-violet-50/30 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="max-h-[50vh] overflow-y-auto">
                        {editing ? (
                            <div className="p-5 space-y-3">
                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-medium text-violet-700 mb-1 block">Subject</label>
                                    <input
                                        type="text"
                                        value={editSubject}
                                        onChange={(e) => setEditSubject(e.target.value)}
                                        className="w-full p-2.5 text-sm rounded-lg border border-violet-300 bg-white
                                            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
                                            placeholder:text-violet-400"
                                        placeholder="Email subject..."
                                        autoFocus
                                    />
                                </div>

                                {/* Body - Rich Text Editor */}
                                <div>
                                    <label className="text-xs font-medium text-violet-700 mb-1 block">Body</label>
                                    <RichTextEditor
                                        value={editBody}
                                        onChange={setEditBody}
                                        placeholder="Write your email body..."
                                    />
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="gap-1.5 text-gray-600 cursor-pointer"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saving || (!editSubject.trim() && !editBody.trim())}
                                        className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        {saving ? "Saving..." : "Save Draft"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-3">
                                {/* Account info */}
                                {contact.email_account_name && (
                                    <div className="text-xs text-violet-600">
                                        Sending via {contact.email_account_name}
                                    </div>
                                )}

                                {/* Subject preview */}
                                {contact.draft_subject && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-violet-900">
                                            {contact.draft_subject}
                                        </span>
                                    </div>
                                )}

                                {/* Body preview - rendered HTML */}
                                <div className="text-sm text-violet-900 bg-white rounded-lg p-4 border border-violet-200/80 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-violet-600 [&_a]:underline">
                                    {sanitizedPreview ? (
                                        <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
                                    ) : (
                                        <span className="text-violet-500 italic">No draft content yet</span>
                                    )}
                                </div>

                                {/* Edit button */}
                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleStartEdit}
                                        className="gap-1.5 text-violet-800 border-violet-300 bg-violet-100 hover:bg-violet-200 hover:border-violet-400 cursor-pointer"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit Draft
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
