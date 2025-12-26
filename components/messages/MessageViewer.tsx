"use client";

import React, { useMemo, useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock } from "lucide-react";
import Image from 'next/image';
import { useFontSize } from "@/lib/font-size-context";
import { toast } from "sonner";
import { OutreachMessage } from "@/app/api/messages/route";
import { ConversationMessage } from "@/app/api/messages/[contactId]/route";
import axios from "axios";


interface MessageViewerProps {
  message: OutreachMessage | null;
}

export const MessageViewer = React.memo(({ message }: MessageViewerProps) => {
  /* eslint-disable react-hooks/exhaustive-deps */
  const { getFontSizeClass } = useFontSize();
  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch conversation history when contact_id changes
  React.useEffect(() => {
    if (message?.contact_id) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await axios.get(`/api/messages/${message.contact_id}`);
          if (res.data) {
            setConversation(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch conversation:", error);
          toast.error("Failed to load conversation history");
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    } else {
      setConversation([]);
    }
  }, [message?.contact_id]);

  const optimizedPicture = useMemo(
    () => message?.profile_picture,
    [message?.profile_picture]
  );

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }, []);

  if (!message) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Mail className="h-16 w-16 text-gray-300 mb-4" />
        <p className={`${fontSizeClass} text-muted-foreground`}>
          Select a conversation to view details
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200 h-full flex flex-col shadow-none rounded-none border-0 md:border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4 bg-white">
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
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{message.full_name}</h2>
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            {message.status === 'draft' && <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>}
            {message.status === 'sent' && <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-green-50 text-green-700 border-green-200">Sent</Badge>}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Clock className="h-5 w-5 text-gray-400 animate-pulse" />
          </div>
        ) : conversation.length > 0 ? (
          conversation.map((msg) => {
            // Logic: 'bot' means "Me" (System/User) -> Right Side
            // Anything else means "Contact" -> Left Side
            const isMe = msg.sender_type === 'bot' || msg.sender_type === 'user';

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                  {/* Avatar for Contact (Left) */}
                  {!isMe && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1">
                      {optimizedPicture ? (
                        <Image src={optimizedPicture} alt="Contact" width={32} height={32} className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {getInitials(message.full_name)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avatar for User/Bot (Right) */}
                  {isMe && (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden mt-1" title={msg.sender_details?.full_name || 'Me'}>
                      {msg.sender_details?.avatar_url ? (
                        <Image src={msg.sender_details.avatar_url} alt="Me" width={32} height={32} className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-blue-600 bg-blue-50">
                          Me
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl whitespace-pre-wrap shadow-sm ${fontSizeClass} ${isMe
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
                      {new Date(msg.created_at || msg.timestamp || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className={fontSizeClass}>No messages yet</p>
          </div>
        )}
      </div>

      {/* Input Placeholder */}
      <div className="p-4 border-t bg-white">
        <div className="relative">
          <div className="absolute inset-0 bg-gray-50/50 z-10 flex items-center justify-center rounded-md border border-dashed border-gray-200">
            <span className="text-xs text-gray-400 font-medium">Reply functionality coming soon</span>
          </div>
          <div className="h-10 w-full bg-gray-50 rounded-md"></div>
        </div>
      </div>
    </Card>
  );
});

MessageViewer.displayName = "MessageViewer";
