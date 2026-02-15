"use client";

import { LinkedInContact } from "@/app/api/messages/route";
import { MessageSquare, Send, Inbox } from "lucide-react";
import { Loading } from "@/components/loading";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LinkedInMessage } from "@/app/api/messages/[contactId]/route";

interface MessageViewerProps {
  contact: LinkedInContact | null;
  messages: LinkedInMessage[];
  loading: boolean;
  error: string | null;
}

export function MessageViewer({
  contact,
  messages,
  loading,
  error,
}: MessageViewerProps) {

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-sm text-muted-foreground">
          Select a contact to view conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative min-h-0">
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loading />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto pb-4">
            {messages.map((message) => {
              const isOutbound = message.sender_type === 'bot';
              const messageDate = message.created_at || message.timestamp;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isOutbound ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl p-4 shadow-sm",
                      isOutbound
                        ? "bg-gray-100 border border-gray-200"
                        : "bg-white border border-gray-200"
                    )}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {isOutbound ? (
                        <Send className="h-3.5 w-3.5 text-gray-500" />
                      ) : (
                        <Inbox className="h-3.5 w-3.5 text-gray-500" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        isOutbound ? "text-gray-500" : "text-gray-500"
                      )}>
                        {isOutbound ? 'AI Agent' : contact.full_name}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div
                      className={cn(
                        "text-sm leading-relaxed break-words whitespace-pre-wrap",
                        isOutbound ? "text-gray-700" : "text-gray-700"
                      )}
                    >
                      {message.content}
                    </div>

                    {/* Timestamp */}
                    {messageDate && (
                      <div className={cn(
                        "flex items-center text-xs pt-2 mt-2 border-t",
                        isOutbound
                          ? "text-gray-500 border-gray-200"
                          : "text-gray-500 border-gray-200"
                      )}>
                        <span>
                          {format(new Date(messageDate), "MMM d, h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
