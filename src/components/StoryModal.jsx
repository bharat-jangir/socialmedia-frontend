import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Avatar,
  TextField,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  closeStoryModal,
  nextStory,
  previousStory,
  setSelectedStoryIndex,
  markStoryAsViewed,
} from '../state/Post/storySlice';
import {
  viewStory,
  likeStory,
  unlikeStory,
  replyToStory,
  deleteStory,
} from '../state/Post/story.action';

const StoryModal = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const {
    storyModalOpen,
    selectedUserStories,
    selectedStoryIndex,
    userStories,
  } = useSelector((state) => state.story);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [currentStory, setCurrentStory] = useState(null);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  
  const progressRef = useRef(null);
  const intervalRef = useRef(null);

  // Get current story
  useEffect(() => {
    if (selectedUserStories.length > 0 && selectedStoryIndex < selectedUserStories.length) {
      const story = selectedUserStories[selectedStoryIndex];
      setCurrentStory(story);
      // Use isLiked field from API response
      setIsLiked(story.isLiked || false);
      setIsViewed(story.isViewed || false);
    }
  }, [selectedUserStories, selectedStoryIndex, currentUser?.id]);

  // Find first unviewed story index when modal opens
  useEffect(() => {
    if (storyModalOpen && selectedUserStories.length > 0) {
      const firstUnviewedIndex = selectedUserStories.findIndex(story => !story.isViewed);
      if (firstUnviewedIndex !== -1 && firstUnviewedIndex !== selectedStoryIndex) {
        // Dispatch action to change to first unviewed story
        dispatch(setSelectedStoryIndex(firstUnviewedIndex));
      }
    }
  }, [storyModalOpen, selectedUserStories, selectedStoryIndex, dispatch]);

  // Auto progress and view tracking
  useEffect(() => {
    if (currentStory && storyModalOpen) {
      // Mark as viewed if not already viewed
      if (!isViewed && currentUser?.id !== currentStory.user?.id) {
        dispatch(viewStory(currentStory.id));
        dispatch(markStoryAsViewed({ storyId: currentStory.id }));
        setIsViewed(true);
      }

      // Start progress
      setProgress(0);
      const duration = 5000; // 5 seconds
      const interval = 50; // Update every 50ms
      const increment = (interval / duration) * 100;

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Auto advance to next story
            if (selectedStoryIndex < selectedUserStories.length - 1) {
              dispatch(nextStory());
            } else {
              // Close modal if last story
              dispatch(closeStoryModal());
            }
            return 0;
          }
          return prev + increment;
        });
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [currentStory, storyModalOpen, selectedStoryIndex, selectedUserStories.length, isViewed, currentUser?.id, dispatch]);

  const handleClose = () => {
    dispatch(closeStoryModal());
    setProgress(0);
    setReplyText('');
    setShowReplyInput(false);
  };

  const handleNext = () => {
    if (selectedStoryIndex < selectedUserStories.length - 1) {
      dispatch(nextStory());
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (selectedStoryIndex > 0) {
      dispatch(previousStory());
    }
  };

  const handleLike = () => {
    if (currentStory) {
      if (isLiked) {
        dispatch(unlikeStory(currentStory.id));
        setIsLiked(false);
      } else {
        dispatch(likeStory(currentStory.id));
        setIsLiked(true);
      }
    }
  };

  const handleReply = async () => {
    if (replyText.trim() && currentStory) {
      try {
        await dispatch(replyToStory({
          storyId: currentStory.id,
          replyText: replyText.trim(),
        }));
        setReplyText('');
        setShowReplyInput(false);
      } catch (error) {
        console.error('Error replying to story:', error);
      }
    }
  };

  const handleDelete = () => {
    if (currentStory && currentUser?.id === currentStory.user?.id) {
      if (window.confirm('Are you sure you want to delete this story?')) {
        dispatch(deleteStory(currentStory.id));
        handleClose();
      }
    }
  };

  const handleShare = () => {
    if (currentStory) {
      if (navigator.share) {
        navigator.share({
          title: `Story by ${currentStory.user?.fname} ${currentStory.user?.lname}`,
          text: currentStory.caption || 'Check out this story!',
          url: window.location.href,
        }).catch(console.error);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Link copied to clipboard!');
        }).catch(console.error);
      }
    }
  };

  if (!storyModalOpen || !currentStory) {
    return null;
  }

  return (
    <Dialog
      open={storyModalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          borderRadius: 3,
          maxHeight: '90vh',
          width: '90vw',
          maxWidth: '400px',
          height: '700px',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER SECTION */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(26, 26, 46, 0.9)' 
              : 'rgba(248, 250, 252, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Progress Bars */}
          <Box sx={{ 
            display: 'flex',
            gap: 0.5,
            p: 1.5
          }}>
            {selectedUserStories.map((story, index) => (
              <Box
                key={story.id}
                sx={{
                  flex: 1,
                  height: 3,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Progress for current story */}
                {index === selectedStoryIndex && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1.5,
                      transition: 'width 0.1s linear',
                    }}
                  />
                )}
                {/* Completed stories */}
                {index < selectedStoryIndex && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '100%',
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1.5,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Header Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              pb: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={currentStory.user?.profileImage}
                alt={currentStory.user?.fname}
                sx={{ 
                  width: 36, 
                  height: 36, 
                  border: `2px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[2],
                }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  color: theme.palette.text.primary, 
                  fontWeight: 600 
                }}>
                  {currentStory.user?.fname} {currentStory.user?.lname}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary 
                }}>
                  {new Date(currentStory.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentUser?.id === currentStory.user?.id && (
                <IconButton 
                  onClick={handleDelete} 
                  sx={{ 
                    color: theme.palette.text.primary,
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
              <IconButton 
                onClick={handleClose} 
                sx={{ 
                  color: theme.palette.text.primary,
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* MAIN CONTENT SECTION */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: theme.palette.background.default,
            overflow: 'hidden',
          }}
        >
          {/* Story Media Container */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundColor: theme.palette.background.paper, // Subtle background for better contrast
            }}
          >
            {currentStory.storyType === 'IMAGE' ? (
              <img
                src={currentStory.imageUrl}
                alt="Story"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
              />
            ) : (
              <video
                src={currentStory.videoUrl}
                autoPlay
                muted
                loop
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
              />
            )}
          </Box>

          {/* Navigation Areas */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pl: 2,
              zIndex: 1,
            }}
            onClick={handlePrevious}
          >
            {selectedStoryIndex > 0 && (
              <IconButton 
                sx={{ 
                  color: theme.palette.text.primary, 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 0, 0, 0.3)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(5px)',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
            )}
          </Box>

          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pr: 2,
              zIndex: 1,
            }}
            onClick={handleNext}
          >
            {selectedStoryIndex < selectedUserStories.length - 1 && (
              <IconButton 
                sx={{ 
                  color: theme.palette.text.primary, 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 0, 0, 0.3)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(5px)',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <NavigateNextIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* FOOTER SECTION */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(26, 26, 46, 0.9)' 
              : 'rgba(248, 250, 252, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2,
          }}
        >
          {/* Caption */}
          {currentStory.caption && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                mb: 2,
                lineHeight: 1.4,
                fontSize: '0.9rem',
              }}
            >
              {currentStory.caption}
            </Typography>
          )}

          {/* Reply Input */}
          {showReplyInput && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Send a message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleReply();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 2,
                    '& fieldset': { border: `1px solid ${theme.palette.divider}` },
                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleReply}
                disabled={!replyText.trim()}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                  '&:disabled': { backgroundColor: theme.palette.action.disabled },
                  minWidth: '80px',
                }}
              >
                Send
              </Button>
            </Box>
          )}

          {/* Action Buttons Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left Side - Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Like Button - Only show for other users' stories */}
              {currentStory && currentStory.user?.id !== currentUser?.id && (
                <IconButton
                  onClick={handleLike}
                  sx={{ 
                    color: isLiked ? '#ff3040' : theme.palette.text.primary,
                    backgroundColor: theme.palette.action.hover,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease',
                    width: 44,
                    height: 44,
                  }}
                >
                  {isLiked ? (
                    <FavoriteIcon sx={{ fontSize: 24 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 24 }} />
                  )}
                </IconButton>
              )}
              
              {/* Reply Button - Only show for other users' stories */}
              {currentStory && currentStory.user?.id !== currentUser?.id && (
                <IconButton
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  sx={{ 
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.action.hover,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease',
                    width: 44,
                    height: 44,
                  }}
                >
                  <ReplyIcon sx={{ fontSize: 24 }} />
                </IconButton>
              )}

              {/* Share Button */}
              <IconButton
                onClick={handleShare}
                sx={{ 
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected,
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease',
                  width: 44,
                  height: 44,
                }}
              >
                <ShareIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Box>

            {/* Right Side - Story Stats */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentStory.totalViews > 0 && (
                <Chip
                  label={`${currentStory.totalViews} views`}
                  size="small"
                  sx={{ 
                    backgroundColor: theme.palette.action.hover, 
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
              {currentStory.totalLikes > 0 && (
                <Chip
                  label={`${currentStory.totalLikes} likes`}
                  size="small"
                  sx={{ 
                    backgroundColor: theme.palette.action.hover, 
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
              {currentStory.totalReplies > 0 && (
                <Chip
                  label={`${currentStory.totalReplies} replies`}
                  size="small"
                  sx={{ 
                    backgroundColor: theme.palette.action.hover, 
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default StoryModal;
