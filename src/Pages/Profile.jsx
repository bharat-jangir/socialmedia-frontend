import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserProfileData,
  getUsersPosts,
  getUserReels,
  getSavedPosts,
} from "../state/Post/post.action";
import { followUser, unfollowUser, updateUserCoverImage } from "../state/Auth/authActions";
import { createChat } from "../state/Message/message.action";
import PostModal from "../components/PostModal";
import ReelModal from "../components/ReelModal";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Avatar, 
  Typography, 
  Button
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PlayArrow, Image, PhotoCamera } from "@mui/icons-material";
import ProfileModal from "../components/ProfileModal";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  console.log("Component mounted with ID:", id, "Type:", typeof id);

  // Redux States
  const userPosts = useSelector((state) => state.post.posts) || [];
  const userReels = useSelector((state) => state.post.userReels) || [];
  const savedPosts = useSelector((state) => state.post.savedPosts) || [];
  const currentUser = useSelector((state) => state.auth.user);
  const userProfile = useSelector((state) => state.post.userProfile) || currentUser;
  const postsCount = useSelector((state) => state.post.postsCount) || 0;
  const savedPostsCount = useSelector((state) => state.post.savedPostsCount) || 0;
  const reelsCount = useSelector((state) => state.post.reelsCount) || 0;
  const followersCount = useSelector((state) => state.post.followersCount) || 0;
  const followingCount = useSelector((state) => state.post.followingCount) || 0;

  // Local States
  const [value, setValue] = useState("post");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedReel, setSelectedReel] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState(0);
  const [isCoverImageLoading, setIsCoverImageLoading] = useState(false);
  const [coverImageError, setCoverImageError] = useState(null);
  const [localCoverImage, setLocalCoverImage] = useState(null);

  // Fetch data only on id change
  useEffect(() => {
    console.log("Profile ID:", id, "Type:", typeof id);
    if (id && id !== "undefined" && id.trim() !== "") {
      console.log("Dispatching API calls for ID:", id);
      dispatch(getUserProfileData(id));
      dispatch(getUsersPosts(id));
      dispatch(getUserReels({userId: id}));
    } else {
      console.log("ID is invalid, not dispatching API calls");
    }
  }, [id, dispatch]);

  // Fetch saved posts only when saved tab is selected and user is viewing their own profile
  useEffect(() => {
    if (value === "saved" && currentUser?.id == id && id && id !== "undefined" && id.trim() !== "") {
      dispatch(getSavedPosts(currentUser?.id));
    }
  }, [value, id, currentUser?.id, dispatch]);

  // Check if current user is following this profile user
  useEffect(() => {
    if (currentUser?.following && userProfile?.id) {
      const isCurrentlyFollowing = currentUser.following.includes(userProfile.id);
      setIsFollowing(isCurrentlyFollowing);
    }
  }, [currentUser?.following, userProfile?.id]);

  // Initialize local followers count
  useEffect(() => {
    setLocalFollowersCount(followersCount);
  }, [followersCount]);

  // Sync local cover image with user profile
  useEffect(() => {
    if (userProfile?.coverImage) {
      setLocalCoverImage(userProfile.coverImage);
    }
  }, [userProfile?.coverImage]);

  // Handlers
  const handlePostClick = (post) => {
    // Only handle posts (not reels) in Posts tab
    if(post.type === "reel"){
      handleReelClick(post);
      } else {
      setSelectedPost(post);
      setIsPostModalOpen(true);
    }
  };

  const handleReelClick = (reel) => {
    // Handle reels in Reels tab
    setSelectedReel(reel);
    setIsReelModalOpen(true);
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
  };

  const handleCloseReelModal = () => {
    setIsReelModalOpen(false);
    setSelectedReel(null);
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleFollowToggle = async () => {
    if (isFollowLoading || !userProfile?.id) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(userProfile.id));
        setIsFollowing(false);
        setLocalFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await dispatch(followUser(userProfile.id));
        setIsFollowing(true);
        setLocalFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessageClick = async () => {
    if (!userProfile?.id) return;
    
    try {
      const result = await dispatch(createChat({ userId: userProfile.id }));
      
      if (result.type.endsWith('fulfilled')) {
        const chatId = result.payload.id;
        navigate(`/message?chatId=${chatId}`);
      } else {
        console.error('Failed to create chat:', result.payload);
        navigate('/message');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      navigate('/message');
    }
  };

  const handleCoverImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setCoverImageError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCoverImageError('Image size should be less than 10MB');
      return;
    }

    setIsCoverImageLoading(true);
    setCoverImageError(null);

    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file, 'image');
      
      if (!imageUrl) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      // Update cover image via API
      const result = await dispatch(updateUserCoverImage(imageUrl));
      
      if (result.type.endsWith('fulfilled')) {
        console.log('Cover image updated successfully');
        // Immediately update local state for instant UI reflection
        setLocalCoverImage(imageUrl);
        // Clear any previous errors
        setCoverImageError(null);
        // Also refresh user profile data to ensure consistency
        if (currentUser?.id == id) {
          dispatch(getUserProfileData(id));
        }
      } else {
        throw new Error(result.payload || 'Failed to update cover image');
      }
    } catch (error) {
      console.error('Error updating cover image:', error);
      setCoverImageError(error.message || 'Failed to update cover image');
    } finally {
      setIsCoverImageLoading(false);
    }
  };

  // Get data for each tab
  const getPostsData = () => {
    return Array.isArray(userPosts) ? userPosts : [];
  };

  const getReelsData = () => {
    return Array.isArray(userReels) ? userReels : [];
  };

  const getSavedData = () => {
    console.log('Profile - getSavedData - savedPosts:', savedPosts);
    const data = Array.isArray(savedPosts) ? savedPosts : [];
    console.log('Profile - getSavedData - returning:', data);
    return data;
  };

  // Render media item
  const renderMediaItem = (item, index, clickHandler = handlePostClick) => (
    <Box
      key={item.id || index}
      className="aspect-square cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden relative"
      sx={{
        backgroundColor: theme.palette.background.default,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out'
        }
      }}
      onClick={() => clickHandler(item)}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.type === "reel" ? "Reel" : "Post"}
          className="w-full h-full object-cover"
        />
      ) : item.video ? (
        <video
          src={item.video}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        />
      ) : (
        <Box 
          className="w-full h-full flex items-center justify-center"
          sx={{ backgroundColor: theme.palette.background.default }}
        >
          <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
            No Media
          </Typography>
        </Box>
      )}
      
      {/* Type Icon */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {item.type === "post" ? (
          <Image sx={{ color: 'white', fontSize: 16 }} />
        ) : (
          <PlayArrow sx={{ color: 'white', fontSize: 16 }} />
        )}
      </Box>
    </Box>
  );

  // Render empty state
  const renderEmptyState = (message, description) => (
    <Box className="col-span-3 text-center py-20">
      <Typography variant="h6" sx={{ color: theme.palette.text.disabled }} gutterBottom>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
        {description}
      </Typography>
    </Box>
  );

  return (
    <Box 
      className="flex flex-col items-center min-h-screen dark-scrollbar"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      {/* Profile Header */}
      <Box 
        className="w-full max-w-4xl rounded-lg shadow-lg mb-6 overflow-hidden"
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {/* Cover Photo */}
        <Box 
          className="relative h-64"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.divider} 100%)`
          }}
        >
          <img 
            className="w-full h-full object-cover opacity-80" 
            src={localCoverImage || userProfile?.coverImage || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"} 
            alt="Cover" 
          />
          {/* Dark overlay for better contrast */}
          <Box 
            className="absolute inset-0"
            sx={{
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.3)' 
                : 'rgba(0, 0, 0, 0.1)'
            }}
          ></Box>
          
          {/* Cover Image Change Button - Only show for current user */}
          {currentUser?.id == id && (
            <Box className="absolute top-4 right-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                style={{ display: 'none' }}
                id="cover-image-input"
                disabled={isCoverImageLoading}
              />
              <label htmlFor="cover-image-input">
                <Button
                  variant="contained"
                  component="span"
                  disabled={isCoverImageLoading}
                  startIcon={<PhotoCamera />}
                  sx={{
                    borderRadius: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                    '&:disabled': {
                      backgroundColor: theme.palette.action.disabled,
                      color: theme.palette.text.disabled
                    }
                  }}
                >
                  {isCoverImageLoading ? 'Uploading...' : 'Change Cover'}
                </Button>
              </label>
            </Box>
          )}
          
          {/* Error Message */}
          {coverImageError && (
            <Box className="absolute top-16 right-4">
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.error.main,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 0, 0, 0.8)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  maxWidth: '200px'
                }}
              >
                {coverImageError}
              </Typography>
            </Box>
          )}
          {/* Profile Picture Overlay */}
          <Box className="absolute bottom-0 left-6 transform translate-y-1/2">
          <Avatar
              src={userProfile?.profileImage} 
              sx={{ 
                width: 140, 
                height: 140,
                border: `4px solid ${theme.palette.divider}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                fontSize: '3rem',
                bgcolor: theme.palette.background.paper,
                color: theme.palette.primary.main
              }} 
            >
              {userProfile?.fname?.charAt(0) || "U"}
            </Avatar>
          </Box>
          
          {/* Action Buttons */}
          <Box className="absolute bottom-4 right-6">
          {currentUser?.id == id ? (
            <Button
                variant="contained" 
                onClick={handleOpenEditModal}
                sx={{ 
                  borderRadius: '20px',
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': { backgroundColor: theme.palette.primary.dark }
                }}
            >
              Edit Profile
            </Button>
          ) : (
              <Box className="flex gap-2">
              <Button
                  variant="contained"
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  sx={{ 
                    borderRadius: '20px',
                    backgroundColor: isFollowing ? theme.palette.action.disabled : theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': { 
                      backgroundColor: isFollowing ? theme.palette.action.hover : theme.palette.primary.dark
                    },
                    '&:disabled': {
                      backgroundColor: theme.palette.action.disabled,
                      color: theme.palette.text.disabled
                    }
                  }}
                >
                  {isFollowLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
              </Button>
              <Button
                variant="contained"
                  onClick={handleMessageClick}
                  sx={{ 
                    borderRadius: '20px',
                    backgroundColor: theme.palette.success.main,
                    color: theme.palette.success.contrastText,
                    '&:hover': { 
                      backgroundColor: theme.palette.success.dark
                    }
                  }}
              >
                Message
              </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Profile Info Section */}
        <Box className="pt-16 px-6 pb-6">
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            {userProfile?.fname || "User"} {userProfile?.lname || ""}
          </Typography>
          
          {/* Stats Row */}
          <Box className="flex gap-8 mt-4">
            <Box className="text-center">
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                {postsCount}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Posts
              </Typography>
            </Box>
            <Box className="text-center">
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                {localFollowersCount}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Followers
              </Typography>
            </Box>
            <Box className="text-center">
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                {followingCount}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Following
              </Typography>
            </Box>
          </Box>
          
          {/* Bio Section */}
            {userProfile?.userBio && (
            <Box 
              className="mt-4 p-4 rounded-lg"
              sx={{ 
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                {userProfile.userBio}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box 
        className="w-full max-w-4xl rounded-lg shadow-lg"
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box 
          className="flex"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Button
            variant="text"
            onClick={() => setValue("post")}
            sx={{
              flex: 1,
              borderRadius: 0,
              borderBottom: value === "post" ? `3px solid ${theme.palette.primary.main}` : "none",
              color: value === "post" ? theme.palette.primary.main : theme.palette.text.secondary,
              textTransform: "none",
              fontWeight: value === "post" ? "bold" : "normal",
              py: 2,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            Posts
          </Button>
          <Button
            variant="text"
            onClick={() => setValue("reels")}
            sx={{
              flex: 1,
              borderRadius: 0,
              borderBottom: value === "reels" ? `3px solid ${theme.palette.primary.main}` : "none",
              color: value === "reels" ? theme.palette.primary.main : theme.palette.text.secondary,
              textTransform: "none",
              fontWeight: value === "reels" ? "bold" : "normal",
              py: 2,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            Reels
          </Button>
          {currentUser?.id == id && (
            <Button
              variant="text"
              onClick={() => setValue("saved")}
              sx={{
                flex: 1,
                borderRadius: 0,
                borderBottom: value === "saved" ? `3px solid ${theme.palette.primary.main}` : "none",
                color: value === "saved" ? theme.palette.primary.main : theme.palette.text.secondary,
                textTransform: "none",
                fontWeight: value === "saved" ? "bold" : "normal",
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }
              }}
            >
              Saved
            </Button>
          )}
        </Box>
          </Box>

      {/* Dark Theme Tab Content */}
      <Box className="w-full max-w-4xl mt-4">
        {value === "post" ? (
          <Box className="grid grid-cols-3 gap-1">
            {getPostsData().length > 0 ? (
              getPostsData().map((post, index) => renderMediaItem(post, index, handlePostClick))
            ) : (
              renderEmptyState(
                "No content available",
                "When you share photos and videos, they'll appear here."
              )
            )}
          </Box>
            ) : value === "reels" ? (
          <Box className="grid grid-cols-3 gap-1">
            {getReelsData().length > 0 ? (
              getReelsData().map((reel, index) => renderMediaItem(reel, index, handleReelClick))
            ) : (
              renderEmptyState(
                "No reels available",
                "When you create reels, they'll appear here."
              )
            )}
          </Box>
            ) : value === "saved" ? (
          <Box className="grid grid-cols-3 gap-1">
            {(() => {
              const savedData = getSavedData();
              console.log('Profile - Saved tab rendering - savedData:', savedData);
              console.log('Profile - Saved tab rendering - savedData.length:', savedData.length);
              
              return savedData.length > 0 ? (
                savedData.map((post, index) => renderMediaItem(post, index, handlePostClick))
              ) : (
                renderEmptyState(
                  "No saved content available",
                  "Posts and reels you save will appear here."
                )
              );
            })()}
          </Box>
        ) : null}
      </Box>

      {/* Post Modal */}
      {isPostModalOpen && (
        <PostModal
          post={selectedPost}
          open={isPostModalOpen}
          onClose={handleClosePostModal}
        />
      )}

      {/* Reel Modal */}
      {isReelModalOpen && (
        <ReelModal
          reel={selectedReel}
          open={isReelModalOpen}
          onClose={handleCloseReelModal}
        />
      )}

      {/* Edit Profile Modal */}
      <ProfileModal 
        open={isEditModalOpen} 
        handleClose={handleCloseEditModal} 
      />
    </Box>
  );
};

export default UserProfile;