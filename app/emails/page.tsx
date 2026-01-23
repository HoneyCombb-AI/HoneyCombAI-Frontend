"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { EmailList } from "@/components/emails/EmailList";
import { EmailViewer } from "@/components/emails/EmailViewer";
import { EmailFilters } from "@/components/emails/EmailFilters";
import { type EmailsResponse } from "@/app/api/emails/route";

export default function EmailsPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<EmailsResponse | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");

    const fetchEmails = useCallback(async () => {
        try {
            setLoading(true);

            const response = await axios.get<EmailsResponse>("/api/emails", {
                params: {
                    search: search.trim() || undefined,
                },
            });

            const result = response.data;
            setData(result);

            // Auto-select first email if none selected
            if (result.emails.length > 0 && !selectedId) {
                setSelectedId(result.emails[0].id);
            }
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                setError(e.response?.data?.error || e.message);
            } else {
                setError(e instanceof Error ? e.message : "Failed to load emails");
            }
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (!authLoading) {
            fetchEmails();
        }
    }, [authLoading, fetchEmails]);

    const emails = useMemo(() => data?.emails || [], [data]);

    const selectedEmail = useMemo(
        () => emails.find((e) => e.id === selectedId) || null,
        [emails, selectedId]
    );

    const handleSelectEmail = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-gray-50/50 overflow-hidden">
            {/* Filter Bar - Fixed at top */}
            <div className="flex-shrink-0 border-b bg-white shadow-sm">
                <EmailFilters
                    search={search}
                    onSearchChange={setSearch}
                />
            </div>

            {authLoading || loading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">
                        Loading contact emails...
                    </p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
                    {/* Email List - Independently scrollable */}
                    <div className="border-r bg-white lg:col-span-1 overflow-y-auto h-full">
                        <EmailList
                            emails={emails}
                            selectedId={selectedId}
                            onSelectEmail={handleSelectEmail}
                        />
                    </div>

                    {/* Email Viewer - Independently scrollable */}
                    <div className="lg:col-span-2 overflow-y-auto h-full">
                        <EmailViewer email={selectedEmail} />
                    </div>
                </div>
            )}
        </div>
    );
}
