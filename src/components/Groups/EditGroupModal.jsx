import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { updateGroup, addGroupMember, getGroupMembers, getUserGroups } from "../../state/Groups/groupActions";
import { searchUsers } from "../../state/Auth/authActions";

const EditGroupModal = ({ open, onClose, group }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { updateGroupLoading, groupMembers } = useSelector((state) => state.groups);
  const { users: searchResults } = useSelector((state) => state.auth);
  const currentUser = useSelector((state) => state.auth.user);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Initialize form data when group changes
  useEffect(() => {
    if (group && open) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
      });
      setError(null);
      setSuccess(false);
      setSearchQuery("");
      // Load group members when modal opens
      dispatch(getGroupMembers(group.id));
    }
  }, [group, open, dispatch]);

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  // Handle search users
  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      setSearchLoading(true);
      try {
        await dispatch(searchUsers(query));
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // Handle add member
  const handleAddMember = async (userId) => {
    try {
      const result = await dispatch(addGroupMember({ groupId: group.id, memberId: userId }));
      
      if (result.type.endsWith('fulfilled')) {
        // Reload members after adding
        await dispatch(getGroupMembers(group.id));
        // Refresh group list to update member count
        await dispatch(getUserGroups());
        // Clear search query
        setSearchQuery("");
        setSuccess("Member added successfully");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.payload || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      setError(error.message || "Failed to add member. User may already be a member or you may not have permission.");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    // Validate
    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }

    if (formData.name.trim().length < 3) {
      setError("Group name must be at least 3 characters");
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setError("Description must be less than 500 characters");
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
      };

      const result = await dispatch(updateGroup({
        groupId: group.id,
        updateData: updateData,
      }));

      if (result.type.endsWith('fulfilled')) {
        // Refresh group list
        await dispatch(getUserGroups());
        setSuccess("Group updated successfully");
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        throw new Error(result.payload || "Failed to update group");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      setError(error.message || "Failed to update group. Please try again.");
    }
  };

  const members = groupMembers[group?.id] || [];

  // Filter out existing members and current user from search results
  const availableUsers = searchResults.filter(user => {
    // Don't show current user
    if (user.id === currentUser?.id) return false;
    
    // Don't show users who are already active members
    return !members.some(member => 
      member.user?.id === user.id && member.status === 'ACTIVE'
    );
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
          color: theme.palette.text.primary,
          width: { xs: '95%', sm: '100%' },
          maxWidth: { xs: '95vw', sm: '600px' },
          margin: { xs: '16px auto', sm: '32px auto' },
          maxHeight: { xs: '90vh', sm: '85vh' },
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ mr: -1, ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Edit Group</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
              {success}
            </Alert>
          )}

          {/* Group Name */}
          <TextField
            fullWidth
            label="Group Name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 3 }}
            helperText={`${formData.description.length}/500`}
          />

          {/* Add Members Section */}
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>
            Add Members
          </Typography>

          <TextField
            fullWidth
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {searchLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {searchQuery && availableUsers.length > 0 && (
            <List>
              {availableUsers.map((user) => (
                <ListItem key={user.id}>
                  <ListItemAvatar>
                    <Avatar src={user.profileImage}>
                      {user.fname?.charAt(0) || 'U'}{user.lname?.charAt(0) || ''}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${user.fname || ''} ${user.lname || ''}`.trim() || user.email}
                    secondary={user.email}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleAddMember(user.id)}
                      sx={{ color: theme.palette.primary.main }}
                      aria-label="Add member"
                    >
                      <PersonAddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {searchQuery && !searchLoading && availableUsers.length === 0 && (
            <Typography 
              sx={{ textAlign: 'center', p: 2, color: theme.palette.text.secondary }}
            >
              No users found or all users are already members
            </Typography>
          )}

          {!searchQuery && (
            <Typography 
              sx={{ textAlign: 'center', p: 3, color: theme.palette.text.secondary }}
            >
              Search for users above to add them to the group
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={updateGroupLoading}
        >
          {updateGroupLoading ? <CircularProgress size={20} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupModal;

