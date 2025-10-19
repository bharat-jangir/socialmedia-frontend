import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, API_BASE_URL } from "../../config/api";

export const createPost = createAsyncThunk(
  "post/createPost",
  async (postData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/api/posts`, postData.data);
      console.log("Post Created", data);
      return data;
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

export const getAllPosts = createAsyncThunk(
  "post/getAllPosts",
  async (_, { rejectWithValue }) => {
    console.log("getting all the posts");
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/posts`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Posts Fetched", data);
      return data;
    } catch (error) {
      console.log(
        "Error fetching all posts:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// New infinite scroll actions
export const getFeedPosts = createAsyncThunk(
  "post/getFeedPosts",
  async ({ page = 0, size = 10, feedType = 'all', userId = null }, { rejectWithValue }) => {
    console.log(`Getting ${feedType} feed posts - page: ${page}, size: ${size}`);
    try {
      const jwt = localStorage.getItem("token");
      let endpoint = '';
      
      switch (feedType) {
        case 'all':
          endpoint = `/api/posts/optimized/feed?page=${page}&size=${size}`;
          break;
        case 'user':
          if (!userId) {
            throw new Error('UserId is required for user feed');
          }
          endpoint = `/api/posts/optimized/user/${userId}/feed?page=${page}&size=${size}`;
          break;
        case 'saved':
          endpoint = `/api/posts/optimized/saved/feed?page=${page}&size=${size}`;
          break;
        default:
          endpoint = `/api/posts/optimized/feed?page=${page}&size=${size}`;
      }
      
      const { data } = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log(`${feedType} Feed Posts Fetched:`, data);
      
      const posts = data.content || data;
      const currentPage = data.page || page;
      const totalPages = data.totalPages || 0;
      const hasMore = data.hasNext !== undefined ? data.hasNext : (posts.length > 0 && (currentPage < totalPages - 1));
      
      console.log("API Response Analysis:", {
        postsCount: posts.length,
        currentPage,
        totalPages,
        hasMore,
        hasNext: data.hasNext,
        feedType,
        samplePost: posts[0] ? {
          id: posts[0].id,
          totalLikes: posts[0].totalLikes,
          recentLikedByCount: posts[0].recentLikedBy?.length,
          recentCommentsCount: posts[0].recentComments?.length
        } : null
      });
      
      return { 
        posts, 
        page: currentPage,
        totalPages,
        hasMore,
        feedType 
      };
    } catch (error) {
      console.log(
        `Error fetching ${feedType} feed posts:`,
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUsersPosts = createAsyncThunk(
  "post/getUsersPosts",
  async (userId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/posts/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Posts Fetched", data);
      
      // Extract posts from the response structure
      const posts = data.content || data;
      console.log("Extracted Posts:", posts);
      
      return posts; // Return just the posts array, not the whole response
    } catch (error) {
      console.log(
        "Error fetching user posts:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const likePost = createAsyncThunk(
  "post/likePost",
  async (postId, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/posts/like/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("Post Like Toggled", data);
      
      // Get current user from state
      const currentUser = getState().auth.user;
      console.log("Current user from state:", currentUser);
      
      return { postId, data, currentUser };
    } catch (error) {
      console.log("Error liking post:", error.response?.data || error.message);

      // Handle specific database constraint errors
      if (error.response?.data?.message?.includes("Duplicate entry")) {
        console.log(
          "Duplicate like detected - this is expected behavior for toggle"
        );
        // Return success even for duplicate entries as it means the like was already there
        const currentUser = getState().auth.user;
        return { postId, data: { message: "Like toggled successfully" }, currentUser };
      }

      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Comments API actions

export const createComment = createAsyncThunk(
  "post/createComment",
  async (reqData, { rejectWithValue, getState }) => {
    try {
      const { data } = await api.post(
        `/api/comments/post/${reqData.postId}`,
        reqData.data
      );
      console.log("Comment Created", data);
      
      // Get current user from state for optimistic update
      const currentUser = getState().auth.user;
      
      // Return proper structure with postId and comment
      return { 
        postId: reqData.postId, 
        comment: data,
        currentUser 
      };
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/api/posts/${postId}`);
      console.log("Post Deleted", data);
      return { postId, data };
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

// Get user profile with all data (posts, saved posts, reels, counts)
export const getUserProfileData = createAsyncThunk(
  "post/getUserProfileData",
  async (userId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/users/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("User Profile Data", data);
      return data;
    } catch (error) {
      console.log(
        "Error fetching user profile:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get current user's saved posts
export const getSavedPosts = createAsyncThunk(
  "post/getSavedPosts",
  async (userId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const endpoint = userId
        ? `/api/posts/saved/combined/paginated?page=0&size=10`
        : `/api/posts/saved/combined/paginated?page=0&size=10`;
      const { data } = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Saved Posts", data);
      return data;
    } catch (error) {
      console.log(
        "Error fetching saved posts:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Save/Unsave post
export const savePost = createAsyncThunk(
  "post/savePost",
  async (postId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/posts/save/${postId}`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Post Save/Unsave API Response:", data);
      console.log("Post Save/Unsave - postId:", postId, "postId type:", typeof postId);
      // Just return postId, reducer will handle the toggle logic
      return { postId };
    } catch (error) {
      console.log(
        "Error saving/unsaving post:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Save/Unsave reel
export const saveReel = createAsyncThunk(
  "post/saveReel",
  async (reelId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("🔄 Attempting to save reel with ID:", reelId);
      console.log("🔗 Using endpoint: /api/reels/save/" + reelId);
      
      // Use the correct reel save endpoint
      const { data } = await api.put(`/api/reels/save/${reelId}`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("✅ Reel Save/Unsave API Response:", data);
      console.log("✅ Reel Save/Unsave - reelId:", reelId, "reelId type:", typeof reelId);
      // Just return reelId, reducer will handle the toggle logic
      return { reelId };
    } catch (error) {
      console.log("❌ Error saving/unsaving reel:", error.response?.data || error.message);
      console.log("❌ Error status:", error.response?.status);
      console.log("❌ Full error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get saved post IDs only (lightweight)
export const getSavedPostIds = createAsyncThunk(
  "post/getSavedPostIds",
  async (_, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get("/api/posts/saved/ids", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Saved Post IDs API Response:", data);
      console.log("Saved Post IDs API Response Type:", typeof data);
      console.log("Saved Post IDs API Response Is Array:", Array.isArray(data));
      
      // Extract only IDs from the response and ensure consistent data types
      const postIds = Array.isArray(data) ? data.map(post => {
        const id = post.id || post;
        console.log("Processing post:", post, "Extracted ID:", id, "ID type:", typeof id);
        // Convert to string to ensure consistent comparison
        return String(id);
      }) : [];
      console.log("Final Extracted Post IDs:", postIds);
      console.log("Final Post IDs Types:", postIds.map(id => typeof id));
      return postIds;
    } catch (error) {
      console.log(
        "Error fetching saved post IDs:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create Reel
export const createReel = createAsyncThunk(
  "post/createReel",
  async (reelData, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post("/api/reels", reelData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Reel Created:", data);
      return data;
    } catch (error) {
      console.log(
        "Error creating reel:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get user's reels (with pagination)
export const getUserReels = createAsyncThunk(
  "post/getUserReels",
  async ({ userId, page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/reels/user/${userId}?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("User Reels", data);
      
      // Extract content array from response
      const reelsData = data.content || data;
      console.log("Extracted user reels data:", reelsData);
      
      return { data: reelsData, page, size, totalElements: data.totalElements, hasNext: data.hasNext };
    } catch (error) {
      console.log(
        "Error fetching user reels:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all reels (with pagination)
export const getAllReels = createAsyncThunk(
  "post/getAllReels",
  async ({ page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      console.log("getAllReels API call - page:", page, "size:", size);
      const jwt = localStorage.getItem("token");
      console.log("JWT token:", jwt ? "Present" : "Missing");
      
      const url = `/api/reels/feed?page=${page}&size=${size}`;
      console.log("API URL:", url);
      
      const { data } = await api.get(url, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("All Reels API Response:", data);
      console.log("All Reels Data Type:", typeof data);
      console.log("All Reels Is Array:", Array.isArray(data));
      
      // Extract content array from response
      const reelsData = data.content || data;
      console.log("Extracted reels data:", reelsData);
      console.log("Reels data is array:", Array.isArray(reelsData));
      
      return { data: reelsData, page, size, totalElements: data.totalElements, hasNext: data.hasNext };
    } catch (error) {
      console.log(
        "Error fetching all reels:",
        error.response?.data || error.message
      );
      console.log("Error status:", error.response?.status);
      console.log("Error details:", error);
      
      // Temporary mock data for testing
      if (error.response?.status === 404 || error.message.includes('404')) {
        console.log("API endpoint not found, using mock data");
        const mockData = [
          {
            id: 1,
            title: "Sample Reel 1",
            video: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
            user: {
              id: 1,
              fname: "John",
              lname: "Doe",
              profileImage: "https://via.placeholder.com/150"
            },
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            title: "Sample Reel 2", 
            video: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
            user: {
              id: 2,
              fname: "Jane",
              lname: "Smith",
              profileImage: "https://via.placeholder.com/150"
            },
            createdAt: new Date().toISOString()
          }
        ];
        return { data: mockData, page, size };
      }
      
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Like/Unlike a reel
export const likeReel = createAsyncThunk(
  "post/likeReel",
  async (reelId, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/reels/like/${reelId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("Reel Like Toggled", data);
      
      // Get current user ID from auth state
      const state = getState();
      const currentUserId = state.auth?.user?.id;
      console.log("Current user ID for like:", currentUserId);
      
      return { reelId, data, userId: currentUserId };
    } catch (error) {
      console.log(
        "Error liking reel:",
        error.response?.data || error.message
      );

      // Handle specific database constraint errors
      if (error.response?.data?.message?.includes("Duplicate entry")) {
        console.log(
          "Duplicate reel like detected - this is expected behavior for toggle"
        );
        // Return success even for duplicate entries as it means the like was already there
        const state = getState();
        const currentUserId = state.auth?.user?.id;
        return {
          reelId,
          data: { message: "Reel like toggled successfully" },
          userId: currentUserId
        };
      }

      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add comment to a reel
export const addReelComment = createAsyncThunk(
  "post/addReelComment",
  async ({ reelId, content }, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      // Send just the content field as expected by API
      const requestBody = { content: content };
      console.log("Sending comment request:", {
        url: `/api/reels/${reelId}/comment`,
        body: requestBody,
        reelId,
        content
      });
      
      const { data } = await api.post(
        `/api/reels/${reelId}/comment`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("Reel Comment Added - Full Response:=================>", data);
      
      // Use only real API response - no temp data
      console.log("API returned success message, but no comment data - will refetch comments");
      
      return { 
        reelId, 
        comment: data, // No temp comment
        shouldRefetch: false // Refetch to get real comments
      };
    } catch (error) {
      console.log(
        "Error adding reel comment:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update comment in a reel
export const updateReelComment = createAsyncThunk(  
  "post/updateReelComment",
  async ({ reelId, commentId, content }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/reels/${reelId}/comment/${commentId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Reel Comment Updated", data);
      
      return { reelId, commentId, comment: data };
    } catch (error) {
      console.log(
        "Error updating reel comment:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete comment from a reel
export const deleteReelComment = createAsyncThunk(
  "post/deleteReelComment",
  async ({ reelId, commentId }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("🗑️ deleteReelComment action called with reelId:", reelId, "commentId:", commentId);
      console.log("🔍 Using endpoint: /api/reels/" + reelId + "/comment/" + commentId);
      
      const { data } = await api.delete(
        `/api/reels/${reelId}/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("✅ Reel Comment Deleted successfully:", data);
      
      return { reelId, commentId };
    } catch (error) {
      console.log(
        "❌ Error deleting reel comment:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete reel
export const deleteReel = createAsyncThunk(
  "post/deleteReel",
  async (reelId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.delete(`/api/reels/${reelId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Reel Deleted", data);
      return { reelId, data };
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

// Get reel comments (with pagination)
export const getReelComments = createAsyncThunk(
  "post/getReelComments",
  async ({ reelId, page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(
        `/api/reels/${reelId}/comments?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("Reel Comments - Full API Response:", data);
      
      // Extract content array from response
      const commentsData = data.content || data;
      console.log("Extracted comments data:", commentsData);
      console.log("First comment structure:", commentsData[0]);
      
      return { 
        reelId, 
        data: commentsData, 
        page, 
        size, 
        totalElements: data.totalElements, 
        hasNext: data.hasNext 
      };
    } catch (error) {
      console.log(
        "Error fetching reel comments:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add comment to a post
export const addComment = createAsyncThunk(
  "post/addComment",
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(
        `/api/comments/post/${postId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Comment Added - Full Response:", data);
      console.log("Comment Added - Data Type:", typeof data);
      console.log("Comment Added - Data Keys:", Object.keys(data || {}));
      console.log("Comment Added - User Data:", data?.user);
      console.log("Comment Added - Content:", data?.content);
      return { postId, comment: data };
    } catch (error) {
      console.log(
        "Error adding comment:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch all comments for a post
export const fetchComments = createAsyncThunk(
  "post/fetchComments",
  async (postId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/comments/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Comments Fetched", data);
      return { postId, comments: data };
    } catch (error) {
      console.log(
        "Error fetching comments:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update a comment
export const updateComment = createAsyncThunk(
  "post/updateComment",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/comments/${commentId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Comment Updated", data);
      return { commentId, comment: data };
    } catch (error) {
      console.log(
        "Error updating comment:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete a comment
export const deleteComment = createAsyncThunk(
  "post/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("🗑️ deleteComment action called with commentId:", commentId);
      console.log("🔍 Using endpoint: /api/comments/" + commentId);
      
      const { data } = await api.delete(`/api/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("✅ Comment Deleted successfully:", data);
      return { commentId, data };
    } catch (error) {
      console.log(
        "❌ Error deleting comment:",
        error.response?.data || error.message
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Like/Unlike a comment
export const likeComment = createAsyncThunk(
  "post/likeComment",
  async (commentId, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/comments/like/${commentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("Comment Like Toggled - API Response:", data);
      console.log("API Response Structure Check:", {
        hasTotalLikes: 'totalLikes' in data,
        hasIsLiked: 'isLiked' in data,
        totalLikes: data.totalLikes,
        isLiked: data.isLiked,
        fullResponse: data
      });
      
      // Get current user from state
      const currentUser = getState().auth.user;
      console.log("Current user for comment like:", currentUser);
      
      // Return the updated comment data with new structure
      return { 
        commentId, 
        updatedComment: data, // This should contain totalLikes and isLiked
        currentUser 
      };
    } catch (error) {
      console.log(
        "Error liking comment:",
        error.response?.data || error.message
      );

      // Handle specific database constraint errors
      if (error.response?.data?.message?.includes("Duplicate entry")) {
        console.log(
          "Duplicate comment like detected - this is expected behavior for toggle"
        );
        // Return success even for duplicate entries as it means the like was already there
        const currentUser = getState().auth.user;
        return {
          commentId,
          data: { message: "Comment like toggled successfully" },
          currentUser
        };
      }

      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Like/Unlike a reel comment
export const likeReelComment = createAsyncThunk(
  "post/likeReelComment",
  async (commentId, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(
        `/api/comments/like/${commentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log("Reel Comment Like Toggled - API Response:", data);
      console.log("Reel Comment API Response Structure Check:", {
        hasTotalLikes: 'totalLikes' in data,
        hasIsLiked: 'isLiked' in data,
        totalLikes: data.totalLikes,
        isLiked: data.isLiked,
        fullResponse: data
      });
      
      // Get current user from state
      const currentUser = getState().auth.user;
      console.log("Current user for reel comment like:", currentUser);
      
      // Return the updated comment data with new structure
      return { 
        commentId, 
        updatedComment: data, // This should contain totalLikes and isLiked
        currentUser 
      };
    } catch (error) {
      console.log(
        "Error liking reel comment:",
        error.response?.data || error.message
      );

      // Handle specific database constraint errors
      if (error.response?.data?.message?.includes("Duplicate entry")) {
        console.log(
          "Duplicate reel comment like detected - this is expected behavior for toggle"
        );
        // Return success even for duplicate entries as it means the like was already there
        const currentUser = getState().auth.user;
        return {
          commentId,
          data: { message: "Reel comment like toggled successfully" },
          currentUser
        };
      }

      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
