import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Videocam,
  Mic,
  Settings,
  Refresh,
  CheckCircle,
  Error
} from '@mui/icons-material';

const PermissionRequestModal = ({ open, onClose, onRetry, callType = 'VIDEO_CALL' }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  const isVideoCall = callType !== 'VOICE_ONLY';
  const requiredDevices = isVideoCall ? ['Camera', 'Microphone'] : ['Microphone'];

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Check current permission status
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      const micPermission = await navigator.permissions.query({ name: 'microphone' });
      
      setPermissionStatus({
        camera: cameraPermission.state,
        microphone: micPermission.state
      });
      
      if (onRetry) {
        await onRetry();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getPermissionIcon = (device) => {
    if (!permissionStatus) return <Settings />;
    
    const status = device === 'Camera' ? permissionStatus.camera : permissionStatus.microphone;
    return status === 'granted' ? <CheckCircle color="success" /> : <Error color="error" />;
  };

  const getPermissionText = (device) => {
    if (!permissionStatus) return `Allow ${device} access`;
    
    const status = device === 'Camera' ? permissionStatus.camera : permissionStatus.microphone;
    return status === 'granted' ? `${device} access granted` : `${device} access denied`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Videocam color="primary" />
          <Typography variant="h6">
            Camera & Microphone Access Required
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          To join the group call, we need access to your {isVideoCall ? 'camera and microphone' : 'microphone'}.
        </Alert>

        <Typography variant="body1" gutterBottom>
          Please follow these steps:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText 
              primary="1. Click the camera/microphone icon in your browser's address bar"
              secondary="Look for the camera or microphone icon next to the URL"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CheckCircle />
            </ListItemIcon>
            <ListItemText 
              primary="2. Select 'Allow' for camera and microphone access"
              secondary="Choose 'Allow' from the dropdown menu"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Refresh />
            </ListItemIcon>
            <ListItemText 
              primary="3. Click 'Retry' below to test permissions"
              secondary="We'll check if permissions are now granted"
            />
          </ListItem>
        </List>

        {permissionStatus && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Current Permission Status:
            </Typography>
            {requiredDevices.map((device) => (
              <Box key={device} display="flex" alignItems="center" gap={1} mb={1}>
                {getPermissionIcon(device)}
                <Typography variant="body2">
                  {getPermissionText(device)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Alert severity="warning" sx={{ mt: 2 }}>
          If you don't see the permission prompt, check your browser's site settings:
          <br />
          • Chrome: Settings → Privacy and security → Site settings
          <br />
          • Firefox: Settings → Privacy & Security → Permissions
          <br />
          • Safari: Safari → Preferences → Websites
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={handleRetry} 
          variant="contained" 
          color="primary"
          disabled={isRetrying}
          startIcon={<Refresh />}
        >
          {isRetrying ? 'Checking...' : 'Retry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionRequestModal;
