"use client";

import { useEffect, useMemo } from "react";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "./loading";
import { AnimatePresence, motion } from "motion/react";
import { useNotifications } from "@/lib/notification-context";

interface NotificationPopoverContentProps {
  isOpen: boolean;
}

export function NotificationPopoverContent({ isOpen }: NotificationPopoverContentProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasLoaded,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshData
  } = useNotifications();

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      fetchNotifications();
    }
  }, [isOpen, hasLoaded, fetchNotifications]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (!a.is_read && b.is_read) return -1;
      if (a.is_read && !b.is_read) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notifications]);

  return (
    <div className="space-y-4 w-full h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          </motion.div>
        )}
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
            onClick={refreshData}
          >
            Try Again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No notifications from the past 3 days
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-2 overflow-y-auto px-1 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {sortedNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: notification.is_read ? 0.7 : 1,
                  y: 0
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.2,
                  delay: hasLoaded ? 0 : index * 0.05,
                  ease: "easeOut",
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }
                }}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={`
                  group relative px-3 py-3 cursor-pointer shadow-sm transition-colors duration-200
                  ${notification.is_read
                    ? 'hover:bg-muted/20 hover:shadow-sm'
                    : 'hover:bg-muted/30 border-l-4 border-l-primary rounded-l-lg shadow-md hover:shadow-lg'
                  }
                  ${index !== sortedNotifications.length - 1 ? 'border-b border-border/20' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {!notification.is_read ? (
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    ) : (
                      <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`
                        text-sm leading-relaxed transition-colors duration-200
                        ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}
                      `}>
                        {notification.message}
                      </p>
                      {!notification.is_read && (
                        <Check className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-200" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/80">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      {notification.type && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full capitalize font-medium">
                          {notification.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}