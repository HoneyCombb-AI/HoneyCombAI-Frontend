"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Filter, X, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    // New Email popover state
    const [composeOpen, setComposeOpen] = useState(false);
    const [contactSearch, setContactSearch] = useState("");
    const [contactResults, setContactResults] = useState<{id: string; full_name: string; email: string | null; company_name: string | null}[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced contact search
    useEffect(() => {
        if (!composeOpen || contactSearch.trim().length < 2) {
            setContactResults([]);
            setSearching(false);
            return;
        }
        const controller = new AbortController();
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await axios.get("/api/contacts/search", {
                    params: { q: contactSearch.trim(), limit: 8 },
                    signal: controller.signal,
                });
                setContactResults(res.data.contacts || []);
            } catch (err) {
                if (!axios.isCancel(err)) {
                    setContactResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearching(false);
                }
            }
        }, 300);
        return () => {
            controller.abort();
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [contactSearch, composeOpen]);

    const handleSelectContact = useCallback((contactId: string) => {
        setComposeOpen(false);
        setContactSearch("");
        setContactResults([]);
        router.push(`/emails?contactId=${contactId}`);
    }, [router]);

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

            {/* New Email Button - Right side */}
            <div className="relative shrink-0 ml-auto">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-sm"
                    onClick={() => setComposeOpen(!composeOpen)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    New
                </Button>

                {composeOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => { setComposeOpen(false); setContactSearch(""); setContactResults([]); }}
                        />
                        <div className="absolute top-full mt-2 right-0 z-20 w-80 rounded-md border bg-white p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Search for a contact</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Type a name or email..."
                                    value={contactSearch}
                                    onChange={(e) => setContactSearch(e.target.value)}
                                    className="pl-9 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="mt-2 max-h-56 overflow-y-auto">
                                {searching ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : contactResults.length > 0 ? (
                                    <div className="space-y-0.5">
                                        {contactResults.map((c) => (
                                            <Button
                                                key={c.id}
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={!c.email}
                                                className="w-full justify-start h-auto py-2 font-normal"
                                                onClick={() => handleSelectContact(c.id)}
                                            >
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{c.full_name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {c.email || "No email"}
                                                        {c.company_name && ` · ${c.company_name}`}
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                ) : contactSearch.trim().length >= 2 ? (
                                    <p className="text-sm text-center text-muted-foreground py-4">No contacts found</p>
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-4">Type at least 2 characters</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
