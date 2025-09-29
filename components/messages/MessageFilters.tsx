"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown, Filter, X } from "lucide-react";

export type StatusFilter = "all" | "requested" | "completed";

interface MessageFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const MessageFilters = React.memo(({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  dateRange,
  onDateRangeChange,
  hasActiveFilters,
  onResetFilters
}: MessageFiltersProps) => {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-t bg-gray-50/50 flex-wrap">
      <div className="flex-1 max-w-md min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
      >
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
        onClick={() => onSortOrderChange(sortOrder === "desc" ? "asc" : "desc")}
      >
        <ArrowUpDown className="h-4 w-4 mr-2" />
        {sortOrder === "desc" ? "Newest" : "Oldest"}
      </Button>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateRange.start}
          onChange={(e) =>
            onDateRangeChange({ ...dateRange, start: e.target.value })
          }
          className="w-[150px]"
          placeholder="Start date"
        />
        <span className="text-sm text-gray-500">to</span>
        <Input
          type="date"
          value={dateRange.end}
          onChange={(e) =>
            onDateRangeChange({ ...dateRange, end: e.target.value })
          }
          className="w-[150px]"
          placeholder="End date"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
});

MessageFilters.displayName = "MessageFilters";