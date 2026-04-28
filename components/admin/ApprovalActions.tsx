"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import type { ApprovalItem } from "@/types/admin";
import { RichTextEditor } from "@/components/emails/RichTextEditor";
import { Input } from "@/components/ui/input";

interface ApprovalActionsProps {
    item: ApprovalItem;
    onApprove: (id: string, snapshot?: Record<string, unknown>) => void;
    onReject: (id: string, reason: string) => void;
}

function isEmailSnapshot(snapshot: unknown): snapshot is { subject: string; body: string } {
    return typeof snapshot === "object" && snapshot !== null && "subject" in snapshot;
}

export function ApprovalActions({ item, onApprove, onReject }: ApprovalActionsProps) {
    const [editing, setEditing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [editSnapshot, setEditSnapshot] = useState<Record<string, unknown>>(
        item.snapshot as unknown as Record<string, unknown>
    );
    const [loadingAction, setLoadingAction] = useState<"approving" | "rejecting" | null>(null);
    const [prevItemId, setPrevItemId] = useState(item.id);
    if (item.id !== prevItemId) {
        setPrevItemId(item.id);
        setEditing(false);
        setRejecting(false);
        setRejectionReason("");
        setEditSnapshot(item.snapshot as unknown as Record<string, unknown>);
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
                                    value={(editSnapshot.subject as string) || ""}
                                    onChange={(e) =>
                                        setEditSnapshot((s) => ({ ...s, subject: e.target.value }))
                                    }
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Body</label>
                                <div className="mt-1">
                                    <RichTextEditor
                                        value={(editSnapshot.body as string) || ""}
                                        onChange={(html) =>
                                            setEditSnapshot((s) => ({ ...s, body: html }))
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
                                    (editSnapshot.draft_message as string) ||
                                    (editSnapshot.connection_note as string) ||
                                    ""
                                }
                                onChange={(e) =>
                                    setEditSnapshot((s) => ({ ...s, draft_message: e.target.value }))
                                }
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
                                    setEditSnapshot(item.snapshot as unknown as Record<string, unknown>);
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
                            className={`gap-1.5 whitespace-nowrap text-white ${
                                loadingAction === "approving"
                                    ? "bg-green-600"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
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
