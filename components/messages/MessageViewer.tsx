"use client";

import React, { useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, User, CheckCircle2, Clock, Linkedin, Twitter, Facebook, Instagram, Send, Copy } from "lucide-react";
import { optimizeImageUrl } from "@/lib/ContactUtils";
import Image from 'next/image';
import { parseBracketedText } from "./MessageUtil";
import { useFontSize } from "@/lib/font-size-context";
import { toast } from "sonner";

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

const ICON_CLASS = "h-5 w-5";
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  email: Mail,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  outreach: Send,
};

const getIconForSection = (iconType: string) => {
  const IconComponent = ICON_MAP[iconType.toLowerCase()] || Mail;
  return <IconComponent className={ICON_CLASS} />;
};

export const MessageViewer = React.memo(({ message }: MessageViewerProps) => {
  const { getFontSizeClass } = useFontSize();

  const optimizedPicture = useMemo(
    () => message?.profile_picture ? optimizeImageUrl(message.profile_picture) : null,
    [message?.profile_picture]
  );

  const formattedDate = useMemo(
    () => message ? new Date(message.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : '',
    [message?.updated_at]
  );

  const parsedSections = useMemo(
    () => message ? parseBracketedText(message.outreach_message) : [],
    [message?.outreach_message]
  );

  const statusBadge = useMemo(() => {
    if (!message) return null;
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
  }, [message?.outreach_completed, message?.outreach_requested]);

  const handleCopySection = useCallback((content: string, sectionType: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success(`${sectionType} message copied to clipboard`);
    }).catch(() => {
      toast.error("Failed to copy message");
    });
  }, []);

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

  return (
    <Card className="bg-white border-gray-200">
      <div className="px-6">
        <div className="flex items-start gap-4 mb-4">
          {optimizedPicture ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
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
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500" />
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{message.full_name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {statusBadge}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-6">
          {parsedSections.length > 0 ? (
            parsedSections.map((section, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIconForSection(section.icon)}
                    <h3 className="text-lg font-semibold text-gray-900">{section.type}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopySection(section.content, section.type)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="pl-7">
                  <p className={`${getFontSizeClass()} text-black whitespace-pre-wrap leading-relaxed`}>{section.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopySection(message.outreach_message, "Message")}
                className="absolute top-0 right-0 h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <pre className={`whitespace-pre-wrap ${getFontSizeClass()} leading-relaxed text-black font-sans pr-10`}>
                {message.outreach_message}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

MessageViewer.displayName = "MessageViewer";