"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Mail, User, CheckCircle2, Clock } from "lucide-react";
import { optimizeImageUrl } from "@/lib/ContactUtils";

export interface OutreachMessage {
  id: string;
  full_name: string;
  profile_picture: string | null;
  outreach_message: string;
  outreach_requested: boolean;
  outreach_completed: boolean;
  updated_at: string;
}

interface MessageViewerProps {
  message: OutreachMessage | null;
}

export const MessageViewer = React.memo(({ message }: MessageViewerProps) => {
  if (!message) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Mail className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-sm text-muted-foreground">
          Select a message to view details
        </p>
      </div>
    );
  }

  const optimizedPicture = message.profile_picture
    ? optimizeImageUrl(message.profile_picture)
    : null;

  const getStatusBadge = () => {
    if (message.outreach_completed) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Response Ready
        </Badge>
      );
    }
    if (message.outreach_requested) {
      return (
        <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3 mr-1" />
          Generating
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border-gray-200">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {optimizedPicture ? (
            <img
              src={optimizedPicture}
              alt={message.full_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500" />
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{message.full_name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge()}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(message.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="prose max-w-none">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Outreach Message
            </span>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">
            {message.outreach_message}
          </pre>
        </div>
      </div>
    </Card>
  );
});

MessageViewer.displayName = "MessageViewer";