import React, { useState, useEffect } from 'react';
import { Avatar, Box, Typography, Badge } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { openStoryModal } from '../state/Post/storySlice';
import { getUserStories } from '../state/Post/story.action';
import { useTheme } from '@mui/material/styles';

const StoryCircle = ({ user, hasStories = false, isOwnStory = false, hasUnviewedStories = false, onClick, stories: passedStories = [] }) => {
  const dispatch = useDispatch();
  const { userStories } = useSelector((state) => state.story);
  const [stories, setStories] = useState([]);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Use passed stories if available, otherwise get from Redux
  useEffect(() => {
    if (passedStories && passedStories.length > 0) {
      setStories(passedStories);
    } else if (user?.id && userStories[user.id]) {
      setStories(userStories[user.id]);
    } else if (user?.id && !userStories[user.id]) {
      setLoading(true);
      dispatch(getUserStories(user.id))
        .finally(() => setLoading(false));
    }
  }, [user?.id, dispatch, userStories, passedStories]);

  // Update local stories when Redux state changes (fallback)
  useEffect(() => {
    if (user?.id && userStories[user.id] && (!passedStories || passedStories.length === 0)) {
      setStories(userStories[user.id]);
    }
  }, [user?.id, userStories, passedStories]);

  const handleClick = () => {
    console.log('StoryCircle clicked - isOwnStory:', isOwnStory, 'stories.length:', stories.length);
    console.log('Stories array:', stories);
    if (isOwnStory) {
      console.log('Opening create story modal for own story');
      console.log('onClick function:', onClick);
      // Always open create story modal for own story
      if (onClick) {
        onClick();
        console.log('onClick called successfully');
      } else {
        console.log('onClick is undefined!');
      }
    } else if (stories.length > 0) {
      console.log('Opening story modal for existing stories');
      console.log('Passing stories to modal:', stories);
      dispatch(openStoryModal({ 
        userStories: stories, 
        initialIndex: 0 
      }));
    }
  };

  const handleDoubleClick = () => {
    console.log('StoryCircle double clicked - isOwnStory:', isOwnStory, 'stories.length:', stories.length);
    if (isOwnStory && stories.length > 0) {
      console.log('Opening story modal for own existing stories');
      dispatch(openStoryModal({ 
        userStories: stories, 
        initialIndex: 0 
      }));
    }
  };

  // Check if user has any unviewed stories using isViewed field
  const hasUnviewedStoriesLocal = hasUnviewedStories || stories.some(story => !story.isViewed);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        minWidth: '70px',
        maxWidth: '70px',
        flexShrink: 0,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          hasStories || stories.length > 0 ? (
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: hasUnviewedStoriesLocal 
                  ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                  : '#e0e0e0',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isOwnStory ? (
                <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  +
                </Typography>
              ) : (
                <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                  {stories.length}
                </Typography>
              )}
            </Box>
          ) : null
        }
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: hasUnviewedStoriesLocal 
              ? `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 25%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.dark} 75%, ${theme.palette.primary.main} 100%)`
              : theme.palette.divider,
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Avatar
              src={user?.profileImage}
              alt={user?.fname}
              sx={{
                width: 54,
                height: 54,
                border: 'none',
                background: 'transparent',
              }}
            />
          </Box>
        </Box>
      </Badge>
      
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          textAlign: 'center',
          fontSize: '10px',
          color: theme.palette.text.secondary,
          maxWidth: '70px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {isOwnStory ? 'Your Story' : user?.fname || 'User'}
      </Typography>
    </Box>
  );
};

export default StoryCircle;