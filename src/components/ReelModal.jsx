import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Avatar,
  Divider,
  TextField,
  Button,
  Grid,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { formatMessageTime } from "../utils/dateTimeUtils";
import TimeAgo from "./TimeAgo";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  addReelComment,
  updateReelComment,
  deleteReelComment,
  deleteReel,
  likeReel,
  likeComment,
  saveReel,
  getReelComments,
} from "../state/Post/post.action";
import LikesModal from "./LikesModal";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", sm: "90%" },
  maxWidth: "1000px",
  height: { xs: "95%", sm: "80%" },
  maxHeight: { xs: "95vh", sm: "80vh" },
  bgcolor: "background.paper",
  border: "none",
  outline: "none",
  borderRadius: 2,
  boxShadow: 24,
  display: "flex",
  flexDirection: "column",
};

function ReelModal({ open, onClose, reel }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((state) => state.post.loading);
  const currentUser = useSelector((state) => state.auth.user);
  const savedPostIds = useSelector((state) => state.post?.savedPostIds || []);
  const userReels = useSelector((state) => state.post?.userReels || []);
  const allReels = useSelector((state) => state.post?.allReels || []);
  
  // Get the latest reel data from Redux state if available
  const latestReel = useMemo(() => {
    if (!reel?.id) return reel;
    
    // First try to find in userReels
    const updatedReel = userReels.find(r => r.id === reel.id);
    if (updatedReel) {
      console.log('ReelModal - Found updated reel in userReels:', updatedReel);
      return updatedReel;
    }
    
    // Then try to find in allReels
    const updatedReelFromAll = allReels.find(r => r.id === reel.id);
    if (updatedReelFromAll) {
      console.log('ReelModal - Found updated reel in allReels:', updatedReelFromAll);
      return updatedReelFromAll;
    }
    
    // Fallback to original reel
    console.log('ReelModal - Using original reel:', reel);
    return reel;
  }, [reel, userReels, allReels]);
  const [localComments, setLocalComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [reelLiked, setReelLiked] = useState(false);
  const [reelLikeCount, setReelLikeCount] = useState(0);
  const [reelSaved, setReelSaved] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [reelComments, setReelComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Local state for comment likes
  const [localLikedComments, setLocalLikedComments] = useState(new Set());
  const [localLikeCounts, setLocalLikeCounts] = useState(new Map());
  const [localInteractedComments, setLocalInteractedComments] = useState(new Set());

  // Update reel like and save state when reel changes
  useEffect(() => {
    console.log('ReelModal - useEffect triggered:', {
      latestReel: latestReel?.id,
      currentUserId: currentUser?.id,
      latestReelData: latestReel
    });
    
    if (latestReel && currentUser?.id) {
      // Check if user liked this reel - prioritize isLiked field, then check likedBy array
      const isLiked = latestReel.isLiked !== undefined 
        ? latestReel.isLiked 
        : latestReel.likedBy?.includes(currentUser.id) || false;
      
      // Get like count - prioritize totalLikes, then likedBy length
      const likeCount = latestReel.totalLikes !== undefined 
        ? latestReel.totalLikes 
        : latestReel.likedBy?.length || 0;
      
      console.log('ReelModal - Setting reel state:', {
        isLiked,
        likeCount,
        previousReelLiked: reelLiked,
        previousReelLikeCount: reelLikeCount
      });
      
      setReelLiked(isLiked);
      setReelLikeCount(likeCount);
      
      // Check if reel is saved - convert to string for comparison
      const reelIdStr = String(latestReel.id);
      const isSaved = savedPostIds.includes(reelIdStr);
      setReelSaved(isSaved);
      
      console.log('ReelModal - Reel state updated:', {
        reelId: latestReel.id,
        reelIdStr,
        isLiked,
        likeCount,
        isSaved,
        savedPostIds: savedPostIds.slice(0, 5), // Show first 5 for debugging
        savedPostIdsIncludes: savedPostIds.includes(reelIdStr),
        reelData: {
          isLiked: latestReel.isLiked,
          totalLikes: latestReel.totalLikes,
          likedBy: latestReel.likedBy,
          likedByLength: latestReel.likedBy?.length
        }
      });
    }
  }, [latestReel, currentUser?.id, savedPostIds]);

  // Track last fetched reel ID to prevent duplicate calls
  const lastFetchedReelIdRef = useRef(null);
  
  // Fetch reel comments - memoized to prevent recreation
  const fetchReelComments = useCallback(async () => {
    if (!latestReel?.id) return;
    
    setLoadingComments(true);
    try {
      const result = await dispatch(getReelComments({ 
        reelId: latestReel.id, 
        page: 0, 
        size: 20 
      }));
      
      if (result.type.endsWith('fulfilled')) {
        const comments = result.payload.data || [];
        setReelComments(comments);
        setLocalComments(comments);
      }
    } catch (error) {
      console.error('Error fetching reel comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [latestReel?.id, dispatch]);
  
  // Load comments when modal opens - prevent duplicate calls
  useEffect(() => {
    if (!open || !latestReel?.id) {
      // Reset when modal closes
      if (!open) {
        lastFetchedReelIdRef.current = null;
      }
      return;
    }
    
    const reelId = latestReel.id?.toString();
    
    // Prevent duplicate calls for the same reel
    if (lastFetchedReelIdRef.current === reelId) {
      // Still update local comments from recentComments if available
      if (latestReel.recentComments) {
        setLocalComments(latestReel.recentComments);
      }
      return;
    }
    
    // Mark as fetched
    lastFetchedReelIdRef.current = reelId;
    
    // Set initial comments from recentComments if available
    setLocalComments(latestReel.recentComments || []);
    
    // Fetch comments
    fetchReelComments();
  }, [open, latestReel?.id, fetchReelComments]);

  // Sync local comment like state with Redux state
  useEffect(() => {
    if (localComments.length > 0) {
      // Reset local state when comments change
      setLocalLikedComments(new Set());
      setLocalLikeCounts(new Map());
      setLocalInteractedComments(new Set());
    }
  }, [localComments]);

  // Sync comment like state with Redux state updates
  useEffect(() => {
    if (reelComments[latestReel?.id]?.comments) {
      const updatedComments = reelComments[latestReel.id].comments;
      setLocalComments(updatedComments);
      console.log('ReelModal - Synced comments from Redux:', updatedComments);
    }
  }, [reelComments, latestReel?.id]);

  // Helper function to extract image URL
  const extractImageUrl = (imageString) => {
    if (!imageString) return null;
    if (imageString.startsWith("http")) return imageString;
    return imageString;
  };

  // Handle like/unlike reel
  const handleLikeReel = async () => {
    if (!latestReel?.id || !currentUser?.id) {
      console.log('ReelModal - handleLikeReel: Missing reel ID or user ID', {
        reelId: latestReel?.id,
        userId: currentUser?.id
      });
      return;
    }
    
    console.log('ReelModal - handleLikeReel: Starting like toggle', {
      reelId: latestReel.id,
      currentLikedState: reelLiked,
      currentLikeCount: reelLikeCount
    });
    
    // Store current state for rollback
    const currentLikedState = reelLiked;
    const currentLikeCount = reelLikeCount;
    
    // Optimistic update
    const newLikedState = !reelLiked;
    const newLikeCount = newLikedState ? reelLikeCount + 1 : Math.max(0, reelLikeCount - 1);
    
    console.log('ReelModal - handleLikeReel: Optimistic update', {
      newLikedState,
      newLikeCount
    });
    
    setReelLiked(newLikedState);
    setReelLikeCount(newLikeCount);
    
    try {
      console.log('ReelModal - handleLikeReel: Dispatching likeReel action');
      const result = await dispatch(likeReel(latestReel.id));
      console.log('ReelModal - handleLikeReel: Action result', result);
      
      if (result.type.endsWith('fulfilled')) {
        console.log('Reel like toggled successfully:', result.payload);
        // Redux state will be updated by the reducer, and our useEffect will sync with it
        // No need to manually update state here as it will be handled by Redux
      } else {
        // Revert on failure
        console.log('ReelModal - handleLikeReel: Action failed, reverting state');
        setReelLiked(currentLikedState);
        setReelLikeCount(currentLikeCount);
        console.error('Failed to like reel:', result.payload);
      }
    } catch (error) {
      // Revert on error
      console.log('ReelModal - handleLikeReel: Error occurred, reverting state');
      setReelLiked(currentLikedState);
      setReelLikeCount(currentLikeCount);
      console.error('Error liking reel:', error);
    }
  };

  // Handle save/unsave reel
  const handleSaveReel = async () => {
    if (!latestReel?.id || !currentUser?.id) return;
    
    // Store current state for rollback
    const currentSavedState = reelSaved;
    
    // Optimistic update
    const newSavedState = !reelSaved;
    setReelSaved(newSavedState);
    
    try {
      const result = await dispatch(saveReel(latestReel.id));
      if (result.type.endsWith('fulfilled')) {
        console.log('Reel save toggled successfully:', result.payload);
        // Redux state will be updated by the reducer, and our useEffect will sync with it
        // No need to manually update state here as it will be handled by Redux
      } else {
        // Revert on failure
        setReelSaved(currentSavedState);
        console.error('Failed to save reel:', result.payload);
      }
    } catch (error) {
      // Revert on error
      setReelSaved(currentSavedState);
      console.error('Error saving reel:', error);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !latestReel?.id || isSubmitting) return;
    
    setIsSubmitting(true);
    const commentContent = newComment.trim();
    setNewComment(""); // Clear input immediately for better UX
    
    try {
      const result = await dispatch(addReelComment({
        reelId: latestReel.id,
        content: commentContent
      }));
      
      if (result.type.endsWith('fulfilled')) {
        console.log('Reel comment added successfully:', result.payload);
        // Refetch comments to get the latest data
        await fetchReelComments();
      } else {
        // Restore comment on failure
        setNewComment(commentContent);
        console.error('Failed to add comment:', result.payload);
      }
    } catch (error) {
      // Restore comment on error
      setNewComment(commentContent);
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId) => {
    if (!commentId || !currentUser?.id) return;
    
    // Store current state for rollback
    const currentLikedState = localLikedComments.has(commentId);
    const currentLikeCount = localLikeCounts.get(commentId) || 0;
    
    // Optimistic update
    setLocalLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
    
    setLocalLikeCounts(prev => {
      const newMap = new Map(prev);
      const newLikedState = !currentLikedState;
      const newLikeCount = newLikedState ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1);
      newMap.set(commentId, newLikeCount);
      return newMap;
    });
    
    setLocalInteractedComments(prev => new Set([...prev, commentId]));
    
    try {
      const result = await dispatch(likeComment(commentId));
      if (result.type.endsWith('fulfilled')) {
        console.log('Comment like toggled successfully:', result.payload);
        // Clear local state to let Redux state take precedence
        setLocalLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        
        setLocalLikeCounts(prev => {
          const newMap = new Map(prev);
          newMap.delete(commentId);
          return newMap;
        });
        
        setLocalInteractedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        
        // Refetch comments to get the latest data from Redux
        await fetchReelComments();
      } else {
        // Revert on failure
        setLocalLikedComments(prev => {
          const newSet = new Set(prev);
          if (currentLikedState) {
            newSet.add(commentId);
          } else {
            newSet.delete(commentId);
          }
          return newSet;
        });
        
        setLocalLikeCounts(prev => {
          const newMap = new Map(prev);
          newMap.set(commentId, currentLikeCount);
          return newMap;
        });
        
        console.error('Failed to like comment:', result.payload);
      }
    } catch (error) {
      // Revert on error
      setLocalLikedComments(prev => {
        const newSet = new Set(prev);
        if (currentLikedState) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
      
      setLocalLikeCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(commentId, currentLikeCount);
        return newMap;
      });
      
      console.error('Error liking comment:', error);
    }
  };

  // Check if comment is liked
  const isCommentLiked = (comment) => {
    console.log('isCommentLiked - comment:', comment.id, 'isLiked:', comment.isLiked, 'localInteracted:', localInteractedComments.has(comment.id), 'localLiked:', localLikedComments.has(comment.id));
    
    // Prioritize local state if user has interacted
    if (localInteractedComments.has(comment.id)) {
      return localLikedComments.has(comment.id);
    }
    // Fallback to comment data from Redux
    return comment.isLiked === true;
  };

  // Get comment like count
  const getCommentLikeCount = (comment) => {
    console.log('getCommentLikeCount - comment:', comment.id, 'totalLikes:', comment.totalLikes, 'localInteracted:', localInteractedComments.has(comment.id), 'localCount:', localLikeCounts.get(comment.id));
    
    // Prioritize local state if user has interacted
    if (localInteractedComments.has(comment.id)) {
      return localLikeCounts.get(comment.id) || 0;
    }
    // Fallback to comment data from Redux
    return comment.totalLikes || 0;
  };

  // Handle edit comment
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  // Handle update comment
  const handleUpdateComment = async () => {
    if (!editingComment || !editText.trim() || !latestReel?.id) return;
    
    const updatedContent = editText.trim();
    const commentToUpdate = editingComment; // Store reference before clearing state
    
    setEditingComment(null);
    setEditText("");
    
    try {
      const result = await dispatch(updateReelComment({
        reelId: latestReel.id,
        commentId: commentToUpdate.id,
        content: updatedContent
      }));
      
      if (result.type.endsWith('fulfilled')) {
        console.log('Reel comment updated successfully:', result.payload);
        // Refetch comments to get the latest data
        await fetchReelComments();
      } else {
        // Restore edit state on failure
        setEditingComment(commentToUpdate);
        setEditText(updatedContent);
        console.error('Failed to update comment:', result.payload);
      }
    } catch (error) {
      // Restore edit state on error
      setEditingComment(commentToUpdate);
      setEditText(updatedContent);
      console.error('Error updating comment:', error);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!commentId || !latestReel?.id) return;
    
    // Optimistic update - remove comment from local state immediately
    const originalComments = [...localComments];
    setLocalComments(prev => prev.filter(comment => comment.id !== commentId));
    
    try {
      const result = await dispatch(deleteReelComment({
        reelId: latestReel.id,
        commentId: commentId
      }));
      
      if (result.type.endsWith('fulfilled')) {
        console.log('Reel comment deleted successfully:', result.payload);
        // Refetch comments to ensure consistency
        await fetchReelComments();
      } else {
        // Restore comment on failure
        setLocalComments(originalComments);
        console.error('Failed to delete comment:', result.payload);
      }
    } catch (error) {
      // Restore comment on error
      setLocalComments(originalComments);
      console.error('Error deleting comment:', error);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Delete handlers
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!latestReel?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const result = await dispatch(deleteReel(latestReel.id));
      if (result.type.endsWith('fulfilled')) {
        console.log('Reel deleted successfully');
        setDeleteDialogOpen(false);
        onClose(); // Close the modal after successful deletion
      } else {
        console.error('Failed to delete reel:', result.payload);
      }
    } catch (error) {
      console.error('Error deleting reel:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!latestReel) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="reel-modal-title"
        aria-describedby="reel-modal-description"
      >
        <Box sx={style}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" component="h2">
              Reel
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {latestReel?.user?.id === currentUser?.id && (
                <IconButton 
                  aria-label="reel options"
                  onClick={handleMenuOpen}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: { xs: "column", sm: "row" } }}>
            {/* Left Side - Video */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#000",
                minHeight: { xs: "40%", sm: 0 },
                maxHeight: { xs: "50%", sm: "100%" },
                position: "relative",
              }}
            >
              {latestReel.video ? (
                <video
                  src={latestReel.video}
                  controls
                  autoPlay
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
                  <PlayArrowIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography>No video available</Typography>
                </Box>
              )}
            </Box>

            {/* Right Side - Comments and Interactions */}
            <Box
              sx={{
                width: { xs: "100%", sm: "400px" },
                display: "flex",
                flexDirection: "column",
                borderLeft: { xs: "none", sm: "1px solid #e0e0e0" },
                borderTop: { xs: "1px solid #e0e0e0", sm: "none" },
              }}
            >
              {/* User Info */}
              <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    src={extractImageUrl(latestReel.user?.profileImage)}
                    sx={{ width: 32, height: 32, cursor: 'pointer' }}
                    onClick={() => {
                      if (latestReel?.user?.id) {
                        navigate(`/profile/${latestReel.user.id}`);
                      }
                    }}
                  />
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (latestReel?.user?.id) {
                          navigate(`/profile/${latestReel.user.id}`);
                        }
                      }}
                    >
                      {latestReel.user?.fname} {latestReel.user?.lname}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{latestReel.user?.fname?.toLowerCase()}_
                      {latestReel.user?.lname?.toLowerCase()}
                    </Typography>
                  </Box>
                </Box>
                {latestReel.title && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {latestReel.title}
                  </Typography>
                )}
              </Box>

              {/* Comments Section */}
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  p: 2,
                  scrollBehavior: "smooth",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(0, 0, 0, 0.1)",
                    borderRadius: "8px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "linear-gradient(45deg, #9ca3af, #6b7280)",
                    borderRadius: "8px",
                    border: "1px solid transparent",
                    backgroundClip: "content-box",
                    transition: "all 0.3s ease",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "linear-gradient(45deg, #6b7280, #4b5563)",
                  },
                  // Firefox scrollbar styling
                  scrollbarWidth: "thin",
                  scrollbarColor: "#9ca3af rgba(0, 0, 0, 0.1)",
                }}
              >
                {localComments.length > 0 ? (
                  localComments.map((comment) => (
                    <Box key={comment.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <Avatar
                          src={extractImageUrl(comment.user?.profileImage)}
                          sx={{ width: 24, height: 24, mt: 0.5 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: "0.875rem" }}>
                              {comment.user?.fname} {comment.user?.lname}
                            </Typography>
                            <TimeAgo 
                              dateInput={comment.createdAt} 
                              variant="caption"
                              color="text.secondary"
                            />
                          </Box>
                          
                          {editingComment?.id === comment.id ? (
                            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                              <TextField
                                size="small"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                sx={{ flex: 1 }}
                              />
                              <Button size="small" onClick={handleUpdateComment}>
                                Save
                              </Button>
                              <Button size="small" onClick={() => setEditingComment(null)}>
                                Cancel
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {comment.content}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleLikeComment(comment.id)}
                              sx={{ p: 0.5 }}
                            >
                              {isCommentLiked(comment) ? (
                                <FavoriteIcon sx={{ fontSize: 16, color: "red" }} />
                              ) : (
                                <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                            <Typography variant="caption" color="text.secondary">
                              {getCommentLikeCount(comment)} likes
                            </Typography>
                            
                            {comment.user?.id === currentUser?.id && (
                              <>
                                <Button
                                  size="small"
                                  onClick={() => handleEditComment(comment)}
                                  sx={{ minWidth: "auto", p: 0.5, fontSize: "0.75rem" }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  sx={{ minWidth: "auto", p: 0.5, fontSize: "0.75rem", color: "error.main" }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No comments yet. Be the first to comment!
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <IconButton onClick={handleLikeReel}>
                    {reelLiked ? (
                      <FavoriteIcon sx={{ color: "red" }} />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                  <IconButton>
                    <ChatBubbleOutlineIcon />
                  </IconButton>
                  <IconButton>
                    <ShareIcon />
                  </IconButton>
                  <Box sx={{ flex: 1 }} />
                  <IconButton onClick={handleSaveReel}>
                    {reelSaved ? (
                      <BookmarkIcon sx={{ color: "black" }} />
                    ) : (
                      <BookmarkBorderIcon />
                    )}
                  </IconButton>
                </Box>
                
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  {reelLikeCount} likes
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  {formatMessageTime(latestReel.createdAt)}
                </Typography>
              </Box>

              {/* Add Comment */}
              <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    sx={{ minWidth: "auto", px: 2 }}
                  >
                    Post
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Likes Modal */}
      <LikesModal
        open={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        postId={latestReel?.id}
        postType="reel"
      />

      {/* Menu for reel options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Reel
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Reel
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this reel? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ReelModal;
