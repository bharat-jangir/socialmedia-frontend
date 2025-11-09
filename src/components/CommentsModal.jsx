import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Divider,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { getPostComments } from "../state/Post/likesComments.action";
import { likeComment, addComment, deleteComment } from "../state/Post/post.action";
import { isTempId, canDeleteComment, getCommentDisplayStatus, isNullId } from "../utils/commentUtils";
import TimeAgo from "./TimeAgo";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", sm: "500px" },
  maxWidth: "500px",
  height: { xs: "80%", sm: "600px" },
  maxHeight: "600px",
  bgcolor: "background.paper",
  border: "none",
  outline: "none",
  borderRadius: 2,
  boxShadow: 24,
  display: "flex",
  flexDirection: "column",
};

function CommentsModal({ open, onClose, postId, totalComments }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Local state fallback for comment likes
  const [localLikedComments, setLocalLikedComments] = useState(new Set());
  const [localLikeCounts, setLocalLikeCounts] = useState(new Map()); // commentId -> count
  const [localInteractedComments, setLocalInteractedComments] = useState(new Set()); // Track which comments have been interacted with
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const observerRef = useRef(null);

  // Get comments from Redux state
  const comments = useSelector((state) => {
    const postComments = state.post.postComments?.[postId]?.comments || [];
    return postComments;
  });
  const commentsLoading = useSelector((state) => state.post.postComments?.[postId]?.loading || false);
  
  useEffect(() => {
    // Sync local state with Redux state when comments are loaded
    if (comments.length > 0) {
      const likedCommentIds = new Set();
      const likeCounts = new Map();
      
      comments.forEach(comment => {
        if (comment.isLiked === true) {
          likedCommentIds.add(comment.id);
        }
        if (comment.totalLikes !== undefined) {
          likeCounts.set(comment.id, comment.totalLikes);
        }
      });
      
      // Only update local state if it's empty or if we have new comments
      // This prevents resetting local state when new comments are added
      setLocalLikedComments(prev => {
        const newSet = new Set(likedCommentIds);
        // Preserve existing local interactions
        prev.forEach(id => {
          if (localInteractedComments.has(id)) {
            newSet.add(id);
          }
        });
        return newSet;
      });
      
      setLocalLikeCounts(prev => {
        const newMap = new Map(likeCounts);
        // Preserve existing local like counts for interacted comments
        prev.forEach((count, id) => {
          if (localInteractedComments.has(id)) {
            newMap.set(id, count);
          }
        });
        return newMap;
      });
      
      console.log("Synced local state with Redux state:", {
        likedComments: Array.from(likedCommentIds),
        likeCounts: Object.fromEntries(likeCounts)
      });
    }
  }, [comments, postId, localInteractedComments]);

  // Additional sync for Redux state changes (like/unlike actions)
  useEffect(() => {
    if (comments && comments.length > 0) {
      console.log("CommentsModal - Syncing with Redux state changes");
      comments.forEach(comment => {
        // If we haven't interacted with this comment locally, sync with Redux state
        if (!localInteractedComments.has(comment.id)) {
          console.log("Syncing comment with Redux state:", {
            commentId: comment.id,
            isLiked: comment.isLiked,
            totalLikes: comment.totalLikes
          });
          
          // Update local state to match Redux state
          setLocalLikedComments(prev => {
            const newSet = new Set(prev);
            if (comment.isLiked) {
              newSet.add(comment.id);
            } else {
              newSet.delete(comment.id);
            }
            return newSet;
          });
          
          setLocalLikeCounts(prev => {
            const newMap = new Map(prev);
            newMap.set(comment.id, comment.totalLikes || 0);
            return newMap;
          });
        }
      });
    }
  }, [comments, localInteractedComments]);

  // Load initial comments
  useEffect(() => {
    if (open && postId) {
      setCurrentPage(0);
      setHasMore(true);
      dispatch(getPostComments({ postId, page: 0, size: 20 }));
    }
  }, [open, postId, dispatch]);

  // Infinite scroll observer
  const lastCommentElementRef = useCallback(
    (node) => {
      if (loadingMore || !hasMore) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !loadingMore) {
              console.log("Loading more comments - page:", currentPage + 1);
              setLoadingMore(true);
              dispatch(getPostComments({ postId, page: currentPage + 1, size: 20 }))
                .then((result) => {
                  if (result.type.endsWith('fulfilled')) {
                    setCurrentPage(prev => prev + 1);
                    setHasMore(result.payload.hasNext);
                  }
                })
                .finally(() => {
                  setLoadingMore(false);
                });
            }
          },
          {
            threshold: 0.1,
            rootMargin: "100px",
          }
        );
        observerRef.current.observe(node);
      }
    },
    [loadingMore, hasMore, currentPage, postId, dispatch]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleProfileClick = (userId) => {
    // Navigate to user profile
    window.location.href = `/profile/${userId}`;
  };

  const handleLikeComment = useCallback((commentId) => {
    if (!currentUser?.id) return;
    
    console.log("Liking comment:", commentId);
    console.log("Current user:", currentUser);
    
    // Find the comment to get current state
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // Get current state directly from Redux and local state
    const isLikedFromRedux = comment.isLiked === true;
    const isLikedFromLocal = localLikedComments.has(commentId);
    const isCurrentlyLiked = localLikedComments.has(commentId) ? isLikedFromLocal : isLikedFromRedux;
    
    const countFromRedux = comment.totalLikes || 0;
    const countFromLocal = localLikeCounts.get(commentId);
    const currentCount = localLikeCounts.has(commentId) ? countFromLocal : countFromRedux;
    
    console.log("Current state:", {
      commentId,
      isLikedFromRedux,
      isLikedFromLocal,
      isCurrentlyLiked,
      countFromRedux,
      countFromLocal,
      currentCount,
      localLikedComments: Array.from(localLikedComments),
      localLikeCounts: Object.fromEntries(localLikeCounts)
    });
    
    // Batch all state updates together to prevent flickering
    React.startTransition(() => {
      // Update liked comments
      setLocalLikedComments(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(commentId);
          console.log("Removed like from local state for comment:", commentId);
        } else {
          newSet.add(commentId);
          console.log("Added like to local state for comment:", commentId);
        }
        return newSet;
      });
      
      // Track that we've interacted with this comment
      setLocalInteractedComments(prev => {
        const newSet = new Set(prev);
        newSet.add(commentId);
        console.log("Marked comment as interacted:", commentId);
        return newSet;
      });
      
      // Update like counts
      setLocalLikeCounts(prev => {
        const newMap = new Map(prev);
        if (isCurrentlyLiked) {
          // Currently liked, so unlike (decrease count)
          newMap.set(commentId, Math.max(0, currentCount - 1));
          console.log("Decreased like count for comment:", commentId, "to:", currentCount - 1);
        } else {
          // Currently not liked, so like (increase count)
          newMap.set(commentId, currentCount + 1);
          console.log("Increased like count for comment:", commentId, "to:", currentCount + 1);
        }
        return newMap;
      });
    });
    
    // Dispatch API call - Redux will handle the state update
    dispatch(likeComment(commentId)).then((result) => {
      if (result.type.endsWith('fulfilled')) {
        console.log("Comment like action completed successfully");
        // Clear local interaction after a short delay to allow Redux state to update
        setTimeout(() => {
          setLocalInteractedComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            console.log("Cleared local interaction for comment:", commentId);
            return newSet;
          });
        }, 1000); // 1 second delay
      } else {
        console.error("Comment like action failed:", result.payload);
      }
    });
  }, [currentUser?.id, comments, localLikedComments, localLikeCounts, dispatch]);

  const isCommentLiked = useCallback((comment) => {
    // Use local state as fallback if Redux state is not updated
    const isLikedFromRedux = comment.isLiked === true;
    const isLikedFromLocal = localLikedComments.has(comment.id);
    
    // If we have interacted with this comment locally, use local state
    // Otherwise, use Redux state
    const hasLocalState = localInteractedComments.has(comment.id);
    const finalIsLiked = hasLocalState ? isLikedFromLocal : isLikedFromRedux;
    
    console.log("Checking if comment is liked:", {
      commentId: comment.id,
      isLikedFromRedux: isLikedFromRedux,
      isLikedFromLocal: isLikedFromLocal,
      finalIsLiked: finalIsLiked,
      totalLikes: comment.totalLikes,
      localLikedComments: Array.from(localLikedComments),
      hasLocalState: localInteractedComments.has(comment.id)
    });
    
    return finalIsLiked;
  }, [localLikedComments, localInteractedComments]);

  const getCommentLikeCount = useCallback((comment) => {
    // Use local state as fallback if Redux state is not updated
    const countFromRedux = comment.totalLikes || 0;
    const countFromLocal = localLikeCounts.get(comment.id);
    
    // If we have interacted with this comment locally, use local count
    // Otherwise, use Redux count
    const hasLocalState = localInteractedComments.has(comment.id);
    const finalCount = hasLocalState ? countFromLocal : countFromRedux;
    
    console.log("Getting like count for comment:", {
      commentId: comment.id,
      countFromRedux: countFromRedux,
      countFromLocal: countFromLocal,
      finalCount: finalCount,
      hasLocalState: localLikeCounts.has(comment.id)
    });
    
    return finalCount;
  }, [localLikeCounts, localInteractedComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser?.id || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    console.log("🚀 Submitting comment:", newComment);
    console.log("🔍 Modal state before submit:", { open, postId });
    
    try {
      // Dispatch the addComment action - wait for API response
      const result = await dispatch(addComment({
        postId: postId,
        content: newComment.trim()
      }));
      
      if (result.type.endsWith('fulfilled')) {
        console.log("✅ Comment added successfully from API response");
        console.log("🔍 Modal state after success:", { open, postId });
        console.log("💾 Original API response comment stored in Redux state");
        setNewComment("");
        
        // Comment is already stored in Redux state via addComment.fulfilled reducer
        // Modal should stay open to show the new comment
      } else {
        console.log("❌ Failed to add comment:", result.payload);
      }
    } catch (error) {
      console.log("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    
    // Find the comment to check its status
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // Prevent deletion of temp ID comments only
    if (isTempId(commentId)) {
      console.log("🚫 Cannot delete temp ID comment:", commentId);
      return;
    }
    
    console.log("🗑️ Deleting comment from CommentsModal:", commentId);
    console.log("🔍 CommentsModal - postId:", postId, "commentId:", commentId);
    
    try {
      // Pass both commentId and postId so reducer knows which post to update
      const result = await dispatch(deleteComment({ 
        commentId, 
        postId: postId 
      }));
      
      if (result.type.endsWith('fulfilled')) {
        console.log("✅ Comment deleted successfully");
        // Don't manually decrement count - deleteComment.fulfilled reducer already handles it
        // Don't manually remove from list - deleteComment.fulfilled reducer already handles it
      } else {
        console.log("❌ Failed to delete comment:", result.payload);
      }
    } catch (error) {
      console.log("Error deleting comment:", error);
    }
  };


  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="comments-modal-title"
      aria-describedby="comments-modal-description"
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
          <Typography variant="h6" component="h2" id="comments-modal-title">
            Comments ({totalComments || 0})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Comments List */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1,
          }}
        >
          {commentsLoading && comments.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : comments.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "text.secondary",
              }}
            >
              <Typography>No comments yet</Typography>
            </Box>
          ) : (
            comments.map((comment, index) => {
              const isLastComment = index === comments.length - 1;
              return (
                <Box key={`${comment.id}-${comment.isLiked}-${comment.totalLikes}`}>
                  <Box
                    sx={{
                      p: 2,
                    }}
                    ref={isLastComment ? lastCommentElementRef : null}
                  >
                    {/* Comment Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Avatar
                        src={comment.user?.profileImage}
                        sx={{ width: 32, height: 32, mr: 1.5, cursor: "pointer" }}
                        onClick={() => handleProfileClick(comment.user?.id)}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, cursor: "pointer" }}
                          onClick={() => handleProfileClick(comment.user?.id)}
                        >
                          {comment.user?.fname && comment.user?.lname 
                            ? `${comment.user.fname} ${comment.user.lname}`
                            : comment.user?.fname || comment.user?.lname || "Unknown User"
                          }
                        </Typography>
                        <TimeAgo 
                          dateInput={comment.createdAt} 
                          variant="caption"
                          color="text.secondary"
                        />
                      </Box>
                    </Box>

                    {/* Comment Content */}
                    <Typography variant="body2" sx={{ mb: 1, ml: 4 }}>
                      {comment.content || "No content available"}
                    </Typography>
                    
                    {/* Comment Actions */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        ml: 4,
                        gap: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={!currentUser?.id}
                      >
                        {isCommentLiked(comment) ? (
                          <FavoriteIcon sx={{ fontSize: 16, color: "error.main" }} />
                        ) : (
                          <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                      <Typography variant="caption" color="text.secondary">
                        {Math.max(0, getCommentLikeCount(comment))} likes
                      </Typography>
                      
                      {/* Delete button - only show for current user's comments and not temp ID */}
                      {currentUser?.id === comment.user?.id && !isTempId(comment.id) && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteComment(comment.id)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon sx={{ fontSize: 16, color: "error.main" }} />
                        </IconButton>
                      )}
                      
                    </Box>
                  </Box>
                  {index < comments.length - 1 && <Divider />}
                </Box>
              );
            })
          )}

          {/* Loading More */}
          {loadingMore && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                Loading more comments...
              </Typography>
            </Box>
          )}

          {/* End of comments indicator */}
          {!hasMore && comments.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                p: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                You've reached the end!
              </Typography>
            </Box>
          )}
        </Box>

        {/* Comment Input Section */}
        <Box
          sx={{
            borderTop: "1px solid #e0e0e0",
            p: 2,
            backgroundColor: "background.paper"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              key={currentUser?.profileImage || 'default'} // Force re-render when image changes
              src={currentUser?.profileImage}
              sx={{ width: 32, height: 32 }}
            />
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmittingComment}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                },
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmittingComment}
              sx={{
                borderRadius: 3,
                minWidth: "auto",
                px: 2,
              }}
            >
              {isSubmittingComment ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                "Post"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

export default CommentsModal;
