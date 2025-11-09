import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserProfileData,
  getUsersPosts,
  getUserReels,
  getSavedPosts,
} from "../state/Post/post.action";
import { followUser, unfollowUser, updateUserCoverImage, getUserProfile } from "../state/Auth/authActions";
import { createChat } from "../state/Message/message.action";
import { getAllChats } from "../state/Message/message.action";
import PostModal from "../components/PostModal";
import ReelModal from "../components/ReelModal";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Avatar, 
  Typography, 
  Button,
  CircularProgress
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PlayArrow, Image, PhotoCamera } from "@mui/icons-material";
import ProfileModal from "../components/ProfileModal";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import ProfileSkeleton from "../components/ProfileSkeleton";

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
  const profileLoading = useSelector((state) => state.post.loading);
  const userProfileFromRedux = useSelector((state) => state.post.userProfile);
  const existingChats = useSelector((state) => state.message.chats) || [];
  
  // Track loading states for posts and reels separately
  const [postsLoading, setPostsLoading] = useState(false);
  const [reelsLoading, setReelsLoading] = useState(false);
  
  // Only use userProfile if it matches the requested ID OR if we're viewing our own profile
  // Otherwise, use null to show loading state
  const isViewingOwnProfile = currentUser?.id?.toString() === id?.toString();
  
  // Determine which profile to use - IMPORTANT: Always verify the profile matches the requested ID
  let userProfile = null;
  const profileIdMatches = userProfileFromRedux?.id?.toString() === id?.toString();
  
  if (isViewingOwnProfile) {
    // If viewing own profile:
    // 1. Always prefer userProfileFromRedux if it matches (has posts/reels counts)
    // 2. Fall back to currentUser only if Redux doesn't have the data yet
    if (profileIdMatches && userProfileFromRedux) {
      userProfile = userProfileFromRedux;
      // Merge currentUser profile image to ensure we have the latest image
      // This ensures instant updates when profile image is changed
      if (currentUser?.profileImage) {
        userProfile = { ...userProfile, profileImage: currentUser.profileImage };
      }
    } else if (userProfileFromRedux && !profileIdMatches) {
      // Redux has stale data for different user - wait for new data to load
      // Don't use currentUser here as it doesn't have posts/reels counts
      userProfile = null; // Will show skeleton until data loads
    } else {
      // No Redux data yet, use currentUser as fallback for basic info
      // But this should only happen briefly during initial load
      userProfile = currentUser;
    }
  } else {
    // If viewing another user's profile, ONLY use Redux data if it matches the requested ID
    if (profileIdMatches && userProfileFromRedux) {
      userProfile = userProfileFromRedux;
    }
    // Otherwise userProfile stays null (will show skeleton)
  }

  // Helper function to add cache-busting to image URLs
  const getImageUrlWithCacheBust = (imageUrl) => {
    if (!imageUrl) return null;
    // If URL already has query parameters, append timestamp
    // Otherwise, add it
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };

  // Get the most up-to-date profile image
  const getProfileImageUrl = () => {
    if (isViewingOwnProfile && currentUser?.profileImage) {
      // When viewing own profile, prioritize currentUser profile image for instant updates
      return currentUser.profileImage;
    }
    return userProfile?.profileImage;
  };
  
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
  const lastFetchedIdRef = React.useRef(null);
  const isFetchingRef = React.useRef(false);
  const initialLoadRef = React.useRef(true); // Track if this is the initial load for this profile

  // Fetch data only on id change - prevent multiple calls
  useEffect(() => {
    console.log("Profile ID:", id, "Type:", typeof id);
    console.log("Current Redux userProfile:", userProfileFromRedux?.id, "Requested ID:", id);
    
    // Cleanup function to reset fetching state if ID changes before fetch completes
    let isMounted = true;
    
    if (!id || id === "undefined" || id.trim() === "") {
      console.log("ID is invalid, not dispatching API calls");
      lastFetchedIdRef.current = null;
      isFetchingRef.current = false;
      return;
    }
    
    const idString = id.toString();
    
    // Check if Redux profile matches the requested ID
    const reduxProfileMatches = userProfileFromRedux?.id?.toString() === idString;
    
    // If Redux has data for a different user, force fetch (clear the ref)
    if (userProfileFromRedux && !reduxProfileMatches) {
      console.log("Redux has stale data for different user, forcing fetch for:", idString);
      lastFetchedIdRef.current = null; // Force fetch by clearing the ref
      initialLoadRef.current = true; // Treat as initial load when switching users
    }
    
    // Prevent duplicate calls for the same ID
    if (lastFetchedIdRef.current === idString && reduxProfileMatches) {
      console.log("Already fetched this profile and data matches, skipping...");
      initialLoadRef.current = false; // Not initial load anymore
      return;
    }
    
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping...");
      return;
    }
    
    // Mark as fetching and update last fetched ID
    const isInitialLoad = initialLoadRef.current || !reduxProfileMatches;
    console.log("Dispatching API calls for ID:", id, "Initial load:", isInitialLoad);
    if (!isInitialLoad) {
      console.log("Updating existing profile data, will not show skeleton");
    }
    isFetchingRef.current = true;
    lastFetchedIdRef.current = idString;
    
    // Set loading states for posts and reels
    setPostsLoading(true);
    setReelsLoading(true);
    
    // Fetch all data in parallel - these will replace Redux state
    // getUserProfileData sets posts, userReels, and userProfile
    // getUsersPosts and getUserReels are called separately to ensure fresh data
    Promise.all([
      dispatch(getUserProfileData(id)),
      dispatch(getUsersPosts(id)),
      dispatch(getUserReels({userId: id, page: 0})) // Always start from page 0 when switching profiles
    ]).finally(() => {
      // Only reset fetching state if component is still mounted and ID hasn't changed
      if (isMounted && lastFetchedIdRef.current === idString) {
        isFetchingRef.current = false;
        initialLoadRef.current = false; // Initial load complete
      }
      // Always reset loading states after a delay to prevent stuck loader
      setTimeout(() => {
        if (isMounted && lastFetchedIdRef.current === idString) {
          setPostsLoading(false);
          setReelsLoading(false);
        }
      }, 100);
    });
    
    // Cleanup: reset fetching state if component unmounts or ID changes
    return () => {
      isMounted = false;
      // Only reset if the ID actually changed (not just unmount)
      if (lastFetchedIdRef.current !== idString) {
        isFetchingRef.current = false;
      }
    };
  }, [id, dispatch, userProfileFromRedux?.id]);

  // Reset loading states when data arrives in Redux or loading completes
  useEffect(() => {
    const currentIdString = id?.toString();
    const isCurrentProfile = lastFetchedIdRef.current === currentIdString;
    
    // Reset posts loading when:
    // 1. Not loading AND we have posts data (even if empty array is fine - means API responded)
    // 2. OR loading is false and we're on the current profile
    if (isCurrentProfile) {
      // Check if posts have loaded (even if empty)
      const postsHaveLoaded = Array.isArray(userPosts) && !profileLoading;
      // Check if reels have loaded (even if empty)
      const reelsHaveLoaded = Array.isArray(userReels) && !profileLoading;
      
      if (postsHaveLoaded) {
        console.log("Posts have loaded, resetting posts loading state", { postsCount: userPosts.length });
        setPostsLoading(false);
      }
      
      if (reelsHaveLoaded) {
        console.log("Reels have loaded, resetting reels loading state", { reelsCount: userReels.length });
        setReelsLoading(false);
      }
    }
  }, [profileLoading, id, userPosts, userReels]);
  
  // Reset loading states when profile ID changes (switching profiles)
  useEffect(() => {
    return () => {
      // Reset loading when component unmounts or ID changes
      setPostsLoading(false);
      setReelsLoading(false);
    };
  }, [id]);
  
  // Fallback: Reset loading states after 5 seconds to prevent infinite loader
  useEffect(() => {
    if (postsLoading || reelsLoading) {
      const timeoutId = setTimeout(() => {
        console.log("Loading timeout reached, resetting loading states");
        setPostsLoading(false);
        setReelsLoading(false);
      }, 5000); // 5 second fallback
      
      return () => clearTimeout(timeoutId);
    }
  }, [postsLoading, reelsLoading]);

  // Fetch saved posts only when saved tab is selected and user is viewing their own profile
  useEffect(() => {
    if (value === "saved" && currentUser?.id == id && id && id !== "undefined" && id.trim() !== "") {
      dispatch(getSavedPosts(currentUser?.id));
    }
  }, [value, id, currentUser?.id, dispatch]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (modalOpenTimeoutRef.current) {
        clearTimeout(modalOpenTimeoutRef.current);
      }
    };
  }, []);

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

  // Listen for profile image update events (only refresh profile image, not all data)
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      // If viewing own profile, just refresh the current user profile
      // Don't refresh all profile data as it might interfere with posts/reels
      if (isViewingOwnProfile && currentUser?.id?.toString() === id?.toString()) {
        // Only refresh auth user profile to update the image
        const token = localStorage.getItem("token");
        if (token) {
          dispatch(getUserProfile(token));
        }
        // Note: We don't call getUserProfileData here because it might clear posts/reels
        // The profile image will be updated via currentUser from auth state
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, [id, isViewingOwnProfile, currentUser?.id, dispatch]);

  // Track last clicked item to prevent duplicate opens
  const lastClickedItemRef = useRef(null);
  const isOpeningModalRef = useRef(false);
  const modalOpenTimeoutRef = useRef(null);
  
  // Handle reel click - defined first to avoid dependency issues
  const handleReelClick = useCallback((reel) => {
    // Prevent rapid clicks
    if (isOpeningModalRef.current) {
      console.log("Modal already opening, ignoring click");
      return;
    }
    
    // Prevent duplicate clicks on the same reel
    const reelId = reel?.id?.toString();
    if (lastClickedItemRef.current === reelId && isReelModalOpen) {
      console.log("Reel modal already open for this reel, ignoring click");
      return;
    }
    
    // Clear any existing timeout
    if (modalOpenTimeoutRef.current) {
      clearTimeout(modalOpenTimeoutRef.current);
    }
    
    // Handle reels in Reels tab
    isOpeningModalRef.current = true;
    lastClickedItemRef.current = reelId;
    setSelectedReel(reel);
    setIsReelModalOpen(true);
    
    // Reset flag after a short delay
    modalOpenTimeoutRef.current = setTimeout(() => {
      isOpeningModalRef.current = false;
      modalOpenTimeoutRef.current = null;
    }, 300);
  }, [isReelModalOpen]);
  
  // Handlers with debounce and duplicate prevention
  const handlePostClick = useCallback((post) => {
    // Prevent rapid clicks
    if (isOpeningModalRef.current) {
      console.log("Modal already opening, ignoring click");
      return;
    }
    
    // Only handle posts (not reels) in Posts tab
    if(post.type === "reel"){
      handleReelClick(post);
      return;
    }
    
    // Prevent duplicate clicks on the same post
    const postId = post?.id?.toString();
    if (lastClickedItemRef.current === postId && isPostModalOpen) {
      console.log("Post modal already open for this post, ignoring click");
      return;
    }
    
    // Clear any existing timeout
    if (modalOpenTimeoutRef.current) {
      clearTimeout(modalOpenTimeoutRef.current);
    }
    
    isOpeningModalRef.current = true;
    lastClickedItemRef.current = postId;
    setSelectedPost(post);
    setIsPostModalOpen(true);
    
    // Reset flag after a short delay
    modalOpenTimeoutRef.current = setTimeout(() => {
      isOpeningModalRef.current = false;
      modalOpenTimeoutRef.current = null;
    }, 300);
  }, [isPostModalOpen, handleReelClick]);

  const handleClosePostModal = useCallback(() => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
    lastClickedItemRef.current = null;
    isOpeningModalRef.current = false;
  }, []);

  const handleCloseReelModal = useCallback(() => {
    setIsReelModalOpen(false);
    setSelectedReel(null);
    lastClickedItemRef.current = null;
    isOpeningModalRef.current = false;
  }, []);

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
    if (!userProfile?.id || !currentUser?.id) return;
    
    // First, check if a chat with this user already exists
    const existingChat = existingChats.find(chat => {
      if (!chat.users || chat.users.length !== 2) return false;
      const userIds = chat.users.map(u => u.id?.toString() || u.id);
      const targetUserId = userProfile.id?.toString();
      const currentUserIdStr = currentUser.id?.toString();
      return userIds.includes(targetUserId) && userIds.includes(currentUserIdStr);
    });
    
    if (existingChat) {
      // Chat already exists, navigate to it directly
      const chatId = existingChat.id?.toString() || existingChat.id;
      navigate(`/message?chatId=${chatId}`);
      return;
    }
    
    // No existing chat found, create a new one
    // Backend will also check and return existing chat if found
    try {
      const result = await dispatch(createChat({ userId: userProfile.id }));
      
      if (result.type.endsWith('fulfilled')) {
        const chatId = result.payload.id?.toString() || result.payload.id;
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
        // Refresh current user profile to update cover image in auth state
        // Don't refresh getUserProfileData as it might interfere with posts/reels display
        if (currentUser?.id == id) {
          const token = localStorage.getItem("token");
          if (token) {
            dispatch(getUserProfile(token));
          }
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

  // Get data for each tab - Filter by user ID to ensure only current profile's data is shown
  const getPostsData = useMemo(() => {
    if (!id || !userPosts || !Array.isArray(userPosts)) {
      console.log("getPostsData: No ID or invalid userPosts", { id, userPostsLength: userPosts?.length });
      return [];
    }
    const idString = id.toString();
    // Filter posts to only include those belonging to the current profile
    const filtered = userPosts.filter(post => {
      // Check if post belongs to current user profile
      const postUserId = post.user?.id?.toString() || post.userId?.toString();
      const matches = postUserId === idString;
      if (!matches && postUserId) {
        console.log("Post filtered out:", { postId: post.id, postUserId, requestedId: idString });
      }
      return matches;
    });
    console.log("getPostsData filtered result:", { total: userPosts.length, filtered: filtered.length, idString });
    return filtered;
  }, [userPosts, id]);

  const getReelsData = useMemo(() => {
    if (!id || !userReels || !Array.isArray(userReels)) {
      console.log("getReelsData: No ID or invalid userReels", { id, userReelsLength: userReels?.length });
      return [];
    }
    const idString = id.toString();
    // Filter reels to only include those belonging to the current profile
    const filtered = userReels.filter(reel => {
      // Check if reel belongs to current user profile
      const reelUserId = reel.user?.id?.toString() || reel.userId?.toString();
      const matches = reelUserId === idString;
      if (!matches && reelUserId) {
        console.log("Reel filtered out:", { reelId: reel.id, reelUserId, requestedId: idString });
      }
      return matches;
    });
    console.log("getReelsData filtered result:", { total: userReels.length, filtered: filtered.length, idString });
    return filtered;
  }, [userReels, id]);

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

  // Show skeleton only on initial load to prevent flickering
  // Don't show skeleton if we already have valid profile data (even if loading more data)
  const hasValidProfile = userProfile && userProfile?.id?.toString() === id?.toString();
  const isInitialProfileLoad = initialLoadRef.current && !hasValidProfile;
  
  // Only show skeleton if:
  // 1. This is the initial load AND we don't have valid profile data AND we're loading
  // 2. OR we have no profile at all and we have a valid ID to fetch (initial state)
  const shouldShowSkeleton = (isInitialProfileLoad && profileLoading) || 
                              (!userProfile && !lastFetchedIdRef.current && id && id !== "undefined" && id.trim() !== "");
  
  if (shouldShowSkeleton) {
    return <ProfileSkeleton />;
  }
  
  // If we have no profile and no valid ID, show error state instead of skeleton
  if (!userProfile && (!id || id === "undefined" || id.trim() === "")) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-screen">
        <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
          Invalid profile ID
        </Typography>
      </Box>
    );
  }

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
              key={getProfileImageUrl() || 'default'} // Force re-render when image changes
              src={getProfileImageUrl()} 
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
              {(userProfile?.fname || currentUser?.fname)?.charAt(0) || "U"}
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
            {postsLoading ? (
              <Box 
                className="col-span-3 flex items-center justify-center py-20"
                sx={{ minHeight: '300px' }}
              >
                <CircularProgress 
                  size={48} 
                  sx={{ color: theme.palette.primary.main }} 
                />
              </Box>
            ) : getPostsData && getPostsData.length > 0 ? (
              getPostsData.map((post, index) => renderMediaItem(post, index, handlePostClick))
            ) : (
              renderEmptyState(
                "No content available",
                "When you share photos and videos, they'll appear here."
              )
            )}
          </Box>
            ) : value === "reels" ? (
          <Box className="grid grid-cols-3 gap-1">
            {reelsLoading ? (
              <Box 
                className="col-span-3 flex items-center justify-center py-20"
                sx={{ minHeight: '300px' }}
              >
                <CircularProgress 
                  size={48} 
                  sx={{ color: theme.palette.primary.main }} 
                />
              </Box>
            ) : getReelsData && getReelsData.length > 0 ? (
              getReelsData.map((reel, index) => renderMediaItem(reel, index, handleReelClick))
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
      <PostModal
        post={selectedPost}
        open={isPostModalOpen}
        onClose={handleClosePostModal}
      />

      {/* Reel Modal */}
      <ReelModal
        reel={selectedReel}
        open={isReelModalOpen}
        onClose={handleCloseReelModal}
      />

      {/* Edit Profile Modal */}
      <ProfileModal 
        open={isEditModalOpen} 
        handleClose={handleCloseEditModal} 
      />
    </Box>
  );
};

export default UserProfile;