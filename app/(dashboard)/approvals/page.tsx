"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ApprovalCard } from "@/components/admin/ApprovalCard";
import type { ApprovalItem } from "@/types/admin";

type TabStatus = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
    const { role, approvalRequired, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabStatus>("pending");
    const [items, setItems] = useState<ApprovalItem[]>([]);
    const [fetchLoading, setFetchLoading] = useState<boolean>(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [approvalToggle, setApprovalToggle] = useState(approvalRequired);

    // Redirect non-admins
    useEffect(() => {
        if (!authLoading && role !== null && role !== "admin") {
            router.replace("/overview");
        }
    }, [authLoading, role, router]);

    // Sync toggle with context
    useEffect(() => {
        setApprovalToggle(approvalRequired);
    }, [approvalRequired]);

    const fetchItems = useCallback(async () => {
        setFetchLoading(true);
        try {
            const res = await axios.get("/api/admin/approvals", {
                params: { status: activeTab, page, limit: 20 },
            });
            setItems(res.data.items || []);
            setTotal(res.data.total || 0);
            setHasMore(res.data.hasMore || false);
        } catch {
            toast.error("Failed to load approvals");
        } finally {
            setFetchLoading(false);
        }
    }, [activeTab, page]);

    useEffect(() => {
        if (!authLoading && role === "admin") {
            fetchItems();
        }
    }, [authLoading, role, fetchItems]);

    const handleToggleApproval = useCallback(async (checked: boolean) => {
        try {
            await axios.patch("/api/admin/approval-settings", {
                approval_required: checked,
            });
            setApprovalToggle(checked);
            toast.success(
                checked
                    ? "Approval required for all outreach"
                    : "Approval requirement disabled"
            );
        } catch {
            toast.error("Failed to update setting");
        }
    }, []);

    const handleAction = useCallback(async (
        id: string,
        action: "approve" | "reject",
        payload?: { snapshot?: Record<string, unknown>; rejection_reason?: string }
    ) => {
        try {
            await axios.patch(`/api/admin/approvals/${id}`, {
                action,
                ...payload,
            });
            toast.success(action === "approve" ? "Approved & sent" : "Rejected");
            setItems((prev) => prev.filter((item) => item.id !== id));
            setTotal((prev) => Math.max(0, prev - 1));
        } catch {
            toast.error(`Failed to ${action}`);
        }
    }, []);

    const handleApprove = useCallback((id: string, snapshot?: Record<string, unknown>) => {
        handleAction(id, "approve", { snapshot });
    }, [handleAction]);

    const handleReject = useCallback((id: string, reason: string) => {
        handleAction(id, "reject", { rejection_reason: reason });
    }, [handleAction]);

    const handleTabChange = useCallback((tab: TabStatus) => {
        setActiveTab(tab);
        setPage(1);
    }, []);

    if (authLoading || role === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Loading />
                <p className="text-sm text-muted-foreground mt-4">Loading...</p>
            </div>
        );
    }

    if (role !== "admin") {
        return null;
    }

    const tabs: { label: string; value: TabStatus }[] = [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
    ];

    return (
        <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
            {/* Toolbar — same level: tabs on left, toggle on right */}
            <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.value}
                            variant={activeTab === tab.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTabChange(tab.value)}
                            className="gap-2 text-sm"
                        >
                            {tab.label}
                            {tab.value === "pending" && total > 0 && activeTab === "pending" && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {total}
                                </Badge>
                            )}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Label
                        htmlFor="approval-toggle"
                        className="text-sm text-muted-foreground"
                    >
                        Require Approval
                    </Label>
                    <Switch
                        id="approval-toggle"
                        checked={approvalToggle}
                        onCheckedChange={handleToggleApproval}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                {fetchLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loading />
                        <p className="text-sm text-muted-foreground mt-4">Loading your approvals...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ShieldCheck className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-sm text-muted-foreground">
                            No {activeTab} items
                        </p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {items.map((item) => (
                            <ApprovalCard
                                key={item.id}
                                item={item}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                isReadOnly={activeTab !== "pending"}
                            />
                        ))}

                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
