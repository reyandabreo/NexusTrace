import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'alert' | 'evidence' | 'system' | 'processing';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  time: string;
  read: boolean;
  caseId?: string;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatNotificationTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          time: formatNotificationTime(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);
