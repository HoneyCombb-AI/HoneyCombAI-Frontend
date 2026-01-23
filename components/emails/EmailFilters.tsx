"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EmailFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
}

export function EmailFilters({
    search,
    onSearchChange,
}: EmailFiltersProps) {
    return (
        <div className="p-4">
            {/* Search Only */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, or company..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
        </div>
    );
}
