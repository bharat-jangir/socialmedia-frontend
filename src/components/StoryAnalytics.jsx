import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  Reply as ReplyIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getStoryAnalytics } from '../state/Post/story.action';

const StoryAnalytics = ({ storyId }) => {
  const dispatch = useDispatch();
  const { storyAnalytics, loading } = useSelector((state) => state.story);
  const analytics = storyAnalytics[storyId];

  useEffect(() => {
    if (storyId && !analytics) {
      dispatch(getStoryAnalytics(storyId));
    }
  }, [storyId, analytics, dispatch]);

  if (loading || !analytics) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AnalyticsIcon sx={{ color: '#1976d2' }} />
            <Typography variant="h6">Story Analytics</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Loading analytics...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { views = 0, likes = 0, replies = 0 } = analytics.data || {};

  return (
    <Card sx={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AnalyticsIcon sx={{ color: '#1976d2' }} />
          <Typography variant="h6">Story Analytics</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Tooltip title="Total Views">
                <IconButton sx={{ color: '#1976d2' }}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                {views}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Views
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Tooltip title="Total Likes">
                <IconButton sx={{ color: '#ff3040' }}>
                  <FavoriteIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" sx={{ color: '#ff3040' }}>
                {likes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Likes
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Tooltip title="Total Replies">
                <IconButton sx={{ color: '#4caf50' }}>
                  <ReplyIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" sx={{ color: '#4caf50' }}>
                {replies}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Replies
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Engagement Rate */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip
            label={`${views > 0 ? ((likes + replies) / views * 100).toFixed(1) : 0}% Engagement`}
            color="primary"
            variant="outlined"
            sx={{ 
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderColor: '#1976d2',
              color: '#1976d2'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StoryAnalytics;
