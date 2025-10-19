import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Grid,
  Paper,
  Divider,
  Badge,
} from '@mui/material';
import {
  Favorite,
  Share,
  Comment,
  Bookmark,
  MoreVert,
  Add,
  Search,
  Notifications,
  Home,
  Person,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ThemePreview = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ 
          fontWeight: 700, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}>
          SoulConnect Theme
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          A unique social media theme that embodies connection, creativity, and positivity
        </Typography>
        
        {/* Color Palette */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h6">Coral Rose</Typography>
              <Typography variant="body2">#FF6B6B</Typography>
              <Typography variant="caption">Warmth & Connection</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
              <Typography variant="h6">Sky Blue</Typography>
              <Typography variant="body2">#4ECDC4</Typography>
              <Typography variant="caption">Trust & Communication</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'accent.main', color: 'white' }}>
              <Typography variant="h6">Lavender</Typography>
              <Typography variant="body2">#A8E6CF</Typography>
              <Typography variant="caption">Creativity & Inspiration</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
              <Typography variant="h6">Warm Beige</Typography>
              <Typography variant="body2">#FFEAA7</Typography>
              <Typography variant="caption">Comfort & Positivity</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Navigation Bar Preview */}
      <Card sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              SoulConnect
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small">
                <Search />
              </IconButton>
              <IconButton size="small">
                <Notifications />
              </IconButton>
              <IconButton size="small">
                <Person />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Social Media Post Preview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Post Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Person />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Sarah Johnson
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 hours ago
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>

              {/* Post Content */}
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                Just had an amazing day exploring the city! The SoulConnect theme really brings out the warmth in every interaction. 🌟
              </Typography>

              {/* Post Image Placeholder */}
              <Box sx={{ 
                height: 200, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.secondary.light}20 100%)`
              }}>
                <Typography variant="body2" color="text.secondary">
                  Beautiful cityscape photo
                </Typography>
              </Box>

              {/* Post Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button startIcon={<Favorite />} size="small" sx={{ color: 'text.secondary' }}>
                  24
                </Button>
                <Button startIcon={<Comment />} size="small" sx={{ color: 'text.secondary' }}>
                  8
                </Button>
                <Button startIcon={<Share />} size="small" sx={{ color: 'text.secondary' }}>
                  Share
                </Button>
                <Box sx={{ flex: 1 }} />
                <IconButton size="small">
                  <Bookmark />
                </IconButton>
              </Box>
            </CardContent>
          </Card>

          {/* Story Circle Preview */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Stories
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box key={item} sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            border: '2px solid',
                            borderColor: 'background.paper'
                          }}
                        />
                      }
                    >
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          border: '3px solid',
                          borderColor: item === 1 ? 'primary.main' : 'divider',
                          bgcolor: item === 1 ? 'primary.light' : 'grey.300'
                        }}
                      >
                        <Person />
                      </Avatar>
                    </Badge>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      User {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Preview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Trending
              </Typography>
              {[1, 2, 3].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`#trending${item}`}
                    size="small"
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item * 1000} posts
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    }
                  }}
                >
                  Create Post
                </Button>
                <Button variant="outlined" startIcon={<Home />}>
                  Home
                </Button>
                <Button variant="outlined" startIcon={<Person />}>
                  Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Design Philosophy */}
      <Card sx={{ mt: 4, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Design Philosophy
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            The SoulConnect theme is designed to foster authentic human connections through warm, inviting colors that evoke feelings of trust, creativity, and positivity. The coral rose primary color represents warmth and emotional connection, while the sky blue secondary color promotes trust and clear communication.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
            The lavender accent color encourages creativity and inspiration, while the warm beige provides comfort and approachability. This carefully crafted palette creates a sophisticated yet welcoming environment that encourages users to share, connect, and express themselves authentically.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ThemePreview;
