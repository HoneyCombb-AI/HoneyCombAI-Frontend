"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, User } from "lucide-react";
import { optimizeImageUrl } from "@/lib/ContactUtils";
import Image from 'next/image';

export interface OutreachMessage {
  id: string;
  full_name: string;
  profile_picture: string | null;
  outreach_message: string;
  outreach_requested: boolean;
  outreach_completed: boolean;
  updated_at: string;
}

interface MessageListProps {
  messages: OutreachMessage[];
  selectedId: string | null;
  onSelectMessage: (id: string) => void;
}

const MessageListItem = React.memo(({
  message,
  isActive,
  onClick
}: {
  message: OutreachMessage;
  isActive: boolean;
  onClick: () => void;
}) => {
  const date = new Date(message.updated_at);
  const snippet = message.outreach_message.replace(/\n/g, " ").slice(20, 50);
  const optimizedPicture = message.profile_picture
    ? optimizeImageUrl(message.profile_picture)
    : null;

  const getStatusBadge = () => {
    if (message.outreach_completed) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Response Ready
        </Badge>
      );
    }
    if (message.outreach_requested) {
      return (
        <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Generating
        </Badge>
      );
    }
    return null;
  };

  return (
    <li
      className={`cursor-pointer px-4 py-2 hover:bg-gray-50 transition-colors ${isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
        }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {optimizedPicture ? (

          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image
              src={optimizedPicture}
              alt={message.full_name}
              fill
              className="object-cover"
              sizes="48px"
              quality={100}
            />
          </div>

        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-gray-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm truncate">
              {message.full_name}
            </span>
            {getStatusBadge()}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-1">
            {snippet}...
          </p>

          <div className="flex justify-end">
            <span className="text-xs text-gray-400">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
});

MessageListItem.displayName = "MessageListItem";

export const MessageList = React.memo(({
  messages,
  selectedId,
  onSelectMessage
}: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No messages found.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {messages.map((message) => (
        <MessageListItem
          key={message.id}
          message={message}
          isActive={message.id === selectedId}
          onClick={() => onSelectMessage(message.id)}
        />
      ))}
    </ul>
  );
});

MessageList.displayName = "MessageList";