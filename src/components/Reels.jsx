import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography, IconButton, TextField, Avatar, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, useTheme } from '@mui/material';
import { getAllReels, likeReel, addReelComment, updateReelComment, deleteReelComment, getReelComments, likeComment } from '../state/Post/post.action';
import { addOptimisticReelComment, removeOptimisticReelComment } from '../state/Post/postSlice';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';

function Reels() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { allReels, loading, reelsLoadingMore, reelsHasMore, reelsCurrentPage, reelComments } = useSelector((state) => state.post);
  const { user } = useSelector((state) => state.auth);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [availableHeight, setAvailableHeight] = useState('100vh');
  const reelsContainerRef = useRef(null);
  const videoRefs = useRef({});
  const observerRef = useRef(null);
  const lastClickTime = useRef(0);
  const commentObserverRef = useRef(null);

  // Local state for comment likes (same pattern as CommentsModal)
  const [localLikedComments, setLocalLikedComments] = useState(new Set());
  const [localLikeCounts, setLocalLikeCounts] = useState(new Map());
  const [localInteractedComments, setLocalInteractedComments] = useState(new Set());

  // Calculate available height by subtracting header and footer heights
  const calculateAvailableHeight = useCallback(() => {
    const header = document.querySelector('header, [role="banner"], .app-header, .navbar, .MuiAppBar-root');
    const footer = document.querySelector('footer, [role="contentinfo"], .app-footer, .bottom-nav, .MuiBottomNavigation-root');
    
    let headerHeight = 0;
    let footerHeight = 0;
    
    if (header) {
      headerHeight = header.offsetHeight;
    }
    
    if (footer) {
      footerHeight = footer.offsetHeight;
    }
    
    // Add some buffer to ensure full coverage
    const buffer = 10; // Small buffer to ensure no gaps
    const totalUsedHeight = headerHeight + footerHeight + buffer;
    const availableHeight = totalUsedHeight > 0 ? `calc(100vh - ${totalUsedHeight}px)` : '100vh';
    
    console.log('Height calculation:', {
      headerHeight,
      footerHeight,
      buffer,
      totalUsedHeight,
      availableHeight
    });
    
    return availableHeight;
  }, []);

  // Update available height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      const newHeight = calculateAvailableHeight();
      setAvailableHeight(newHeight);
    };

    // Initial calculation with a small delay to ensure DOM is ready
    setTimeout(updateHeight, 100);
    updateHeight();

    // Listen for resize events
    window.addEventListener('resize', updateHeight);
    
    // Also listen for DOM changes (in case header/footer are dynamically added/removed)
    const observer = new MutationObserver(updateHeight);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
    };
  }, [calculateAvailableHeight]);

  // Helper function to check if reel is liked by current user
  const isReelLiked = useCallback((reel) => {
    if (!reel || !user?.id) {
      console.log("isReelLiked - no reel or user:", { reel: !!reel, userId: user?.id });
      return false;
    }
    const isLiked = reel.likedBy?.includes(user.id) || false;
    console.log("isReelLiked check:", { 
      reelId: reel.id, 
      userId: user.id, 
      likedBy: reel.likedBy, 
      isLiked 
    });
    return isLiked;
  }, [user?.id]);

  // Sync local state with Redux state for comments (preserve local interactions)
  useEffect(() => {
    if (selectedReelId && reelComments[selectedReelId]?.comments) {
      const comments = reelComments[selectedReelId].comments;
      console.log("Reels - Syncing local state with comments:", comments.map(c => ({
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
    }
  }, [selectedReelId, reelComments, localInteractedComments]);

  // Helper functions for comment likes
  const isCommentLiked = useCallback((commentId) => {
    return localInteractedComments.has(commentId) 
      ? localLikedComments.has(commentId)
      : (reelComments[selectedReelId]?.comments?.find(c => c.id === commentId)?.isLiked || false);
  }, [localInteractedComments, localLikedComments, reelComments, selectedReelId]);

  const getCommentLikeCount = useCallback((commentId) => {
    return localInteractedComments.has(commentId)
      ? (localLikeCounts.get(commentId) || 0)
      : (reelComments[selectedReelId]?.comments?.find(c => c.id === commentId)?.totalLikes || 0);
  }, [localInteractedComments, localLikeCounts, reelComments, selectedReelId]);

  const handleLikeComment = useCallback(async (commentId) => {
    if (!commentId) return;
    
    const wasLiked = isCommentLiked(commentId);
    const currentCount = getCommentLikeCount(commentId);
    
    // Optimistic update
    setLocalInteractedComments(prev => new Set([...prev, commentId]));
    setLocalLikedComments(prev => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
    setLocalLikeCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(commentId, wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1);
      return newMap;
    });
    
    try {
      const result = await dispatch(likeComment(commentId));
      console.log("Reels - Comment like result:", result);
    } catch (error) {
      console.error("Reels - Error liking comment:", error);
      // Revert optimistic update on error
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
        newMap.set(commentId, currentCount);
        return newMap;
      });
    }
  }, [isCommentLiked, getCommentLikeCount, dispatch]);

  // Debug logs
  console.log("Reels Component - State:", {
    allReels: allReels,
    allReelsLength: allReels.length,
    loading: loading,
    reelsLoadingMore: reelsLoadingMore,
    reelsHasMore: reelsHasMore,
    reelsCurrentPage: reelsCurrentPage,
    user: user,
  });

  // Load initial reels
  useEffect(() => {
    console.log("Reels useEffect - allReels.length:", allReels.length);
    if (allReels.length === 0) {
      console.log("Dispatching getAllReels...");
      dispatch(getAllReels({ page: 0, size: 10 }));
    }
  }, [dispatch, allReels.length]);

  // Intersection Observer for infinite scroll
  const lastReelElementRef = useCallback((node) => {
    if (reelsLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && reelsHasMore) {
        console.log("Loading more reels...");
        dispatch(getAllReels({ page: reelsCurrentPage + 1, size: 10 }));
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    
    if (node) observerRef.current.observe(node);
  }, [reelsLoadingMore, reelsHasMore, reelsCurrentPage, dispatch]);

  // Handle scroll snap with auto play
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const reelHeight = containerHeight; // Each reel takes full container height
    
    const newIndex = Math.round(scrollTop / reelHeight);
    
    if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < allReels.length) {
      setCurrentReelIndex(newIndex);
      
      // Pause all videos
      Object.values(videoRefs.current).forEach(video => {
        if (video) video.pause();
      });
      
      // Auto play current video
      const currentVideo = videoRefs.current[newIndex];
      if (currentVideo) {
        currentVideo.currentTime = 0; // Reset to beginning
        currentVideo.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [currentReelIndex, allReels.length]);

  // Handle single click (play/pause)
  const handleVideoClick = useCallback((index) => {
    console.log("Single click detected - triggering play/pause");
    handleSingleClick(index);
  }, []);

  // Handle double click (like animation)
  const handleVideoDoubleClick = useCallback((index) => {
    console.log("Double click detected - triggering like");
    handleDoubleClick(index);
  }, []);

  // Handle single click (play/pause)
  const handleSingleClick = useCallback((index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      // Pause all other videos
      Object.values(videoRefs.current).forEach((v, i) => {
        if (v && i !== index) v.pause();
      });
      video.play().catch(console.error);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Handle double click (like animation)
  const handleDoubleClick = useCallback((index) => {
    const reel = allReels[index];
    const reelId = reel?.id;
    console.log("handleDoubleClick called:", { index, reelId, reel, user });
    
    if (!reelId || !user?.id) {
      console.log("No reelId or user ID found:", { reelId, userId: user?.id });
      return;
    }

    // Show heart animation immediately for better UX
    console.log("Showing heart animation for index:", index);
    setShowHeartAnimation(index);
    setTimeout(() => {
      console.log("Hiding heart animation");
      setShowHeartAnimation(null);
    }, 1000);

    // Call API to like/unlike reel
    console.log("Dispatching likeReel action for reelId:", reelId, "userId:", user.id);
    dispatch(likeReel(reelId));
  }, [allReels, user, dispatch]);

  // Handle comment button click
  const handleCommentClick = useCallback((reelId) => {
    console.log("Comment button clicked for reelId:", reelId);
    setSelectedReelId(reelId);
    setCommentModalOpen(true);
    
    // Load comments if not already loaded
    const currentComments = reelComments[reelId];
    if (!currentComments || currentComments.comments.length === 0) {
      console.log("Loading comments for reelId:", reelId);
      dispatch(getReelComments({ reelId, page: 0, size: 10 }));
    }
  }, [reelComments, dispatch]);

  // Handle comment modal close
  const handleCommentModalClose = useCallback(() => {
    setCommentModalOpen(false);
    setSelectedReelId(null);
    setNewComment('');
    setEditingComment(null);
    setEditText('');
  }, []);

  // Handle add comment
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !selectedReelId) return;
    
    const trimmedComment = newComment.trim();
    console.log("Adding comment:", {
      originalComment: newComment,
      trimmedComment: trimmedComment,
      reelId: selectedReelId,
      commentLength: trimmedComment.length
    });
    
    // Add optimistic comment immediately
    dispatch(addOptimisticReelComment({
      reelId: selectedReelId,
      content: trimmedComment
    }));
    
    // Clear input immediately for better UX
    setNewComment('');
    
    try {
      // Make API call
      const result = await dispatch(addReelComment({ 
        reelId: selectedReelId, 
        content: trimmedComment 
      }));
      
      console.log("Add comment result:", result);
      
      // If API call fails, the rejected case in the reducer will handle removing the optimistic comment
      if (result.type.endsWith('rejected')) {
        console.log("Comment failed, optimistic comment will be removed by reducer");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }, [newComment, selectedReelId, dispatch]);

  // Handle edit comment
  const handleEditComment = useCallback((comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  }, []);

  // Handle update comment
  const handleUpdateComment = useCallback(async () => {
    if (!editText.trim() || !editingComment || !selectedReelId) return;
    
    console.log("Updating comment:", editingComment, "with content:", editText.trim());
    
    try {
      const result = await dispatch(updateReelComment({
        reelId: selectedReelId,
        commentId: editingComment,
        content: editText.trim()
      }));
      
      if (result.type.endsWith('fulfilled')) {
        setEditingComment(null);
        setEditText('');
        console.log("Comment updated successfully");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  }, [editText, editingComment, selectedReelId, dispatch]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingComment(null);
    setEditText('');
  }, []);

  // Handle delete comment
  const handleDeleteComment = useCallback((commentId) => {
    if (!selectedReelId) return;
    
    console.log("🗑️ Deleting comment from Reels component:", commentId, "from reelId:", selectedReelId);
    console.log("🔍 Reels - Using deleteReelComment action");
    dispatch(deleteReelComment({ reelId: selectedReelId, commentId }));
  }, [selectedReelId, dispatch]);

  // Handle video metadata load
  const handleVideoLoadedMetadata = useCallback((index) => {
    const video = videoRefs.current[index];
    if (video) {
      // Set video to start at beginning
      video.currentTime = 0;
      
      // Auto-play first video or current visible video
      if ((index === 0 && !isPlaying) || index === currentReelIndex) {
        video.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [isPlaying, currentReelIndex]);

  // Handle video end
  const handleVideoEnded = useCallback((index) => {
    // Move to next reel
    if (index < allReels.length - 1) {
      const nextIndex = index + 1;
      setCurrentReelIndex(nextIndex);
      
      // Scroll to next reel
      const container = reelsContainerRef.current;
      if (container) {
        container.scrollTo({
          top: nextIndex * container.clientHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [allReels.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (loading && allReels.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (allReels.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" color="text.secondary">
          No reels available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={reelsContainerRef}
      onScroll={handleScroll}
      sx={{
        height: availableHeight || 'calc(100vh - 140px)', // Dynamic height with fallback
        minHeight: 'calc(100vh - 140px)', // Ensure minimum height
        width: '100%',
        maxWidth: { xs: '100%', sm: '400px' }, // Responsive max width
        margin: '0 auto', // ✅ Center the container
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        position: 'relative',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(45deg, #9ca3af, #6b7280)',
          borderRadius: '10px',
          border: '1px solid transparent',
          backgroundClip: 'content-box'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(45deg, #6b7280, #4b5563)'
        },
        scrollbarWidth: 'thin',
        scrollbarColor: '#9ca3af rgba(255, 255, 255, 0.1)',
        backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#f5f5f5' // Theme-aware background
      }}
    >
      {allReels.map((reel, index) => (
        <Box
          key={reel.id}
          ref={index === allReels.length - 1 ? lastReelElementRef : null}
          sx={{
            height: availableHeight || 'calc(100vh - 140px)', // Match container height with fallback
            minHeight: 'calc(100vh - 140px)', // Ensure minimum height
            width: '100%',
            position: 'relative',
            scrollSnapAlign: 'start',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#f5f5f5', // Theme-aware background
            cursor: 'pointer',
            overflow: 'hidden'
          }}
          onClick={() => handleVideoClick(index)}
          onDoubleClick={() => handleVideoDoubleClick(index)}
        >
          {/* Video Player Container */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#f5f5f5', // Theme-aware background
              zIndex: 1
            }}
          >
            <video
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src={reel.video}
              onLoadedMetadata={() => handleVideoLoadedMetadata(index)}
              onEnded={() => handleVideoEnded(index)}
              onError={(e) => console.error('Video error:', e)}
              onClick={(e) => {
                e.stopPropagation();
                handleVideoClick(index);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleVideoDoubleClick(index);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain', // Show full video content without cropping
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              playsInline
              muted={false}
              loop={false}
              preload="metadata"
            />
          </Box>

          {/* Right Side Actions */}
          <Box
            sx={{
              position: 'absolute',
              right: { xs: 12, sm: 16 },
              bottom: { xs: 120, sm: 140 }, // Move up to avoid overlay
              zIndex: 4, // Higher z-index to stay above overlay
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 2, sm: 2.5 }
            }}
          >
            {/* Like Button */}
            <Box display="flex" flexDirection="column" alignItems="center">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(index);
                }}
                sx={{
                  color: isReelLiked(reel) ? '#ff3040' : 'white',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(4px)', // Reduced blur effect
                  width: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  }
                }}
              >
                {isReelLiked(reel) ? (
                  <FavoriteIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                ) : (
                  <FavoriteBorderIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                )}
              </IconButton>
              <Typography variant="caption" color="white" sx={{ fontSize: '12px' }}>
                {Math.max(0, reel.totalLikes || reel.likesCount || 0)}
              </Typography>
            </Box>

            {/* Comment Button */}
            <Box display="flex" flexDirection="column" alignItems="center">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleCommentClick(reel.id);
                }}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(4px)', // Reduced blur effect
                  width: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  }
                }}
              >
                <CommentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
              </IconButton>
              <Typography variant="caption" color="white" sx={{ fontSize: '12px' }}>
                {reel.totalComments || reel.commentsCount || 0}
              </Typography>
            </Box>

            {/* Share Button */}
            <Box display="flex" flexDirection="column" alignItems="center">
              <IconButton
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(4px)', // Reduced blur effect
                  width: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  }
                }}
              >
                <ShareIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
              </IconButton>
              <Typography variant="caption" color="white" sx={{ fontSize: '12px' }}>
                Share
              </Typography>
            </Box>
          </Box>

          {/* Heart Animation */}
          {showHeartAnimation === index && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 4,
                animation: 'heartAnimation 1s ease-out forwards',
                '@keyframes heartAnimation': {
                  '0%': {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'translate(-50%, -50%) scale(1.2)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 0,
                  },
                },
              }}
            >
              <FavoriteIcon sx={{ fontSize: 80, color: '#ff3040' }} />
            </Box>
          )}

          {/* Overlay Content */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0, // Cover complete width
              zIndex: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              padding: { xs: 1.5, sm: 2 },
              color: 'white',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.3)', // Add shadow effect
              backdropFilter: 'blur(2px)' // Subtle backdrop blur
            }}
          >
            {/* User Info */}
            <Box display="flex" alignItems="center" mb={1}>
              <Box
                component="img"
                src={reel.user?.profileImage}
                alt={reel.user?.fname}
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: '50%',
                  marginRight: 1,
                  border: '2px solid white'
                }}
              />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {reel.user?.fname} {reel.user?.lname}
              </Typography>
            </Box>

            {/* Reel Title */}
            <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {reel.title}
            </Typography>
          </Box>

          {/* Loading indicator for more reels */}
          {index === allReels.length - 1 && reelsLoadingMore && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3
              }}
            >
              <CircularProgress size={24} color="primary" />
            </Box>
          )}
        </Box>
      ))}

      {/* Comment Modal */}
      <Dialog
        open={commentModalOpen}
        onClose={handleCommentModalClose}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '80vh',
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Comments</Typography>
          <IconButton onClick={handleCommentModalClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Comments List */}
          <Box sx={{ flex: 1, overflow: 'auto', padding: 2 }}>
            {selectedReelId && reelComments[selectedReelId] && (
              <>
                {reelComments[selectedReelId].loading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress />
                  </Box>
                ) : reelComments[selectedReelId].comments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                    No comments yet. Be the first to comment!
                  </Typography>
                ) : (
                  <List>
                    {reelComments[selectedReelId].comments.map((comment, index) => {
                      console.log("Rendering comment:", comment);
                      return (
                        <ListItem
                          key={comment.id}
                          ref={index === reelComments[selectedReelId].comments.length - 1 ? commentObserverRef : null}
                          sx={{ px: 0 }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              src={comment.user?.profileImage} 
                              alt={comment.user?.fname || 'User'} 
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>
                                  {comment.user?.fname || 'Unknown'} {comment.user?.lname || ''}
                                </Typography>
                                {editingComment === comment.id ? (
                                  <Box sx={{ ml: 1, mt: 1 }}>
                                    <TextField
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      size="small"
                                      fullWidth
                                      multiline
                                      maxRows={3}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleUpdateComment();
                                        }
                                      }}
                                    />
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={handleUpdateComment}
                                        disabled={!editText.trim()}
                                        color="primary"
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={handleCancelEdit}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ ml: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {comment.content || comment.text || 'No content'}
                                    </Typography>
                                    
                                    {/* Debug Info - Remove after testing */}
                                    <Typography variant="caption" sx={{ color: "red", fontSize: "10px" }}>
                                      DEBUG: ID={comment.id}, Content="{comment.content}", User="{comment.user?.fname} {comment.user?.lname}"
                                    </Typography>
                                    
                                    {/* Comment Like Button */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleLikeComment(comment.id)}
                                        sx={{ 
                                          color: isCommentLiked(comment.id) ? 'red' : 'inherit',
                                          p: 0.5
                                        }}
                                      >
                                        {isCommentLiked(comment.id) ? (
                                          <FavoriteIcon fontSize="small" />
                                        ) : (
                                          <FavoriteBorderIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                                        {Math.max(0, getCommentLikeCount(comment.id))}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                              </Typography>
                            }
                          />
                          {comment.user?.id === user?.id && editingComment !== comment.id && (
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleEditComment(comment)}
                                size="small"
                                sx={{ mr: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteComment(comment.id)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      );
                    })}
                    
                    {/* Loading more comments */}
                    {reelComments[selectedReelId].loadingMore && (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </List>
                )}
              </>
            )}
          </Box>
          
          {/* Add Comment Input */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar src={user?.profileImage} alt={user?.fname} sx={{ width: 32, height: 32 }} />
              <TextField
                fullWidth
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => {
                  console.log("Comment input changed:", e.target.value);
                  setNewComment(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    console.log("Enter pressed, current comment:", newComment);
                    handleAddComment();
                  }
                }}
                variant="outlined"
                size="small"
                multiline
                maxRows={3}
              />
              <IconButton
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Reels;