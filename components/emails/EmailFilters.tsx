"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Plus, Loader2, ChevronDown, Tag, MessageSquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { OrgSender } from "@/types/emails";

interface TagOption {
    name: string;
    color: string;
}

interface EmailFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    hasReply: boolean;
    onHasReplyChange: (value: boolean) => void;
    selectedUserId: string | null;
    onUserIdChange: (userId: string | null) => void;
}

export function EmailFilters({
    search,
    onSearchChange,
    selectedTags,
    onTagsChange,
    hasReply,
    onHasReplyChange,
    selectedUserId,
    onUserIdChange,
}: EmailFiltersProps) {
    const router = useRouter();

    // Which filter slots are visible on the bar
    const [showTags, setShowTags] = useState(false);
    const [showUser, setShowUser] = useState(false);

    // Tags — lazy, fetched once on first open
    const [tags, setTags] = useState<TagOption[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const tagsFetchedRef = useRef(false);

    // Senders — lazy, fetched once on first open
    const [senders, setSenders] = useState<OrgSender[]>([]);
    const [sendersLoading, setSendersLoading] = useState(false);
    const sendersFetchedRef = useRef(false);

    // New email compose popover
    const [composeOpen, setComposeOpen] = useState(false);
    const [contactSearch, setContactSearch] = useState("");
    const [contactResults, setContactResults] = useState<{ id: string; full_name: string; email: string | null; company_name: string | null }[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTags = () => {
        if (tagsFetchedRef.current) return;
        tagsFetchedRef.current = true;
        setTagsLoading(true);
        axios.get("/api/tags")
            .then(res => setTags(res.data ?? []))
            .catch(() => { tagsFetchedRef.current = false; })
            .finally(() => setTagsLoading(false));
    };

    const fetchSenders = () => {
        if (sendersFetchedRef.current) return;
        sendersFetchedRef.current = true;
        setSendersLoading(true);
        axios.get("/api/emails/senders")
            .then(res => setSenders(res.data.senders ?? []))
            .catch(() => { sendersFetchedRef.current = false; })
            .finally(() => setSendersLoading(false));
    };

    const activateTagsFilter = () => {
        setShowTags(true);
        fetchTags();
    };

    const removeTagsFilter = () => {
        setShowTags(false);
        onTagsChange([]);
    };

    const activateUserFilter = () => {
        setShowUser(true);
        fetchSenders();
    };

    const removeUserFilter = () => {
        setShowUser(false);
        onUserIdChange(null);
    };

    const toggleTag = (name: string) => {
        onTagsChange(selectedTags.includes(name)
            ? selectedTags.filter(t => t !== name)
            : [...selectedTags, name]);
    };

    const clearAll = () => {
        removeTagsFilter();
        removeUserFilter();
        onHasReplyChange(false);
    };

    const hasActiveFilters = showTags || hasReply || showUser;

    const selectedSender = senders.find(s => s.user_id === selectedUserId) ?? null;

    // Debounced contact search for compose popover
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
                if (!axios.isCancel(err)) setContactResults([]);
            } finally {
                if (!controller.signal.aborted) setSearching(false);
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

    return (
        <div className="sticky top-0 z-40 flex flex-wrap items-center gap-2 border-b bg-white px-6 py-3 shadow-sm">

            {/* Search */}
            <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search contacts..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className="pl-9 w-56 h-9 bg-white"
                />
            </div>

            <div className="h-6 w-px bg-gray-200 shrink-0" />

            {/* Filter type selector */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-sm">
                        <Search className="h-4 w-4" />
                        Filter
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        onSelect={showTags ? removeTagsFilter : activateTagsFilter}
                        className={cn(showTags && "bg-accent")}
                    >
                        <Tag className="h-4 w-4 mr-2" />
                        Tags
                        {showTags && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => onHasReplyChange(!hasReply)}
                        className={cn(hasReply && "bg-accent")}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Has Reply
                        {hasReply && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={showUser ? removeUserFilter : activateUserFilter}
                        className={cn(showUser && "bg-accent")}
                    >
                        <User className="h-4 w-4 mr-2" />
                        By User
                        {showUser && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Tags sub-filter — appears when Tags is activated */}
            {showTags && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "gap-2 text-sm",
                                selectedTags.length > 0 && "bg-blue-50 border-blue-300 text-blue-700"
                            )}
                        >
                            <Tag className="h-4 w-4" />
                            Tags
                            {selectedTags.length > 0 && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium">
                                    {selectedTags.length}
                                </span>
                            )}
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {tagsLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : tags.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground text-center">No tags available</p>
                        ) : (
                            tags.map(tag => {
                                const active = selectedTags.includes(tag.name);
                                return (
                                    <DropdownMenuItem
                                        key={tag.name}
                                        onSelect={e => { e.preventDefault(); toggleTag(tag.name); }}
                                        className={cn(active && "bg-accent")}
                                    >
                                        <span
                                            className="h-2 w-2 rounded-full mr-2 shrink-0"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                        {active && <span className="ml-auto text-xs">✓</span>}
                                    </DropdownMenuItem>
                                );
                            })
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Has Reply — inline toggle button */}
            {hasReply && (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-sm bg-blue-50 border-blue-300 text-blue-700"
                    onClick={() => onHasReplyChange(false)}
                >
                    <MessageSquare className="h-4 w-4" />
                    Has Reply
                    <X className="h-3 w-3" />
                </Button>
            )}

            {/* By User sub-filter — appears when User is activated */}
            {showUser && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "gap-2 text-sm",
                                selectedUserId && "bg-blue-50 border-blue-300 text-blue-700"
                            )}
                        >
                            <User className="h-4 w-4" />
                            {selectedSender ? selectedSender.display_name : "By User"}
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                        {sendersLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : senders.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground text-center">No senders found</p>
                        ) : (
                            <>
                                {selectedUserId && (
                                    <DropdownMenuItem onSelect={() => onUserIdChange(null)}>
                                        <X className="h-4 w-4 mr-2 text-muted-foreground" />
                                        Clear
                                    </DropdownMenuItem>
                                )}
                                {senders.map(sender => {
                                    const active = selectedUserId === sender.user_id;
                                    return (
                                        <DropdownMenuItem
                                            key={sender.user_id}
                                            onSelect={() => onUserIdChange(active ? null : sender.user_id)}
                                            className={cn(active && "bg-accent")}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{sender.display_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{sender.email}</p>
                                            </div>
                                            {active && <span className="ml-2 text-xs shrink-0">✓</span>}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Clear All — only when any filter is active */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="gap-2 text-sm text-gray-500"
                >
                    <X className="h-4 w-4" />
                    Clear All
                </Button>
            )}

            {/* New Email */}
            <div className="relative shrink-0 ml-auto">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-sm"
                    onClick={() => setComposeOpen(o => !o)}
                >
                    <Plus className="h-3.5 w-3.5" />
                    New
                </Button>

                {composeOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => { setComposeOpen(false); setContactSearch(""); setContactResults([]); }} />
                        <div className="absolute top-full mt-2 right-0 z-20 w-80 rounded-md border bg-white p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Search for a contact</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Type a name or email..."
                                    value={contactSearch}
                                    onChange={e => setContactSearch(e.target.value)}
                                    className="pl-9 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="mt-2 max-h-56 overflow-y-auto no-scrollbar">
                                {searching ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : contactResults.length > 0 ? (
                                    <div className="space-y-0.5">
                                        {contactResults.map(c => (
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
