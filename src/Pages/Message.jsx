import {
  Avatar,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  Backdrop,
  CircularProgress,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Group";
import ChatIcon from "@mui/icons-material/Chat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ExploreIcon from "@mui/icons-material/Explore";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import SearchChat from "../components/SearchChat";
import UserChatCard from "../components/UserChatCard";
import ChatMessages from "../components/ChatMessages";
import GroupList from "../components/Groups/GroupList";
import GroupChat from "../components/Groups/GroupChat";
import CreateGroupModal from "../components/Groups/CreateGroupModal";
import ExploreGroupsModal from "../components/Groups/ExploreGroupsModal";

import { createMessage, getAllChats } from "../state/Message/message.action";
import { addMessageToChat, updateMessageInChat, replaceMessageInChat } from "../state/Message/messageSlice";
import { getUserGroups } from "../state/Groups/groupActions";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import WebSocketService from "../utils/sockets";

function Message() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md breakpoint (768px)
  const [currentChat, setCurrentChat] = useState();
  const [currentGroup, setCurrentGroup] = useState();
  const [messages, setMessages] = useState([]);
  const [selectedImage, setSelectedImage] = useState();
  const [activeTab, setActiveTab] = useState(0);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExploreGroupsModalOpen, setIsExploreGroupsModalOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);


  const chatContainerRef = useRef(null);
  const processedMessageIdsRef = useRef(new Set());

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  // Select only necessary parts to prevent re-renders when messages are sent
  // This ensures chat list doesn't re-render when loadingMessage or message state changes
  const loadingChats = useSelector((state) => state.message.loadingChats);
  const refreshingChats = useSelector((state) => state.message.refreshingChats);
  const chats = useSelector((state) => state.message.chats);
  // Need to access newly created message for immediate display
  const newMessage = useSelector((state) => state.message.message);
  const { auth, groups } = useSelector((state) => ({
    auth: state.auth,
    groups: state.groups,
  }));



  const [anchorEl, setAnchorEl] = useState(null);

  // Open menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // --- Helpers ---
  const sortMessagesAsc = (list) => {
    return [...(list || [])].sort((a, b) => {
      const ta = new Date(a.createdAt || a.timestamp || a.time || 0).getTime();
      const tb = new Date(b.createdAt || b.timestamp || b.time || 0).getTime();
      if (ta !== tb) return ta - tb; // Ascending order (oldest first)
      const ia = (a.id || "").toString();
      const ib = (b.id || "").toString();
      return ia.localeCompare(ib); // Ascending order for IDs too
    });
  };

  useEffect(() => {
    dispatch(getAllChats());
    if (auth.user?.id) dispatch(getUserGroups());
  }, [dispatch, auth.user?.id]);

  useEffect(() => {
    const onVisibleOrFocus = () => dispatch(getAllChats());
    window.addEventListener("focus", onVisibleOrFocus);
    const onVisibility = () => {
      if (document.visibilityState === "visible") onVisibleOrFocus();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onVisibleOrFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dispatch]);

  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId && chats.length > 0) {
      const targetChat = chats.find(
        (chat) => chat.id.toString() === chatId
      );
      if (targetChat) {
        setCurrentChat(targetChat);
        setMessages(sortMessagesAsc(targetChat.messages || []));
        navigate("/message", { replace: true });
      }
    }
  }, [searchParams, chats, navigate]);

  useEffect(() => {
    if (!currentChat) return;
    const updated = chats.find((c) => 
      c.id === currentChat.id || 
      c.id?.toString() === currentChat.id?.toString()
    );
    if (updated) {
      // Only update if messages actually changed to avoid unnecessary re-renders
      const sortedMessages = sortMessagesAsc(updated.messages || []);
      setCurrentChat(updated);
      setMessages(sortedMessages);
    }
  }, [chats, currentChat?.id]);

  // Sync messages when a new message is created (via API)
  // This is needed to show the message immediately to the sender
  useEffect(() => {
    if (newMessage && currentChat) {
      const chatId = newMessage.chatId || newMessage.chat?.id;
      if (chatId && (chatId === currentChat.id || chatId?.toString() === currentChat.id?.toString())) {
        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (m) => m.id === newMessage.id || (m.id?.toString() === newMessage.id?.toString())
          );
          if (!exists) {
            return sortMessagesAsc([...prevMessages, newMessage]);
          }
          return prevMessages;
        });
      }
    }
  }, [newMessage, currentChat?.id]);

  async function handleSelectImage(e) {
    setLoading(true);
    const imgUrl = await uploadToCloudinary(e.target.files[0], "image");
    setSelectedImage(imgUrl);
    setLoading(false);
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentChat(null);
    setCurrentGroup(null);
    setMessages([]);
  };

  const handleGroupSelect = (group) => {
    setCurrentGroup(group);
    setCurrentChat(null);
    setMessages([]);
  };

  // Handle sending message via WebSocket (similar to group chat) - NO HTTP FALLBACK
  const handleCreateMessage = async (value) => {
    if (!value || !value.trim() || !currentChat || !currentChat.id) {
      console.error("❌ Cannot send message: Invalid input or chat");
      return;
    }


    // Ensure WebSocket is connected before sending
    if (!WebSocketService.isConnected || !WebSocketService.stompClient) {
      console.warn("⚠ WebSocket not connected. Attempting to reconnect...");
      try {
        await WebSocketService.initializeWebSocketConnection(auth.user);
        if (!WebSocketService.isConnected || !WebSocketService.stompClient) {
          alert("Unable to connect to server. Please check your connection and try again.");
          return;
        }
      } catch (error) {
        console.error("❌ Failed to connect WebSocket:", error);
        alert("Unable to connect to server. Please check your connection and try again.");
        return;
      }
    }

    const messageRequest = {
      chatId: currentChat.id,
      content: value.trim(),
      imageUrl: selectedImage || null,
      messageType: "TEXT",
      action: "send"
    };
    

    let optimisticMessage = null;

    try {
      // Add message optimistically to local state for immediate UI feedback
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      optimisticMessage = {
        id: tempId,
        chatId: currentChat.id,
        content: value.trim(),
        image: selectedImage || null,
        user: auth.user,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        tempId: tempId
      };
      
      // Add optimistic message to local state
      setMessages((prev) => {
        return sortMessagesAsc([...prev, optimisticMessage]);
      });
      
      // Also update Redux state
      dispatch(addMessageToChat({ chatId: currentChat.id, message: optimisticMessage }));
      
      // Send via WebSocket (only method, no HTTP fallback)
      const sent = WebSocketService.sendMessage(
        `/app/chat/${currentChat.id}/send`,
        messageRequest
      );
      
      if (!sent) {
        throw new Error("Failed to send message via WebSocket - sendMessage returned false");
      }
      
      // Clear input and image
      setSelectedImage(null);
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
      console.error("  Error details:", error.message);
      console.error("  Stack:", error.stack);
      
      // Remove optimistic message on error
      if (optimisticMessage) {
        setMessages((prev) => {
          return prev.filter(msg => msg.tempId !== optimisticMessage.tempId);
        });
        
        // Also remove from Redux
        dispatch(updateMessageInChat({ chatId: currentChat.id, message: null }));
      }
      
      alert("Failed to send message: " + (error.message || "Unknown error") + ". Please try again.");
    }
  };

  // WebSocket subscription for direct chat (similar to group chat pattern)
  useEffect(() => {
    if (!auth.user || !currentChat || !currentChat.id) {
      return;
    }

    let topicSubscription = null;

    const subscribeToChat = async () => {
      try {
        await WebSocketService.initializeWebSocketConnection(auth.user);
        
        // Check if WebSocket is properly connected
        if (!WebSocketService.isConnected || !WebSocketService.stompClient) {
          console.error("❌ WebSocket not connected properly");
          return;
        }
        
        // Use SINGLE subscription (topic only, like group chat) to avoid duplicates
        const chatTopic = `/chat/${currentChat.id}`;
        
        // Unsubscribe from any existing subscriptions first
        if (WebSocketService.directChatSubscription) {
          WebSocketService.directChatSubscription.unsubscribe();
        }
        if (WebSocketService.directChatSubscriptionTopic) {
          WebSocketService.directChatSubscriptionTopic.unsubscribe();
        }
        
        // Store currentChat.id in a local variable to avoid closure issues
        const chatId = currentChat.id;
        
        // SINGLE subscription to chat topic (same pattern as group chat)
        topicSubscription = WebSocketService.subscribeToTopic(
          chatTopic,
          (response) => {
            try {
              const receivedMessage = JSON.parse(response.body);
              
              // Verify this message is for the current chat
              const messageChatId = receivedMessage.chatId?.toString();
              const currentChatIdStr = chatId?.toString();
              
              if (messageChatId === currentChatIdStr || receivedMessage.chatId === chatId) {
                handleWebSocketMessage(receivedMessage);
              }
            } catch (error) {
              console.error("❌ Error parsing WebSocket message:", error);
            }
          }
        );
        
        // Store subscription for cleanup
        WebSocketService.directChatSubscription = topicSubscription;
        WebSocketService.directChatSubscriptionTopic = null; // Clear the old reference
        
      } catch (error) {
        console.error("WebSocket connection failed:", error);
      }
    };
    
    subscribeToChat();
    
    return () => {
      if (topicSubscription) {
        topicSubscription.unsubscribe();
      }
      // Also clean up stored references
      if (WebSocketService.directChatSubscription) {
        WebSocketService.directChatSubscription = null;
      }
      if (WebSocketService.directChatSubscriptionTopic) {
        WebSocketService.directChatSubscriptionTopic = null;
      }
      // Clear processed message IDs when chat changes to allow new messages
      processedMessageIdsRef.current.clear();
    };
  }, [currentChat?.id, auth.user?.id, currentChat]);

  // Centralized WebSocket message handler for direct chat (similar to group chat)
  const handleWebSocketMessage = (receivedMessage) => {
    // Validate message has required fields
    if (!receivedMessage || !receivedMessage.id) {
      console.error("❌ Invalid message: missing ID");
      return;
    }
    
    // CRITICAL: Prevent duplicate processing using message ID tracking
    const messageId = receivedMessage.id?.toString();
    if (!messageId) {
      return;
    }
    
    // Check if we've already processed this message
    if (processedMessageIdsRef.current.has(messageId)) {
      return; // Already processed, skip
    }
    
    // Mark as processed immediately to prevent race conditions
    processedMessageIdsRef.current.add(messageId);
    
    // Clean up old processed IDs (keep last 100 to prevent memory leak)
    if (processedMessageIdsRef.current.size > 100) {
      const idsArray = Array.from(processedMessageIdsRef.current);
      processedMessageIdsRef.current = new Set(idsArray.slice(-50));
    }
    
    // Handle regular messages (not deleted)
    if (receivedMessage.content !== undefined && !receivedMessage.isDeleted) {
      const chatId = receivedMessage.chatId || currentChat?.id;
      
      // Additional check: message already exists in state
      setMessages((prevMessages) => {
        const exists = prevMessages.some(
          (m) => (m.id?.toString() === messageId) && !m.isOptimistic
        );
        
        // If message already exists (and it's not optimistic), skip processing
        if (exists) {
          return prevMessages; // Don't modify state, message already there
        }
        
        // Transform backend response to match frontend format
        const transformedMessage = {
          id: receivedMessage.id,
          chatId: chatId,
          content: receivedMessage.content,
          image: receivedMessage.imageUrl,
          user: {
            id: receivedMessage.userId,
            fname: receivedMessage.userName?.split(' ')[0] || auth.user?.fname,
            lname: receivedMessage.userName?.split(' ')[1] || auth.user?.lname,
            email: auth.user?.email,
            profileImage: receivedMessage.userProfileImage
          },
          timestamp: receivedMessage.timestamp || receivedMessage.createdAt,
          createdAt: receivedMessage.createdAt || receivedMessage.timestamp,
          isEdited: receivedMessage.isEdited || false,
          isDeleted: receivedMessage.isDeleted || false,
        };
        
        // Check if this message is from current user (to replace optimistic message)
        const isFromCurrentUser = receivedMessage.userId === auth.user?.id || 
                                  receivedMessage.userId?.toString() === auth.user?.id?.toString();
        
        if (isFromCurrentUser) {
          // This is the sender's own message - replace optimistic message with real one
          // Use Redux action (like group chat) to properly handle replacement
          dispatch(replaceMessageInChat({ chatId, message: transformedMessage }));
          
          // Update local state: remove optimistic, add real message
          const filteredMessages = prevMessages.filter(
            (msg) => !(msg.isOptimistic && msg.user?.id === transformedMessage.user?.id)
          );
          
          // Check if real message already exists
          const hasRealMessage = filteredMessages.some(
            (m) => m.id?.toString() === messageId && !m.isOptimistic
          );
          
          if (!hasRealMessage) {
            return sortMessagesAsc([...filteredMessages, transformedMessage]);
          }
          
          // Real message already exists, just return filtered (removed optimistic duplicates)
          return sortMessagesAsc(filteredMessages);
        } else {
          // This is from another user - add as new message (already checked for duplicates above)
          dispatch(addMessageToChat({ chatId, message: transformedMessage }));
          return sortMessagesAsc([...prevMessages, transformedMessage]);
        }
      });
    }
  };


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="message-container" style={{ height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      <Grid container className="h-full w-full" sx={{ height: '100vh', position: 'relative' }}>
        {/* Left Panel - Chat List */}
        {(!isMobile || (!currentChat && !currentGroup)) && (
        <Grid 
          item 
          xs={12} 
          md={3} 
          className="message-left-panel px-5"
          sx={{
            height: '100vh',
            overflow: 'hidden',
            borderRight: { md: `1px solid ${theme.palette.divider}` },
            backgroundColor: { xs: theme.palette.background.paper, md: 'transparent' }
          }}
        >
          <div className="flex h-full flex-col">
            <div className="w-full">
              <div className="flex items-center space-x-4 py-5">
                <IconButton onClick={() => navigate(-1)}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" className="font-bold">
                  Messages
                </Typography>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mb-4">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="flex-1 py-1.5 rounded-lg font-medium text-xs"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    }
                  }}
                  size="small"
                >
                  Create Group
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExploreIcon />}
                  onClick={() => setIsExploreGroupsModalOpen(true)}
                  className="flex-1 py-1.5 rounded-lg font-medium text-xs"
                  sx={{
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                    }
                  }}
                  size="small"
                >
                  Explore
                </Button>
              </div>

              {/* Tabs */}
              <Box 
                className="border-b mb-4"
                sx={{ 
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  className="min-h-0"
                  sx={{
                    "& .MuiTab-root": {
                      color: theme.palette.text.secondary,
                      textTransform: "none",
                      minHeight: "56px",
                      fontSize: "14px",
                      fontWeight: "500",
                      "&.Mui-selected": {
                        color: theme.palette.primary.main,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 107, 107, 0.1)' 
                          : 'rgba(255, 107, 107, 0.05)',
                      },
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: theme.palette.primary.main,
                      height: "3px",
                      borderRadius: "2px",
                    },
                  }}
                >
                  <Tab
                    icon={<ChatIcon />}
                    iconPosition="start"
                    label={`Chats (${chats.length})`}
                    className="flex-1"
                  />
                  <Tab
                    icon={<GroupIcon />}
                    iconPosition="start"
                    label={`Groups (${groups.groups.length})`}
                    className="flex-1"
                  />
                </Tabs>
              </Box>

              <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                {activeTab === 0 ? (
                  <>
                    <SearchChat />
                    <div className="h-full space-y-4 mt-5 overflow-y-scroll hideScrollbar relative">
                      {/* Show refresh loader at top when refreshing with existing chats */}
                      {refreshingChats && chats.length > 0 && (
                        <div className="flex items-center justify-center py-2 sticky top-0 z-10" 
                             style={{ backgroundColor: theme.palette.background.paper }}>
                          <CircularProgress 
                            size={24} 
                            sx={{ color: theme.palette.primary.main }}
                          />
                        </div>
                      )}
                      
                      {/* Initial load - show full loader */}
                      {loadingChats && chats.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <CircularProgress 
                            size={40} 
                            sx={{ color: theme.palette.primary.main }}
                          />
                        </div>
                      ) : chats.length === 0 ? (
                        /* Empty state */
                        <div className="flex items-center justify-center h-full">
                          <Typography 
                            variant="body2" 
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            No chats yet. Start a conversation!
                          </Typography>
                        </div>
                      ) : (
                        /* Show chats list */
                        chats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setCurrentChat(chat);
                              setCurrentGroup(null);
                              setMessages(sortMessagesAsc(chat.messages || []));
                            }}
                          >
                            <UserChatCard 
                              chat={chat}
                              onChatDeleted={(chatId) => {
                                // Remove deleted chat from state
                                if (currentChat?.id === chatId) {
                                  setCurrentChat(null);
                                }
                                // Refresh chats list
                                dispatch(getAllChats());
                              }}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <GroupList onGroupSelect={handleGroupSelect} />
                )}
              </div>
            </div>
          </div>
        </Grid>
        )}

        {/* Right Panel - Chat Messages */}
        {(!isMobile || currentChat || currentGroup) && (
        <Grid 
          item 
          xs={12} 
          md={9} 
          className="message-right-panel w-full"
          sx={{
            height: '100vh',
            overflow: 'hidden',
            borderLeft: { md: `1px solid ${theme.palette.divider}` },
            backgroundColor: { xs: theme.palette.background.paper, md: 'transparent' }
          }}
        >
          {currentChat ? (
            <div className="h-full w-full flex flex-col">
              {/* Profile Header */}
              <div className="flex justify-between items-center border-l p-5 flex-shrink-0 w-full">
                <div className="flex items-center space-x-3">
                  <IconButton
                    onClick={() => {
                      setCurrentChat(null);
                      setCurrentGroup(null);
                      setMessages([]);
                    }}
                    sx={{
                      display: { xs: 'flex', md: 'flex' } // Always show back button
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <Avatar
                    src={
                      auth.user?.id === currentChat.users[1]?.id
                        ? currentChat.users[0]?.profileImage
                        : currentChat.users[1]?.profileImage
                    }
                    onClick={() => {
                      const otherUserId = auth.user?.id === currentChat.users[1]?.id
                        ? currentChat.users[0]?.id
                        : currentChat.users[1]?.id;
                      if (otherUserId) {
                        navigate(`/profile/${otherUserId}`);
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    {auth.user?.id === currentChat.users[1]?.id
                      ? currentChat.users[0]?.fname?.charAt(0) || "U"
                      : currentChat.users[1]?.fname?.charAt(0) || "U"}
                  </Avatar>
                  <Typography 
                    variant="subtitle1"
                    onClick={() => {
                      const otherUserId = auth.user?.id === currentChat.users[1]?.id
                        ? currentChat.users[0]?.id
                        : currentChat.users[1]?.id;
                      if (otherUserId) {
                        navigate(`/profile/${otherUserId}`);
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    {auth.user?.id === currentChat.users[1]?.id
                      ? `${currentChat.users[0].fname} ${currentChat.users[0].lname}`
                      : `${currentChat.users[1].fname} ${currentChat.users[1].lname}`}
                  </Typography>
                </div>
                {/* Right side: Call buttons + Menu */}
                <div className="flex items-center space-x-2">
                  {(() => {
                    const otherUser =
                      auth.user?.id === currentChat.users[1]?.id
                        ? currentChat.users[0]
                        : currentChat.users[1];

                    if (!otherUser) return null;

                    return null;
                  })()}

                  {/* 3 Dots Menu */}
                  <IconButton onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        const otherUserId = auth.user?.id === currentChat.users[1]?.id
                          ? currentChat.users[0]?.id
                          : currentChat.users[1]?.id;
                        if (otherUserId) {
                          navigate(`/profile/${otherUserId}`);
                        }
                        handleMenuClose();
                      }}
                    >
                      View Profile
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        alert("Block User");
                        handleMenuClose();
                      }}
                    >
                      Block
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        alert("Report User");
                        handleMenuClose();
                      }}
                    >
                      Report
                    </MenuItem>
                  </Menu>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={chatContainerRef}
                className="message-chat-area hideScrollbar px-2 space-y-5 py-5 w-full"
              >
                {messages.map((msg, index) => (
                  <ChatMessages
                    key={
                      msg.id ||
                      `${msg.user?.id || "u"}-${
                        msg.createdAt || msg.timestamp || index
                      }`
                    }
                    text={msg}
                  />
                ))}
              </div>

              {/* Message Input */}
              <div className="message-input-area border-l w-full">
                {selectedImage && (
                  <img
                    className="w-[5rem] h-[5rem] object-cover px-2"
                    src={selectedImage}
                    alt=""
                  />
                )}
                <div className="flex py-5 items-center justify-center space-x-5 px-4">
                  <input
                    type="text"
                    onKeyPress={async (e) => {
                      if (e.key === "Enter" && e.target.value) {
                        await handleCreateMessage(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="bg-transparent rounded-full flex-1 max-w-full py-3 px-5"
                    style={{
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.primary
                    }}
                    placeholder="Write your message..."
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectImage}
                      className="hidden"
                      id="image-input"
                    />
                    <label htmlFor="image-input">
                      <AddPhotoAlternateIcon
                        className="cursor-pointer"
                        color="primary"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : currentGroup ? (
            <div className="h-full w-full">
              <GroupChat
                group={currentGroup}
                onClose={() => {
                  setCurrentGroup(null);
                  setCurrentChat(null);
                }}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center px-8">
              <div 
                className="p-8 rounded-full mb-8"
                style={{ backgroundColor: theme.palette.background.default }}
              >
                <ChatBubbleOutlineIcon
                  sx={{ fontSize: "8rem", color: theme.palette.text.disabled }}
                />
              </div>
              <Typography 
                variant="h2" 
                className="mb-4"
                style={{ color: theme.palette.text.primary }}
              >
                {activeTab === 0 ? "No Chats Selected" : "No Groups Selected"}
              </Typography>
              <Typography
                variant="body1"
                className="mb-8 max-w-md"
                style={{ color: theme.palette.text.secondary }}
              >
                {activeTab === 0
                  ? "Select a chat from the left panel to start messaging with your friends"
                  : "Select a group from the left panel to start group messaging and collaboration"}
              </Typography>
              <div className="flex space-x-4">
                <Button
                  variant="outlined"
                  className="border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 px-6 py-3 rounded-xl"
                >
                  Learn More
                </Button>
              </div>
            </div>
          )}
        </Grid>
        )}
      </Grid>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
      <ExploreGroupsModal
        open={isExploreGroupsModalOpen}
        onClose={() => setIsExploreGroupsModalOpen(false)}
      />
    </div>
  );
}

export default Message;
