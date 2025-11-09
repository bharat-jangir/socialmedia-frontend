import React, { useState, useEffect } from 'react';
import { Box, Tooltip } from '@mui/material';
import WebSocketService from '../utils/sockets';

const ConnectionStatusDot = () => {
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = () => {
    const status = WebSocketService.getConnectionStatus();
    setIsConnected(status?.isConnected || false);
  };

  useEffect(() => {
    // Check connection status on mount
    checkConnection();
    
    // Check every 2 seconds
    const interval = setInterval(checkConnection, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isConnected ? '#4caf50' : '#f44336',
          boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
        }}
      />
    </Tooltip>
  );
};

export default ConnectionStatusDot;

