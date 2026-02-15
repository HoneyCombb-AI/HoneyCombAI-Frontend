"use client";

import { LinkedInContact } from "@/app/api/messages/route";
import { cn } from "@/lib/utils";
import { MessageSquare, Loader2, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  contacts: LinkedInContact[];
  selectedId: string | null;
  onSelectContact: (id: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
}

export function MessageList({
  contacts,
  selectedId,
  onSelectContact,
  hasMore,
  onLoadMore,
  loadingMore
}: MessageListProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-sm text-muted-foreground">No assigned contacts found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="divide-y">
        {contacts.map((contact) => {
          const isSelected = contact.id === selectedId;
          const initials = (contact.full_name || "")
            .split(" ")
            .map((part) => part.trim().charAt(0))
            .join("")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .slice(0, 2) || "?";

          return (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={cn(
                "w-full p-4 text-left transition-colors hover:bg-gray-50 flex flex-col gap-2 cursor-pointer group",
                isSelected && "bg-blue-50 hover:bg-blue-50 border-l-4 border-blue-500"
              )}
            >
              <div className="flex items-start gap-3 w-full">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium truncate text-sm text-gray-900">
                      {contact.full_name}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {contact.company_name || contact.current_company}
                  </p>

                  {/* Status indicators */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {contact.is_connected && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                        Connected
                      </span>
                    )}
                    {contact.reply_received && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Replied
                      </span>
                    )}
                    {contact.meeting_booked && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        Meeting
                      </span>
                    )}
                    {!contact.is_connected && !contact.reply_received && contact.conversation_started && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 border-t flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full gap-2 text-sm font-medium border-dashed text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:cursor-pointer"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
