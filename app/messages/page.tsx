"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/loading";
import { Calendar, Mail } from "lucide-react";

interface MessageRow {
  id: string;
  full_name: string;
  outreach_msg: string;
  outreach_date: string | null;
  updated_at: string | null;
}

export default function MessagesPage() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("contacts")
          .select("id, full_name, outreach_msg, outreach_date, updated_at")
          .not("outreach_msg", "is", null)
          .neq("outreach_msg", "")
          .order("outreach_date", { ascending: false, nullsFirst: false })
          .order("updated_at", { ascending: false });
        if (error) throw error;
        setMessages((data || []) as MessageRow[]);
        setSelectedId((data && data[0]?.id) || null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchMessages();
  }, [authLoading]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((m) => m.full_name.toLowerCase().includes(term));
  }, [messages, search]);

  const selected = useMemo(
    () => filtered.find((m) => m.id === selectedId) || null,
    [filtered, selectedId]
  );

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
      {/* Search Toolbar */}
      <div className="flex items-center justify-end border-b bg-white px-6 py-3">
        <div className="w-full max-w-md">
          <Input
            placeholder="Search by contact name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {authLoading || loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <Loading />
          <p className="text-sm text-muted-foreground mt-4">
            Loading messages...
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* List */}
          <div className="border-r bg-white lg:col-span-1 min-h-[60vh]">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No messages found.
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((m) => {
                  const isActive = m.id === selectedId;
                  const dateStr = m.outreach_date || m.updated_at;
                  const date = dateStr ? new Date(dateStr) : null;
                  const snippet = m.outreach_msg
                    .replace(/\n/g, " ")
                    .slice(0, 120);
                  return (
                    <li
                      key={m.id}
                      className={`cursor-pointer px-4 py-3 hover:bg-gray-50 ${
                        isActive ? "bg-amber-50" : ""
                      }`}
                      onClick={() => setSelectedId(m.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">
                          {m.full_name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{date ? date.toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 truncate mt-1">
                        {snippet}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Viewer */}
          <div className="lg:col-span-2 p-4">
            {selected ? (
              <Card className="bg-white/90 border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2 py-1 text-xs"
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Outreach
                    </Badge>
                    <span className="font-semibold">{selected.full_name}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {selected.updated_at
                      ? new Date(selected.updated_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <Separator className="my-3" />
                <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {selected.outreach_msg}
                </pre>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Select a message to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}