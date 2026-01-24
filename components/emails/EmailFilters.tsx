"use client";

import { useEffect, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { cn } from "@/lib/utils";

interface EmailFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
}

interface TagOption {
    name: string;
    color: string;
}

export function EmailFilters({
    search,
    onSearchChange,
    selectedTags,
    onTagsChange,
}: EmailFiltersProps) {
    const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        axios.get("/api/tags")
            .then(res => setAvailableTags(res.data))
            .catch(err => console.error("Failed to load tags", err));
    }, []);

    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            onTagsChange(selectedTags.filter(t => t !== tagName));
        } else {
            onTagsChange([...selectedTags, tagName]);
        }
    };

    return (
        <div className="p-4 flex items-center gap-2 border-b">
            {/* Search Bar - Reduced Width */}
            <div className="relative w-[280px] shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 bg-white w-full"
                />
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1 shrink-0" />

            {/* Filter Controls & Tags */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "h-9 border-dashed cursor-pointer",
                            selectedTags.length > 0 && "bg-blue-50 border-blue-200 text-blue-700"
                        )}
                    >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Tags
                        {selectedTags.length > 0 && (
                            <span className="ml-1.5 rounded-md bg-blue-100 px-1.5 py-0.5 text-xs">
                                {selectedTags.length}
                            </span>
                        )}
                    </Button>

                    {/* Simple Dropdown Content */}
                    {isOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsOpen(false)}
                            />
                            <div className="absolute top-full mt-2 left-0 z-20 w-64 rounded-md border bg-white p-2 shadow-md animate-in fade-in-0 zoom-in-95">
                                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">
                                    Filter by Tags
                                </p>
                                {availableTags.length === 0 ? (
                                    <p className="px-2 py-2 text-sm text-center text-muted-foreground">
                                        No tags available
                                    </p>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                        {availableTags.map((tag) => {
                                            const isSelected = selectedTags.includes(tag.name);
                                            return (
                                                <div
                                                    key={tag.name}
                                                    onClick={() => toggleTag(tag.name)}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                                                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-4 w-4 rounded-sm border flex items-center justify-center",
                                                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-primary"
                                                    )}>
                                                        {isSelected && <span className="text-[10px]">✓</span>}
                                                    </div>
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: tag.color }}
                                                    />
                                                    <span>{tag.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Selected Tags Display - Scrollable */}
                {selectedTags.length > 0 && (
                    <>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 px-1">
                            {selectedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="h-7 rounded-sm px-2 font-normal whitespace-nowrap shrink-0"
                                >
                                    {tag}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto w-auto p-0 ml-1.5 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                        onClick={() => toggleTag(tag)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>

                        {/* Reset Button - Fixed */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTagsChange([])}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0 ml-1"
                        >
                            Reset
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
