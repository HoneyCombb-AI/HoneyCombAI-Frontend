"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ApprovalList } from "@/components/admin/ApprovalList";
import { ApprovalDetail } from "@/components/admin/ApprovalDetail";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import type { ApprovalItem, ApprovalSnapshot } from "@/types/admin";

type TabStatus = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
    const { role, approvalRequired, setApprovalRequired, loading: authLoading } = useAuth();
    const router = useRouter();
    const { state: sidebarState } = useSidebar();

    const [activeTab, setActiveTab] = useState<TabStatus>("pending");
    const [items, setItems] = useState<ApprovalItem[]>([]);
    const [fetchLoading, setFetchLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [approvalToggle, setApprovalToggle] = useState(approvalRequired);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Refs for fixed-position action bar (same pattern as EmailComposer)
    const detailRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [actionsRect, setActionsRect] = useState({ left: 0, width: 0 });
    const [actionsHeight, setActionsHeight] = useState(0);

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

    const fetchItems = useCallback(async (signal?: AbortSignal) => {
        if (page === 1) {
            setFetchLoading(true);
        } else {
            setLoadingMore(true);
        }
        try {
            const res = await axios.get("/api/admin/approvals", {
                params: { status: activeTab, page, limit: 20 },
                signal,
            });
            if (page === 1) {
                setItems(res.data.items || []);
            } else {
                setItems((prev) => [...prev, ...(res.data.items || [])]);
            }
            setTotal(res.data.total || 0);
            setHasMore(res.data.hasMore || false);
        } catch (err) {
            if (!axios.isCancel(err)) {
                toast.error("Failed to load approvals");
            }
        } finally {
            if (!signal?.aborted) {
                setFetchLoading(false);
                setLoadingMore(false);
            }
        }
    }, [activeTab, page]);

    useEffect(() => {
        if (!authLoading && role === "admin") {
            const controller = new AbortController();
            fetchItems(controller.signal);
            return () => controller.abort();
        }
    }, [authLoading, role, fetchItems]);

    // Auto-select first item when items change
    useEffect(() => {
        if (items.length > 0 && (!selectedId || !items.find(i => i.id === selectedId))) {
            setSelectedId(items[0].id);
        }
    }, [items]);

    const selectedItem = useMemo(
        () => items.find((i) => i.id === selectedId) || null,
        [items, selectedId]
    );

    // Calculate action bar rect (same as EmailComposer positioning)
    const updateActionsRect = useCallback(() => {
        if (!detailRef.current) return;
        const rect = detailRef.current.getBoundingClientRect();
        setActionsRect({ left: rect.left, width: rect.width });
    }, []);

    useLayoutEffect(() => {
        updateActionsRect();
    }, [updateActionsRect, selectedId]);

    // Recalculate after sidebar transition (200ms CSS transition)
    useEffect(() => {
        const timer = setTimeout(() => updateActionsRect(), 220);
        return () => clearTimeout(timer);
    }, [sidebarState, updateActionsRect]);

    useEffect(() => {
        updateActionsRect();
        window.addEventListener("resize", updateActionsRect);
        return () => window.removeEventListener("resize", updateActionsRect);
    }, [updateActionsRect]);

    useEffect(() => {
        if (!detailRef.current || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => updateActionsRect());
        observer.observe(detailRef.current);
        return () => observer.disconnect();
    }, [updateActionsRect]);

    // Track action bar height for bottom padding
    useEffect(() => {
        if (!actionsRef.current) return;
        const el = actionsRef.current;
        const update = () => setActionsHeight(el.getBoundingClientRect().height);
        update();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => update());
        observer.observe(el);
        return () => observer.disconnect();
    }, [selectedId]);

    const actionsStyle: CSSProperties = actionsRect.width
        ? { left: actionsRect.left, width: actionsRect.width }
        : { left: 0, visibility: "hidden", pointerEvents: "none" };

    const handleToggleApproval = useCallback(async (checked: boolean) => {
        try {
            await axios.patch("/api/admin/approval-settings", {
                approval_required: checked,
            });
            setApprovalRequired(checked);
            setApprovalToggle(checked);
            toast.success(
                checked
                    ? "Approval required for all outreach"
                    : "Approval requirement disabled"
            );
        } catch {
            toast.error("Failed to update setting");
        }
    }, [setApprovalRequired]);

    const handleAction = useCallback(async (
        id: string,
        action: "approve" | "reject",
        payload?: { snapshot?: ApprovalSnapshot; rejection_reason?: string }
    ) => {
        try {
            await axios.patch(`/api/admin/approvals/${id}`, {
                action,
                ...payload,
            });
            toast.success(
                action === "approve"
                    ? "Email approved and sent successfully"
                    : "Email rejected successfully"
            );
            setItems((prev) => prev.filter((item) => item.id !== id));
            setTotal((prev) => Math.max(0, prev - 1));
        } catch {
            toast.error(
                action === "approve"
                    ? "Failed to approve email"
                    : "Failed to reject email"
            );
        }
    }, []);

    const handleApprove = useCallback((id: string, snapshot?: ApprovalSnapshot) => {
        return handleAction(id, "approve", { snapshot });
    }, [handleAction]);

    const handleReject = useCallback((id: string, reason: string) => {
        return handleAction(id, "reject", { rejection_reason: reason });
    }, [handleAction]);

    const handleTabChange = useCallback((tab: TabStatus) => {
        setActiveTab(tab);
        setPage(1);
        setSelectedId(null);
    }, []);

    if (authLoading || role === null) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
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
        <div className="flex h-screen w-full flex-col bg-gray-50/50 overflow-hidden">
            {/* Filter Bar - Fixed at top */}
            <div className="shrink-0 sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-sm">
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
            {fetchLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">Loading approvals...</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden min-h-0">
                    {/* Left Panel - Item List */}
                    <div className="border-r bg-white lg:col-span-1 overflow-y-auto h-full min-h-0">
                        <ApprovalList
                            items={items}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            hasMore={hasMore}
                            onLoadMore={() => setPage((p) => p + 1)}
                            loadingMore={loadingMore}
                            activeTab={activeTab}
                        />
                    </div>

                    {/* Right Panel - Detail View */}
                    <div
                        ref={detailRef}
                        className="lg:col-span-2 overflow-hidden h-full min-h-0 relative"
                        style={{ paddingBottom: activeTab === "pending" && selectedItem ? actionsHeight : undefined }}
                    >
                        <ApprovalDetail item={selectedItem} />
                    </div>

                    {/* Action Bar - Fixed at bottom (same pattern as EmailComposer) */}
                    {activeTab === "pending" && selectedItem && (
                        <div
                            ref={actionsRef}
                            className="fixed bottom-0 z-50"
                            style={actionsStyle}
                        >
                            <ApprovalActions
                                item={selectedItem}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
