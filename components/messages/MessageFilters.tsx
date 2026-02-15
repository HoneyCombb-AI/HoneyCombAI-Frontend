"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MessageFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function MessageFilters({
  search,
  onSearchChange,
}: MessageFiltersProps) {
  return (
    <div className="p-4 flex items-center gap-2 border-b">
      <div className="relative w-[280px] shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white w-full"
        />
      </div>
    </div>
  );
}