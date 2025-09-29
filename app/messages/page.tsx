"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/loading";
import {
    Calendar,
    Mail,
    Search,
    ArrowUpDown,
    Filter,
    X,
    CheckCircle2,
    Clock,
    User
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface OutreachMessage {
    id: string;
    full_name: string;
    profile_picture: string | null;
    outreach_message: string;
    outreach_requested: boolean;
    outreach_completed: boolean;
    updated_at: string;
}

interface MessagesResponse {
    messages: OutreachMessage[];
    total_count: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

type StatusFilter = "all" | "requested" | "completed";

export default function MessagesPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<MessagesResponse | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: "",
        end: ""
    });

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: "1",
                limit: "100",
                sortOrder,
                status: statusFilter,
            });

            if (search.trim()) params.set("search", search.trim());
            if (dateRange.start) params.set("startDate", dateRange.start);
            if (dateRange.end) params.set("endDate", dateRange.end);

            const response = await fetch(`/api/messages?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch messages");

            const result: MessagesResponse = await response.json();
            setData(result);

            if (result.messages.length > 0 && !selectedId) {
                setSelectedId(result.messages[0].id);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load messages");
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, sortOrder, dateRange, selectedId]);

    useEffect(() => {
        if (!authLoading) {
            fetchMessages();
        }
    }, [authLoading, fetchMessages]);

    const messages = useMemo(() => data?.messages || [], [data]);

    const selected = useMemo(
        () => messages.find((m) => m.id === selectedId) || null,
        [messages, selectedId]
    );

    const hasActiveFilters = useMemo(
        () => statusFilter !== "all" || dateRange.start || dateRange.end || search,
        [statusFilter, dateRange, search]
    );

    const resetFilters = useCallback(() => {
        setSearch("");
        setStatusFilter("all");
        setDateRange({ start: "", end: "" });
        setSortOrder("desc");
    }, []);

    const getStatusBadge = (msg: OutreachMessage) => {
        if (msg.outreach_completed) {
            return (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Response Ready
                </Badge>
            );
        }
        if (msg.outreach_requested) {
            return (
                <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Generating
                </Badge>
            );
        }
        return null;
    };

    if (error) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <div className="flex items-center gap-3 border-b bg-white px-6 py-3">
                    <SidebarTrigger />
                    <h1 className="text-lg font-semibold">Messages</h1>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
            {/* Top Navigation Bar */}
            <div className="border-b bg-white">
                <header className="hidden md:flex h-16 items-center gap-2 px-6">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex flex-1 items-center justify-between">
                        {/* Logo/Brand */}
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-gray-900">
                                Messages
                            </h1>
                            {data && (
                                <Badge variant="secondary" className="ml-2">
                                    {data.total_count}
                                </Badge>
                            )}
                        </div>
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="flex items-center gap-3 px-6 py-3 border-t bg-gray-50/50">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search messages..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Messages</SelectItem>
                            <SelectItem value="completed">Response Ready</SelectItem>
                            <SelectItem value="requested">Generating</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        {sortOrder === "desc" ? "Newest" : "Oldest"}
                    </Button>

                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-[150px]"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-[150px]"
                        />
                    </div>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {authLoading || loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">
                        Loading messages...
                    </p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
                    {/* Message List */}
                    <div className="border-r bg-white lg:col-span-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
                        {messages.length === 0 ? (
                            <div className="p-6 text-center">
                                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No messages found.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {messages.map((msg) => {
                                    const isActive = msg.id === selectedId;
                                    const date = new Date(msg.updated_at);
                                    const snippet = msg.outreach_message
                                        .replace(/\n/g, " ")
                                        .slice(0, 80);

                                    return (
                                        <li
                                            key={msg.id}
                                            className={`cursor-pointer px-4 py-3 hover:bg-gray-50 transition-colors ${isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                                }`}
                                            onClick={() => setSelectedId(msg.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {msg.profile_picture ? (
                                                    <img
                                                        src={msg.profile_picture}
                                                        alt={msg.full_name}
                                                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <User className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-sm truncate">
                                                            {msg.full_name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            {date.toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <div className="mb-2">
                                                        {getStatusBadge(msg)}
                                                    </div>

                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {snippet}...
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Message Viewer */}
                    <div className="lg:col-span-2 p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
                        {selected ? (
                            <Card className="bg-white border-gray-200">
                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        {selected.profile_picture ? (
                                            <img
                                                src={selected.profile_picture}
                                                alt={selected.full_name}
                                                className="h-16 w-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="h-8 w-8 text-gray-500" />
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <h2 className="text-xl font-semibold mb-2">{selected.full_name}</h2>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {getStatusBadge(selected)}
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {new Date(selected.updated_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="prose max-w-none">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">Outreach Message</span>
                                        </div>
                                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">
                                            {selected.outreach_message}
                                        </pre>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Mail className="h-16 w-16 text-gray-300 mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    Select a message to view details
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}