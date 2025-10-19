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

import { useEffect, useState, useRef } from "react";
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
import { getUserGroups } from "../state/Groups/groupActions";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import WebSocketService from "../utils/sockets";

function Message() {
  const theme = useTheme();
  const [currentChat, setCurrentChat] = useState();
  const [currentGroup, setCurrentGroup] = useState();
  const [messages, setMessages] = useState([]);
  const [selectedImage, setSelectedImage] = useState();
  const [activeTab, setActiveTab] = useState(0);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExploreGroupsModalOpen, setIsExploreGroupsModalOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);

  console.log("🚀🚀🚀currentchat:",currentChat);

  const chatContainerRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  const { message, auth, groups } = useSelector((state) => ({
    message: state.message,
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
    if (chatId && message.chats.length > 0) {
      const targetChat = message.chats.find(
        (chat) => chat.id.toString() === chatId
      );
      if (targetChat) {
        setCurrentChat(targetChat);
        setMessages(targetChat.messages || []);
        navigate("/message", { replace: true });
      }
    }
  }, [searchParams, message.chats, navigate]);

  useEffect(() => {
    if (!currentChat) return;
    const updated = message.chats.find((c) => c.id === currentChat.id);
    if (updated) {
      setCurrentChat(updated);
      setMessages(sortMessagesAsc(updated.messages || []));
    }
  }, [message.chats, currentChat?.id]);

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

  function handleCreateMessage(value) {
    if (currentChat) {
      const messageObj = {
        chatId: currentChat?.id,
        content: value,
        image: selectedImage,
        user: auth.user,
        isLocal: true,
      };
      // Add new message locally first
      // setMessages(prev => [...prev, messageObj]);
      dispatch(createMessage({ message: messageObj, sendMessageToServer }));
    } else if (currentGroup) {
      console.log("Group messaging not implemented yet");
    }
    setSelectedImage(null);
  }

  // Redux effect removed - all message handling now through WebSocket only

  useEffect(() => {
    let subscription = null;

    if (auth.user && currentChat) {
      const subscribeToChat = async () => {
        try {
          await WebSocketService.initializeWebSocketConnection(auth.user);
          subscription = WebSocketService.subscribeToTopic(
            `/user/${currentChat.id}/private`,
            (response) => {
              const receivedMessage = JSON.parse(response.body);
              
              setMessages((prevMessages) => {
                // Check if message already exists by ID
                const exists = prevMessages.some(
                  (m) => m.id === receivedMessage.id
                );
                if (exists) {
                  return prevMessages;
                }

                // For current user's messages, try to replace local message
                if (receivedMessage.user?.id === auth.user?.id) {
                  const idx = prevMessages.findIndex(
                    (msg) =>
                      msg.isLocal &&
                      !msg.id &&
                      msg.chatId === receivedMessage.chatId &&
                      msg.content === receivedMessage.content &&
                      msg.user?.id === receivedMessage.user?.id
                  );
                  if (idx !== -1) {
                    const next = [...prevMessages];
                    next[idx] = receivedMessage;
                    return sortMessagesAsc(next);
                  }
                }
                
                // Add new message
                return [...prevMessages, receivedMessage];
              });
            }
          );
        } catch (error) {
          console.error("WebSocket connection failed:", error);
          setTimeout(subscribeToChat, 2000);
        }
      };
      subscribeToChat();
    }

    return () => subscription?.unsubscribe();
  }, [currentChat, auth.user]);

  function sendMessageToServer(newMessage) {
    WebSocketService.sendMessage(
      `/app/chat/${currentChat?.id.toString()}`,
      newMessage
    );
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="message-container">
      <Grid container className="h-full w-full">
        {/* Left Panel */}
        <Grid item xs={3} className="message-left-panel px-5">
          <div className="flex h-full justify-between space-x-2">
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
                    label={`Chats (${message.chats.length})`}
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

              <div className="h-[75vh]">
                {activeTab === 0 ? (
                  <>
                    <SearchChat />
                    <div className="h-full space-y-4 mt-5 overflow-y-scroll hideScrollbar">
                      {message.chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => {
                            setCurrentChat(chat);
                            setCurrentGroup(null);
                            setMessages(chat.messages);
                          }}
                        >
                          <UserChatCard chat={chat} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <GroupList onGroupSelect={handleGroupSelect} />
                )}
              </div>
            </div>
          </div>
        </Grid>

        {/* Right Panel */}
        <Grid item xs={9} className="message-right-panel w-full">
          {currentChat ? (
            <div className="h-full w-full flex flex-col">
              {/* Profile Header */}
              <div className="flex justify-between items-center border-l p-5 flex-shrink-0 w-full">
                <div className="flex items-center space-x-3">
                  <IconButton
                    onClick={() => {
                      setCurrentChat(null);
                      setCurrentGroup(null);
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
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && e.target.value) {
                        handleCreateMessage(e.target.value);
                        e.target.value = "";
                        setSelectedImage(null);
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
