"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import axios from 'axios';

interface Notification {
  id: number;
  message: string;
  type?: string;
  batch_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshData: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get('/api/notification?count_only=true');
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user || hasLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/notification?limit=20&offset=0');
      setNotifications(response.data.data);
      setUnreadCount(response.data.data.filter((n: Notification) => !n.is_read).length);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user, hasLoaded]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await axios.patch('/api/notification', {
        action: 'mark_read',
        notification_id: notificationId
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notification', { action: 'mark_all_read' });

      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const refreshData = useCallback(() => {
    setHasLoaded(false);
    setError(null);
  }, []);


  const addNotification = useCallback((notification: Notification) => {
    if (!notification.is_read) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        if (prev === 0) {
          toast.success("You have new notifications");
        }
        return newCount;
      });
    }

    if (hasLoaded) {
      setNotifications(prev => {
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    }
  }, [hasLoaded]);

  const updateNotification = useCallback((updatedNotification: any) => {
    const notificationId = updatedNotification.id;
    const wasRead = updatedNotification.old?.is_read;
    const isNowRead = updatedNotification.new?.is_read;

    if (wasRead === false && isNowRead === true) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (hasLoaded) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? {
              ...notif,
              message: updatedNotification.new.text || notif.message,
              type: updatedNotification.new.type || notif.type,
              is_read: updatedNotification.new.is_read ?? notif.is_read,
              updated_at: updatedNotification.new.updated_at || notif.updated_at,
            }
            : notif
        )
      );
    }
  }, [hasLoaded]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    let subscriptionActive = true;
    const channel = supabase
      .channel(`notifications_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!subscriptionActive) return;
          const newNotification = {
            id: payload.new.id,
            message: payload.new.text,
            type: payload.new.type,
            batch_id: payload.new.batch_id,
            is_read: payload.new.is_read,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at,
          };
          addNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!subscriptionActive) return;
          updateNotification({
            id: payload.new.id,
            old: payload.old,
            new: payload.new,
          });
        }
      )
      .subscribe((status, err) => {
        if (!subscriptionActive) return;
        console.log('🔌 Realtime subscription status:', status);
        if (err) {
          console.error('❌ Realtime subscription error:', err);
          return;
        }

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully connected to Realtime!');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Realtime connection closed - this is normal during cleanup');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      subscriptionActive = false;
      channel.unsubscribe();
    };
  }, [user?.id, addNotification, updateNotification]);

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
    }
  }, [user?.id]); 

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setHasLoaded(false);
      setError(null);
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        hasLoaded,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshData,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}