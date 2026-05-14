"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { MessageList } from "@/components/messages/MessageList";
import { MessageViewer } from "@/components/messages/MessageViewer";
import { MessageFilters } from "@/components/messages/MessageFilters";
import { type LinkedInContactsResponse, type LinkedInContact, type LinkedInMessage } from "@/types/messages";

export default function LinkedInPage() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<LinkedInContact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const LIMIT = 20;

  // Keep selectedIdRef in sync with selectedId state
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContacts = useCallback(async (isLoadMore = false) => {
    try {
      let currentPage: number;

      if (isLoadMore) {
        currentPage = pageRef.current + 1;
        pageRef.current = currentPage;
        setLoadingMore(true);
      } else {
        currentPage = 1;
        pageRef.current = 1;
        setLoading(true);
      }

      const response = await axios.get<LinkedInContactsResponse>("/api/messages", {
        params: {
          search: debouncedSearch.trim() || undefined,
          page: currentPage,
          limit: LIMIT,
        },
      });

      const result = response.data;

      if (isLoadMore) {
        setContacts(prev => [...prev, ...result.contacts]);
        setPage(currentPage);
      } else {
        setContacts(result.contacts);
        setPage(1);
        // Auto-select first contact only if nothing is currently selected
        if (result.contacts.length > 0 && !selectedIdRef.current) {
          setSelectedId(result.contacts[0].id);
        }
      }

      setHasMore(result.hasMore);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.error || e.message);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load contacts");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!authLoading) {
      fetchContacts(false);
    }
  }, [authLoading, fetchContacts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchContacts(true);
    }
  };

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedId) || null,
    [contacts, selectedId]
  );

  const handleSelectContact = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const fetchMessages = useCallback(async (contactId: string) => {
    try {
      setMessageLoading(true);
      setMessageError(null);
      const response = await axios.get(`/api/messages/${contactId}`);
      setMessages(response.data.messages || []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setMessageError(e.response?.data?.error || e.message);
      } else {
        setMessageError(e instanceof Error ? e.message : "Failed to load messages");
      }
      setMessages([]);
    } finally {
      setMessageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContact?.id) {
      fetchMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact?.id, fetchMessages]);

  const handleTaskSave = useCallback(async (
    taskId: string,
    updates: { draft_message?: string; connection_note?: string }
  ) => {
    if (!selectedContact) return;
    await axios.patch(`/api/messages/${selectedContact.id}/task`, {
      task_id: taskId,
      ...updates,
    });
    // Update local state so the UI reflects the change immediately
    setContacts(prev =>
      prev.map(c =>
        c.id === selectedContact.id
          ? {
            ...c,
            ...(updates.draft_message !== undefined && { draft_message: updates.draft_message }),
            ...(updates.connection_note !== undefined && { connection_note: updates.connection_note }),
          }
          : c
      )
    );
  }, [selectedContact]);

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50/50 overflow-hidden">
      {/* Search Bar */}
      <div className="shrink-0 border-b bg-white shadow-sm">
        <MessageFilters
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <p className="text-base font-medium text-red-500">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : authLoading || (loading && page === 1) ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loading />
          <p className="text-sm text-muted-foreground mt-4">
            Loading LinkedIn contacts...
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden min-h-0">
          {/* Contact List */}
          <div className="border-r bg-white lg:col-span-1 overflow-y-auto h-full min-h-0">
            <MessageList
              contacts={contacts}
              selectedId={selectedId}
              onSelectContact={handleSelectContact}
              hasMore={hasMore}
              onLoadMore={loadMore}
              loadingMore={loadingMore}
            />
          </div>

          {/* Message Viewer */}
          <div className="lg:col-span-2 overflow-hidden h-full min-h-0 relative">
            <MessageViewer
              contact={selectedContact}
              messages={messages}
              loading={messageLoading}
              error={messageError}
              onTaskSave={handleTaskSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}