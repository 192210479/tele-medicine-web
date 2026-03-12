import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiPut } from '../services/api';
import socket from '../services/socketService';

interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { userId, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Step 5: Prevent Duplicate Notifications helper
  const isDuplicate = (newNotif: Notification, currentNotifs: Notification[]) => {
    return currentNotifs.some(n => 
      n.title === newNotif.title && 
      n.description === newNotif.description && 
      n.created_at === newNotif.created_at
    );
  };

  // Step 4: Restore Notifications on Reload
  // Merge the fetched notifications with any new ones received through the socket.
  // Do not clear existing notifications.
  const loadNotifications = useCallback(async () => {
    if (!userId || !role) return;
    try {
      setIsLoading(true);
      const data = await apiGet('/api/notifications', { user_id: userId, role });
      
      setNotifications(prev => {
        const fetchedNotifs = (data || []);
        // Start with current local notifications (which might include fresh socket ones)
        const combined = [...prev];
        
        // Add fetched notifications if they aren't already in the list
        fetchedNotifs.forEach((n: Notification) => {
          if (!combined.some(existing => existing.id === n.id)) {
            combined.push(n);
          }
        });

        // Sort newest first
        return combined.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    if (userId && role) {
      loadNotifications();

      // Step 3: Prevent Multiple Room Connections
      const handleConnect = () => {
        const flagKey = `userRoomConnected_${userId}_${role}`;
        if (!(window as any)[flagKey]) {
          socket.emit("connect_user", {
            user_id: userId,
            role: role
          });
          (window as any)[flagKey] = true;
          console.log(`Connected user room: ${role}_${userId}`);
        }
      };

      // Step 2 & 8: Reconnect User After Page Refresh / Socket Disconnect
      if (socket.connected) {
        handleConnect();
      }
      
      socket.on("connect", handleConnect);

      // Step 3: Real-Time Notification Listener
      const handleNotification = (data: Notification) => {
        setNotifications(prev => {
          // Step 5: Prevent Duplicate Notifications
          if (isDuplicate(data, prev)) return prev;
          return [data, ...prev];
        });
      };

      socket.on("notification", handleNotification);

      // Step 7: Handle Background Tab Behavior
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          loadNotifications();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("notification", handleNotification);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        // Reset flag on unmount if needed, but per-session usually means per-page-load
        const flagKey = `userRoomConnected_${userId}_${role}`;
        delete (window as any)[flagKey];
      };
    }
  }, [userId, role, loadNotifications]);

  const markAsRead = async (notificationId: number) => {
    try {
      await apiPut(`/api/notification/read/${notificationId}`, {});
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    if (!userId || !role) return;
    try {
      await apiPut('/api/notifications/read-all', {
        user_id: userId,
        role: role
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAllRead,
        isLoading
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
