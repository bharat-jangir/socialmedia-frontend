import React, { useState } from "react";
import {
  Card,
  CardHeader,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  MoreHoriz as MoreHorizIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { deleteGroup } from "../../state/Groups/groupActions";

const GroupCard = ({ group, onClick, currentUser }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteGroup(group.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditGroup = () => {
    // Navigate to group settings
    handleMenuClose();
  };

  return (
    <>
      <Card className="cursor-pointer hover:bg-gray-800/50 transition-colors">
        <CardHeader
          avatar={
            <Avatar
              sx={{
                width: "3.5rem",
                height: "3.5rem",
                fontSize: "1.5rem",
                bgcolor: "#191c29",
                color: "rgb(88,199,250)",
              }}
              src={group.groupImage}
            >
              {group.groupImage ? null : group.name.charAt(0).toUpperCase()}
            </Avatar>
          }
          action={
            currentUser?.id === group.createdBy?.id && (
              <IconButton onClick={handleMenuOpen}>
                <MoreHorizIcon />
              </IconButton>
            )
          }
          title={group.name}
          subheader={`${group.groupType} • ${group.activeMemberCount || 0} members`}
          onClick={onClick}
        />
      </Card>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        className="mt-2"
        PaperProps={{
          className: "bg-gray-800 border border-gray-700",
        }}
      >
        <MenuItem onClick={handleEditGroup} className="text-white hover:bg-gray-700">
          <ListItemIcon>
            <EditIcon className="text-blue-500" />
          </ListItemIcon>
          <ListItemText primary="Edit Group" />
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} className="text-white hover:bg-gray-700">
          <ListItemIcon>
            <DeleteIcon className="text-red-500" />
          </ListItemIcon>
          <ListItemText primary="Delete Group" />
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          className: "bg-gray-800 border border-gray-700",
        }}
      >
        <DialogTitle className="text-white">Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText className="text-gray-300">
            Are you sure you want to delete "{group.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} className="text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GroupCard;