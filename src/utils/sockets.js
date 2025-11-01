// Polyfill for global variable
if (typeof global === 'undefined') {
  window.global = window;
}

import Stomp from 'stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { API_BASE_URL } from '../config/api';

// Auto-enable audio on first user interaction
const enableAudioOnInteraction = () => {
  if (WebSocketService.audioEnabled) return;
  WebSocketService.initializeAudio().catch(() => {});
};

// Add event listeners for user interaction
document.addEventListener('click', enableAudioOnInteraction, { once: true });
document.addEventListener('keydown', enableAudioOnInteraction, { once: true });
document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });

const WebSocketService = {
  stompClient: null,
  isConnected: false,
  connectionPromise: null,
  notificationSubscription: null,
  roomEventsSubscription: null,
  groupChatSubscription: null,
  isInitializing: false,
  userId: null,
  audioEnabled: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  connectionCheckInterval: null,
  isReconnecting: false,

  // Connection status monitoring
  getConnectionStatus: () => {
    return {
      isConnected: WebSocketService.isConnected,
      isInitializing: WebSocketService.isInitializing,
      isReconnecting: WebSocketService.isReconnecting,
      userId: WebSocketService.userId,
      reconnectAttempts: WebSocketService.reconnectAttempts,
      hasStompClient: !!WebSocketService.stompClient
    };
  },

  // Initialize audio context for notifications
  initializeAudio: async () => {
    try {
      if (WebSocketService.audioEnabled) return;
      
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported');
        return;
      }
      
      WebSocketService.audioContext = new AudioContext();
      WebSocketService.audioEnabled = true;
      console.log('✅ Audio context initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
    }
  },

  // Play notification sound
  playNotificationSound: () => {
    try {
      if (!WebSocketService.audioEnabled || !WebSocketService.audioContext) {
        console.log('🔇 Audio not enabled, skipping sound');
        return;
      }
      
      // Create a simple beep sound
      const oscillator = WebSocketService.audioContext.createOscillator();
      const gainNode = WebSocketService.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(WebSocketService.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, WebSocketService.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, WebSocketService.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, WebSocketService.audioContext.currentTime + 0.5);
      
      oscillator.start(WebSocketService.audioContext.currentTime);
      oscillator.stop(WebSocketService.audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('❌ Failed to play notification sound:', error);
    }
  },

  // Initialize WebSocket connection
  initializeWebSocketConnection: async (user) => {
    if (WebSocketService.connectionPromise) {
      return WebSocketService.connectionPromise;
    }

    WebSocketService.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        if (WebSocketService.isConnected) {
          resolve();
          return;
    }

    WebSocketService.isInitializing = true;
        WebSocketService.userId = user.id;

        console.log('🔌 Initializing WebSocket connection...');

        // Get WebSocket URL from API base URL
        // IMPORTANT: When page is loaded over HTTPS, we MUST use HTTPS/WSS, not HTTP/WS
        const getWebSocketUrl = () => {
          const isHttps = window.location.protocol === 'https:';
          
          // If API_BASE_URL is provided, ensure it uses HTTPS if page is HTTPS
          if (API_BASE_URL) {
            let wsUrl = API_BASE_URL;
            // Force HTTPS if page is loaded over HTTPS
            if (isHttps && wsUrl.startsWith('http://')) {
              wsUrl = wsUrl.replace('http://', 'https://');
            }
            return `${wsUrl}/ws`;
          }
          
          // Fallback for local development
          const protocol = isHttps ? 'https:' : 'http:';
          const host = window.location.hostname;
          const port = window.location.port || (isHttps ? '443' : '5000');
          return `${protocol}//${host}${port !== '443' && port !== '80' ? ':' + port : ''}/ws`;
        };

        const wsUrl = getWebSocketUrl();
        console.log('🔌 WebSocket URL:', wsUrl);
        console.log('🔌 Current page protocol:', window.location.protocol);
        
        // Create SockJS connection
        // SockJS automatically uses secure transport (wss://) if page is loaded over HTTPS
        // Even if URL starts with http://, SockJS upgrades to wss:// for HTTPS pages
        const socket = new SockJS(wsUrl, null, {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling']
        });
        WebSocketService.stompClient = Stomp.over(socket);
        
        // Disable debug logging
        WebSocketService.stompClient.debug = null;

        // Connect to WebSocket
        WebSocketService.stompClient.connect(
          {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          (frame) => {
            console.log('✅ WebSocket connected:', frame);
          WebSocketService.isConnected = true;
          WebSocketService.isInitializing = false;
          WebSocketService.reconnectAttempts = 0;
          
            // Subscribe to notifications
          WebSocketService.subscribeToNotifications();
          
          WebSocketService.subscribeToRoomEvents();
          WebSocketService.subscribeToPingResponses();
          
          // Send subscription message to backend
            WebSocketService.stompClient.send('/app/user.subscribe', {}, JSON.stringify({
              userId: user.id,
              timestamp: new Date().toISOString()
            }));
          
          // Start connection health check
          WebSocketService.startConnectionHealthCheck();
          
          resolve();
          },
          (error) => {
            console.error('❌ WebSocket connection failed:', error);
          WebSocketService.isConnected = false;
          WebSocketService.isInitializing = false;
            WebSocketService.stompClient = null;
          WebSocketService.connectionPromise = null;
          reject(error);
          }
        );
      } catch (error) {
        console.error('❌ WebSocket initialization error:', error);
        WebSocketService.isInitializing = false;
        WebSocketService.connectionPromise = null;
        reject(error);
      }
    });

    return WebSocketService.connectionPromise;
  },

  // Subscribe to notifications
  subscribeToNotifications: () => {
    if (WebSocketService.notificationSubscription) {
      WebSocketService.notificationSubscription.unsubscribe();
    }

    if (WebSocketService.stompClient && WebSocketService.isConnected && WebSocketService.userId) {
      const notificationChannel = `/user/${WebSocketService.userId}/queue/notifications`;
      
      WebSocketService.notificationSubscription = WebSocketService.stompClient.subscribe(
        notificationChannel,
        (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('🔔 Notification received:', notification);
            
            // Play notification sound
            WebSocketService.playNotificationSound();
            
            // Dispatch custom event for notification handling
            window.dispatchEvent(new CustomEvent('notificationReceived', {
              detail: notification
            }));
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        }
      );
      
      console.log('✅ Subscribed to notifications');
    }
  },

  // Subscribe to room events
  subscribeToRoomEvents: () => {
    if (WebSocketService.roomEventsSubscription) {
      WebSocketService.roomEventsSubscription.unsubscribe();
    }

    if (WebSocketService.stompClient && WebSocketService.isConnected && WebSocketService.userId) {
      const roomEventsChannel = `/user/${WebSocketService.userId}/queue/room-events`;
      
      WebSocketService.roomEventsSubscription = WebSocketService.stompClient.subscribe(
        roomEventsChannel,
        (message) => {
          try {
            const roomEvent = JSON.parse(message.body);
            console.log('🏠 Room event received:', roomEvent);
            
            // Dispatch custom event for room event handling
            window.dispatchEvent(new CustomEvent('roomEventReceived', {
              detail: roomEvent
            }));
          } catch (error) {
            console.error('Error parsing room event:', error);
          }
        }
      );
      
      console.log('✅ Subscribed to room events');
    }
  },

  // Subscribe to ping responses
  subscribeToPingResponses: () => {
    if (WebSocketService.stompClient && WebSocketService.isConnected && WebSocketService.userId) {
      const pingChannel = `/user/${WebSocketService.userId}/queue/ping`;
      
      WebSocketService.stompClient.subscribe(
        pingChannel,
        (message) => {
          try {
            const pingResponse = JSON.parse(message.body);
            console.log('🏓 Ping response received:', pingResponse);
          } catch (error) {
            console.error('Error parsing ping response:', error);
          }
        }
      );
      
      console.log('✅ Subscribed to ping responses');
    }
  },

  // Subscribe to group chat
  subscribeToGroupChat: (groupId) => {
    if (WebSocketService.groupChatSubscription) {
      WebSocketService.groupChatSubscription.unsubscribe();
    }

    if (WebSocketService.stompClient && WebSocketService.isConnected) {
      const groupChatChannel = `/topic/group.${groupId}`;
      
      WebSocketService.groupChatSubscription = WebSocketService.stompClient.subscribe(
        groupChatChannel,
        (message) => {
          try {
            const groupMessage = JSON.parse(message.body);
            console.log('👥 Group message received:', groupMessage);
            
            // Dispatch custom event for group message handling
            window.dispatchEvent(new CustomEvent('groupMessageReceived', {
              detail: groupMessage
            }));
          } catch (error) {
            console.error('Error parsing group message:', error);
          }
        }
      );
      
      console.log('✅ Subscribed to group chat:', groupId);
    }
  },

  // Subscribe to topic
  subscribeToTopic: (topic, callback) => {
    if (WebSocketService.stompClient && WebSocketService.isConnected) {
      return WebSocketService.stompClient.subscribe(topic, callback);
    }
    return null;
  },

  // Send message
  sendMessage: (destination, message) => {
    if (!WebSocketService.stompClient || !WebSocketService.isConnected) {
      console.error('❌ Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      WebSocketService.stompClient.send(destination, headers, JSON.stringify(message));
      return true;
          } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  },

  // Start connection health check
  startConnectionHealthCheck: () => {
    if (WebSocketService.connectionCheckInterval) {
      clearInterval(WebSocketService.connectionCheckInterval);
    }

    WebSocketService.connectionCheckInterval = setInterval(() => {
      if (!WebSocketService.isConnected || !WebSocketService.stompClient) {
        console.log('🔍 Connection lost, attempting to reconnect...');
        WebSocketService.handleReconnection();
      return;
    }
    
      // Send ping to check connection
      try {
        WebSocketService.stompClient.send('/app/ping', {}, JSON.stringify({
          userId: WebSocketService.userId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('❌ Ping failed:', error);
        WebSocketService.handleReconnection();
      }
    }, 30000); // Check every 30 seconds
  },

  // Stop connection health check
  stopConnectionHealthCheck: () => {
    if (WebSocketService.connectionCheckInterval) {
      clearInterval(WebSocketService.connectionCheckInterval);
      WebSocketService.connectionCheckInterval = null;
    }
  },

  // Handle reconnection
  handleReconnection: async () => {
    if (WebSocketService.isReconnecting || WebSocketService.reconnectAttempts >= WebSocketService.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached or already reconnecting');
      return;
    }

    WebSocketService.isReconnecting = true;
    WebSocketService.reconnectAttempts++;

    console.log(`🔄 Attempting reconnection ${WebSocketService.reconnectAttempts}/${WebSocketService.maxReconnectAttempts}`);

    try {
      // Disconnect current connection
      if (WebSocketService.stompClient) {
        WebSocketService.stompClient.disconnect();
      }

      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get user from localStorage or Redux store
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        await WebSocketService.initializeWebSocketConnection(user);
        console.log('✅ Reconnection successful');
      } else {
        console.error('❌ No user data available for reconnection');
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
    } finally {
      WebSocketService.isReconnecting = false;
    }
  },

  // Disconnect WebSocket
  disconnectWebSocket: () => {
    // Stop connection health check
    WebSocketService.stopConnectionHealthCheck();
    
    // Unsubscribe from notifications
    if (WebSocketService.notificationSubscription) {
      WebSocketService.notificationSubscription.unsubscribe();
      WebSocketService.notificationSubscription = null;
    }

    // Unsubscribe from room events
    if (WebSocketService.roomEventsSubscription) {
      WebSocketService.roomEventsSubscription.unsubscribe();
      WebSocketService.roomEventsSubscription = null;
    }
    
    // Unsubscribe from group chat
    if (WebSocketService.groupChatSubscription) {
      WebSocketService.groupChatSubscription.unsubscribe();
      WebSocketService.groupChatSubscription = null;
    }
    
    // Disconnect WebSocket
    if (WebSocketService.stompClient !== null) {
      try {
        WebSocketService.stompClient.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
    }
    
    // Reset all connection state
    WebSocketService.stompClient = null;
    WebSocketService.isConnected = false;
    WebSocketService.isInitializing = false;
    WebSocketService.isReconnecting = false;
    WebSocketService.connectionPromise = null;
  }
};

export default WebSocketService;