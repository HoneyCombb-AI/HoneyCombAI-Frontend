"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading";
import { MessageList } from "@/components/messages/MessageList";
import { MessageViewer } from "@/components/messages/MessageViewer";
import { MessageFilters } from "@/components/messages/MessageFilters";
import { MessagePagination } from "@/components/messages/MessagePagination";
import { type MessagesResponse, type StatusFilter } from "@/app/api/messages/route";

export default function MessagesPage() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MessagesResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get<MessagesResponse>("/api/messages", {
        params: {
          page: currentPage,
          limit: pageSize,
          sortOrder,
          status: statusFilter,
          search: search.trim() || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
        },
      });

      const result = response.data;
      setData(result);

      // Auto-select first message if none selected
      if (result.messages.length > 0 && !selectedId) {
        setSelectedId(result.messages[0].id);
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.error || e.message);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortOrder, dateRange, pageSize, currentPage]);

  useEffect(() => {
    if (!authLoading) {
      fetchMessages();
    }
  }, [authLoading, fetchMessages]);

  const messages = useMemo(() => data?.messages || [], [data]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedId) || null,
    [messages, selectedId]
  );

  const hasActiveFilters = useMemo(
    () => statusFilter !== "all" || !!dateRange.start || !!dateRange.end || !!search,
    [statusFilter, dateRange, search]
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setSortOrder("desc");
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedId(null); // Clear selection when changing pages
  }, []);

  const handleSelectMessage = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

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
      <header className="hidden md:flex h-16 items-center gap-2 px-6 border-b bg-white">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              Messages
            </h1>
            <Badge variant="outline" className="text-xs font-normal text-blue-600 border-blue-200">
              Beta
            </Badge>
            {data && (
              <Badge variant="secondary" className="ml-2">
                {data.total_count}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Filter Bar - Sticky */}
      <div className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <MessageFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      {authLoading || loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <Loading />
          <p className="text-sm text-muted-foreground mt-4">
            Loading messages...
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
            {/* Message List */}
            <div className="border-r bg-white lg:col-span-1 overflow-y-auto">
              <MessageList
                messages={messages}
                selectedId={selectedId}
                onSelectMessage={handleSelectMessage}
              />
            </div>

            {/* Message Viewer */}
            <div className="lg:col-span-2 p-6 overflow-y-auto">
              <MessageViewer message={selectedMessage} />
            </div>
          </div>

          {/* Pagination */}
          {data && data.pagination && (
            <MessagePagination
              pagination={data.pagination}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}