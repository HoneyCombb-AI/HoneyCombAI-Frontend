"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { OutreachMessage } from "@/app/api/messages/route";


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
  const [imageError, setImageError] = useState(false);
  const date = new Date(message.updated_at);
  const snippet = message.content
    ? (message.content.length > 50
      ? message.content.replace(/\n/g, " ").slice(0, 50) + "..."
      : message.content.replace(/\n/g, " "))
    : "";
  const optimizedPicture = message.profile_picture;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const getStatusBadge = () => {
    if (message.status === 'sent') {
      return (
        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-green-50 text-green-700 border-green-200">
          Sent
        </Badge>
      );
    }
    if (message.status === 'draft') {
      return (
        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-yellow-50 text-yellow-700 border-yellow-200">
          Draft
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
        {optimizedPicture && !imageError ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={optimizedPicture}
              alt={message.full_name}
              fill
              className="object-cover"
              sizes="40px"
              quality={100}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">{getInitials(message.full_name)}</span>
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
            {snippet}
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
      <div className="flex items-center justify-center h-full min-h-[400px]">
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
