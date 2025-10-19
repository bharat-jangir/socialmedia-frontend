import { api } from '../config/api';

// Get all notifications
export const getNotifications = async () => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.get('/api/notifications', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get paginated notifications
export const getPaginatedNotifications = async (page = 0, size = 20) => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.get(`/api/notifications/paginated?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error fetching paginated notifications:', error);
    throw error;
  }
};

// Get unread notifications
export const getUnreadNotifications = async () => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.get('/api/notifications/unread', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadCount = async () => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.get('/api/notifications/unread/count', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data.data.unreadCount || 0;
  } catch (error) {
    // Handle network errors gracefully
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('Backend server not available, returning 0 unread count');
      return 0;
    }
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.put(`/api/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.put('/api/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.delete(`/api/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.delete('/api/notifications/all', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Get notifications by type
export const getNotificationsByType = async (type) => {
  try {
    const jwt = localStorage.getItem('token');
    const { data } = await api.get(`/api/notifications/type/${type}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return data;
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    throw error;
  }
};

// Notification types
export const NOTIFICATION_TYPES = {
  LIKE_POST: "LIKE_POST",
  LIKE_STORY: "LIKE_STORY", 
  LIKE_COMMENT: "LIKE_COMMENT",
  COMMENT_POST: "COMMENT_POST",
  COMMENT_STORY: "COMMENT_STORY",
  FOLLOW: "FOLLOW",
  STORY_VIEW: "STORY_VIEW",
  MENTION: "MENTION",
  SYSTEM: "SYSTEM"
};

// Get notification icon based on type
export const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.LIKE_POST:
    case NOTIFICATION_TYPES.LIKE_STORY:
    case NOTIFICATION_TYPES.LIKE_COMMENT:
      return '❤️';
    case NOTIFICATION_TYPES.COMMENT_POST:
    case NOTIFICATION_TYPES.COMMENT_STORY:
      return '💬';
    case NOTIFICATION_TYPES.FOLLOW:
      return '👥';
    case NOTIFICATION_TYPES.STORY_VIEW:
      return '👁️';
    case NOTIFICATION_TYPES.MENTION:
      return '📢';
    case NOTIFICATION_TYPES.SYSTEM:
      return '🔔';
    default:
      return '🔔';
  }
};

// Format time ago
export const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};
