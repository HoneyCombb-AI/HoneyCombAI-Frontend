"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Mail,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    Pencil,
    User,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ApprovalItem, EmailSnapshot, LinkedInSnapshot } from "@/types/admin";

interface ApprovalCardProps {
    item: ApprovalItem;
    onApprove: (id: string, snapshot?: Record<string, unknown>) => void;
    onReject: (id: string, reason: string) => void;
    isReadOnly?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
    email_draft: "Email Draft",
    manual_email: "Manual Email",
    linkedin_task: "LinkedIn Task",
    manual_linkedin: "Manual LinkedIn",
};

function isEmailSnapshot(snapshot: unknown): snapshot is EmailSnapshot {
    return typeof snapshot === "object" && snapshot !== null && "subject" in snapshot;
}

export function ApprovalCard({
    item,
    onApprove,
    onReject,
    isReadOnly = false,
}: ApprovalCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [editSnapshot, setEditSnapshot] = useState<Record<string, unknown>>(
        item.snapshot as unknown as Record<string, unknown>
    );
    const [actionLoading, setActionLoading] = useState(false);

    const isEmail = item.item_type === "email_draft" || item.item_type === "manual_email";
    const snapshot = item.snapshot;

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await onApprove(item.id, editing ? editSnapshot : undefined);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        setActionLoading(true);
        try {
            await onReject(item.id, rejectionReason);
        } finally {
            setActionLoading(false);
            setRejecting(false);
        }
    };

    return (
        <div className="rounded-lg border bg-white shadow-sm">
            {/* Card Header */}
            <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                        className={cn(
                            "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center",
                            isEmail
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600"
                        )}
                    >
                        {isEmail ? (
                            <Mail className="h-4 w-4" />
                        ) : (
                            <MessageSquare className="h-4 w-4" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                                {TYPE_LABELS[item.item_type] || item.item_type}
                            </Badge>
                            {item.status === "approved" && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                    Approved
                                </Badge>
                            )}
                            {item.status === "rejected" && (
                                <Badge className="bg-red-100 text-red-700 text-xs">
                                    Rejected
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">
                            To: {item.contact_name || "Unknown Contact"}
                            {item.company_name && ` · ${item.company_name}`}
                        </p>
                        {isEmailSnapshot(snapshot) && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                                Subject: {snapshot.subject}
                            </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.submitted_by_name}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(item.submitted_at), "MMM d, h:mm a")}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0"
                >
                    {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t px-4 py-3">
                    {editing && !isReadOnly ? (
                        <div className="space-y-3">
                            {isEmailSnapshot(snapshot) ? (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Subject
                                        </label>
                                        <Input
                                            value={(editSnapshot.subject as string) || ""}
                                            onChange={(e) =>
                                                setEditSnapshot((s) => ({
                                                    ...s,
                                                    subject: e.target.value,
                                                }))
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Body
                                        </label>
                                        <Textarea
                                            value={(editSnapshot.body as string) || ""}
                                            onChange={(e) =>
                                                setEditSnapshot((s) => ({
                                                    ...s,
                                                    body: e.target.value,
                                                }))
                                            }
                                            rows={8}
                                            className="mt-1 font-mono text-sm"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Message
                                    </label>
                                    <Textarea
                                        value={
                                            (editSnapshot.draft_message as string) ||
                                            (editSnapshot.connection_note as string) ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setEditSnapshot((s) => ({
                                                ...s,
                                                draft_message: e.target.value,
                                            }))
                                        }
                                        rows={6}
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                            {isEmailSnapshot(snapshot)
                                ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: snapshot.body }} />
                                : <div className="whitespace-pre-wrap">{(snapshot as LinkedInSnapshot).draft_message ||
                                  (snapshot as LinkedInSnapshot).connection_note ||
                                  "No content"}</div>}
                        </div>
                    )}

                    {/* Rejection reason display */}
                    {item.status === "rejected" && item.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
                            <span className="font-medium">Reason:</span>{" "}
                            {item.rejection_reason}
                        </div>
                    )}

                    {/* Review info for completed items */}
                    {item.status !== "pending" && item.reviewed_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Reviewed by {item.reviewed_by_name || "Admin"} on{" "}
                            {format(new Date(item.reviewed_at), "MMM d, h:mm a")}
                        </p>
                    )}
                </div>
            )}

            {/* Rejection reason input */}
            {rejecting && !isReadOnly && (
                <div className="border-t px-4 py-3">
                    <label className="text-xs font-medium text-muted-foreground">
                        Rejection Reason (optional)
                    </label>
                    <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Why are you rejecting this?"
                        rows={2}
                        className="mt-1"
                    />
                    <div className="flex gap-2 mt-2">
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={actionLoading}
                        >
                            Confirm Reject
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejecting(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {!isReadOnly && item.status === "pending" && !rejecting && (
                <div className="border-t px-4 py-3 flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setExpanded(true);
                            setEditing(!editing);
                        }}
                        className="gap-1.5"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        {editing ? "Cancel Edit" : "Edit"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Check className="h-3.5 w-3.5" />
                        {editing ? "Save & Approve" : "Approve"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejecting(true)}
                        className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <X className="h-3.5 w-3.5" />
                        Reject
                    </Button>
                </div>
            )}
        </div>
    );
}
