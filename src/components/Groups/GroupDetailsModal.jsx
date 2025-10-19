import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  VolumeOff as MuteIcon,
  PushPin as PinIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Message as MessageIcon,
} from "@mui/icons-material";
import {
  getGroupMembers,
  getGroupAdmins,
  leaveGroup,
  deleteGroup,
  toggleGroupMute,
  toggleGroupPin,
  addGroupMember,
  removeGroupMember,
  joinGroup,
} from "../../state/Groups/groupActions";
import { searchUsers } from "../../state/Auth/authActions";

const GroupDetailsModal = ({ open, onClose, group }) => {
  const dispatch = useDispatch();
  const { groupMembers, groupAdmins, loading, error } = useSelector((state) => state.groups);
  const { users: searchResults } = useSelector((state) => state.auth);
  const currentUser = useSelector((state) => state.auth.user);

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load group data when modal opens
  useEffect(() => {
    if (open && group) {
      dispatch(getGroupMembers(group.id));
      dispatch(getGroupAdmins(group.id));
    }
  }, [open, group, dispatch]);

  // Check if current user is admin
  const isAdmin = group?.admin?.id === currentUser?.id;
  const isCreator = group?.createdBy?.id === currentUser?.id;
  const isMember = groupMembers[group?.id]?.some(member => member.user.id === currentUser?.id);

  // Get current member data
  const currentMember = groupMembers[group?.id]?.find(member => member.user.id === currentUser?.id);
  const members = groupMembers[group?.id] || [];
  const admins = groupAdmins[group?.id] || [];

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle user search
  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchLoading(true);
      try {
        await dispatch(searchUsers(query));
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // Handle join group
  const handleJoinGroup = async () => {
    setActionLoading(true);
    try {
      await dispatch(joinGroup(group.id));
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    setActionLoading(true);
    try {
      await dispatch(leaveGroup(group.id));
      onClose();
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    setActionLoading(true);
    try {
      await dispatch(deleteGroup(group.id));
      onClose();
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  // Handle mute/unmute
  const handleToggleMute = async () => {
    setActionLoading(true);
    try {
      await dispatch(toggleGroupMute({
        groupId: group.id,
        memberId: currentUser.id,
        isMuted: !currentMember?.isMuted,
      }));
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  // Handle pin/unpin
  const handleTogglePin = async () => {
    setActionLoading(true);
    try {
      await dispatch(toggleGroupPin({
        groupId: group.id,
        memberId: currentUser.id,
        isPinned: !currentMember?.isPinned,
      }));
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  // Handle add member
  const handleAddMember = async (userId) => {
    setActionLoading(true);
    try {
      await dispatch(addGroupMember({ groupId: group.id, memberId: userId }));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async (userId) => {
    setActionLoading(true);
    try {
      await dispatch(removeGroupMember({ groupId: group.id, memberId: userId }));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle start chat
  const handleStartChat = () => {
    // Navigate to group chat
    onClose();
  };


  // Get group type color
  const getGroupTypeColor = (type) => {
    switch (type) {
      case "STUDY":
        return "primary";
      case "WORK":
        return "secondary";
      case "FRIENDS":
        return "success";
      case "HOBBY":
        return "warning";
      case "FAMILY":
        return "info";
      case "GENERAL":
        return "default";
      default:
        return "default";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  if (!group) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex items-center justify-center p-4"
    >
      <Box className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <Box className="relative">
          {/* Cover Image */}
          {group.groupCoverImage && (
            <Box
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${group.groupCoverImage})` }}
            >
              <Box className="absolute inset-0 bg-black bg-opacity-50" />
            </Box>
          )}
          
          {/* Header Content */}
          <Box className="p-6">
            <Box className="flex items-start justify-between">
              <Box className="flex items-center space-x-4">
                <Avatar
                  src={group.groupImage}
                  className="w-20 h-20 bg-blue-600 border-4 border-gray-800"
                  sx={{ width: 80, height: 80 }}
                >
                  <GroupIcon className="text-3xl text-white" />
                </Avatar>
                
                <Box>
                  <Typography variant="h4" className="text-white font-bold">
                    {group.name}
                  </Typography>
                  <Box className="flex items-center space-x-2 mt-2">
                    <Chip
                      label={group.groupType}
                      color={getGroupTypeColor(group.groupType)}
                      size="small"
                    />
                    {group.isPublic ? (
                      <PublicIcon className="text-green-500" />
                    ) : (
                      <LockIcon className="text-gray-500" />
                    )}
                    <Typography variant="body2" className="text-gray-400">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Menu */}
              <Box className="flex items-center space-x-2">
                {!isMember && (
                  <Button
                    variant="contained"
                    onClick={handleJoinGroup}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {actionLoading ? <CircularProgress size={20} /> : "Join Group"}
                  </Button>
                )}
                
                {isMember && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<MessageIcon />}
                      onClick={handleStartChat}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Chat
                    </Button>
                  </>
                )}
                
                <IconButton onClick={handleMenuOpen} className="text-gray-400">
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box className="px-6 pb-6">
          {error && (
            <Alert severity="error" className="mb-4">
              {typeof error === 'string' ? error : error.message || 'An error occurred'}
            </Alert>
          )}

          {/* Description */}
          {group.description && (
            <Box className="mb-6">
              <Typography variant="body1" className="text-gray-300">
                {group.description}
              </Typography>
            </Box>
          )}

          {/* Tabs */}
          <Box className="border-b border-gray-700 mb-4">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              className="min-h-0"
              sx={{
                "& .MuiTab-root": {
                  color: "#9ca3af",
                  textTransform: "none",
                  minHeight: "48px",
                  "&.Mui-selected": {
                    color: "#3b82f6",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#3b82f6",
                },
              }}
            >
              <Tab label={`Members (${members.length})`} />
              <Tab label={`Admins (${admins.length})`} />
              <Tab label="Group Info" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Box>
              {/* Add Members (Admin only) */}
              {isAdmin && (
                <Box className="mb-4">
                  <TextField
                    fullWidth
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                    className="bg-gray-700 rounded-lg"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": {
                          borderColor: "#374151",
                        },
                        "&:hover fieldset": {
                          borderColor: "#6b7280",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3b82f6",
                        },
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "#9ca3af",
                      },
                    }}
                  />
                  
                  {/* Search Results */}
                  {searchQuery && searchResults.length > 0 && (
                    <Box className="bg-gray-700 rounded-lg p-4 mt-2 max-h-48 overflow-y-auto">
                      <List className="p-0">
                        {searchResults
                          .filter(user => !members.some(member => member.user.id === user.id))
                          .map((user) => (
                            <ListItem
                              key={user.id}
                              className="hover:bg-gray-600 rounded-lg"
                            >
                              <ListItemAvatar>
                                <Avatar src={user.profileImage} className="bg-blue-600">
                                  {user.fname?.[0]}{user.lname?.[0]}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${user.fname} ${user.lname}`}
                                secondary={user.email}
                                className="text-white"
                              />
                              <ListItemSecondaryAction>
                                <Button
                                  size="small"
                                  onClick={() => handleAddMember(user.id)}
                                  disabled={actionLoading}
                                  className="text-blue-500"
                                >
                                  Add
                                </Button>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}

              {/* Members List */}
              <List className="bg-gray-700 rounded-lg">
                {members.map((member) => (
                  <ListItem key={member.user.id} className="hover:bg-gray-600">
                    <ListItemAvatar>
                      <Avatar src={member.user.profileImage} className="bg-blue-600">
                        {member.user.fname?.[0]}{member.user.lname?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box className="flex items-center space-x-2">
                          <span className="text-white">
                            {member.user.fname} {member.user.lname}
                          </span>
                          {member.role === "ADMIN" && (
                            <Chip label="Admin" size="small" color="primary" />
                          )}
                          {member.isPinned && (
                            <PinIcon className="text-yellow-500 text-sm" />
                          )}
                          {member.isMuted && (
                            <MuteIcon className="text-red-500 text-sm" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" className="text-gray-400">
                          Joined {formatDate(member.joinedAt)}
                        </Typography>
                      }
                    />
                    {isAdmin && member.user.id !== currentUser?.id && (
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          onClick={() => handleRemoveMember(member.user.id)}
                          disabled={actionLoading}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {activeTab === 1 && (
            <List className="bg-gray-700 rounded-lg">
              {admins.map((admin) => (
                <ListItem key={admin.user.id} className="hover:bg-gray-600">
                  <ListItemAvatar>
                    <Avatar src={admin.user.profileImage} className="bg-blue-600">
                      {admin.user.fname?.[0]}{admin.user.lname?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${admin.user.fname} ${admin.user.lname}`}
                    secondary={
                      <Typography variant="body2" className="text-gray-400">
                        {admin.user.id === group.createdBy?.id ? "Creator" : "Admin"}
                      </Typography>
                    }
                    className="text-white"
                  />
                </ListItem>
              ))}
            </List>
          )}

          {activeTab === 2 && (
            <Box className="space-y-4">
              <Box className="bg-gray-700 rounded-lg p-4">
                <Typography variant="h6" className="text-white mb-3">
                  Group Information
                </Typography>
                <Box className="space-y-2">
                  <Box className="flex justify-between">
                    <Typography className="text-gray-400">Created by:</Typography>
                    <Typography className="text-white">
                      {group.createdBy?.fname} {group.createdBy?.lname}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography className="text-gray-400">Created on:</Typography>
                    <Typography className="text-white">
                      {formatDate(group.createdAt)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography className="text-gray-400">Last activity:</Typography>
                    <Typography className="text-white">
                      {formatDate(group.lastActivity)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography className="text-gray-400">Max members:</Typography>
                    <Typography className="text-white">
                      {group.maxMembers}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography className="text-gray-400">Status:</Typography>
                    <Chip
                      label={group.status}
                      color={group.status === "ACTIVE" ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          className="mt-2"
          PaperProps={{
            className: "bg-gray-800 border border-gray-700",
          }}
        >
          {isAdmin && (
            <MenuItem onClick={handleMenuClose} className="text-white hover:bg-gray-700">
              <ListItemIcon>
                <SettingsIcon className="text-blue-500" />
              </ListItemIcon>
              <ListItemText primary="Group Settings" />
            </MenuItem>
          )}
          
          {isMember && (
            <>
              <MenuItem onClick={handleTogglePin} className="text-white hover:bg-gray-700">
                <ListItemIcon>
                  <PinIcon className="text-yellow-500" />
                </ListItemIcon>
                <ListItemText primary={currentMember?.isPinned ? "Unpin Group" : "Pin Group"} />
              </MenuItem>
              
              <MenuItem onClick={handleToggleMute} className="text-white hover:bg-gray-700">
                <ListItemIcon>
                  <MuteIcon className="text-red-500" />
                </ListItemIcon>
                <ListItemText primary={currentMember?.isMuted ? "Unmute Group" : "Mute Group"} />
              </MenuItem>
              
              <Divider className="border-gray-600" />
              
              <MenuItem onClick={handleLeaveGroup} className="text-white hover:bg-gray-700">
                <ListItemIcon>
                  <ExitIcon className="text-orange-500" />
                </ListItemIcon>
                <ListItemText primary="Leave Group" />
              </MenuItem>
            </>
          )}
          
          {isCreator && (
            <MenuItem onClick={handleDeleteGroup} className="text-white hover:bg-gray-700">
              <ListItemIcon>
                <DeleteIcon className="text-red-500" />
              </ListItemIcon>
              <ListItemText primary="Delete Group" />
            </MenuItem>
          )}
        </Menu>
      </Box>
    </Modal>
  );
};

export default GroupDetailsModal;
