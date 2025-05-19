import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import itemsService from '../services/itemsService';

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  markAsRead: () => {},
  markAllAsRead: () => {},
  addNotification: () => {},
  fetchNotifications: () => {}
});

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  // Add a refresh interval
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchNotifications();

      // Set up polling every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);

      // Cleanup on unmount
      return () => clearInterval(interval);
    }
  }, [user]); // Re-run when user changes

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching notifications for user:', user._id);
      const response = await itemsService.getNotifications();
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to fetch notifications');
      }

      console.log('Received notifications:', {
        count: response.notifications?.length || 0,
        notifications: response.notifications
      });

      const newNotifications = response.notifications || [];
      
      setNotifications(newNotifications.map(notification => ({
        ...notification,
        createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
        read: !!notification.read,
        _id: notification._id || notification.id
      })));
      
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      
      console.log('Updated notifications state:', {
        totalCount: newNotifications.length,
        unreadCount: newNotifications.filter(n => !n.read).length
      });
    } catch (error) {
      console.error('Error fetching notifications:', {
        error: error.message,
        response: error.response?.data
      });
      setNotifications([]);
      setUnreadCount(0);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(error.message || 'Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId || !user) return;

    try {
      const response = await itemsService.markNotificationAsRead(notificationId);
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to mark notification as read');
      }

      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId || n.id === notificationId 
            ? { ...n, read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(error.message || 'Failed to mark notification as read');
      }
    }
  }, [user, logout]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await itemsService.markAllNotificationsAsRead();
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to mark all notifications as read');
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(error.message || 'Failed to mark all notifications as read');
      }
    }
  }, [user, logout]);

  const addNotification = useCallback((notification) => {
    if (!notification || !user) return;

    setNotifications(prev => [
      {
        ...notification,
        createdAt: new Date(notification.createdAt || Date.now()),
        read: false,
        _id: notification._id || notification.id
      },
      ...prev
    ]);
    setUnreadCount(prev => prev + 1);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    addNotification,
    fetchNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
