"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loading } from "./loading";

interface Notification {
  id: number;
  message: string;
  created_at: string;
  updated_at: string;
  contact: {
    id: string;
    full_name: string;
    email: string;
    profile_picture?: string;
  };
}

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}


interface NotificationPopoverContentProps {
  isOpen: boolean;
}

export function NotificationPopoverContent({ isOpen }: NotificationPopoverContentProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);


  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notification?limit=10&offset=0');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data: NotificationResponse = await response.json();
      setNotifications(data.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    }
  };

  const loadData = async () => {
    if (hasLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      await fetchNotifications();
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadData();
    }
  }, [isOpen, hasLoaded]);


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-4 w-full h-full">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h4 className="font-semibold">Notifications</h4>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loading />
          <p className="text-sm text-muted-foreground mt-4">Loading Notifications...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BellOff className="h-12 w-12 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHasLoaded(false);
              setError(null);
            }}
          >
            Try Again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No new notifications available
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarImage
                  src={notification.contact.profile_picture}
                  alt={notification.contact.full_name}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(notification.contact.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {notification.contact.full_name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}