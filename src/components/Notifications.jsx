import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Divider,
  Box,
  Chip,
  Button,
  AppBar,
  Toolbar,
  Container,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Favorite,
  Comment,
  Share,
  PersonAdd,
  Notifications as NotificationIcon,
  MarkAsUnread,
  ArrowBack,
  CheckCircle,
  Delete,
  NotificationsNone,
} from "@mui/icons-material";
import { useNotifications } from '../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';

function Notifications() {
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
  const [filter, setFilter] = useState("all"); // all, unread, read

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

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.isRead;
    if (filter === "read") return notification.isRead;
    return true; // all
  });

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary
    }}>
      {/* Instagram-like Header */}
      <AppBar 
        position="sticky" 
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate(-1)}
            sx={{ 
              mr: 2,
              color: theme.palette.text.primary
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              color: theme.palette.text.primary
            }}
          >
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button
                color="primary"
                onClick={handleMarkAllAsRead}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                color="error"
                onClick={handleDeleteAllNotifications}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                startIcon={<Delete />}
              >
                Delete All
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Filter Chips */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            onClick={() => setFilter("all")}
            color={filter === "all" ? "primary" : "default"}
            variant={filter === "all" ? "filled" : "outlined"}
            sx={{ 
              color: filter === "all" ? theme.palette.text.primary : theme.palette.text.secondary,
              borderColor: theme.palette.divider
            }}
          />
          <Chip
            label={`Unread (${unreadCount})`}
            onClick={() => setFilter("unread")}
            color={filter === "unread" ? "primary" : "default"}
            variant={filter === "unread" ? "filled" : "outlined"}
            sx={{ 
              color: filter === "unread" ? theme.palette.text.primary : theme.palette.text.secondary,
              borderColor: theme.palette.divider
            }}
          />
          <Chip
            label="Read"
            onClick={() => setFilter("read")}
            color={filter === "read" ? "primary" : "default"}
            variant={filter === "read" ? "filled" : "outlined"}
            sx={{ 
              color: filter === "read" ? theme.palette.text.primary : theme.palette.text.secondary,
              borderColor: theme.palette.divider
            }}
          />
        </Box>

        {/* Notifications List */}
        <Card sx={{ 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : filteredNotifications.length > 0 ? (
              <List sx={{ p: 0 }}>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.1)',
                        borderLeft: notification.isRead ? 'none' : `3px solid ${getNotificationColor(notification.type)}`,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                        py: 2,
                        px: 3,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={notification.sender?.profileImage}
                          alt={notification.sender?.fname}
                          sx={{
                            width: 48,
                            height: 48,
                            backgroundColor: getNotificationColor(notification.type),
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {!notification.isRead && (
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notification.id)}
                              sx={{
                                color: theme.palette.success.main,
                                '&:hover': {
                                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                },
                              }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteNotification(notification.id)}
                            sx={{
                                color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredNotifications.length - 1 && (
                      <Divider sx={{ backgroundColor: theme.palette.divider }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <NotificationsNone sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" sx={{ color: theme.palette.text.disabled, mb: 1 }}>
                  No notifications found
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                  {filter === "unread"
                    ? "You're all caught up! No unread notifications."
                    : filter === "read"
                    ? "No read notifications yet."
                    : "You don't have any notifications yet."}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Notifications;
