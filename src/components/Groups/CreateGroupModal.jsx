import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { createGroup } from "../../state/Groups/groupActions";
import { searchUsers } from "../../state/Auth/authActions";

const CreateGroupModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { createGroupLoading, error } = useSelector((state) => state.groups);
  const { users: searchResults } = useSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupType: "GENERAL",
    isPublic: false,
    memberIds: [],
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [errors, setErrors] = useState({});

  // Group types
  const groupTypes = [
    { value: "STUDY", label: "Study", icon: "📚" },
    { value: "WORK", label: "Work", icon: "💼" },
    { value: "HOBBY", label: "Hobby", icon: "🎨" },
    { value: "FAMILY", label: "Family", icon: "👨‍👩‍👧‍👦" },
    { value: "FRIENDS", label: "Friends", icon: "👥" },
    { value: "GENERAL", label: "General", icon: "💬" },
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        description: "",
        groupType: "GENERAL",
        isPublic: false,
        memberIds: [],
      });
      setSelectedMembers([]);
      setSearchQuery("");
      setErrors({});
    }
  }, [open]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
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

  // Handle member selection
  const handleMemberToggle = (user) => {
    const isSelected = selectedMembers.some(member => member.id === user.id);
    
    if (isSelected) {
      setSelectedMembers(prev => prev.filter(member => member.id !== user.id));
    } else {
      setSelectedMembers(prev => [...prev, user]);
    }
  };

  // Handle member removal
  const handleMemberRemove = (userId) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Group name must be at least 3 characters";
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const submitData = {
      ...formData,
      memberIds: selectedMembers.map(member => member.id),
    };
    
    try {
      await dispatch(createGroup(submitData));
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!createGroupLoading) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="flex items-center justify-center p-4"
    >
      <Box 
        className="rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        sx={{ backgroundColor: theme.palette.background.paper }}
      >
        {/* Header */}
        <Box 
          className="flex items-center justify-between p-6 border-b"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Typography 
            variant="h5" 
            className="font-semibold"
            sx={{ color: theme.palette.text.primary }}
          >
            Create New Group
          </Typography>
          <IconButton 
            onClick={handleClose} 
            disabled={createGroupLoading}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box className="p-6">
          {error && (
            <Alert severity="error" className="mb-4">
              {typeof error === 'string' ? error : error.message || 'An error occurred'}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <TextField
              fullWidth
              label="Group Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
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
                "& .MuiInputLabel-root": {
                  color: theme.palette.text.secondary,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: theme.palette.primary.main,
                },
              }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              error={!!errors.description}
              helperText={errors.description || `${formData.description.length}/500`}
              multiline
              rows={3}
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
                "& .MuiInputLabel-root": {
                  color: theme.palette.text.secondary,
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: theme.palette.primary.main,
                },
              }}
            />

            {/* Group Type */}
            <FormControl fullWidth>
              <InputLabel 
                sx={{ color: theme.palette.text.secondary }}
              >
                Group Type
              </InputLabel>
              <Select
                value={formData.groupType}
                onChange={(e) => handleInputChange("groupType", e.target.value)}
                label="Group Type"
                sx={{
                  backgroundColor: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.divider,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                  "& .MuiSvgIcon-root": {
                    color: theme.palette.text.secondary,
                  },
                }}
              >
                {groupTypes.map((type) => (
                  <MenuItem 
                    key={type.value} 
                    value={type.value}
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <Box className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Public/Private Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                  sx={{ color: theme.palette.primary.main }}
                />
              }
              label={
                <Box className="flex items-center space-x-2">
                  <span style={{ color: theme.palette.text.primary }}>
                    {formData.isPublic ? "Public Group" : "Private Group"}
                  </span>
                  <Chip
                    label={formData.isPublic ? "Anyone can join" : "Invite only"}
                    size="small"
                    color={formData.isPublic ? "success" : "default"}
                    className="text-xs"
                  />
                </Box>
              }
            />

            <Divider sx={{ borderColor: theme.palette.divider }} />

            {/* Add Members */}
            <Box>
              <Typography 
                variant="h6" 
                className="mb-3"
                sx={{ color: theme.palette.text.primary }}
              >
                Add Members
              </Typography>
              
              {/* Search Users */}
              <TextField
                fullWidth
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: theme.palette.text.secondary, marginRight: 1 }} />
                  ),
                }}
                className="mb-4"
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

              {/* Search Results */}
              {searchQuery && (
                <Box 
                  className="rounded-lg p-4 mb-4 max-h-48 overflow-y-auto"
                  sx={{ backgroundColor: theme.palette.background.default }}
                >
                  {searchLoading ? (
                    <Box className="flex justify-center py-4">
                      <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
                    </Box>
                  ) : searchResults.length > 0 ? (
                    <List className="p-0">
                      {searchResults.map((user) => (
                        <ListItem
                          key={user.id}
                          className="rounded-lg cursor-pointer"
                          onClick={() => handleMemberToggle(user)}
                          sx={{
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              src={user.profileImage} 
                              sx={{ backgroundColor: theme.palette.primary.main }}
                            >
                              {user.fname?.[0]}{user.lname?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${user.fname} ${user.lname}`}
                            secondary={user.email}
                            sx={{ color: theme.palette.text.primary }}
                          />
                          <ListItemSecondaryAction>
                            <Checkbox
                              checked={selectedMembers.some(member => member.id === user.id)}
                              sx={{ color: theme.palette.primary.main }}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography 
                      className="text-center py-4"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      No users found
                    </Typography>
                  )}
                </Box>
              )}

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <Box className="mb-4">
                  <Typography 
                    variant="subtitle2" 
                    className="mb-2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Selected Members ({selectedMembers.length})
                  </Typography>
                  <Box className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <Chip
                        key={member.id}
                        avatar={
                          <Avatar 
                            src={member.profileImage} 
                            sx={{ backgroundColor: theme.palette.primary.main }}
                          >
                            {member.fname?.[0]}{member.lname?.[0]}
                          </Avatar>
                        }
                        label={`${member.fname} ${member.lname}`}
                        onDelete={() => handleMemberRemove(member.id)}
                        sx={{
                          backgroundColor: theme.palette.background.default,
                          color: theme.palette.text.primary,
                        }}
                        deleteIcon={
                          <CloseIcon sx={{ color: theme.palette.text.secondary }} />
                        }
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Box className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={createGroupLoading}
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createGroupLoading}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  }
                }}
                startIcon={createGroupLoading ? <CircularProgress size={20} /> : <GroupIcon />}
              >
                {createGroupLoading ? "Creating..." : "Create Group"}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Modal>
  );
};

export default CreateGroupModal;
