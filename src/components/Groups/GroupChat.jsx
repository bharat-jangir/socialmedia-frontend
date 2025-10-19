import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import {
  getGroupMessages,
  sendGroupMessage,
  sendGroupMediaMessage,
  addGroupMessageReaction,
  markGroupMessagesAsRead,
} from "../../state/Groups/groupActions";
import { updateMessageReactions } from "../../state/Groups/groupSlice";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import WebSocketService from "../../utils/sockets";

const GroupChat = ({ group, onClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { groupMessages, sendingMessage } = useSelector((state) => state.groups);
  const currentUser = useSelector((state) => state.auth.user);
  
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  

  // Helper function to stop typing indicator
  const stopTypingIndicator = () => {
    if (isTyping) {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send stop typing event via WebSocket
      if (WebSocketService.isConnected) {
        const stopTypingRequest = {
          groupId: group.id,
          action: "stop_typing"
        };
        
        WebSocketService.sendMessage(
          `/app/group/${group.id}/typing`,
          stopTypingRequest
        );
      }
    }
  };

  // Helper function to manually scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Check if user has reacted with specific emoji (including optimistic state)
  const hasUserReacted = (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return false;
    
    // Check optimistic reactions first
    const optimisticCount = optimisticReactions[messageId]?.[emoji] || 0;
    
    // If user is removing this reaction (negative count), return false
    if (optimisticCount < 0) {
      return false;
    }
    
    // If user has optimistic reaction (positive count), return true
    if (optimisticCount > 0) {
      return true;
    }
    
    // Check server reactions
    const serverReaction = message.reactions?.some(reaction => 
      reaction.user?.id === currentUser?.id && reaction.emoji === emoji
    );
    
    return serverReaction;
  };

  // Get user's current reaction emoji (Instagram style - one reaction per user)
  const getUserCurrentReaction = (messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return null;
    
    // Check optimistic reactions first
    const optimisticReactionsForMessage = optimisticReactions[messageId] || {};
    
    // Check if user is removing a reaction (negative count)
    const removedEmoji = Object.keys(optimisticReactionsForMessage).find(emoji => 
      optimisticReactionsForMessage[emoji] < 0
    );
    
    if (removedEmoji) {
      return null; // Return null if user is removing reaction
    }
    
    // Find emoji with positive count (user's current reaction)
    const optimisticEmoji = Object.keys(optimisticReactionsForMessage).find(emoji => 
      optimisticReactionsForMessage[emoji] > 0
    );
    
    if (optimisticEmoji) {
      return optimisticEmoji;
    }
    
    // Fallback to server reactions
    if (!message.reactions) return null;
    
    // Find user's current reaction from server
    const userReaction = message.reactions.find(reaction => 
      reaction.user?.id === currentUser?.id
    );
    
    return userReaction ? userReaction.emoji : null;
  };

  // Get message reactions with counts
  const getMessageReactions = (messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return { reactions: [], reactionCounts: {}, totalReactionCount: 0 };
    
    const serverReactions = message.reactions || [];
    const serverReactionCounts = message.reactionCounts || {};
    const serverTotalCount = message.totalReactionCount || 0;
    
    // Get optimistic reactions for this message
    const optimisticReactionsForMessage = optimisticReactions[messageId] || {};
    
    // Combine server and optimistic reactions
    const combinedReactionCounts = { ...serverReactionCounts };
    let combinedTotalCount = serverTotalCount;
    
    Object.entries(optimisticReactionsForMessage).forEach(([emoji, count]) => {
      if (count > 0) {
        combinedReactionCounts[emoji] = (combinedReactionCounts[emoji] || 0) + count;
        combinedTotalCount += count;
      } else if (count < 0) {
        combinedReactionCounts[emoji] = Math.max(0, (combinedReactionCounts[emoji] || 0) + count);
        combinedTotalCount = Math.max(0, combinedTotalCount + count);
      }
    });
    
    // Remove emojis with 0 count
    Object.keys(combinedReactionCounts).forEach(emoji => {
      if (combinedReactionCounts[emoji] <= 0) {
        delete combinedReactionCounts[emoji];
      }
    });
    
    return {
      reactions: serverReactions,
      reactionCounts: combinedReactionCounts,
      totalReactionCount: combinedTotalCount
    };
  };

  // Get messages for this group
  const groupId = group?.id;
  const messages = Array.isArray(groupMessages[groupId]) 
    ? groupMessages[groupId]
        .filter(msg => msg && msg.id && msg.createdAt) // Filter out invalid messages
        .sort((a, b) => {
          // Sort by creation time (oldest first, newest last)
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeA - timeB;
        })
    : [];

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log("GroupChat - Messages count:", messages.length);
  }

  // Track previous message count to detect new messages
  const prevMessageCountRef = useRef(0);
  
  // Scroll to bottom when new messages arrive (but not on reactions)
  useEffect(() => {
    const currentMessageCount = messages.length;
    const prevMessageCount = prevMessageCountRef.current;
    
    // Only scroll if there are actually new messages (count increased)
    if (currentMessageCount > prevMessageCount) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100); // Small delay to ensure DOM is updated
    }
    
    // Update the previous count
    prevMessageCountRef.current = currentMessageCount;
  }, [messages.length]); // Only depend on message count, not the entire messages array

  // Handle scroll detection to show/hide scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShowScrollButton(!isAtBottom);
    }
  };

  // Watch for changes in groupMessages (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Messages updated:", messages.length);
    }
  }, [groupMessages, groupId, messages]);

  // Load messages when component mounts
  useEffect(() => {
    if (group?.id) {
      dispatch(getGroupMessages({ groupId: group.id }));
      dispatch(markGroupMessagesAsRead(group.id));
    }
  }, [group?.id, dispatch]);


  // FIXED: Simplified WebSocket subscription with proper cleanup
  useEffect(() => {
    let subscription = null;
    
    if (currentUser && group) {
      const subscribeToGroupChat = async () => {
        try {
          await WebSocketService.initializeWebSocketConnection(currentUser);
          
          // Check if WebSocket is properly connected
          if (!WebSocketService.isConnected || !WebSocketService.stompClient) {
            console.error("❌ WebSocket not connected properly");
            return;
          }
          
          const topic = `/group/${group.id}`;
          
          // Unsubscribe from any existing subscription first
          if (WebSocketService.groupChatSubscription) {
            WebSocketService.groupChatSubscription.unsubscribe();
          }
          
          subscription = WebSocketService.subscribeToTopic(
            topic,
            (response) => {
              try {
                const receivedMessage = JSON.parse(response.body);
                handleWebSocketMessage(receivedMessage);
              } catch (error) {
                console.error("Error parsing WebSocket message:", error);
              }
            }
          );
          
          // Store subscription reference for cleanup
          WebSocketService.groupChatSubscription = subscription;
          
        } catch (error) {
          console.error("Error setting up WebSocket:", error);
        }
      };

      subscribeToGroupChat();

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
        // Clear typing timeout on unmount
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [group?.id, currentUser?.id]); // Only depend on IDs, not entire objects

  // FIXED: Centralized WebSocket message handler
  const handleWebSocketMessage = (receivedMessage) => {
    // Handle regular messages first (messages with ID and content)
    if (receivedMessage.id && receivedMessage.content) {
      // Check if this message is from current user (to prevent duplicates)
      if (receivedMessage.sender?.id === currentUser?.id) {
        // This is the sender's own message - replace optimistic message with real one
        const transformedMessage = {
          id: receivedMessage.id,
          content: receivedMessage.content,
          messageType: receivedMessage.messageType || "TEXT",
          sender: {
            id: receivedMessage.sender?.id,
            fname: receivedMessage.sender?.fname || receivedMessage.sender?.firstName,
            lname: receivedMessage.sender?.lname || receivedMessage.sender?.lastName,
            email: receivedMessage.sender?.email,
            gender: receivedMessage.sender?.gender,
            profileImage: receivedMessage.sender?.profileImage,
            coverImage: receivedMessage.sender?.coverImage,
            userBio: receivedMessage.sender?.userBio,
            following: receivedMessage.sender?.following || [],
            followers: receivedMessage.sender?.followers || []
          },
          createdAt: receivedMessage.createdAt || new Date().toISOString(),
          updatedAt: receivedMessage.updatedAt,
          reactions: receivedMessage.reactions || [],
          reactionCounts: receivedMessage.reactionCounts || {},
          totalReactionCount: receivedMessage.totalReactionCount || 0,
          readBy: receivedMessage.readBy || [],
          readCount: receivedMessage.readCount || 0,
          replyTo: receivedMessage.replyTo,
          isEdited: receivedMessage.isEdited || receivedMessage.edited || false,
          editedAt: receivedMessage.editedAt,
          isDeleted: receivedMessage.isDeleted || receivedMessage.deleted || false,
          deletedAt: receivedMessage.deletedAt,
          systemMessage: receivedMessage.systemMessage || false
        };
        
        // Replace optimistic message with real message
        dispatch({
          type: "groups/replaceGroupMessage",
          payload: {
            groupId: group.id,
            message: transformedMessage,
          },
        });
      } else {
        // This is from another user - add as new message
        const transformedMessage = {
          id: receivedMessage.id,
          content: receivedMessage.content,
          messageType: receivedMessage.messageType || "TEXT",
          sender: {
            id: receivedMessage.sender?.id,
            fname: receivedMessage.sender?.fname || receivedMessage.sender?.firstName,
            lname: receivedMessage.sender?.lname || receivedMessage.sender?.lastName,
            email: receivedMessage.sender?.email,
            gender: receivedMessage.sender?.gender,
            profileImage: receivedMessage.sender?.profileImage,
            coverImage: receivedMessage.sender?.coverImage,
            userBio: receivedMessage.sender?.userBio,
            following: receivedMessage.sender?.following || [],
            followers: receivedMessage.sender?.followers || []
          },
          createdAt: receivedMessage.createdAt || new Date().toISOString(),
          updatedAt: receivedMessage.updatedAt,
          reactions: receivedMessage.reactions || [],
          reactionCounts: receivedMessage.reactionCounts || {},
          totalReactionCount: receivedMessage.totalReactionCount || 0,
          readBy: receivedMessage.readBy || [],
          readCount: receivedMessage.readCount || 0,
          replyTo: receivedMessage.replyTo,
          isEdited: receivedMessage.isEdited || receivedMessage.edited || false,
          editedAt: receivedMessage.editedAt,
          isDeleted: receivedMessage.isDeleted || receivedMessage.deleted || false,
          deletedAt: receivedMessage.deletedAt,
          systemMessage: receivedMessage.systemMessage || false
        };
        
        // Add the message to Redux store
        dispatch({
          type: "groups/addGroupMessage",
          payload: {
            groupId: group.id,
            message: transformedMessage,
          },
        });
      }
      
      return; // Exit early
    }
    
    // Handle reaction updates (messages with ID and reactions but no content)
    if (receivedMessage.id && receivedMessage.reactions !== undefined && !receivedMessage.content) {
      // Update message reactions in Redux
      dispatch(updateMessageReactions({
        groupId: receivedMessage.groupId || group.id,
        messageId: receivedMessage.id,
        reactions: receivedMessage.reactions || [],
        reactionCounts: receivedMessage.reactionCounts || {},
        totalReactionCount: receivedMessage.totalReactionCount || 0
      }));
      
      // Clear optimistic updates for this message
      setOptimisticReactions(prev => {
        const newOptimistic = { ...prev };
        delete newOptimistic[receivedMessage.id];
        return newOptimistic;
      });
      
      return; // Exit early, don't process as regular message
    }
    
    // Handle typing indicators
    if (receivedMessage.action === 'typing' || receivedMessage.action === 'stop_typing') {
      if (receivedMessage.sender && receivedMessage.sender.id !== currentUser?.id) {
        if (receivedMessage.action === 'typing') {
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user.id !== receivedMessage.sender.id);
            return [...filtered, {

              
              id: receivedMessage.sender.id,
              firstName: receivedMessage.sender.fname || receivedMessage.sender.firstName,
              lastName: receivedMessage.sender.lname || receivedMessage.sender.lastName,
              profileImage: receivedMessage.sender.profileImage
            }];
          });
        } else if (receivedMessage.action === 'stop_typing') {
          setTypingUsers(prev => prev.filter(user => user.id !== receivedMessage.sender.id));
        }
      }
      return;
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);


  // Debug function for testing reactions
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.testGroupReaction = (messageId, emoji = '❤️') => {
        console.log('🧪 Testing group reaction:', { messageId, emoji, groupId: group.id });
        handleReaction(messageId, emoji);
      };
      
      window.testGroupReactionStatus = () => {
        console.log('🧪 Group Reaction Status:');
        console.log('- WebSocket Connected:', WebSocketService.isConnected);
        console.log('- Group ID:', group.id);
        console.log('- Current User:', currentUser);
        console.log('- Messages Count:', messages.length);
        console.log('- Optimistic Reactions:', optimisticReactions);
        console.log('- Available Messages:', messages.map(m => ({ id: m.id, content: m.content?.substring(0, 50) })));
      };
      
      window.testRemoveAllReactions = (messageId) => {
        console.log('🧪 Testing remove all reactions:', { messageId, groupId: group.id });
        handleRemoveAllReactions(messageId);
      };
      
      window.testReactionEndpoints = () => {
        console.log('🧪 Reaction Endpoints Test:');
        console.log('- Add Reaction Endpoint: /app/group/' + group.id + '/react');
        console.log('- Remove Reaction Endpoint: /app/group/' + group.id + '/react');
        console.log('- Remove All Reactions Endpoint: /app/group/' + group.id + '/react');
        console.log('- Subscribe to: /group/' + group.id);
      };
      
      window.debugWebSocketMessages = () => {
        console.log('🔍 WebSocket Debug Info:');
        console.log('- WebSocket Connected:', WebSocketService.isConnected);
        console.log('- Stomp Client:', !!WebSocketService.stompClient);
        console.log('- Group ID:', group.id);
        console.log('- Subscription Topic: /group/' + group.id);
        
        // Add temporary message listener
        if (WebSocketService.stompClient && WebSocketService.isConnected) {
          const testSubscription = WebSocketService.stompClient.subscribe(
            `/group/${group.id}`,
            (message) => {
              console.log('🔍 RAW WEBSOCKET MESSAGE RECEIVED:', message.body);
              console.log('🔍 Message Headers:', message.headers);
            }
          );
          
          console.log('🔍 Test subscription created for 10 seconds...');
          setTimeout(() => {
            testSubscription.unsubscribe();
            console.log('🔍 Test subscription removed');
          }, 10000);
        }
      };
    }
  }, [group.id, currentUser, messages.length, optimisticReactions]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) {
      return;
    }

    const messageRequest = {
      groupId: group.id,
      content: newMessage.trim(),
      messageType: "TEXT",
      action: "send"
    };

    try {
      // Always try WebSocket first, fallback to REST API
      if (WebSocketService.isConnected && WebSocketService.stompClient) {
        // Add message optimistically to local state
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMessage = {
          id: tempId, // Temporary ID
          content: newMessage.trim(),
          messageType: "TEXT",
          sender: currentUser,
          createdAt: new Date().toISOString(),
          reactions: [],
          reactionCounts: {},
          totalReactionCount: 0,
          readBy: [],
          readCount: 0,
          isOptimistic: true, // Flag to identify optimistic messages
          tempId: tempId // Store temp ID for matching
        };
        
        dispatch({
          type: "groups/addGroupMessage",
          payload: {
            groupId: group.id,
            message: optimisticMessage,
          },
        });
        
        WebSocketService.sendMessage(
          `/app/group/${group.id}/send`,
          messageRequest
        );
        setNewMessage("");
        stopTypingIndicator();
      } else {
        const result = await dispatch(sendGroupMessage({
          groupId: group.id,
          messageData: {
            content: newMessage.trim(),
            messageType: "TEXT",
          },
        }));
        setNewMessage("");
        stopTypingIndicator();
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Remove optimistic message on error
      if (optimisticMessage) {
        dispatch({
          type: "groups/removeGroupMessage",
          payload: {
            groupId: group.id,
            messageId: optimisticMessage.tempId,
          },
        });
      }
    }
  };

  // Handle key press
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // FIXED: Simplified reaction handler
  const handleReaction = (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) {
      return;
    }
    
    // Get user's current reaction (from both server and optimistic state)
    const currentUserReaction = getUserCurrentReaction(messageId);
    
    if (currentUserReaction === emoji) {
      // User clicked the same emoji - remove reaction
      handleRemoveReaction(messageId, emoji);
    } else if (currentUserReaction) {
      // User has a different reaction - replace it
      handleReplaceReaction(messageId, emoji);
    } else {
      // User has no reaction - add new one
      handleAddReaction(messageId, emoji);
    }
  };

  // FIXED: Simplified add reaction
  const handleAddReaction = (messageId, emoji) => {
    // Add optimistic update
    setOptimisticReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: (prev[messageId]?.[emoji] || 0) + 1
      }
    }));
    
    // Send via WebSocket
    if (WebSocketService.isConnected) {
      const reactionRequest = {
        groupId: group.id,
        messageId: messageId,
        reaction: emoji,
        action: "react"
      };
      
      WebSocketService.sendMessage(`/app/group/${group.id}/react`, reactionRequest);
    } else {
      dispatch(addGroupMessageReaction({
        groupId: group.id,
        messageId: messageId,
        emoji: emoji
      }));
    }
  };

  // FIXED: Simplified replace reaction
  const handleReplaceReaction = (messageId, newEmoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const currentUserReaction = getUserCurrentReaction(messageId);
    if (!currentUserReaction) return;
    
    const currentEmoji = currentUserReaction;
    
    // Add optimistic update for replacement
    setOptimisticReactions(prev => {
      const newOptimistic = { ...prev };
      if (!newOptimistic[messageId]) {
        newOptimistic[messageId] = {};
      }
      
      // Remove current emoji (decrement by 1)
      if (newOptimistic[messageId][currentEmoji]) {
        newOptimistic[messageId][currentEmoji] = Math.max(0, newOptimistic[messageId][currentEmoji] - 1);
        if (newOptimistic[messageId][currentEmoji] <= 0) {
          delete newOptimistic[messageId][currentEmoji];
        }
      } else {
        newOptimistic[messageId][currentEmoji] = -1;
      }
      
      // Add new emoji (increment by 1)
      newOptimistic[messageId][newEmoji] = (newOptimistic[messageId][newEmoji] || 0) + 1;
      
      // Remove message entry if no reactions left
      if (Object.keys(newOptimistic[messageId]).length === 0) {
        delete newOptimistic[messageId];
      }
      
      return newOptimistic;
    });
    
    // Send remove reaction for old emoji
    if (WebSocketService.isConnected) {
      WebSocketService.sendMessage(`/app/group/${group.id}/react`, {
        groupId: group.id,
        messageId: messageId,
        reaction: currentEmoji,
        action: "remove_reaction"
      });
      
      // Send add reaction for new emoji
      WebSocketService.sendMessage(`/app/group/${group.id}/react`, {
        groupId: group.id,
        messageId: messageId,
        reaction: newEmoji,
        action: "react"
      });
    }
  };

  // FIXED: Simplified remove reaction
  const handleRemoveReaction = (messageId, emoji) => {
    // Add optimistic update for removal
    setOptimisticReactions(prev => {
      const newOptimistic = { ...prev };
      if (!newOptimistic[messageId]) {
        newOptimistic[messageId] = {};
      }
      
      newOptimistic[messageId] = {
        ...newOptimistic[messageId],
        [emoji]: -1  // Negative count indicates removal
      };
      
      return newOptimistic;
    });
    
    // Send via WebSocket
    if (WebSocketService.isConnected) {
      const removeRequest = {
        groupId: group.id,
        messageId: messageId,
        reaction: emoji,
        action: "remove_reaction"
      };
      
      WebSocketService.sendMessage(`/app/group/${group.id}/react`, removeRequest);
    } else {
      dispatch({
        type: "groups/removeReactionFromMessage",
        payload: {
          groupId: group.id,
          messageId: messageId,
          userId: currentUser?.id,
          emoji: emoji
        },
      });
    }
  };

  // Handle removing all reactions (for admin/message owner)
  const handleRemoveAllReactions = (messageId) => {
    // Add optimistic update for removal of all reactions
    setOptimisticReactions(prev => {
      const newOptimistic = { ...prev };
      newOptimistic[messageId] = { __removeAll: true };
      return newOptimistic;
    });
    
    // Send via WebSocket
    if (WebSocketService.isConnected) {
      const removeAllRequest = {
        groupId: group.id,
        messageId: messageId,
        action: "remove_all_reactions"
      };
      
      WebSocketService.sendMessage(`/app/group/${group.id}/react`, removeAllRequest);
    }
  };


  // Handle message input change
  const handleMessageChange = (event) => {
    setNewMessage(event.target.value);
    handleTyping();
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      const typingRequest = {
        groupId: group.id,
        action: "typing"
      };
      
      if (WebSocketService.isConnected) {
        WebSocketService.sendMessage(
          `/app/group/${group.id}/typing`,
          typingRequest
        );
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const stopTypingRequest = {
        groupId: group.id,
        action: "stop_typing"
      };
      
      if (WebSocketService.isConnected) {
        WebSocketService.sendMessage(
          `/app/group/${group.id}/typing`,
          stopTypingRequest
        );
      }
    }, 3000);
  };

  // Check if message is from current user
  const isCurrentUserMessage = (message) => {
    return message.sender?.id === currentUser?.id;
  };

  // Format message time
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!group) {
    return (
      <Box className="flex-1 flex items-center justify-center">
        <Typography sx={{ color: theme.palette.text.secondary }}>No group selected</Typography>
      </Box>
    );
  }

  return (
    <Box 
      className="group-chat-container"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      {/* Header */}
      <Box 
        className="group-chat-header flex items-center justify-between p-4 border-b"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Box className="flex items-center space-x-3">
          <IconButton 
            onClick={onClose} 
            sx={{ color: theme.palette.text.secondary }}
          >
            <MoreVertIcon />
          </IconButton>
          <Avatar
            src={group?.groupImage}
            className="w-10 h-10"
            sx={{ backgroundColor: theme.palette.primary.main }}
          >
            <GroupIcon />
          </Avatar>
          <Box>
            <Typography 
              variant="h6" 
              className="font-semibold"
              sx={{ color: theme.palette.text.primary }}
            >
              {group?.name}
            </Typography>
            <Typography 
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {group?.activeMemberCount || 0} members
            </Typography>
          </Box>
        </Box>
        
      </Box>

      {/* Messages */}
      <Box 
        ref={messagesContainerRef}
        className="group-chat-messages p-4 space-y-4 relative"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <Box className="flex flex-col items-center justify-center h-full text-center">
            <GroupIcon 
              className="text-6xl mb-4" 
              sx={{ color: theme.palette.text.secondary }}
            />
            <Typography 
              variant="h6" 
              sx={{ color: theme.palette.text.secondary, mb: 2 }}
            >
              No messages yet
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: theme.palette.text.disabled }}
            >
              Start the conversation in {group?.name}
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = isCurrentUserMessage(message);
            const messageReactions = getMessageReactions(message.id);
            
            return (
              <Box
                key={message.id || index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <Box className="relative group">
                  {/* Message Bubble */}
                  <Box
                    className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl"
                    sx={{
                      backgroundColor: isOwnMessage 
                        ? '#FF6B6B' // Orange for sender (using SoulConnect primary color)
                        : theme.palette.mode === 'dark' 
                          ? '#4A5568' // Dark gray for receiver in dark mode
                          : '#E2E8F0', // Light gray for receiver in light mode
                      color: isOwnMessage 
                        ? '#FFFFFF' // White text for orange background
                        : theme.palette.text.primary,
                      borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                    }}
                  >
                    {!isOwnMessage && (
                      <Typography 
                        variant="caption" 
                        className="font-semibold block mb-1"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        {message.sender?.firstName || message.sender?.fname} {message.sender?.lastName || message.sender?.lname}
                      </Typography>
                    )}
                    
                    {message.messageType === "IMAGE" ? (
                      <Box className="mt-1">
                        <img
                          src={message.mediaUrl}
                          alt="Shared media"
                          className="max-w-full h-auto rounded-lg"
                        />
                        {message.content && (
                          <Typography variant="body2" className="mt-2">
                            {message.content}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" className="leading-relaxed">
                        {message.content}
                      </Typography>
                    )}
                    
                    <Typography
                      variant="caption"
                      className="text-xs mt-1 block"
                      sx={{
                        color: isOwnMessage 
                          ? 'rgba(255, 255, 255, 0.8)' // Semi-transparent white for orange background
                          : theme.palette.text.secondary
                      }}
                    >
                      {formatMessageTime(message.createdAt)}
                    </Typography>
                  </Box>
                  
                  {/* Instagram-like Reaction Tray - Only for other users' messages */}
                  {!isOwnMessage && (
                    <Box className="absolute -bottom-3 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 group-hover:scale-100 scale-95">
                      <Box className="bg-gray-900/95 rounded-full px-4 py-2 shadow-xl border border-gray-700 backdrop-blur-sm">
                        <Box className="flex items-center space-x-2">
                          {["❤️", "😂", "😮", "😢", "😡", "👍"].map((emoji) => {
                            const isReacted = hasUserReacted(message.id, emoji);
                            const emojiCount = messageReactions.reactionCounts[emoji] || 0;
                            const userCurrentReaction = getUserCurrentReaction(message.id);
                            const isUserCurrentReaction = userCurrentReaction === emoji;
                            
                            return (
                              <Box key={emoji} className="relative">
                                <IconButton
                                  size="small"
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className={`text-xl p-1.5 rounded-full transition-all duration-200 ${
                                    isUserCurrentReaction
                                      ? 'bg-blue-500 hover:bg-blue-600 scale-110 shadow-md ring-2 ring-blue-300' 
                                      : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:scale-110'
                                  }`}
                                  title={
                                    isUserCurrentReaction
                                      ? `Remove ${emoji} reaction (${emojiCount} total)` 
                                      : userCurrentReaction
                                        ? `Change reaction to ${emoji} (${emojiCount} total)`
                                        : `React with ${emoji} (${emojiCount} total)`
                                  }
                                >
                                  {emoji}
                                </IconButton>
                                {/* Count indicator - only show if there are reactions */}
                                {emojiCount > 0 && (
                                  <Box className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center px-2 border-2 border-gray-900 font-semibold shadow-sm">
                                    {emojiCount}
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Reaction Count Pills - Show below message if there are reactions */}
                  {messageReactions.totalReactionCount > 0 && (
                    <Box className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(messageReactions.reactionCounts).map(([emoji, count]) => (
                        <Chip
                          key={emoji}
                          label={`${emoji} ${count}`}
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Box 
            className="flex items-center space-x-2 p-3 rounded-lg mx-4"
            sx={{ backgroundColor: theme.palette.background.paper }}
          >
            <Box className="flex space-x-1">
              <Box 
                className="w-2 h-2 rounded-full animate-bounce" 
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  animationDelay: '0ms' 
                }}
              ></Box>
              <Box 
                className="w-2 h-2 rounded-full animate-bounce" 
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  animationDelay: '150ms' 
                }}
              ></Box>
              <Box 
                className="w-2 h-2 rounded-full animate-bounce" 
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  animationDelay: '300ms' 
                }}
              ></Box>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ color: theme.palette.text.secondary }}
            >
              {typingUsers.length === 1 
                ? `${typingUsers[0].firstName || typingUsers[0].fname} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </Typography>
          </Box>
        )}
        
        {/* Scroll to bottom reference */}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Box className="absolute bottom-4 right-4">
            <IconButton
              onClick={scrollToBottom}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                boxShadow: theme.shadows[4],
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                }
              }}
              size="small"
            >
              <SendIcon className="rotate-180" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <Box 
        className="group-chat-input p-4 border-t"
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      >
        <Box className="flex items-center space-x-2 w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedFile(file);
              }
            }}
            className="hidden"
            accept="image/*"
          />
          
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            sx={{ color: theme.palette.text.secondary }}
          >
            <AttachFileIcon />
          </IconButton>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${group?.name}...`}
            disabled={sendingMessage}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderRadius: '8px',
                "& fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
              "& .MuiInputBase-input::placeholder": {
                color: theme.palette.text.disabled,
              },
            }}
          />
          
          <IconButton sx={{ color: theme.palette.text.secondary }}>
            <EmojiIcon />
          </IconButton>
          
          <IconButton
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            sx={{
              color: theme.palette.primary.main,
              '&:disabled': {
                color: theme.palette.action.disabled,
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

    </Box>
  );
};

export default GroupChat;