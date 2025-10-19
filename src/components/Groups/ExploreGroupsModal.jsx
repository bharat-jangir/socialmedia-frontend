import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Explore as ExploreIcon,
} from "@mui/icons-material";
import { getPublicGroups, searchGroups, joinGroup } from "../../state/Groups/groupActions";

const ExploreGroupsModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { publicGroups, searchResults, loading, error, joinGroupLoading } = useSelector((state) => state.groups);
  const currentUser = useSelector((state) => state.auth.user);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Load public groups when modal opens
  useEffect(() => {
    if (open) {
      dispatch(getPublicGroups());
    }
  }, [open, dispatch]);

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchLoading(true);
      try {
        await dispatch(searchGroups(query));
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // Handle join group
  const handleJoinGroup = async (groupId) => {
    try {
      await dispatch(joinGroup(groupId));
      // Refresh public groups after joining
      dispatch(getPublicGroups());
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  // Get groups to display
  const getDisplayGroups = () => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return publicGroups;
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex items-center justify-center p-4"
    >
      <Box 
        className="rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        sx={{ backgroundColor: theme.palette.background.paper }}
      >
        {/* Header */}
        <Box 
          className="flex items-center justify-between p-6 border-b"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Box className="flex items-center space-x-3">
            <Box 
              className="p-2 rounded-lg"
              sx={{ backgroundColor: theme.palette.primary.main }}
            >
              <ExploreIcon sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                className="font-semibold"
                sx={{ color: theme.palette.text.primary }}
              >
                Explore Groups
              </Typography>
              <Typography 
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Discover and join public groups
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box className="p-6">
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search public groups..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searchLoading ? (
                    <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                  ) : (
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  )}
                </InputAdornment>
              ),
            }}
            className="mb-6"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
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

          {error && (
            <Alert severity="error" className="mb-4">
              {typeof error === 'string' ? error : error.message || 'An error occurred'}
            </Alert>
          )}

          {loading ? (
            <Box className="flex justify-center items-center h-32">
              <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : (
            <>
              {getDisplayGroups().length === 0 ? (
                <Box className="text-center py-12">
                  <PublicIcon 
                    className="text-6xl mb-4 mx-auto" 
                    sx={{ color: theme.palette.text.secondary }}
                  />
                  <Typography 
                    variant="h6" 
                    className="mb-2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {searchQuery.trim() ? "No groups found" : "No public groups available"}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ color: theme.palette.text.disabled }}
                  >
                    {searchQuery.trim()
                      ? "Try searching with different keywords"
                      : "Check back later for new public groups"}
                  </Typography>
                </Box>
              ) : (
                <List className="space-y-2">
                  {getDisplayGroups().map((group) => (
                    <ListItem
                      key={group.id}
                      className="rounded-lg mb-2 transition-colors"
                      sx={{
                        backgroundColor: theme.palette.background.default,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={group.groupImage}
                          sx={{ backgroundColor: theme.palette.primary.main }}
                        >
                          <GroupIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box className="flex items-center space-x-2">
                            <Typography 
                              variant="h6"
                              sx={{ color: theme.palette.text.primary }}
                            >
                              {group.name}
                            </Typography>
                            <Chip
                              label={group.groupType}
                              size="small"
                              color={getGroupTypeColor(group.groupType)}
                            />
                            {group.isPublic ? (
                              <PublicIcon 
                                className="text-sm"
                                sx={{ color: theme.palette.success.main }}
                              />
                            ) : (
                              <LockIcon 
                                className="text-sm"
                                sx={{ color: theme.palette.text.disabled }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="body2" 
                              className="mb-1"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              {group.description}
                            </Typography>
                            <Typography 
                              variant="caption"
                              sx={{ color: theme.palette.text.disabled }}
                            >
                              Created {formatDate(group.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={joinGroupLoading}
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            }
                          }}
                        >
                          {joinGroupLoading ? <CircularProgress size={16} /> : "Join"}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default ExploreGroupsModal;
