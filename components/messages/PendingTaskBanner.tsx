"use client";

import { useState } from "react";
import { LinkedInContact } from "@/app/api/messages/route";
import { Clock, Edit3, Save, X, Link2, MessageSquareReply, Eye, ThumbsUp, MessageCircle, RefreshCw, Send, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isValid } from "date-fns";

interface PendingTaskBannerProps {
    contact: LinkedInContact;
    onSave: (taskId: string, updates: { draft_message?: string; connection_note?: string }) => Promise<void>;
}

// Task types that support editing draft content
const EDITABLE_TASK_TYPES = ["connect_with_note", "message", "reply", "comment"] as const;
type EditableTaskType = typeof EDITABLE_TASK_TYPES[number];

const TASK_META: Record<string, { label: string; icon: typeof Link2 }> = {
    connect: { label: "Connection Request", icon: Link2 },
    connect_with_note: { label: "Connection Request", icon: Link2 },
    message: { label: "Message", icon: Send },
    reply: { label: "Message Reply", icon: MessageSquareReply },
    comment: { label: "Comment", icon: MessageCircle },
    like: { label: "Like", icon: ThumbsUp },
    view: { label: "Profile View", icon: Eye },
    reaction: { label: "Reaction", icon: SmilePlus },
    check_status: { label: "Status Check", icon: RefreshCw },
    check_reply: { label: "Reply Check", icon: RefreshCw },
};

export function PendingTaskBanner({ contact, onSave }: PendingTaskBannerProps) {
    const taskType = contact.task_type || "";
    const isEditable = EDITABLE_TASK_TYPES.includes(taskType as EditableTaskType);
    const isConnectionNoteTask = taskType === "connect_with_note";

    const draftContent = isConnectionNoteTask
        ? contact.connection_note
        : contact.draft_message;

    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(draftContent || "");
    const [saving, setSaving] = useState(false);

    if (!contact.task_id) return null;

    const scheduledDate = contact.scheduled_at ? new Date(contact.scheduled_at) : null;
    const formattedDate =
        scheduledDate && isValid(scheduledDate)
            ? format(scheduledDate, "MMM d, yyyy 'at' h:mm a")
            : null;

    const meta = TASK_META[taskType] || { label: taskType, icon: RefreshCw };
    const taskLabel = meta.label;
    const TaskIcon = meta.icon;

    const handleSave = async () => {
        if (!contact.task_id) return;
        setSaving(true);
        try {
            const updates = isConnectionNoteTask
                ? { connection_note: editValue }
                : { draft_message: editValue };
            await onSave(contact.task_id, updates);
            setEditing(false);
        } catch {
            // Error is handled by parent
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(draftContent || "");
        setEditing(false);
    };

    return (
        <div className="border-b bg-violet-50 border-violet-200">
            {/* Header Row */}
            <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 border border-violet-200">
                        <TaskIcon className="h-4 w-4 text-violet-700" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-violet-900">
                                Pending {taskLabel}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-200 text-violet-800 uppercase tracking-wide">
                                {isEditable ? "Draft" : "Scheduled"}
                            </span>
                        </div>
                        {formattedDate && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-violet-600" />
                                <span className="text-xs text-violet-700">
                                    Scheduled: {formattedDate}
                                </span>
                                {contact.linkedin_account_name && (
                                    <>
                                        <span className="text-xs text-violet-500 mx-1">·</span>
                                        <span className="text-xs text-violet-700">
                                            via {contact.linkedin_account_name}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {isEditable && !editing && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditValue(draftContent || ""); setEditing(true); }}
                        className="gap-1.5 text-violet-800 border-violet-300 bg-violet-100 hover:bg-violet-200 hover:border-violet-400 cursor-pointer"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Draft
                    </Button>
                )}
            </div>

            {/* Draft Content — only shown for editable task types */}
            {isEditable && (
                <div className="px-5 pb-4">
                    {editing ? (
                        <div className="space-y-3">
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                maxLength={isConnectionNoteTask ? 300 : undefined}
                                className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-violet-300 bg-white
                             focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
                             placeholder:text-violet-400 resize-y"
                                placeholder={`Enter ${isConnectionNoteTask ? "connection note" : "message"}...`}
                                autoFocus
                            />
                            {isConnectionNoteTask && (
                                <p className="text-xs text-violet-600">
                                    {editValue.length}/300 characters (LinkedIn connection note limit)
                                </p>
                            )}
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
                                    disabled={saving || !editValue.trim()}
                                    className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {saving ? "Saving..." : "Save Draft"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-violet-900 bg-violet-100/60 rounded-lg p-3 border border-violet-200/80 whitespace-pre-wrap">
                            {draftContent || (
                                <span className="text-violet-500 italic">No draft content yet</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Other Pending Tasks */}
            {contact.other_pending_tasks?.length > 0 && (
                <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        Also pending:
                    </span>
                    {contact.other_pending_tasks.map((task, idx) => {
                        const otherMeta = TASK_META[task.task_type] || { label: task.task_type, icon: RefreshCw };
                        const OtherIcon = otherMeta.icon;
                        return (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200"
                            >
                                <OtherIcon className="h-2.5 w-2.5" />
                                {otherMeta.label}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
