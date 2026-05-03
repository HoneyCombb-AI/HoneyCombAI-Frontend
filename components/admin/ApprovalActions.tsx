"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil, Loader2, AtSign } from "lucide-react";
import type { ApprovalItem, ApprovalSnapshot, EmailSnapshot, LinkedInSnapshot } from "@/types/admin";
import { isEmailSnapshot } from "@/types/admin";
import { RichTextEditor } from "@/components/emails/RichTextEditor";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

interface ApprovalActionsProps {
    item: ApprovalItem;
    onApprove: (id: string, snapshot?: ApprovalSnapshot) => void;
    onReject: (id: string, reason: string) => void;
}



function CcTagInput({ cc, onChange }: { cc: string[]; onChange: (cc: string[]) => void }) {
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
        <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <AtSign className="h-3 w-3" />
                CC
            </label>
            <div
                className="mt-1 flex flex-wrap items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {cc.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
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
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
                    placeholder={cc.length === 0 ? "Add CC recipients..." : ""}
                />
            </div>
        </div>
    );
}

export function ApprovalActions({ item, onApprove, onReject }: ApprovalActionsProps) {
    const [editing, setEditing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [editSnapshot, setEditSnapshot] = useState<ApprovalSnapshot>(item.snapshot);
    const [loadingAction, setLoadingAction] = useState<"approving" | "rejecting" | null>(null);
    const [prevItemId, setPrevItemId] = useState(item.id);
    if (item.id !== prevItemId) {
        setPrevItemId(item.id);
        setEditing(false);
        setRejecting(false);
        setRejectionReason("");
        setEditSnapshot(item.snapshot);
        setLoadingAction(null);
    }

    const snapshot = item.snapshot;
    const isEmail = isEmailSnapshot(snapshot);

    const isLoading = loadingAction !== null;

    const handleApprove = async () => {
        setLoadingAction("approving");
        try {
            await onApprove(item.id, editing ? editSnapshot : undefined);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleReject = async () => {
        setLoadingAction("rejecting");
        try {
            await onReject(item.id, rejectionReason);
        } finally {
            setLoadingAction(null);
            setRejecting(false);
        }
    };

    return (
        <div className="border-t bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            {/* Edit panel — shown when editing */}
            {editing && (
                <div className="border-b px-6 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
                    {isEmail ? (
                        <>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                                <Input
                                    value={isEmailSnapshot(editSnapshot) ? editSnapshot.subject : ""}
                                    onChange={(e) =>
                                        setEditSnapshot((s) => ({ ...s, subject: e.target.value } as EmailSnapshot))
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <CcTagInput
                                cc={isEmailSnapshot(editSnapshot) ? (editSnapshot.cc ?? []) : []}
                                onChange={(cc) =>
                                    setEditSnapshot((s) => ({ ...s, cc: cc.length ? cc : undefined } as EmailSnapshot))
                                }
                            />
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Body</label>
                                <div className="mt-1">
                                    <RichTextEditor
                                        value={isEmailSnapshot(editSnapshot) ? editSnapshot.body : ""}
                                        onChange={(html) =>
                                            setEditSnapshot((s) => ({ ...s, body: html } as EmailSnapshot))
                                        }
                                        placeholder="Edit email body..."
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Message</label>
                            <Textarea
                                value={
                                    !isEmailSnapshot(editSnapshot)
                                        ? (editSnapshot.draft_message || editSnapshot.connection_note || "")
                                        : ""
                                }
                                onChange={(e) => {
                                    const field = !isEmailSnapshot(editSnapshot) && editSnapshot.draft_message
                                        ? "draft_message"
                                        : "connection_note";
                                    setEditSnapshot((s) => ({ ...s, [field]: e.target.value } as LinkedInSnapshot));
                                }}
                                rows={4}
                                className="mt-1"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Rejection reason — shown when rejecting */}
            {rejecting && (
                <div className="border-b px-6 py-3">
                    <label className="text-xs font-medium text-muted-foreground">
                        Rejection Reason (optional)
                    </label>
                    <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Why are you rejecting this?"
                        rows={2}
                        className="mt-1"
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Action bar */}
            <div className="px-6 py-3 flex items-center gap-2">
                {rejecting ? (
                    <>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={loadingAction === "rejecting"}
                            className="gap-1.5 whitespace-nowrap"
                        >
                            {loadingAction === "rejecting" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <X className="h-3.5 w-3.5" />
                            )}
                            Confirm Reject
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejecting(false)}
                            disabled={loadingAction === "rejecting"}
                            className="whitespace-nowrap"
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                if (!editing) {
                                    setEditSnapshot(item.snapshot);
                                }
                                setEditing(!editing);
                            }}
                            disabled={isLoading}
                            className="gap-1.5 whitespace-nowrap"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {editing ? "Cancel Edit" : "Edit"}
                        </Button>
                        <div className="flex-1" />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejecting(true)}
                            disabled={isLoading}
                            className="gap-1.5 whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <X className="h-3.5 w-3.5" />
                            Reject
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApprove}
                            disabled={loadingAction === "approving"}
                            className="gap-1.5 whitespace-nowrap"
                        >
                            {loadingAction === "approving" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Check className="h-3.5 w-3.5" />
                            )}
                            {editing ? "Save & Approve" : "Approve"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
