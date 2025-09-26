"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import axios from 'axios';

interface NotificationContextType {
  unreadCount: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const channelRef = useRef<any>(null);
  const isComponentMounted = useRef(true);

  // Simple function to fetch count
  const fetchCount = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get('/api/notification/count');
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching count:', error);
      setUnreadCount(0);
    }
  };

  // Setup real-time subscription - just refresh count when anything changes
  const setupRealtimeSubscription = (userId: string) => {
    if (!isComponentMounted.current || !userId) return;

    // Cleanup existing
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setConnectionStatus('connecting');
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (!isComponentMounted.current) return;
          fetchCount();
          toast.success("New notifications are available", { id: 'new-notifications' });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (!isComponentMounted.current) return;
          fetchCount();
        }
      )
      .subscribe((status, err) => {
        if (!isComponentMounted.current) return;

        if (err) {
          console.error('Subscription error:', err);
          setConnectionStatus('disconnected');
          return;
        }

        switch (status) {
          case 'SUBSCRIBED':
            setConnectionStatus('connected');
            break;
          case 'CLOSED':
            setConnectionStatus('disconnected');
            break;
          case 'CHANNEL_ERROR':
            setConnectionStatus('disconnected');
            break;
        }
      });

    channelRef.current = channel;
  };

  // Load count when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchCount();
      setupRealtimeSubscription(user.id);
    } else {
      setUnreadCount(0);
      setConnectionStatus('disconnected');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    }
  }, [user?.id]);

  // Component cleanup
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        connectionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}