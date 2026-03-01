"use client";

import { useState } from "react";
import { LinkedInContact } from "@/app/api/messages/route";
import { Clock, Edit3, Save, X, Link2, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isValid } from "date-fns";

interface PendingTaskBannerProps {
    contact: LinkedInContact;
    onSave: (taskId: string, updates: { draft_message?: string; connection_note?: string }) => Promise<void>;
}

export function PendingTaskBanner({ contact, onSave }: PendingTaskBannerProps) {
    const isConnectionTask = contact.task_type === "connect";
    const draftContent = isConnectionTask
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

    const taskLabel = isConnectionTask ? "Connection Request" : "Message Reply";
    const TaskIcon = isConnectionTask ? Link2 : MessageSquareReply;

    const handleSave = async () => {
        if (!contact.task_id) return;
        setSaving(true);
        try {
            const updates = isConnectionTask
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
                                Draft
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

                {!editing && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                        className="gap-1.5 text-violet-800 border-violet-300 bg-violet-100 hover:bg-violet-200 hover:border-violet-400 cursor-pointer"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Draft
                    </Button>
                )}
            </div>

            {/* Draft Content */}
            <div className="px-5 pb-4">
                {editing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            maxLength={isConnectionTask ? 300 : undefined}
                            className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-violet-300 bg-white
                         focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
                         placeholder:text-violet-400 resize-y"
                            placeholder={`Enter ${isConnectionTask ? "connection note" : "message"}...`}
                            autoFocus
                        />
                        {isConnectionTask && (
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
        </div>
    );
}
