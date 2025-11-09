import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popper,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  CircularProgress,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Visibility as ViewAllIcon,
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ asIcon = false }) => {
  const theme = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    deleteAllNotificationsById,
    formatTimeAgo,
    getNotificationIcon,
  } = useNotifications();

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const popperRef = useRef(null);

  const handleClick = (event) => {
    // Navigate to notifications page instead of opening dropdown
    navigate('/notifications');
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popperRef.current && !popperRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotificationById(notificationId);
  };

  const handleDeleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      await deleteAllNotificationsById();
    }
  };

  const handleViewAllNotifications = () => {
    handleClose(); // Close the dropdown
    navigate('/notifications'); // Navigate to full notifications page
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'LIKE_POST':
      case 'LIKE_STORY':
      case 'LIKE_COMMENT':
        return '#ff3040';
      case 'COMMENT_POST':
      case 'COMMENT_STORY':
        return '#1976d2';
      case 'FOLLOW':
        return '#4caf50';
      case 'STORY_VIEW':
        return '#ff9800';
      case 'MENTION':
        return '#9c27b0';
      case 'SYSTEM':
        return '#607d8b';
      default:
        return '#1976d2';
    }
  };

  // If used as icon (e.g., in BottomNavigationAction), render just the icon without button wrapper
  if (asIcon) {
    return (
      <Badge
        badgeContent={unreadCount}
        color="error"
        max={99}
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: '#ff3040',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          },
        }}
      >
        {unreadCount > 0 ? (
          <NotificationsIcon sx={{ fontSize: 24 }} />
        ) : (
          <NotificationsNoneIcon sx={{ fontSize: 24 }} />
        )}
      </Badge>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ff3040',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            },
          }}
        >
          {unreadCount > 0 ? (
            <NotificationsIcon sx={{ fontSize: 24 }} />
          ) : (
            <NotificationsNoneIcon sx={{ fontSize: 24 }} />
          )}
        </Badge>
      </IconButton>

      <Popper
        ref={popperRef}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        transition
        sx={{
          zIndex: 1300,
          mt: 1,
        }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              sx={{
                width: 380,
                maxHeight: 500,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #3b4054',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      onClick={handleMarkAllAsRead}
                      sx={{
                        color: theme.palette.success.main,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        },
                      }}
                    >
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      size="small"
                      onClick={handleDeleteAllNotifications}
                      sx={{
                        color: theme.palette.error.main,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        },
                      }}
                    >
                      Delete All
                    </Button>
                  )}
                  <MuiIconButton
                    size="small"
                    onClick={handleClose}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <CloseIcon fontSize="small" />
                  </MuiIconButton>
                </Box>
              </Box>

              {/* Notifications List */}
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <NotificationsNoneIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                      No notifications yet
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {notifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          sx={{
                            backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.1)',
                            borderLeft: notification.isRead ? 'none' : `3px solid ${getNotificationColor(notification.type)}`,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              key={notification.sender?.profileImage || notification.id || 'default'} // Force re-render when image changes
                              src={notification.sender?.profileImage}
                              alt={notification.sender?.fname}
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: getNotificationColor(notification.type),
                              }}
                            >
                              {getNotificationIcon(notification.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.text.primary,
                                  fontWeight: notification.isRead ? 'normal' : 'bold',
                                  mb: 0.5,
                                }}
                              >
                                {notification.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.875rem',
                                    mb: 0.5,
                                  }}
                                >
                                  {notification.message}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.disabled,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {formatTimeAgo(notification.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {!notification.isRead && (
                                <MuiIconButton
                                  size="small"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  sx={{
                                    color: theme.palette.success.main,
                                    '&:hover': {
                                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    },
                                  }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </MuiIconButton>
                              )}
                              <MuiIconButton
                                size="small"
                                onClick={() => handleDeleteNotification(notification.id)}
                                sx={{
                                  color: theme.palette.error.main,
                                  '&:hover': {
                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </MuiIconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < notifications.length - 1 && (
                          <Divider sx={{ backgroundColor: theme.palette.divider }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>

              {/* Footer */}
              {notifications.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    borderTop: '1px solid #3b4054',
                    textAlign: 'center',
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<ViewAllIcon />}
                    onClick={handleViewAllNotifications}
                    sx={{
                      color: theme.palette.primary.main,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      },
                    }}
                  >
                    View all notifications
                  </Button>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default NotificationBell;
