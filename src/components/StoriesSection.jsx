import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getFollowingStories } from '../state/Post/story.action';
import { openCreateStoryModal } from '../state/Post/storySlice';
import StoryCircle from './StoryCircle';
import { useTheme } from '@mui/material/styles';

const StoriesSection = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { 
    followingStories, 
    followingStoriesLoading, 
    followingStoriesHasMore,
    followingStoriesPage 
  } = useSelector((state) => state.story);

  const { user: currentUser } = useSelector((state) => state.auth);
  const [storiesLoaded, setStoriesLoaded] = useState(false);
  const scrollContainerRef = useRef(null);
  const lastStoryRef = useRef(null);

  // Load initial following stories
  useEffect(() => {
    if (!storiesLoaded) {
      dispatch(getFollowingStories({ page: 0, size: 10 }));
      setStoriesLoaded(true);
    }
  }, [dispatch, storiesLoaded]);

  // Intersection Observer for infinite scroll
  const lastStoryObserver = useCallback((node) => {
    if (followingStoriesLoading) return;
    if (lastStoryRef.current) lastStoryRef.current.disconnect();
    
    lastStoryRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && followingStoriesHasMore) {
        dispatch(getFollowingStories({ 
          page: followingStoriesPage + 1, 
          size: 10 
        }));
      }
    });
    
    if (node) lastStoryRef.current.observe(node);
  }, [followingStoriesLoading, followingStoriesHasMore, followingStoriesPage, dispatch]);

  const handleCreateStory = () => {
    console.log('handleCreateStory called - opening create story modal');
    console.log('Current Redux state before dispatch:', { createStoryModalOpen: false });
    dispatch(openCreateStoryModal());
    console.log('openCreateStoryModal dispatched');
  };

  if (followingStoriesLoading && !storiesLoaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
        <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
          Loading stories...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        p: 2,
        px: 4,
        overflowX: 'auto',
        border: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
        boxShadow: theme.shadows[2],
        transition: 'all 0.3s ease',
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: '120px',
        '&::-webkit-scrollbar': {
          height: 4,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.background.default,
          borderRadius: 2,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.divider,
          borderRadius: 2,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          minWidth: 'max-content',
          pb: 1,
          alignItems: 'center',
        }}
      >
        {/* Your Story (Create Story) */}
        <StoryCircle
          user={currentUser}
          isOwnStory={true}
          onClick={handleCreateStory}
        />

        {/* Following Users' Stories - Sorted by hasUnviewedStories */}
        {(followingStories || [])
          .sort((a, b) => {
            // Unviewed stories first (hasUnviewedStories: true)
            if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1;
            if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1;
            return 0;
          })
          .map((userStory, index) => {
            const isLastStory = index === (followingStories || []).length - 1;
            return (
            <div
              key={userStory.user.id}
              ref={isLastStory ? lastStoryObserver : null}
            >
              <StoryCircle
                user={userStory.user}
                hasStories={userStory.stories.length > 0}
                hasUnviewedStories={userStory.hasUnviewedStories}
                stories={userStory.stories}
              />
            </div>
            );
          })}

        {/* Loading indicator for infinite scroll */}
        {followingStoriesLoading && (followingStories || []).length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '80px',
              height: '80px',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Empty State */}
        {(followingStories || []).length === 0 && !followingStoriesLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '200px',
              height: '80px',
              color: '#666',
            }}
          >
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
              No stories to show.<br />
              Follow more people to see their stories!
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StoriesSection;
