"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalList } from "@/components/admin/ApprovalList";
import { ApprovalDetail } from "@/components/admin/ApprovalDetail";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import type { ApprovalItem, ApprovalListItem, ApprovalSnapshot, ApprovalSubmitter } from "@/types/admin";

type TabStatus = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
    const { role, approvalRequired, setApprovalRequired, loading: authLoading } = useAuth();
    const router = useRouter();
    const { state: sidebarState } = useSidebar();

    const [activeTab, setActiveTab] = useState<TabStatus>("pending");
    const [items, setItems] = useState<ApprovalListItem[]>([]);
    const [fetchLoading, setFetchLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [approvalToggle, setApprovalToggle] = useState(approvalRequired);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<ApprovalItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Filter state
    const [submitters, setSubmitters] = useState<ApprovalSubmitter[]>([]);
    const [submittersLoading, setSubmittersLoading] = useState(false);
    const submittersFetchedRef = useRef(false);
    const [submittedBy, setSubmittedBy] = useState<string | null>(null);
    const [showUserFilter, setShowUserFilter] = useState(false);

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
                params: {
                    status: activeTab,
                    page,
                    limit: 20,
                    ...(submittedBy ? { submitted_by: submittedBy } : {}),
                },
                signal,
            });
            if (page === 1) {
                setItems(res.data.items || []);
            } else {
                setItems((prev) => [...prev, ...(res.data.items || [])]);
            }
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
    }, [activeTab, page, submittedBy]);

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        setSelectedDetail(null);
        try {
            const res = await axios.get(`/api/admin/approvals/${id}`);
            setSelectedDetail(res.data);
        } catch {
            toast.error("Failed to load approval detail");
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedId) fetchDetail(selectedId);
        else setSelectedDetail(null);
    }, [selectedId, fetchDetail]);

    const fetchSubmitters = useCallback(async () => {
        if (submittersFetchedRef.current) return;
        submittersFetchedRef.current = true;
        setSubmittersLoading(true);
        try {
            const res = await axios.get("/api/admin/approvals", {
                params: { status: "pending", page: 1, limit: 1 },
            });
            setSubmitters(res.data.submitters || []);
        } catch {
            submittersFetchedRef.current = false;
        } finally {
            setSubmittersLoading(false);
        }
    }, []);

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
            setSelectedDetail(null);
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
        setSelectedDetail(null);
        setSubmittedBy(null);
        setShowUserFilter(false);
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
            {/* Filter Bar */}
            <div className="shrink-0 sticky top-0 z-40 flex flex-wrap items-center gap-2 border-b bg-white px-6 py-3 shadow-sm">

                {/* Status dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-sm">
                            {tabs.find(t => t.value === activeTab)?.label ?? "Pending"}
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {tabs.map(tab => (
                            <DropdownMenuItem
                                key={tab.value}
                                onSelect={() => handleTabChange(tab.value)}
                                className={cn(activeTab === tab.value && "bg-accent")}
                            >
                                {tab.label}
                                {activeTab === tab.value && (
                                    <span className="ml-auto text-xs text-muted-foreground">✓</span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-gray-200 shrink-0" />

                {/* Filter dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-sm">
                            Filter
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onSelect={() => {
                                if (showUserFilter) {
                                    setShowUserFilter(false);
                                    setSubmittedBy(null);
                                    setPage(1);
                                } else {
                                    setShowUserFilter(true);
                                    fetchSubmitters();
                                }
                            }}
                            className={cn(showUserFilter && "bg-accent")}
                        >
                            <User className="h-4 w-4 mr-2" />
                            By User
                            {showUserFilter && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* By User sub-filter */}
                {showUserFilter && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "gap-2 text-sm",
                                    submittedBy && "bg-blue-50 border-blue-300 text-blue-700"
                                )}
                            >
                                <User className="h-4 w-4" />
                                {submittedBy
                                    ? (submitters.find(s => s.user_id === submittedBy)?.name ?? "User")
                                    : "By User"}
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            {submittersLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : submitters.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-muted-foreground text-center">No submitters found</p>
                            ) : (
                                <>
                                    {submittedBy && (
                                        <DropdownMenuItem onSelect={() => { setSubmittedBy(null); setPage(1); }}>
                                            <X className="h-4 w-4 mr-2 text-muted-foreground" />
                                            Clear
                                        </DropdownMenuItem>
                                    )}
                                    {submitters.map(s => (
                                        <DropdownMenuItem
                                            key={s.user_id}
                                            onSelect={() => { setSubmittedBy(submittedBy === s.user_id ? null : s.user_id); setPage(1); }}
                                            className={cn(submittedBy === s.user_id && "bg-accent")}
                                        >
                                            {s.name}
                                            {submittedBy === s.user_id && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Clear all filters */}
                {showUserFilter && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowUserFilter(false); setSubmittedBy(null); setPage(1); }}
                        className="gap-2 text-sm text-gray-500"
                    >
                        <X className="h-4 w-4" />
                        Clear All
                    </Button>
                )}

                {/* Require Approval toggle — pushed to the right */}
                <div className="flex items-center gap-3 ml-auto">
                    <Label htmlFor="approval-toggle" className="text-sm text-muted-foreground">
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
                        style={{ paddingBottom: activeTab === "pending" && selectedDetail ? actionsHeight : undefined }}
                    >
                        <ApprovalDetail item={selectedDetail} loading={detailLoading} />
                    </div>

                    {/* Action Bar - Fixed at bottom (same pattern as EmailComposer) */}
                    {activeTab === "pending" && selectedDetail && (
                        <div
                            ref={actionsRef}
                            className="fixed bottom-0 z-50"
                            style={actionsStyle}
                        >
                            <ApprovalActions
                                item={selectedDetail}
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
