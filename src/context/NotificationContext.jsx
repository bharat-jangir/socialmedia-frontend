import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  formatTimeAgo,
  getNotificationIcon
} from '../api/notifications';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get user from Redux state
  const user = useSelector(state => state.auth?.user);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      if (!user) {
        console.warn('User not authenticated, skipping notification load');
        setNotifications([]);
        return;
      }
      
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      // Handle authentication errors gracefully
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.warn('Authentication failed for notifications, user may not be logged in');
        setNotifications([]);
        setError(null); // Don't show error for auth issues
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Backend server not available, using empty notifications');
        setNotifications([]);
        setError(null); // Don't show error for network issues
      } else {
        setError(err.message);
        console.error('Error loading notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.warn('User not authenticated, skipping unread count load');
        setUnreadCount(0);
        return;
      }
      
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // Handle authentication errors gracefully
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.warn('Authentication failed for unread count, user may not be logged in');
        setUnreadCount(0);
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Backend server not available, using 0 unread count');
        setUnreadCount(0);
      } else {
        console.error('Error loading unread count:', err);
        setUnreadCount(0);
      }
    }
  }, [user]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      // Send via WebSocket first
      const WebSocketService = (await import('../utils/sockets')).default;
      WebSocketService.markNotificationAsRead(notificationId);
      
      // Also update via API
      await markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      // Send via WebSocket first
      const WebSocketService = (await import('../utils/sockets')).default;
      WebSocketService.markAllNotificationsAsRead();
      
      // Also update via API
      await markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotificationById = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Delete all notifications
  const deleteAllNotificationsById = useCallback(async () => {
    try {
      await deleteAllNotifications();
      
      // Clear all notifications from local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      setError(err.message);
    }
  }, []);

  // Add new notification (for WebSocket updates)
  const addNotification = useCallback((newNotification) => {
    console.log('➕ Adding notification to state:', newNotification);
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      console.log('📋 Updated notifications array:', updated);
      return updated;
    });
    
    // Update unread count if notification is unread
    if (!newNotification.isRead) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('🔢 Updated unread count:', newCount);
        return newCount;
      });
    }
  }, []);

  // Update notification (for WebSocket updates)
  const updateNotification = useCallback((updatedNotification) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === updatedNotification.id 
          ? updatedNotification 
          : notification
      )
    );
  }, []);

  // Load initial data only when user is authenticated
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    } else {
      // Clear notifications when user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, loadNotifications, loadUnreadCount]);

  // Listen for new notification events
  useEffect(() => {
    const handleNewNotification = (event) => {
      console.log('🎯 NotificationContext received newNotification event:', event.detail);
      console.log('🎯 Event type:', event.type);
      console.log('🎯 Event detail:', event.detail);
      const newNotification = event.detail;
      console.log('📝 Adding notification to context:', newNotification);
      console.log('🔍 Notification type:', newNotification.type);
      console.log('🔍 Notification title:', newNotification.title);
      console.log('🔍 Notification sender:', newNotification.sender);
      addNotification(newNotification);
      
      // Handle call invitations and responses specially
      if (newNotification.type === 'CALL_INVITATION') {
        console.log('📞 Call invitation notification received, triggering call handler');
        
        // Convert notification format to call invitation format
        const callInvitation = {
          fromUserId: newNotification.sender.id,
          fromUser: {
            id: newNotification.sender.id,
            name: `${newNotification.sender.fname} ${newNotification.sender.lname}`.trim(),
            profileImage: newNotification.sender.profileImage
          },
          callType: 'VIDEO_CALL', // Default to video call, could be extracted from notification if available
          roomId: newNotification.relatedEntityId, // This should now contain the room ID
          timestamp: new Date().getTime()
        };
        
        console.log('🔍 Notification relatedEntityId:', newNotification.relatedEntityId);
        console.log('🔍 Call invitation roomId:', callInvitation.roomId);
        
        console.log('📞 Converted call invitation:', callInvitation);
        
        // Trigger call invitation event
        const callEvent = new CustomEvent('callInvitation', {
          detail: callInvitation
        });
        window.dispatchEvent(callEvent);
        console.log('📞 Call invitation event dispatched');
      } else if (newNotification.type === 'CALL_RESPONSE') {
        console.log('📞 Call response notification received, triggering call response handler');
        console.log('🔍 Full notification object:', newNotification);
        console.log('🔍 Notification title:', newNotification.title);
        console.log('🔍 Notification relatedEntityId:', newNotification.relatedEntityId);
        console.log('🔍 Notification sender:', newNotification.sender);
        
        // Convert notification format to call response format
        const callResponse = {
          roomId: newNotification.relatedEntityId,
          accepted: newNotification.title === 'Call Accepted',
          fromUserId: newNotification.sender.id,
          fromUserName: `${newNotification.sender.fname} ${newNotification.sender.lname}`.trim(),
          timestamp: new Date().getTime()
        };
        
        console.log('🔍 Converted call response:', callResponse);
        console.log('🔍 Call response accepted:', callResponse.accepted);
        
        // Trigger call response event
        const callResponseEvent = new CustomEvent('callResponse', {
          detail: callResponse
        });
        window.dispatchEvent(callResponseEvent);
        console.log('📞 Call response event dispatched');
      }
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/icon.png',
          tag: `notification-${newNotification.id}`,
        });
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    
    // Test event listener
    console.log('🔧 NotificationContext: Event listener added for newNotification');
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      console.log('🔧 NotificationContext: Event listener removed for newNotification');
    };
  }, [addNotification]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Test function - remove this after testing
    window.testNotification = () => {
      console.log('🧪 Testing notification system...');
      const testEvent = new CustomEvent('newNotification', {
        detail: {
          id: 'test-' + Date.now(),
          title: 'Test Notification',
          message: 'This is a test notification',
          isRead: false
        }
      });
      window.dispatchEvent(testEvent);
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    deleteAllNotificationsById,
    addNotification,
    updateNotification,
    formatTimeAgo,
    getNotificationIcon,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
