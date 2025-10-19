import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, Error, Refresh, Wifi, WifiOff } from '@mui/icons-material';
import WebSocketService from '../utils/sockets';

const WebSocketStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = () => {
    const status = WebSocketService.getConnectionStatus();
    setConnectionStatus(status);
    setLastChecked(new Date());
    
    // Log status to console for debugging
    console.log('WebSocket Status:', status);
  };

  useEffect(() => {
    // Check connection status on mount
    checkConnection();
    
    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!connectionStatus) return 'default';
    if (connectionStatus.isConnected) return 'success';
    if (connectionStatus.isInitializing) return 'warning';
    if (connectionStatus.isReconnecting) return 'warning';
    return 'error';
  };

  const getStatusText = () => {
    if (!connectionStatus) return 'Unknown';
    if (connectionStatus.isConnected) return 'Connected';
    if (connectionStatus.isInitializing) return 'Connecting...';
    if (connectionStatus.isReconnecting) return 'Reconnecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (!connectionStatus) return <WifiOff />;
    if (connectionStatus.isConnected) return <Wifi />;
    if (connectionStatus.isInitializing || connectionStatus.isReconnecting) return <Refresh />;
    return <WifiOff />;
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      zIndex: 9999,
      bgcolor: 'background.paper',
      borderRadius: 1,
      p: 0.5,
      boxShadow: 1,
      border: '1px solid',
      borderColor: 'divider',
      minWidth: 'auto'
    }}>
      <Tooltip title={`${getStatusText()} - Last checked: ${lastChecked?.toLocaleTimeString() || 'Never'}${connectionStatus?.userId ? ` - ID: ${connectionStatus.userId.slice(0, 8)}...` : ''}${connectionStatus?.reconnectAttempts > 0 ? ` - Reconnect attempts: ${connectionStatus.reconnectAttempts}` : ''}`}>
        <IconButton 
          size="small" 
          onClick={checkConnection}
          sx={{ 
            p: 0.5,
            '& .MuiSvgIcon-root': {
              fontSize: '1rem'
            }
          }}
        >
          {getStatusIcon()}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default WebSocketStatus;
