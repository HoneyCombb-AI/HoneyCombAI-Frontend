"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { MessageList } from "@/components/messages/MessageList";
import { MessageViewer } from "@/components/messages/MessageViewer";
import { MessageFilters } from "@/components/messages/MessageFilters";
import { type LinkedInContactsResponse, type LinkedInContact } from "@/app/api/messages/route";
import { LinkedInMessage } from "@/app/api/messages/[contactId]/route";

export default function LinkedInPage() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<LinkedInContact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContacts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = isLoadMore ? page + 1 : 1;

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
        setPage(prev => prev + 1);
      } else {
        setContacts(result.contacts);
        setPage(1);
        if (result.contacts.length > 0 && !selectedId) {
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
  }, [debouncedSearch, page, selectedId]);

  useEffect(() => {
    if (!authLoading) {
      fetchContacts(false);
    }
  }, [authLoading, debouncedSearch]);

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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50/50 overflow-hidden">
      {/* Search Bar */}
      <div className="flex-shrink-0 border-b bg-white shadow-sm">
        <MessageFilters
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {authLoading || (loading && page === 1) ? (
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
            />
          </div>
        </div>
      )}
    </div>
  );
}