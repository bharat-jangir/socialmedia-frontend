import React, { useState, useEffect, useCallback, useRef } from "react";
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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  addComment,
  fetchComments,
  updateComment,
  deleteComment,
  likePost,
  likeComment,
  savePost,
  deletePost,
} from "../state/Post/post.action";
import LikesModal from "./LikesModal";
import CommentsModal from "./CommentsModal";
import { formatMessageTime, formatDate } from "../utils/dateTimeUtils";
import TimeAgo from "./TimeAgo";

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

function PostModal({ open, onClose, post }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((state) => state.post.loading);
  const currentUser = useSelector((state) => state.auth.user);
  const comments = useSelector((state) => state.post.comments) || [];
  const reduxPosts = useSelector((state) => state.post.posts);
  const savedPostIds = useSelector((state) => state.post?.savedPostIds || []);
  
  // Get the latest post data from Redux state if available
  const latestPost = reduxPosts?.find((p) => p.id === post?.id) || post;
  const [localComments, setLocalComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [postLiked, setPostLiked] = useState(false);
  const [postLikeCount, setPostLikeCount] = useState(0);
  const [postSaved, setPostSaved] = useState(false);
  const [likedComments, setLikedComments] = useState(new Set()); // Track liked comments locally
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Local state for comment likes (same pattern as CommentsModal and Reels)
  const [localLikedComments, setLocalLikedComments] = useState(new Set());
  const [localLikeCounts, setLocalLikeCounts] = useState(new Map());
  const [localInteractedComments, setLocalInteractedComments] = useState(new Set());
  
  // Debug: Log when modal state changes
  useEffect(() => {
    console.log("📱 PostModal CommentsModal state changed:", commentsModalOpen, "for post:", latestPost?.id);
  }, [commentsModalOpen, latestPost?.id]);

  // Update post like and save state when post changes
  useEffect(() => {
    if (latestPost && currentUser?.id) {
      // Handle new structure: recentLikedBy and totalLikes
      const liked = latestPost.recentLikedBy?.some(like => {
        if (typeof like === 'object' && like.id) {
          return like.id === currentUser.id;
        }
        return like === currentUser.id;
      }) || false;
      
      const likeCount = latestPost.totalLikes || 0;
      
      setPostLiked(liked);
      setPostLikeCount(likeCount);
      
      // Simple logic: if post ID is in saved array, it's saved
      const isPostSaved = savedPostIds.includes(String(latestPost.id));
      console.log(`PostModal Post ${latestPost.id}: isSaved = ${isPostSaved}, savedPostIds = [${savedPostIds.join(', ')}]`);
      setPostSaved(isPostSaved);
    }
  }, [latestPost, currentUser?.id, savedPostIds]);

  // Sync local state with Redux state for comments (preserve local interactions)
  useEffect(() => {
    if (comments && comments.length > 0) {
      console.log("PostModal - Syncing local state with comments:", comments.map(c => ({
        id: c.id,
        content: c.content,
        user: c.user,
        totalLikes: c.totalLikes,
        isLiked: c.isLiked
      })));
      
      // Update local state based on Redux state, but preserve local interactions
      setLocalLikedComments(prevLikedComments => {
        const newLikedComments = new Set(prevLikedComments);
        
        comments.forEach(comment => {
          // Only update if we haven't locally interacted with this comment
          if (!localInteractedComments.has(comment.id)) {
            if (comment.isLiked) {
              newLikedComments.add(comment.id);
            } else {
              newLikedComments.delete(comment.id);
            }
          }
        });
        
        return newLikedComments;
      });
      
      setLocalLikeCounts(prevLikeCounts => {
        const newLikeCounts = new Map(prevLikeCounts);
        
        comments.forEach(comment => {
          // Only update if we haven't locally interacted with this comment
          if (!localInteractedComments.has(comment.id)) {
            newLikeCounts.set(comment.id, comment.totalLikes || 0);
          }
        });
        
        return newLikeCounts;
      });
      
      // Also update local comments state, but preserve like state and keep local-only comments
      setLocalComments(prevComments => {
        // Create a map of Redux comments by ID for quick lookup
        const reduxCommentsMap = new Map();
        comments.forEach(comment => {
          reduxCommentsMap.set(comment.id?.toString(), comment);
        });
        
        // Merge: Start with Redux comments, preserving local like state for interacted comments
        const mergedComments = comments.map(comment => {
          const existingComment = prevComments.find(c => c.id?.toString() === comment.id?.toString());
          if (existingComment && localInteractedComments.has(comment.id)) {
            // Preserve local like state for interacted comments
            return {
              ...comment,
              totalLikes: existingComment.totalLikes,
              isLiked: existingComment.isLiked
            };
          }
          return comment;
        });
        
        // Add any local comments that aren't in Redux yet, but only if they're temporary/optimistic
        // Regular comments that aren't in Redux were likely deleted, so don't keep them
        const localOnlyComments = prevComments.filter(prevComment => {
          const prevCommentId = prevComment.id?.toString();
          const isTemporary = prevCommentId?.startsWith('temp_') || prevComment.isOptimistic;
          const existsInRedux = reduxCommentsMap.has(prevCommentId);
          
          // Only keep temporary/optimistic comments that don't exist in Redux
          // Regular comments not in Redux should be removed (they were deleted)
          return isTemporary && !existsInRedux;
        });
        
        // Combine Redux comments with local-only comments, removing duplicates by ID
        const allCommentsMap = new Map();
        
        // First, add all Redux comments
        mergedComments.forEach(comment => {
          const commentId = comment.id?.toString();
          if (commentId) {
            allCommentsMap.set(commentId, comment);
          }
        });
        
        // Then, add local-only comments that don't exist yet
        localOnlyComments.forEach(localComment => {
          const localId = localComment.id?.toString();
          if (localId && !allCommentsMap.has(localId)) {
            allCommentsMap.set(localId, localComment);
          }
        });
        
        // Convert map back to array
        return Array.from(allCommentsMap.values());
      });
    }
  }, [comments, localInteractedComments]);

  const handlePostLike = () => {
    console.log("PostModal like button clicked!", {
      postId: latestPost.id,
      currentUserId: currentUser?.id,
      postLiked,
      totalLikes: latestPost.totalLikes,
      recentLikedBy: latestPost.recentLikedBy
    });
    dispatch(likePost(latestPost.id));
  };

  const handlePostSave = () => {
    console.log(`PostModal saving/unsaving post ${latestPost.id}`);
    dispatch(savePost(latestPost.id));
  };

  // Handle likes modal
  const handleLikesClick = () => {
    setLikesModalOpen(true);
  };

  // Handle comments modal
  const handleCommentsClick = () => {
    setCommentsModalOpen(true);
  };

  const extractImageUrl = (profileImage) => {
    if (!profileImage) return "";
    try {
      const parsed = JSON.parse(profileImage);
      return parsed.imageUrl || profileImage;
    } catch {
      return profileImage;
    }
  };

  // Track last fetched post ID to prevent duplicate calls
  const lastFetchedPostIdRef = useRef(null);
  
  // Fetch comments when modal opens - prevent duplicate calls
  useEffect(() => {
    if (!open || !latestPost?.id) {
      // Reset when modal closes
      if (!open) {
        lastFetchedPostIdRef.current = null;
      }
      return;
    }
    
    const postId = latestPost.id?.toString();
    
    // Prevent duplicate calls for the same post
    if (lastFetchedPostIdRef.current === postId) {
      return;
    }
    
    // Mark as fetched and dispatch
    lastFetchedPostIdRef.current = postId;
    dispatch(fetchComments(latestPost.id));
  }, [open, latestPost?.id, dispatch]);

  // Update local comments state when Redux comments change
  // But preserve locally added comments that might not be in Redux yet
  useEffect(() => {
    setLocalComments(prevComments => {
      // Determine source of comments (Redux or post)
      const sourceComments = (comments && comments.length > 0) 
        ? comments 
        : (latestPost?.comments && latestPost.comments.length > 0)
          ? latestPost.comments
          : [];
      
      if (sourceComments.length === 0) {
        // If no source comments, keep optimistic/temporary local comments
        const optimisticComments = prevComments.filter(c => 
          c.id?.toString().startsWith('temp_') || c.isOptimistic
        );
        return optimisticComments;
      }
      
      // Create a map of source comments by ID
      const sourceCommentsMap = new Map();
      sourceComments.forEach(comment => {
        sourceCommentsMap.set(comment.id?.toString(), comment);
      });
      
      // Keep local comments that aren't in source yet, but only if they're temporary/optimistic
      // Regular comments that aren't in source were likely deleted, so don't keep them
      const localOnlyComments = prevComments.filter(prevComment => {
        const prevId = prevComment.id?.toString();
        const isTemporary = prevId?.startsWith('temp_') || prevComment.isOptimistic;
        const existsInSource = sourceCommentsMap.has(prevId);
        
        // Only keep temporary/optimistic comments that don't exist in source
        // Regular comments not in source should be removed (they were deleted)
        return isTemporary && !existsInSource;
      });
      
      // Merge: Source comments + local-only comments, removing duplicates by ID using Map
      const mergedMap = new Map();
      
      // First, add all source comments
      sourceComments.forEach(comment => {
        const commentId = comment.id?.toString();
        if (commentId) {
          mergedMap.set(commentId, comment);
        }
      });
      
      // Then, add local-only comments that don't exist yet
      localOnlyComments.forEach(localComment => {
        const localId = localComment.id?.toString();
        if (localId && !mergedMap.has(localId)) {
          mergedMap.set(localId, localComment);
        }
      });
      
      // Convert map back to array
      return Array.from(mergedMap.values());
    });
  }, [comments, latestPost?.comments]);

  // Sync local like state with Redux state when comments change
  useEffect(() => {
    if (comments && comments.length > 0) {
      // Update local like state based on Redux state
      const newLikedComments = new Set();
      const newLikeCounts = new Map();
      
      comments.forEach(comment => {
        if (comment.isLiked) {
          newLikedComments.add(comment.id);
        }
        if (comment.totalLikes !== undefined) {
          newLikeCounts.set(comment.id, comment.totalLikes);
        }
      });
      
      setLocalLikedComments(newLikedComments);
      setLocalLikeCounts(newLikeCounts);
    }
  }, [comments]);

  // Helper functions for comment likes
  const isCommentLiked = useCallback((commentId) => {
    return localInteractedComments.has(commentId) 
      ? localLikedComments.has(commentId)
      : (comments.find(c => c.id === commentId)?.isLiked || false);
  }, [localInteractedComments, localLikedComments, comments]);

  const getCommentLikeCount = useCallback((commentId) => {
    return localInteractedComments.has(commentId)
      ? (localLikeCounts.get(commentId) || 0)
      : (comments.find(c => c.id === commentId)?.totalLikes || 0);
  }, [localInteractedComments, localLikeCounts, comments]);

  const handleLikeComment = useCallback(async (commentId) => {
    if (!commentId) return;
    
    const wasLiked = isCommentLiked(commentId);
    const currentCount = getCommentLikeCount(commentId);
    
    console.log("PostModal - handleLikeComment called:", {
      commentId,
      wasLiked,
      currentCount,
      localLikedComments: Array.from(localLikedComments),
      localLikeCounts: Object.fromEntries(localLikeCounts),
      reduxComments: comments.map(c => ({ id: c.id, isLiked: c.isLiked, totalLikes: c.totalLikes }))
    });
    
    // Batch optimistic updates to prevent flickering
    React.startTransition(() => {
      setLocalInteractedComments(prev => new Set([...prev, commentId]));
      setLocalLikedComments(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        console.log("PostModal - Updated localLikedComments:", Array.from(newSet));
        return newSet;
      });
      setLocalLikeCounts(prev => {
        const newMap = new Map(prev);
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        newMap.set(commentId, newCount);
        console.log("PostModal - Updated localLikeCounts:", Object.fromEntries(newMap));
        return newMap;
      });
    });
    
    try {
      const result = await dispatch(likeComment(commentId));
      console.log("PostModal - Comment like result:", result);
    } catch (error) {
      console.error("PostModal - Error liking comment:", error);
      // Revert optimistic update on error
      React.startTransition(() => {
        setLocalLikedComments(prev => {
          const newSet = new Set(prev);
          if (wasLiked) {
            newSet.add(commentId);
          } else {
            newSet.delete(commentId);
          }
          return newSet;
        });
        setLocalLikeCounts(prev => {
          const newMap = new Map(prev);
          newMap.set(commentId, wasLiked ? currentCount + 1 : Math.max(0, currentCount - 1));
          return newMap;
        });
      });
    }
  }, [isCommentLiked, getCommentLikeCount, localLikedComments, localLikeCounts, comments, dispatch]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        addComment({
          postId: latestPost.id,
          content: newComment.trim(),
        })
      );

      if (result.type.endsWith("fulfilled")) {
        const commentText = newComment.trim();
        setNewComment("");
        
        // Don't manually add to localComments here - let Redux handle it via addComment.fulfilled
        // The useEffect will sync Redux comments to localComments automatically
        // Only add if Redux doesn't have it (optimistic update for temporary comments)
        if (result.payload?.comment && result.payload.comment.user) {
          console.log("PostModal - Comment added via Redux, will sync automatically");
          // Check if comment is already in Redux (it should be after addComment.fulfilled)
          // If not, add it optimistically (shouldn't happen, but just in case)
          const commentId = result.payload.comment.id?.toString();
          const isInRedux = comments.some(c => c.id?.toString() === commentId);
          if (!isInRedux) {
            console.log("PostModal - Comment not in Redux yet, adding optimistically");
            setLocalComments((prev) => {
              // Check for duplicates before adding
              const exists = prev.some(c => c.id?.toString() === commentId);
              if (!exists) {
                return [...prev, { ...result.payload.comment, isOptimistic: true }];
              }
              return prev;
            });
          }
        } else {
          // Fallback: create temporary comment only if Redux doesn't have it
          console.log("PostModal - API response missing comment data, creating temporary fallback");
          const tempId = `temp_${Date.now()}`;
          const fallbackComment = {
            id: tempId,
            content: commentText,
            user: currentUser,
            totalLikes: 0,
            isLiked: false,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
          };
          setLocalComments((prev) => {
            // Check for duplicates before adding
            const exists = prev.some(c => c.id?.toString() === tempId);
            if (!exists) {
              return [...prev, fallbackComment];
            }
            return prev;
          });
        }
        
        // Update local post comment count
        setPostLikeCount(prev => prev); // Keep like count same
        console.log("PostModal - Comment added, post totalComments should be updated by Redux");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleCommentSubmit();
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content || "");
  };

  const handleUpdateComment = async () => {
    if (!editText?.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await dispatch(
        updateComment({
          commentId: editingComment,
          content: editText?.trim() || "",
        })
      );

      if (result.type.endsWith("fulfilled")) {
        setEditingComment(null);
        setEditText("");
        
        // Update comment in local state immediately for real-time UI
        // Preserve local like state during update
        setLocalComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === editingComment
              ? { 
                  ...comment, 
                  content: editText?.trim() || "",
                  // Preserve like-related fields
                  totalLikes: comment.totalLikes || 0,
                  isLiked: comment.isLiked || false
                }
              : comment
          )
        );
        
        console.log("PostModal - Comment updated successfully, local state preserved");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (isSubmitting) return;

    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsSubmitting(true);
      try {
        // Pass both commentId and postId so reducer knows which post to update
        const result = await dispatch(deleteComment({ 
          commentId, 
          postId: latestPost?.id 
        }));

        if (result.type.endsWith("fulfilled")) {
          // Remove comment from local state immediately for real-time UI
          setLocalComments((prevComments) =>
            prevComments.filter((comment) => comment.id?.toString() !== commentId?.toString())
          );
          
          // Update local post comment count
          console.log("PostModal - Comment deleted, post totalComments should be updated by Redux");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  // Old functions removed - using new pattern above

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText("");
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
    if (!latestPost?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const result = await dispatch(deletePost(latestPost.id));
      if (result.type.endsWith('fulfilled')) {
        console.log('Post deleted successfully');
        setDeleteDialogOpen(false);
        onClose(); // Close the modal after successful deletion
      } else {
        console.error('Failed to delete post:', result.payload);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };


  // Early return after all hooks
  if (!latestPost) return null;

  // Debug logging for post data
  console.log("PostModal post data:", {
    postId: latestPost?.id,
    postTotalLikes: latestPost?.totalLikes,
    postRecentLikedBy: latestPost?.recentLikedBy,
    postComments: latestPost?.comments,
    postCommentsType: typeof latestPost?.comments,
    postCommentsLength: latestPost?.comments?.length,
    localComments,
    localCommentsLength: localComments?.length,
    reduxComments: comments,
    reduxCommentsLength: comments?.length,
  });

  // Use actual comment count from localComments - this is the source of truth
  // It will be accurate because localComments is synced with Redux comments
  const commentCount = localComments.length;

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="post-modal-title"
      aria-describedby="post-modal-description"
    >
      <Box
        sx={{
          ...style,
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(45deg, #9ca3af, #6b7280)",
            borderRadius: "10px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(45deg, #6b7280, #4b5563)",
            },
          },
          // Firefox scrollbar styling
          scrollbarWidth: "thin",
          scrollbarColor: "#9ca3af rgba(0, 0, 0, 0.1)",
        }}
      >
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
            {latestPost?.type === 'reel' ? 'Reel' : 'Post'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {latestPost?.user?.id === currentUser?.id && (
              <IconButton 
                aria-label="post options"
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
          {/* Left Side - Image/Video */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#000",
              minHeight: { xs: "40%", sm: 0 },
              maxHeight: { xs: "50%", sm: "100%" },
            }}
          >
            {latestPost.image ? (
              <img
                src={latestPost.image}
                alt="Post"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : latestPost.video ? (
              <video
                src={latestPost.video}
                controls
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            ) : (
              <Typography color="white">No media available</Typography>
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
                  src={extractImageUrl(latestPost.user?.profileImage)}
                  sx={{ width: 32, height: 32, cursor: 'pointer' }}
                  onClick={() => {
                    if (latestPost?.user?.id) {
                      navigate(`/profile/${latestPost.user.id}`);
                    }
                  }}
                />
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (latestPost?.user?.id) {
                        navigate(`/profile/${latestPost.user.id}`);
                      }
                    }}
                  >
                    {latestPost.user?.fname} {latestPost.user?.lname}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    @{latestPost.user?.fname?.toLowerCase()}_
                    {latestPost.user?.lname?.toLowerCase()}
                  </Typography>
                </Box>
              </Box>
              {(latestPost.caption || latestPost.title) && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {latestPost.caption || latestPost.title}
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
                  "&:hover": {
                    background: "linear-gradient(45deg, #6b7280, #4b5563)",
                  },
                },
                // Firefox scrollbar styling
                scrollbarWidth: "thin",
                scrollbarColor: "#9ca3af rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Comments ({commentCount})
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading comments...
                  </Typography>
                </Box>
              ) : localComments && localComments.length > 0 ? (
                localComments.map((comment, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar
                        src={extractImageUrl(comment.user?.profileImage)}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {comment.user?.fname && comment.user?.lname 
                          ? `${comment.user.fname} ${comment.user.lname}`
                          : comment.user?.fname || comment.user?.lname || "Unknown User"
                        }
                      </Typography>
                      {currentUser?.id === comment.user?.id && (
                        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditComment(comment)}
                            disabled={isSubmitting}
                          >
                            <Typography variant="caption" color="primary">
                              Edit
                            </Typography>
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isSubmitting}
                          >
                            <Typography variant="caption" color="error">
                              Delete
                            </Typography>
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    {editingComment === comment.id ? (
                      <Box sx={{ ml: 4, mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          disabled={isSubmitting}
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleUpdateComment}
                            disabled={!editText?.trim() || isSubmitting}
                          >
                            {isSubmitting ? "Updating..." : "Update"}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={cancelEdit}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ ml: 4, mb: 1 }}>
                          {comment.content || "No content available"}
                        </Typography>
                        
                        <Box
                          sx={{
                            ml: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mt: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleLikeComment(comment.id)}
                            disabled={isSubmitting}
                            sx={{ 
                              color: isCommentLiked(comment.id) ? 'red' : 'inherit',
                              p: 0.5
                            }}
                          >
                            {isCommentLiked(comment.id) ? (
                              <FavoriteIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                          <Typography variant="caption">
                            {Math.max(0, getCommentLikeCount(comment.id))}
                          </Typography>
                          <TimeAgo 
                            dateInput={comment.createdAt} 
                            variant="caption"
                            color="text.secondary"
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Be the first to comment!
                </Typography>
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <IconButton
                  onClick={handlePostLike}
                >
                  {postLiked ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
                <IconButton onClick={handleCommentsClick}>
                  <ChatBubbleOutlineIcon />
                </IconButton>
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {Math.max(0, commentCount)}
                </Typography>
                <IconButton>
                  <ShareIcon />
                </IconButton>
                <Box sx={{ flex: 1 }} />
                <IconButton onClick={handlePostSave}>
                  {postSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Box>
              
              {/* Like count with recent liked users - all in one line */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {/* Recent liked users avatars */}
                {latestPost?.recentLikedBy && latestPost.recentLikedBy.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mr: 1 }}>
                    {latestPost.recentLikedBy.slice(0, 3).map((like, index) => (
                      <Avatar
                        key={like.id || index}
                        src={like.profileImage}
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          border: "1px solid white",
                          marginLeft: index > 0 ? '-8px' : 0, // Overlap avatars slightly
                          zIndex: 3 - index // Stack order
                        }}
                      />
                    ))}
                    {latestPost.recentLikedBy.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        +{latestPost.recentLikedBy.length - 3}
                      </Typography>
                    )}
                  </Box>
                )}
                <Typography 
                  variant="subtitle2"
                  sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  onClick={handleLikesClick}
                >
                  {postLikeCount} {postLikeCount === 1 ? "like" : "likes"}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatMessageTime(latestPost.createdAt)}
              </Typography>
            </Box>

            {/* Add Comment */}
            <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  key={extractImageUrl(currentUser?.profileImage) || 'default'} // Force re-render when image changes
                  src={extractImageUrl(currentUser?.profileImage)}
                  sx={{ width: 32, height: 32 }}
                />
                <TextField
                  placeholder="Add a comment..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSubmitting}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    },
                  }}
                />
                <Button
                  variant="text"
                  color="primary"
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>

    {/* Likes and Comments Modals */}
    <LikesModal
      open={likesModalOpen}
      onClose={() => setLikesModalOpen(false)}
      postId={latestPost?.id}
      totalLikes={postLikeCount}
    />
    
    <CommentsModal
      open={commentsModalOpen}
      onClose={() => {
        console.log("🔴 PostModal CommentsModal onClose called for post:", latestPost?.id);
        setCommentsModalOpen(false);
      }}
      postId={latestPost?.id}
      totalComments={commentCount}
    />

    {/* Menu for post options */}
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
        Delete Post
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
        Delete Post
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete this post? This action cannot be undone.
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

export default PostModal;
