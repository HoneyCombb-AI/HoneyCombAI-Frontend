"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import {
    Mail, XCircle, FileText, ChevronDown, Edit3, Save,
    X, Loader2, RotateCcw, Trash2, AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import type { ContactEmailAddress } from "@/types/emails";

type BannerVariant = "violet" | "amber" | "red";

export interface ResubmitData {
    subject: string;
    body: string;
    contact_email_id: string;
    contact_email: string;
    cc: string[];
    bcc: string[];
}

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
    // Rejected resubmit props
    contactEmails?: ContactEmailAddress[];
    initialContactEmailId?: string | null;
    initialTo?: string | null;
    initialCc?: string[] | null;
    initialBcc?: string[] | null;
    accountProvider?: "gmail" | "outlook" | null;
    accountEmail?: string | null;
    onResubmit?: (data: ResubmitData) => Promise<void>;
    onDiscard?: () => Promise<void>;
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

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ── CC tag input (mirrors EmailComposer) ──────────────────────────────────────
interface CcInputProps {
    cc: string[];
    onChange: (cc: string[]) => void;
    inputClass: string;
    placeholder?: string;
}

function CcTagInput({ cc, onChange, inputClass, placeholder = "Add CC recipients..." }: CcInputProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = useCallback((raw: string) => {
        const email = raw.trim().toLowerCase();
        if (!email) return;
        if (!isValidEmail(email)) { toast.error(`"${email}" is not a valid email address`); return; }
        if (cc.includes(email)) return;
        onChange([...cc, email]);
        setInput("");
    }, [cc, onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && cc.length > 0) {
            onChange(cc.slice(0, -1));
        }
    };

    return (
        <div
            className={`flex flex-wrap items-center gap-1.5 w-full min-h-[36px] px-2.5 py-1.5 text-sm rounded-lg border bg-white focus-within:ring-2 cursor-text ${inputClass}`}
            onClick={() => inputRef.current?.focus()}
        >
            {cc.map(email => (
                <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-medium">
                    {email}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(cc.filter(c => c !== email)); }}
                        className="hover:text-red-600 cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => addTag(input)}
                className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder:text-gray-400"
                placeholder={cc.length === 0 ? placeholder : ""}
            />
        </div>
    );
}

// ── Resubmit edit form (red variant) ─────────────────────────────────────────
interface ResubmitFormProps {
    subject: string;
    body: string;
    contactEmails: ContactEmailAddress[];
    initialContactEmailId?: string | null;
    initialTo: string;
    initialCc: string[];
    initialBcc: string[];
    accountProvider: "gmail" | "outlook" | null;
    accountEmail: string | null;
    onSubmit: (data: ResubmitData) => Promise<void>;
    onCancel: () => void;
    onDiscard?: () => Promise<void>;
    s: typeof STYLES["red"];
}

function ResubmitForm({
    subject, body, contactEmails, initialContactEmailId, initialTo, initialCc, initialBcc,
    accountProvider, accountEmail, onSubmit, onCancel, onDiscard, s,
}: ResubmitFormProps) {
    const [editSubject, setEditSubject] = useState(subject);
    const [editBody, setEditBody] = useState(body);
    const initialEmailId =
        initialContactEmailId ||
        contactEmails.find(ce => ce.email === initialTo)?.id ||
        contactEmails.find(ce => ce.is_primary)?.id ||
        contactEmails[0]?.id ||
        "";
    const [editContactEmailId, setEditContactEmailId] = useState(initialEmailId);
    const [editCc, setEditCc] = useState<string[]>(initialCc);
    const [editBcc, setEditBcc] = useState<string[]>(initialBcc);
    const [saving, setSaving] = useState(false);
    const [discarding, setDiscarding] = useState(false);

    const handleSubmit = async () => {
        const selectedEmail = contactEmails.find(ce => ce.id === editContactEmailId);
        if (!selectedEmail) {
            toast.error("Select a recipient email.");
            return;
        }

        setSaving(true);
        try {
            await onSubmit({
                subject: editSubject,
                body: editBody,
                contact_email_id: selectedEmail.id,
                contact_email: selectedEmail.email,
                cc: editCc,
                bcc: editBcc,
            });
            toast.success("Email resubmitted for approval.");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                ?? "Failed to resubmit. Please try again.";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = async () => {
        if (!onDiscard) return;
        setDiscarding(true);
        try {
            await onDiscard();
            toast.success("Email discarded.");
        } catch {
            toast.error("Failed to discard. Please try again.");
        } finally {
            setDiscarding(false);
        }
    };

    const providerLabel = accountProvider === "gmail" ? "Gmail" : accountProvider === "outlook" ? "Outlook" : "Email";
    const selectedEmail = contactEmails.find(ce => ce.id === editContactEmailId);

    return (
        <div className="p-5 space-y-3">
            {/* From */}
            <div>
                <label className={`text-xs font-medium mb-1 block ${s.title}`}>From</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{accountEmail || "Connected account"}</span>
                    <span className="ml-auto text-xs text-gray-400">{providerLabel}</span>
                </div>
            </div>

            {/* To */}
            <div>
                <label className={`text-xs font-medium mb-1 block ${s.title}`}>To</label>
                {contactEmails.length > 1 ? (
                    <Select value={editContactEmailId} onValueChange={setEditContactEmailId}>
                        <SelectTrigger className={`w-full text-sm h-9 ${s.inputClass}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {contactEmails.map(ce => (
                                <SelectItem key={ce.id} value={ce.id}>
                                    {ce.email}{ce.is_primary ? " (primary)" : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedEmail?.email || initialTo || "—"}
                    </div>
                )}
            </div>

            {/* CC */}
            <div>
                <label className={`text-xs font-medium mb-1 flex items-center gap-1 ${s.title}`}>
                    <AtSign className="h-3 w-3" />
                    CC
                </label>
                <CcTagInput cc={editCc} onChange={setEditCc} inputClass={s.inputClass} />
            </div>

            {/* BCC */}
            <div>
                <label className={`text-xs font-medium mb-1 flex items-center gap-1 ${s.title}`}>
                    <AtSign className="h-3 w-3" />
                    BCC
                </label>
                <CcTagInput cc={editBcc} onChange={setEditBcc} inputClass={s.inputClass} placeholder="Add BCC recipients..." />
            </div>

            {/* Subject */}
            <div>
                <label className={`text-xs font-medium mb-1 block ${s.title}`}>Subject</label>
                <input
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className={`w-full p-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${s.inputClass}`}
                    placeholder="Email subject..."
                />
            </div>

            {/* Body */}
            <div>
                <label className={`text-xs font-medium mb-1 block ${s.title}`}>Body</label>
                <RichTextEditor
                    value={editBody}
                    onChange={setEditBody}
                    placeholder="Write your message..."
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-between pt-1">
                {onDiscard ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDiscard}
                        disabled={discarding || saving}
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {discarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Discard
                    </Button>
                ) : <span />}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={saving || discarding}
                        className="gap-1.5 text-gray-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={saving || discarding || !editContactEmailId}
                        className="gap-1.5 text-white bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Submitting...</>
                        ) : (
                            <><RotateCcw className="h-3.5 w-3.5" />Submit for Approval</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

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
    contactEmails = [],
    initialContactEmailId,
    initialTo,
    initialCc,
    initialBcc,
    accountProvider,
    accountEmail,
    onResubmit,
    onDiscard,
}: EmailStatusBannerProps) {
    const s = STYLES[variant];
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editSubject, setEditSubject] = useState(subject);
    const [saving, setSaving] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const sanitizedPreview = useMemo(() => DOMPurify.sanitize(body), [body]);

    const isRejectMode = variant === "red" && !!onResubmit;

    const handleStartEdit = () => {
        setEditing(true);
        setIsOpen(true);
    };

    const handleCancel = () => {
        setEditSubject(subject);
        setEditing(false);
    };

    const handleSave = async () => {
        if (!onSave) return;
        setSaving(true);
        try {
            await onSave(editSubject, body);
            toast.success(successMessage);
            setEditing(false);
        } catch {
            toast.error("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const BannerIcon = variant === "red" ? XCircle : Mail;
    const EditIcon   = variant === "red" ? RotateCcw : Edit3;

    return (
        <div className={`border-b shadow-sm ${s.wrapper}`}>
            <Collapsible open={isOpen} onOpenChange={v => { setIsOpen(v); if (!v) setEditing(false); }}>
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
                    <div className="max-h-[70vh] overflow-y-auto">
                        {editing && isRejectMode ? (
                            <ResubmitForm
                                subject={editSubject}
                                body={body}
                                contactEmails={contactEmails}
                                initialContactEmailId={initialContactEmailId}
                                initialTo={initialTo || (contactEmails[0]?.email ?? "")}
                                initialCc={initialCc ?? []}
                                initialBcc={initialBcc ?? []}
                                accountProvider={accountProvider ?? null}
                                accountEmail={accountEmail ?? null}
                                onSubmit={async (data) => { await onResubmit!(data); }}
                                onCancel={handleCancel}
                                onDiscard={onDiscard}
                                s={s}
                            />
                        ) : editing ? (
                            // Generic edit form for violet/amber
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
                                            <><Save className="h-3.5 w-3.5" />{saveButtonLabel}</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Read-only expanded view
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
