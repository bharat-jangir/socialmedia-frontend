import { Avatar, Card, CardHeader, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DeleteIcon from "@mui/icons-material/Delete";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { memo, useState } from "react";
import { deleteChat } from "../state/Message/message.action";


const UserChatCard = memo(function UserChatCard({chat, onChatDeleted}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get the other user (not the current user)
  const otherUser = auth.user?.id === chat.users[1]?.id ? chat.users[0] : chat.users[1];
  
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleProfileClick = () => {
    if (otherUser?.id) {
      navigate(`/profile/${otherUser.id}`);
    }
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
      await dispatch(deleteChat(chat.id));
      setDeleteDialogOpen(false);
      // Notify parent component to refresh or remove chat
      if (onChatDeleted) {
        onChatDeleted(chat.id);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
    <Card>
      <CardHeader
        avatar={
          <Avatar
            key={otherUser?.profileImage || 'default'} // Force re-render when image changes
            sx={{
              width: "3.5rem",
              height: "3.5rem",
              fontSize: "1.5rem",
              bgcolor: "#191c29",
              color: "rgb(88,199,250)",
              cursor: 'pointer'
            }}
            src={otherUser?.profileImage}
            onClick={handleProfileClick}
          >
            {otherUser?.fname?.charAt(0) || "U"}
          </Avatar>
        }
        action={
          <IconButton onClick={handleMenuOpen}>
            <MoreHorizIcon />
          </IconButton>
        }
        title={
          <span 
            style={{ cursor: 'pointer' }}
          >
            {auth.user?.id===chat.users[1].id?chat.users[0].fname+" "+chat.users[0].lname:chat.users[1].fname+" "+chat.users[1].lname}
          </span>
        }
        subheader={
          <span 
            style={{ cursor: 'pointer' }}
          >
            {auth.user?.id===chat.users[1].id?"@"+chat.users[0].fname.toLowerCase()+"_"+chat.users[0].lname.toLowerCase():"@"+chat.users[1].fname.toLowerCase()+"_"+chat.users[1].lname.toLowerCase()}
          </span>
        }
      ></CardHeader>
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
      <MenuItem 
        onClick={() => {
          handleProfileClick();
          handleMenuClose();
        }} 
        className="text-white hover:bg-gray-700"
      >
        <ListItemText primary="View Profile" />
      </MenuItem>
      <MenuItem 
        onClick={handleDeleteClick} 
        className="text-white hover:bg-gray-700"
      >
        <ListItemIcon>
          <DeleteIcon className="text-red-500" />
        </ListItemIcon>
        <ListItemText primary="Delete Chat" />
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
      <DialogTitle className="text-white">Delete Chat</DialogTitle>
      <DialogContent>
        <DialogContentText className="text-gray-300">
          Are you sure you want to delete this chat? This action cannot be undone.
          All messages in this chat will be permanently deleted.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleDeleteCancel}
          className="text-gray-300 hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDeleteConfirm}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-400"
          autoFocus
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
});

UserChatCard.propTypes = {
  chat: PropTypes.object.isRequired,
  onChatDeleted: PropTypes.func,
};

export default UserChatCard;