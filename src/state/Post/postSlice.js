import { createSlice } from "@reduxjs/toolkit";
import {
  createPost,
  likePost,
  getAllPosts,
  getFeedPosts,
  getUsersPosts,
  createComment,
  deletePost,
  getUserProfileData,
  getSavedPosts,
  getUserReels,
  getAllReels,
  likeReel,
  addReelComment,
  updateReelComment,
  deleteReelComment,
  deleteReel,
  getReelComments,
  addComment,
  fetchComments,
  updateComment,
  deleteComment,
  likeComment,
  likeReelComment,
  savePost,
  saveReel,
  getSavedPostIds,
  createReel,
} from "./post.action";
import { getPostLikes, getPostComments } from "./likesComments.action";
import { createOptimisticComment, mapTempToRealId, removeOptimisticComment, isTempId, processCommentFromAPI } from "../../utils/commentUtils";

const initialState = {
  post: null,
  loading: false,
  error: null,
  posts: [],
  like: null,
  comments: [],
  // User profile data
  userProfile: null,
  savedPosts: [],
  savedPostIds: [], // Lightweight array of saved post IDs
  userReels: [],
  allReels: [], // All reels feed
  reelComments: {}, // { reelId: { comments: [], currentPage: 0, hasMore: true, loading: false } }
  
  // Post likes and comments with pagination
  postLikes: {}, // { postId: { likes: [], currentPage: 0, hasMore: true, loading: false } }
  postComments: {}, // { postId: { comments: [], currentPage: 0, hasMore: true, loading: false } }
  postsCount: 0,
  savedPostsCount: 0,
  reelsCount: 0,
  followersCount: 0,
  followingCount: 0,
  // Infinite scroll state for posts
  currentPage: 0,
  totalPages: 0,
  hasMore: true,
  loadingMore: false,
  // Infinite scroll state for reels
  reelsCurrentPage: 0,
  reelsTotalPages: 0,
  reelsHasMore: true,
  reelsLoadingMore: false,
  // Save operation loading state
  savingPost: false,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    // Optimistic comment addition for reels
    addOptimisticReelComment: (state, action) => {
      const { reelId, content } = action.payload;
      const currentUser = state.auth?.user;
      
      // Create optimistic comment
      const optimisticComment = {
        id: `temp_${Date.now()}`, // Temporary ID
        content: content,
        user: {
          id: currentUser?.id,
          fname: currentUser?.fname,
          lname: currentUser?.lname,
          profileImage: currentUser?.profileImage
        },
        createdAt: new Date().toISOString(),
        isOptimistic: true // Flag to identify optimistic comments
      };
      
      // Add to comments list
      const currentComments = state.reelComments[reelId] || { comments: [], currentPage: 0, hasMore: true, loading: false };
      
      state.reelComments[reelId] = {
        ...currentComments,
        comments: [optimisticComment, ...currentComments.comments],
      };
      
      // Update comment count (ensure arrays exist)
      if (Array.isArray(state.allReels)) {
      state.allReels = state.allReels.map(reel => {
        if (reel.id === reelId) {
          return {
            ...reel,
            totalComments: (reel.totalComments || 0) + 1,
            commentsCount: (reel.commentsCount || 0) + 1,
          };
        }
        return reel;
      });
      }
      
      if (Array.isArray(state.userReels)) {
      state.userReels = state.userReels.map(reel => {
        if (reel.id === reelId) {
          return {
            ...reel,
            totalComments: (reel.totalComments || 0) + 1,
            commentsCount: (reel.commentsCount || 0) + 1,
          };
        }
        return reel;
      });
      }
    },
    
    // Remove optimistic comment (in case of error)
    removeOptimisticReelComment: (state, action) => {
      const { reelId, tempId } = action.payload;
      const currentComments = state.reelComments[reelId];
      
      if (currentComments) {
        state.reelComments[reelId] = {
          ...currentComments,
          comments: currentComments.comments.filter(comment => comment.id !== tempId),
        };
        
        // Revert comment count (ensure arrays exist)
        if (Array.isArray(state.allReels)) {
        state.allReels = state.allReels.map(reel => {
          if (reel.id === reelId) {
            return {
              ...reel,
              totalComments: Math.max((reel.totalComments || 0) - 1, 0),
              commentsCount: Math.max((reel.commentsCount || 0) - 1, 0),
            };
          }
          return reel;
        });
        }
        
        if (Array.isArray(state.userReels)) {
        state.userReels = state.userReels.map(reel => {
          if (reel.id === reelId) {
            return {
              ...reel,
              totalComments: Math.max((reel.totalComments || 0) - 1, 0),
              commentsCount: Math.max((reel.commentsCount || 0) - 1, 0),
            };
          }
          return reel;
        });
        }
      }
    },
    updatePostCommentCount: (state, action) => {
      const { postId, increment } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex].totalComments = (state.posts[postIndex].totalComments || 0) + increment;
        console.log("📊 Updated post comment count:", {
          postId,
          increment,
          newCount: state.posts[postIndex].totalComments
        });
      }
    },
    removeCommentFromList: (state, action) => {
      const { postId, commentId } = action.payload;
      if (state.postComments[postId]) {
        state.postComments[postId].comments = state.postComments[postId].comments.filter(
          comment => comment.id !== commentId
        );
        console.log("🗑️ Removed comment from list:", {
          postId,
          commentId,
          remainingComments: state.postComments[postId].comments.length
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createPost.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    }),
      builder.addCase(createPost.fulfilled, (state, action) => {
        return {
          ...state,
          loading: false,
          post: action.payload,
          error: null,
          posts: [...state.posts, action.payload],
          comments: action.payload.comments,
        };
      }),
      builder.addCase(createPost.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      builder.addCase(getAllPosts.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(getAllPosts.fulfilled, (state, action) => {
        const receivedPosts = action.payload || [];
        
        // Merge received posts with existing posts, preserving locally updated counts
        const existingPostsMap = new Map();
        (state.posts || []).forEach(post => {
          const postId = post.id?.toString();
          if (postId) {
            existingPostsMap.set(postId, post);
          }
        });
        
        const mergedPosts = receivedPosts.map(receivedPost => {
          const receivedPostId = receivedPost.id?.toString();
          const existingPost = receivedPostId ? existingPostsMap.get(receivedPostId) : null;
          
          // Preserve locally updated totalComments if it differs from received count
          if (existingPost && existingPost.totalComments !== undefined && receivedPost.totalComments !== undefined) {
            const existingCount = existingPost.totalComments || 0;
            const receivedCount = receivedPost.totalComments || 0;
            
            if (existingCount !== receivedCount) {
              console.log("🔄 Preserving locally updated totalComments (getAllPosts):", {
                postId: receivedPostId,
                existingCount,
                receivedCount,
                using: existingCount
              });
              return {
                ...receivedPost,
                totalComments: existingCount
              };
            }
          }
          return receivedPost;
        });
        
        return { ...state, loading: false, posts: mergedPosts, error: null };
      }),
      builder.addCase(getAllPosts.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // New infinite scroll feed posts
      builder.addCase(getFeedPosts.pending, (state, action) => {
        const { page } = action.meta.arg;
        return { 
          ...state, 
          loading: page === 0, // Only show main loading for first page
          loadingMore: page > 0, // Show loading more for subsequent pages
          error: null 
        };
      }),
      builder.addCase(getFeedPosts.fulfilled, (state, action) => {
        const { posts, page, totalPages, hasMore } = action.payload;
        
        // Calculate hasMore based on received posts
        const receivedPosts = posts || [];
        const calculatedHasMore = receivedPosts.length > 0 && (page < totalPages - 1);
        
        console.log("getFeedPosts.fulfilled:", {
          page,
          totalPages,
          receivedPostsCount: receivedPosts.length,
          hasMore: calculatedHasMore,
          currentPostsCount: state.posts?.length || 0
        });
        
        // Merge received posts with existing posts, preserving locally updated counts
        let mergedPosts;
        if (page === 0) {
          // For first page, replace posts but preserve locally updated totalComments
          // Create a map of existing posts by ID for quick lookup
          const existingPostsMap = new Map();
          (state.posts || []).forEach(post => {
            const postId = post.id?.toString();
            if (postId) {
              existingPostsMap.set(postId, post);
            }
          });
          
          mergedPosts = receivedPosts.map(receivedPost => {
            const receivedPostId = receivedPost.id?.toString();
            const existingPost = receivedPostId ? existingPostsMap.get(receivedPostId) : null;
            
            // If we have an existing post, check if its totalComments was locally updated
            // We preserve the local count if it differs from the received count
            // This handles cases where local updates (add/delete comment) haven't been synced to backend yet
            if (existingPost && existingPost.totalComments !== undefined && receivedPost.totalComments !== undefined) {
              const existingCount = existingPost.totalComments || 0;
              const receivedCount = receivedPost.totalComments || 0;
              
              // If counts differ, prefer the existing (locally updated) count
              // This ensures our local updates (both increments AND decrements) aren't overwritten by stale backend data
              // We preserve regardless of whether existing is higher or lower, as both indicate local changes
              if (existingCount !== receivedCount) {
                console.log("🔄 Preserving locally updated totalComments:", {
                  postId: receivedPostId,
                  existingCount,
                  receivedCount,
                  using: existingCount,
                  reason: existingCount > receivedCount ? "local increment" : "local decrement"
                });
                return {
                  ...receivedPost,
                  totalComments: existingCount
                };
              }
            }
            return receivedPost;
          });
        } else {
          // For subsequent pages, append new posts
          mergedPosts = [...(state.posts || []), ...receivedPosts];
        }
        
        return {
          ...state,
          loading: false,
          loadingMore: false,
          error: null,
          posts: mergedPosts,
          currentPage: page,
          totalPages,
          hasMore: calculatedHasMore,
        };
      }),
      builder.addCase(getFeedPosts.rejected, (state, action) => {
        return { 
          ...state, 
          loading: false, 
          loadingMore: false,
          error: action.payload 
        };
      }),
      builder.addCase(getUsersPosts.pending, (state, action) => {
        // Don't clear posts on pending - causes flicker
        // New posts will replace old posts when fulfilled
        // Keep existing posts visible while loading new ones
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(getUsersPosts.fulfilled, (state, action) => {
        const receivedPosts = action.payload || [];
        console.log("getUsersPosts.fulfilled:", {
          receivedPostsCount: receivedPosts.length,
          currentPostsCount: state.posts?.length || 0,
          posts: receivedPosts
        });
        
        // Merge received posts with existing posts, preserving locally updated counts
        const existingPostsMap = new Map();
        (state.posts || []).forEach(post => {
          const postId = post.id?.toString();
          if (postId) {
            existingPostsMap.set(postId, post);
          }
        });
        
        const mergedPosts = receivedPosts.map(receivedPost => {
          const receivedPostId = receivedPost.id?.toString();
          const existingPost = receivedPostId ? existingPostsMap.get(receivedPostId) : null;
          
          // Preserve locally updated totalComments if it differs from received count
          if (existingPost && existingPost.totalComments !== undefined && receivedPost.totalComments !== undefined) {
            const existingCount = existingPost.totalComments || 0;
            const receivedCount = receivedPost.totalComments || 0;
            
            if (existingCount !== receivedCount) {
              console.log("🔄 Preserving locally updated totalComments (getUsersPosts):", {
                postId: receivedPostId,
                existingCount,
                receivedCount,
                using: existingCount
              });
              return {
                ...receivedPost,
                totalComments: existingCount
              };
            }
          }
          return receivedPost;
        });
        
        return { 
          ...state, 
          loading: false, 
          posts: mergedPosts, // Merge instead of direct assignment to preserve local updates
          error: null 
        };
      }),
      builder.addCase(getUsersPosts.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      builder.addCase(likePost.pending, (state, action) => {
        // Don't set loading state for like actions - they should be instant
        return { ...state, error: null };
      }),
      builder.addCase(likePost.fulfilled, (state, action) => {
        const { postId, data, currentUser } = action.payload;
        console.log("likePost.fulfilled - API Response:", data);
        console.log("Current user from action:", currentUser);
        
        if (!currentUser) {
          console.log("No current user found, skipping like update");
          return { ...state, loading: false, error: null };
        }
        
        // Find the post and update only the counts - no reload needed!
        const postIndex = state.posts.findIndex(post => post.id === postId);
        if (postIndex === -1) {
          return { ...state, loading: false, error: null };
        }
        
        const post = state.posts[postIndex];
        const currentRecentLikedBy = post.recentLikedBy || [];
        
        // Check if current user already liked this post
        const isCurrentlyLiked = currentRecentLikedBy.some(like => {
          if (typeof like === 'object' && like.id) {
            return like.id === currentUser.id;
          }
          return like === currentUser.id;
        });
        
        // Simple count update - no complex logic needed
        let newTotalLikes = post.totalLikes || 0;
        let newRecentLikedBy = [...currentRecentLikedBy];
        
        if (isCurrentlyLiked) {
          // Unlike: decrease count and remove user
          newTotalLikes = Math.max(newTotalLikes - 1, 0);
          newRecentLikedBy = newRecentLikedBy.filter(like => {
            if (typeof like === 'object' && like.id) {
              return like.id !== currentUser.id;
            }
            return like !== currentUser.id;
          });
        } else {
          // Like: increase count and add user
          newTotalLikes = newTotalLikes + 1;
          newRecentLikedBy = [currentUser, ...newRecentLikedBy].slice(0, 5);
        }
        
        console.log("Simple like update:", {
          postId,
          oldTotalLikes: post.totalLikes,
          newTotalLikes,
          wasLiked: isCurrentlyLiked,
          nowLiked: !isCurrentlyLiked
        });
        
        // Update only the specific post in the array (immutable update)
        const newPosts = [...state.posts];
        newPosts[postIndex] = {
              ...post,
          totalLikes: newTotalLikes,
          recentLikedBy: newRecentLikedBy,
            };
        
        return {
          ...state,
          like: action.payload,
          error: null,
          posts: newPosts,
        };
      }),
      builder.addCase(likePost.rejected, (state, action) => {
        return { ...state, error: action.payload };
      }),
      builder.addCase(createComment.pending, (state, action) => {
        // Don't set loading state for comment actions - they should be instant
        return { ...state, error: null };
      }),
      builder.addCase(createComment.fulfilled, (state, action) => {
        const { postId, comment, currentUser } = action.payload;
        console.log("createComment.fulfilled - API Response:", comment);
        console.log("Current user for comment:", currentUser);
        
        // Simple count update - just increment totalComments, no reload needed!
        const newPosts = state.posts.map(post => {
          if (post.id === postId) {
            const newTotalComments = (post.totalComments || 0) + 1;
            
            console.log("Simple comment count update:", {
          postId,
              oldTotalComments: post.totalComments,
              newTotalComments
        });
        
            return {
              ...post,
              totalComments: newTotalComments,
            };
          }
          return post; // Return same reference for unchanged posts
        });
        
        return {
          ...state,
          error: null,
          posts: newPosts,
        };
      }),
      builder.addCase(createComment.rejected, (state, action) => {
        return { ...state, error: action.payload };
      }),
      builder.addCase(deletePost.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(deletePost.fulfilled, (state, action) => {
        return {
          ...state,
          loading: false,
          error: null,
          posts: state.posts.filter(
            (post) => post.id !== action.payload.postId
          ),
        };
      }),
      builder.addCase(deletePost.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // User Profile Data
      builder.addCase(getUserProfileData.pending, (state, action) => {
        // Don't clear existing data on pending - this causes flicker
        // New data will replace old data when fulfilled
        // Only set loading state without clearing to prevent UI flicker
        return { 
          ...state, 
          loading: true, 
          error: null
          // Keep existing posts, userReels, and userProfile to prevent flicker
          // New data will replace it when fulfilled - no need to clear here
        };
      }),
      builder.addCase(getUserProfileData.fulfilled, (state, action) => {
        // Backend returns null for posts/reels in getUserProfileData
        // They are fetched separately via getUsersPosts and getUserReels
        // So we should NOT overwrite existing posts/reels if they're null in the response
        // However, if userProfile changes (switching users), we should clear posts/reels
        // to prevent showing data from the previous user
        const isDifferentUser = state.userProfile?.id?.toString() !== action.payload.user?.id?.toString();
        
        return {
          ...state,
          loading: false,
          userProfile: action.payload.user,
          // Only update posts/reels if they're actually provided as arrays in the response
          // If null/undefined and we're switching users, clear them (they'll be loaded by separate calls)
          // If null/undefined and same user, preserve existing data
          posts: Array.isArray(action.payload.posts) 
            ? action.payload.posts 
            : (isDifferentUser ? [] : (state.posts || [])),
          savedPosts: Array.isArray(action.payload.savedPosts) 
            ? action.payload.savedPosts 
            : (isDifferentUser ? [] : (state.savedPosts || [])),
          userReels: Array.isArray(action.payload.reels) 
            ? action.payload.reels 
            : (isDifferentUser ? [] : (state.userReels || [])),
          postsCount: action.payload.postsCount || 0,
          savedPostsCount: action.payload.savedPostsCount || 0,
          reelsCount: action.payload.reelsCount || 0,
          followersCount: action.payload.followersCount || 0,
          followingCount: action.payload.followingCount || 0,
          error: null,
        };
      }),
      builder.addCase(getUserProfileData.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Saved Posts
      builder.addCase(getSavedPosts.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(getSavedPosts.fulfilled, (state, action) => {
        console.log("getSavedPosts.fulfilled - payload:", action.payload);
        const savedPostsData = action.payload?.content || action.payload || [];
        console.log("getSavedPosts.fulfilled - savedPostsData:", savedPostsData);
        
        return {
          ...state,
          loading: false,
          savedPosts: Array.isArray(savedPostsData) ? savedPostsData : [],
          savedPostsCount: action.payload?.totalElements || 0,
          error: null,
        };
      }),
      builder.addCase(getSavedPosts.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // User Reels (with pagination)
      builder.addCase(getUserReels.pending, (state, action) => {
        const { page } = action.meta.arg;
        if (page === 0) {
          // Don't clear on pending - causes flicker, new reels will replace when fulfilled
          // Only clear if we're explicitly switching users (handled in Profile component)
          return { ...state, loading: true, error: null };
        } else {
          return { ...state, reelsLoadingMore: true, error: null };
        }
      }),
      builder.addCase(getUserReels.fulfilled, (state, action) => {
        const { data, page, hasNext } = action.payload;
        const newReels = Array.isArray(data) ? data : [];
        
        if (page === 0) {
          return {
            ...state,
            loading: false,
            userReels: newReels,
            reelsCurrentPage: 0,
            reelsHasMore: hasNext !== undefined ? hasNext : newReels.length > 0,
            error: null,
          };
        } else {
          return {
            ...state,
            reelsLoadingMore: false,
            userReels: [...state.userReels, ...newReels],
            reelsCurrentPage: page,
            reelsHasMore: hasNext !== undefined ? hasNext : newReels.length > 0,
            error: null,
          };
        }
      }),
      builder.addCase(getUserReels.rejected, (state, action) => {
        return { 
          ...state, 
          loading: false, 
          reelsLoadingMore: false, 
          error: action.payload 
        };
      }),
      // All Reels (with pagination)
      builder.addCase(getAllReels.pending, (state, action) => {
        const { page } = action.meta.arg;
        if (page === 0) {
          return { ...state, loading: true, error: null, allReels: [] };
        } else {
          return { ...state, reelsLoadingMore: true, error: null };
        }
      }),
      builder.addCase(getAllReels.fulfilled, (state, action) => {
        const { data, page, hasNext } = action.payload;
        const newReels = Array.isArray(data) ? data : [];
        
        console.log("getAllReels.fulfilled - payload:", action.payload);
        console.log("getAllReels.fulfilled - data:", data);
        console.log("getAllReels.fulfilled - newReels:", newReels);
        console.log("getAllReels.fulfilled - page:", page);
        console.log("getAllReels.fulfilled - hasNext:", hasNext);
        
        if (page === 0) {
          return {
            ...state,
            loading: false,
            allReels: newReels,
            reelsCurrentPage: 0,
            reelsHasMore: hasNext !== undefined ? hasNext : newReels.length > 0,
            error: null,
          };
        } else {
          return {
            ...state,
            reelsLoadingMore: false,
            allReels: [...state.allReels, ...newReels],
            reelsCurrentPage: page,
            reelsHasMore: hasNext !== undefined ? hasNext : newReels.length > 0,
            error: null,
          };
        }
      }),
      builder.addCase(getAllReels.rejected, (state, action) => {
        return { 
          ...state, 
          loading: false, 
          reelsLoadingMore: false, 
          error: action.payload 
        };
      }),
      // Add comment cases
      builder.addCase(addComment.pending, (state, action) => {
        // Don't add optimistic comment - wait for API response
        state.error = null;
      }),
      builder.addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        
        console.log("✅ Comment API Success - Adding original response to list:", {
          postId,
          comment: comment,
          commentId: comment.id,
          content: comment.content,
          user: comment.user,
          userFname: comment.user?.fname,
          userLname: comment.user?.lname
        });
        
        // Use real API response, but ensure postId is stored with the comment
        // This is critical for delete operations to know which post the comment belongs to
        const processedComment = { 
          ...comment, 
          postId: postId, // Explicitly store postId with the comment
          isOptimistic: false, 
          isPending: false 
        };
        
        // Ensure postComments structure exists - normalize postId to string for consistency
        const normalizedPostId = postId?.toString();
        if (!state.postComments[normalizedPostId]) {
          state.postComments[normalizedPostId] = {
            comments: [],
            currentPage: 0,
            hasMore: true,
            loading: false,
          };
        }
        
        // Add the original API response comment to the top of the list
        console.log("➕ Adding original API response comment to top of list");
        state.postComments[normalizedPostId].comments = [processedComment, ...state.postComments[normalizedPostId].comments];
        
        // Also add to the flat comments array (used by PostModal)
        // Check if comment already exists to avoid duplicates
        const existingCommentIndex = state.comments.findIndex(c => c.id?.toString() === processedComment.id?.toString());
        const isNewComment = existingCommentIndex === -1;
        
        if (isNewComment) {
          state.comments = [processedComment, ...state.comments];
          console.log("➕ Added comment to flat comments array for PostModal");
        } else {
          // Update existing comment if it's already there (shouldn't happen, but handle it)
          state.comments[existingCommentIndex] = processedComment;
          console.log("🔄 Updated existing comment in flat comments array (unexpected - comment already existed)");
        }
        
        // Also update the main posts array if it exists
        // Ensure proper ID matching (handle both string and number IDs)
        const postIndex = state.posts.findIndex(post => 
          post.id?.toString() === postId?.toString() || post.id === postId
        );
        if (postIndex !== -1) {
          // Only increment if this is a new comment (not an update)
          if (isNewComment) {
            const oldCount = state.posts[postIndex].totalComments || 0;
            state.posts[postIndex].totalComments = oldCount + 1;
            console.log("📊 Updated post totalComments count (incremented):", {
              postId,
              postIndex,
              oldCount,
              newCount: state.posts[postIndex].totalComments,
              commentId: processedComment.id
            });
          } else {
            console.log("📊 Skipped incrementing totalComments - comment already existed:", {
              postId,
              commentId: processedComment.id
            });
          }
        } else {
          console.warn("⚠️ Post not found in state.posts for postId:", postId, "Available posts:", state.posts.map(p => p.id));
        }
        
        // Optional: Store comment in localStorage as backup
        try {
          const existingComments = JSON.parse(localStorage.getItem(`comments_${normalizedPostId}`) || '[]');
          const updatedComments = [processedComment, ...existingComments];
          localStorage.setItem(`comments_${normalizedPostId}`, JSON.stringify(updatedComments));
          console.log("💾 Comment stored in localStorage as backup");
        } catch (error) {
          console.log("⚠️ Failed to store comment in localStorage:", error);
        }
        
        state.error = null;
      }),
      builder.addCase(addComment.rejected, (state, action) => {
        // No optimistic comment to remove - just set error
        state.error = action.payload;
      }),
      // Fetch comments cases
      builder.addCase(fetchComments.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(fetchComments.fulfilled, (state, action) => {
        const { postId, comments: fetchedComments } = action.payload;
        const commentsArray = fetchedComments || [];
        
        // Ensure all fetched comments have postId stored
        // This is critical for delete operations to know which post the comment belongs to
        const commentsWithPostId = commentsArray.map(comment => ({
          ...comment,
          postId: comment.postId || postId // Use comment's postId if available, otherwise use from payload
        }));
        
        // Create a map of fetched comments by ID for quick lookup
        const fetchedCommentsMap = new Map();
        commentsWithPostId.forEach(comment => {
          fetchedCommentsMap.set(comment.id?.toString(), comment);
        });
        
        // Only preserve optimistic/temporary comments that aren't in fetched list
        // DO NOT preserve regular comments that aren't in fetched list (they were likely deleted)
        const existingComments = state.comments || [];
        const preservedComments = existingComments.filter(existingComment => {
          const existingId = existingComment.id?.toString();
          const isTemporary = existingId?.startsWith('temp_') || existingComment.isOptimistic;
          const existsInFetched = fetchedCommentsMap.has(existingId);
          
          // Only preserve temporary/optimistic comments that don't exist in fetched list
          // Regular comments that aren't in fetched list should be removed (they were deleted)
          return isTemporary && !existsInFetched;
        });
        
        // Combine: fetched comments (source of truth) + preserved temporary comments
        const mergedComments = [...commentsWithPostId];
        preservedComments.forEach(preservedComment => {
          const preservedId = preservedComment.id?.toString();
          if (preservedId && !mergedComments.some(c => c.id?.toString() === preservedId)) {
            mergedComments.push(preservedComment);
          }
        });
        
        return {
          ...state,
          loading: false,
          comments: mergedComments,
          error: null,
        };
      }),
      builder.addCase(fetchComments.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Update comment cases
      builder.addCase(updateComment.pending, (state, action) => {
        // Don't set loading: true to prevent component re-render
        return { ...state, error: null };
      }),
      builder.addCase(updateComment.fulfilled, (state, action) => {
        // Don't set loading: false to prevent component re-render
        return { ...state, error: null };
      }),
      builder.addCase(updateComment.rejected, (state, action) => {
        // Don't set loading: false to prevent component re-render
        return { ...state, error: action.payload };
      }),
      // Delete comment cases
      builder.addCase(deleteComment.pending, (state, action) => {
        // Don't mark as pending - wait for API response
        state.error = null;
      }),
      builder.addCase(deleteComment.fulfilled, (state, action) => {
        const { commentId, postId, data } = action.payload;
        
        console.log("✅ Comment Delete API Success - Removing comment locally:", commentId, "for post:", postId);
        
        // Determine which post this comment belongs to
        // Priority: 1) postId from action payload, 2) postId from comment object, 3) postId from backend response, 4) find by searching
        let targetPostId = null;
        
        // First priority: postId passed directly in action payload
        if (postId) {
          targetPostId = postId.toString();
        } else {
          // Second priority: find comment and get its postId
          const commentToDelete = state.comments.find(c => c.id?.toString() === commentId?.toString());
          if (commentToDelete?.postId) {
            targetPostId = commentToDelete.postId.toString();
          } else if (data?.postId) {
            // Third priority: backend might return postId in response
            targetPostId = data.postId.toString();
          } else {
            // Fallback: find which post has this comment (only first match)
            // Check all possible postId formats (string and number)
            for (const pid of Object.keys(state.postComments)) {
              const hasComment = state.postComments[pid]?.comments?.some(
                c => c.id?.toString() === commentId?.toString()
              );
              if (hasComment) {
                targetPostId = pid;
                break; // Only use first match to avoid multiple decrements
              }
            }
          }
        }
        
        // Normalize targetPostId to string for consistency
        if (targetPostId) {
          targetPostId = targetPostId.toString();
        }
        
        // Remove comment from the flat comments array (used by PostModal)
        const beforeCount = state.comments.length;
        state.comments = state.comments.filter(
          comment => comment.id?.toString() !== commentId?.toString()
        );
        const afterCount = state.comments.length;
        if (beforeCount > afterCount) {
          console.log("🗑️ Comment removed from flat comments array");
        }
        
        // Only update the specific post that this comment belongs to
        if (targetPostId) {
          // Remove comment from the specific post's comments list
          if (state.postComments[targetPostId]) {
            const beforeCount = state.postComments[targetPostId].comments.length;
            const commentExists = state.postComments[targetPostId].comments.some(
              c => c.id?.toString() === commentId?.toString()
            );
            
            if (commentExists) {
              state.postComments[targetPostId].comments = state.postComments[targetPostId].comments.filter(
                comment => comment.id?.toString() !== commentId?.toString()
              );
              const afterCount = state.postComments[targetPostId].comments.length;
              
              console.log("🗑️ Comment removed from Redux state for post:", {
                postId: targetPostId,
                commentId,
                beforeCount,
                afterCount
              });
              
              // Update post totalComments count - only for the specific post
              const postIndex = state.posts.findIndex(post => 
                post.id?.toString() === targetPostId?.toString() || post.id === parseInt(targetPostId)
              );
              if (postIndex !== -1) {
                const oldCount = state.posts[postIndex].totalComments || 0;
                // Only decrement if the comment actually existed and was removed
                if (beforeCount > afterCount) {
                  state.posts[postIndex].totalComments = Math.max(oldCount - 1, 0);
                  console.log("📊 Updated post totalComments count after delete (decremented):", {
                    postId: targetPostId,
                    postIndex,
                    oldCount,
                    newCount: state.posts[postIndex].totalComments,
                    commentId
                  });
                } else {
                  console.warn("⚠️ Comment count didn't decrease - comment may not have existed:", {
                    postId: targetPostId,
                    commentId,
                    beforeCount,
                    afterCount
                  });
                }
              } else {
                console.warn("⚠️ Post not found in state.posts for postId:", targetPostId, "Available posts:", state.posts.map(p => p.id));
              }
              
              // Also remove from localStorage
              try {
                const existingComments = JSON.parse(localStorage.getItem(`comments_${targetPostId}`) || '[]');
                const updatedComments = existingComments.filter(comment => comment.id?.toString() !== commentId?.toString());
                localStorage.setItem(`comments_${targetPostId}`, JSON.stringify(updatedComments));
                console.log("🗑️ Comment removed from localStorage for post:", targetPostId);
              } catch (error) {
                console.log("⚠️ Failed to remove comment from localStorage:", error);
              }
            }
          }
        } else {
          console.warn("⚠️ Could not determine postId for deleted comment:", commentId);
          // Fallback: remove from all posts (old behavior, but log a warning)
          Object.keys(state.postComments).forEach(postId => {
            state.postComments[postId].comments = state.postComments[postId].comments.filter(
              comment => comment.id?.toString() !== commentId?.toString()
            );
          });
        }
        
        state.error = null;
      }),
      builder.addCase(deleteComment.rejected, (state, action) => {
        // No pending state to revert - just set error
        state.error = action.payload;
      }),
      // Like comment cases
      builder.addCase(likeComment.pending, (state, action) => {
        // Don't set loading state for like comment actions - they should be instant
        return { ...state, error: null };
      }),
      builder.addCase(likeComment.fulfilled, (state, action) => {
        const { commentId, updatedComment, currentUser } = action.payload;
        console.log("=== likeComment.fulfilled REDUCER CALLED ===");
        console.log("Action payload:", action.payload);
        console.log("Comment ID:", commentId);
        console.log("Updated comment from API:", updatedComment);
        console.log("Current user:", currentUser);
        console.log("Current postComments state:", state.postComments);
        
        if (!currentUser) {
          console.log("No current user found for comment like, skipping update");
          return { ...state, error: null };
        }
        
        // If API returns the updated comment with new structure, use it directly
        if (updatedComment && (updatedComment.totalLikes !== undefined || updatedComment.isLiked !== undefined)) {
          console.log("Using API response structure for comment update");
          // Update comments in posts array
          const updatedPosts = state.posts.map(post => {
            if (post.comments && post.comments.length > 0) {
              const updatedComments = post.comments.map(comment => {
            if (comment.id === commentId) {
        return {
                    ...comment,
                    isLiked: updatedComment.isLiked,
                    totalLikes: updatedComment.totalLikes
                  };
                }
                return comment;
              });
              return { ...post, comments: updatedComments };
            }
            return post;
          });
          
          // Update comments in postComments state (for CommentsModal)
          const updatedPostComments = { ...state.postComments };
          Object.keys(updatedPostComments).forEach(postId => {
            if (updatedPostComments[postId]?.comments) {
              updatedPostComments[postId].comments = updatedPostComments[postId].comments.map(comment => {
            if (comment.id === commentId) {
                  return {
                    ...comment,
                    isLiked: updatedComment.isLiked,
                    totalLikes: updatedComment.totalLikes
                  };
                }
                return comment;
              });
            }
          });
          
          console.log("Updated comment like state from API:", {
                commentId,
                currentUserId: currentUser.id,
            newIsLiked: updatedComment.isLiked,
            newTotalLikes: updatedComment.totalLikes,
            updatedComment: updatedComment
          });
          
          // Update comments in reelComments state (for ReelModal)
          const updatedReelComments = { ...state.reelComments };
          Object.keys(updatedReelComments).forEach(reelId => {
            if (updatedReelComments[reelId]?.comments) {
              updatedReelComments[reelId].comments = updatedReelComments[reelId].comments.map(comment => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    isLiked: updatedComment.isLiked,
                    totalLikes: updatedComment.totalLikes
                  };
                }
                return comment;
              });
            }
          });
          
          // Update the flat comments array (used by PostModal)
          const updatedComments = state.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: updatedComment.isLiked,
                totalLikes: updatedComment.totalLikes
              };
            }
            return comment;
          });
          
          console.log("=== STATE UPDATE COMPLETED (API) ===");
          console.log("Updated posts:", updatedPosts);
          console.log("Updated postComments:", updatedPostComments);
          console.log("Updated reelComments:", updatedReelComments);
          console.log("Updated comments:", updatedComments);
          
          state.posts = updatedPosts;
          state.postComments = updatedPostComments;
          state.reelComments = updatedReelComments;
          state.comments = updatedComments;
          state.error = null;
              } else {
          // Fallback: Toggle like state locally if API doesn't return updated structure
          console.log("API didn't return new structure, using local toggle fallback");
          const updatedPosts = state.posts.map(post => {
            if (post.comments && post.comments.length > 0) {
              const updatedComments = post.comments.map(comment => {
                if (comment.id === commentId) {
                  const isCurrentlyLiked = comment.isLiked || false;
              return {
                ...comment,
                    isLiked: !isCurrentlyLiked,
                    totalLikes: isCurrentlyLiked 
                      ? Math.max(0, (comment.totalLikes || 0) - 1)
                      : (comment.totalLikes || 0) + 1
              };
            }
            return comment;
              });
              return { ...post, comments: updatedComments };
            }
            return post;
          });
          
          const updatedPostComments = { ...state.postComments };
          Object.keys(updatedPostComments).forEach(postId => {
            if (updatedPostComments[postId]?.comments) {
              updatedPostComments[postId].comments = updatedPostComments[postId].comments.map(comment => {
                if (comment.id === commentId) {
                  const isCurrentlyLiked = comment.isLiked || false;
                  return {
                    ...comment,
                    isLiked: !isCurrentlyLiked,
                    totalLikes: isCurrentlyLiked 
                      ? Math.max(0, (comment.totalLikes || 0) - 1)
                      : (comment.totalLikes || 0) + 1
                  };
                }
                return comment;
              });
            }
          });
          
          console.log("Updated comment like state locally:", {
                commentId,
            currentUserId: currentUser.id
          });
          
          // Update comments in reelComments state (for ReelModal) - fallback
          const updatedReelComments = { ...state.reelComments };
          Object.keys(updatedReelComments).forEach(reelId => {
            if (updatedReelComments[reelId]?.comments) {
              updatedReelComments[reelId].comments = updatedReelComments[reelId].comments.map(comment => {
                if (comment.id === commentId) {
                  const isCurrentlyLiked = comment.isLiked || false;
              return {
                ...comment,
                    isLiked: !isCurrentlyLiked,
                    totalLikes: isCurrentlyLiked 
                      ? Math.max(0, (comment.totalLikes || 0) - 1)
                      : (comment.totalLikes || 0) + 1
              };
            }
            return comment;
              });
            }
          });
          
          // Update the flat comments array (used by PostModal) - fallback
          const updatedComments = state.comments.map(comment => {
            if (comment.id === commentId) {
              const isCurrentlyLiked = comment.isLiked || false;
              return {
                ...comment,
                isLiked: !isCurrentlyLiked,
                totalLikes: isCurrentlyLiked 
                  ? Math.max(0, (comment.totalLikes || 0) - 1)
                  : (comment.totalLikes || 0) + 1
              };
            }
            return comment;
          });
          
          console.log("=== STATE UPDATE COMPLETED (FALLBACK) ===");
          console.log("Updated posts:", updatedPosts);
          console.log("Updated postComments:", updatedPostComments);
          console.log("Updated reelComments:", updatedReelComments);
          console.log("Updated comments:", updatedComments);
          
          state.posts = updatedPosts;
          state.postComments = updatedPostComments;
          state.reelComments = updatedReelComments;
          state.comments = updatedComments;
          state.error = null;
        }
      }),
      builder.addCase(likeComment.rejected, (state, action) => {
        state.error = action.payload;
      }),
      // Save/Unsave Post
      builder.addCase(savePost.pending, (state, action) => {
        return { ...state, savingPost: true, error: null };
      }),
      builder.addCase(savePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        
        console.log("SavePost Reducer - postId:", postId);
        console.log("Current savedPostIds:", state.savedPostIds);
        
        // Determine current saved status and toggle it
        // Convert postId to string for consistent comparison
        const postIdStr = String(postId);
        const currentlySaved = state.savedPostIds.includes(postIdStr);
        const newIsSaved = !currentlySaved;
        
        console.log("Currently saved:", currentlySaved, "New status:", newIsSaved);
        
        // Update posts array with new saved status
        const newPosts = state.posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isSaved: newIsSaved,
            };
          }
          return post;
        });
        
        // Update saved posts array (ensure it's an array)
        let newSavedPosts = Array.isArray(state.savedPosts) ? [...state.savedPosts] : [];
        let newSavedPostIds = Array.isArray(state.savedPostIds) ? [...state.savedPostIds] : [];
        
        if (newIsSaved) {
          // Add to saved posts if not already there
          const postToSave = state.posts.find(post => post.id === postId);
          if (postToSave && !newSavedPosts.some(savedPost => savedPost.id === postId)) {
            newSavedPosts.push(postToSave);
          }
          // Add to saved post IDs if not already there
          if (!newSavedPostIds.includes(postIdStr)) {
            newSavedPostIds.push(postIdStr);
            console.log("Added postId to savedPostIds:", postIdStr);
          }
        } else {
          // Remove from saved posts
          newSavedPosts = newSavedPosts.filter(savedPost => savedPost.id !== postId);
          // Remove from saved post IDs
          newSavedPostIds = newSavedPostIds.filter(id => id !== postIdStr);
          console.log("Removed postId from savedPostIds:", postIdStr);
        }
        
        console.log("New savedPostIds:", newSavedPostIds);
        
        return {
          ...state,
          savingPost: false,
          posts: newPosts,
          savedPosts: newSavedPosts,
          savedPostIds: newSavedPostIds,
          error: null,
        };
      }),
      builder.addCase(savePost.rejected, (state, action) => {
        return { ...state, savingPost: false, error: action.payload };
      }),
      // Save/Unsave Reel
      builder.addCase(saveReel.pending, (state, action) => {
        return { ...state, savingPost: true, error: null };
      }),
      builder.addCase(saveReel.fulfilled, (state, action) => {
        const { reelId } = action.payload;
        const reelIdStr = String(reelId);
        
        console.log("Redux - saveReel.fulfilled - reelId:", reelId, "reelIdStr:", reelIdStr);
        console.log("Redux - saveReel.fulfilled - current savedPostIds:", state.savedPostIds);
        
        let newSavedPostIds = [...state.savedPostIds];
        
        // Toggle save status
        if (newSavedPostIds.includes(reelIdStr)) {
          // Remove from saved post IDs
          newSavedPostIds = newSavedPostIds.filter(id => id !== reelIdStr);
          console.log("Removed reelId from savedPostIds:", reelIdStr);
        } else {
          // Add to saved post IDs
          newSavedPostIds.push(reelIdStr);
          console.log("Added reelId to savedPostIds:", reelIdStr);
        }
        
        console.log("New savedPostIds:", newSavedPostIds);
        
        return {
          ...state,
          savingPost: false,
          savedPostIds: newSavedPostIds,
          error: null,
        };
      }),
      builder.addCase(saveReel.rejected, (state, action) => {
        return { ...state, savingPost: false, error: action.payload };
      }),
      // Get Saved Post IDs
      builder.addCase(getSavedPostIds.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(getSavedPostIds.fulfilled, (state, action) => {
        console.log("Redux - getSavedPostIds.fulfilled - payload:", action.payload);
        console.log("Redux - getSavedPostIds.fulfilled - payload type:", typeof action.payload);
        console.log("Redux - getSavedPostIds.fulfilled - payload is array:", Array.isArray(action.payload));
        return {
          ...state,
          loading: false,
          savedPostIds: Array.isArray(action.payload) ? action.payload : [], // Array of post IDs
          error: null,
        };
      }),
      builder.addCase(getSavedPostIds.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Create Reel
      builder.addCase(createReel.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(createReel.fulfilled, (state, action) => {
        return {
          ...state,
          loading: false,
          error: null,
          // Add new reel to both userReels and allReels arrays
          userReels: [...state.userReels, action.payload],
          allReels: [action.payload, ...state.allReels], // Add to beginning for feed
        };
      }),
      builder.addCase(createReel.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Like Reel
      builder.addCase(likeReel.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(likeReel.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        console.log("likeReel.fulfilled - reelId:", reelId, "data:", data);
        
        // Get current user ID from action payload
        const currentUserId = action.payload?.userId;
        console.log("likeReel.fulfilled - payload:", action.payload, "currentUserId:", currentUserId);
        if (!currentUserId) {
          console.log("No current user ID found in action payload");
          return state;
        }
        
        // Update the specific reel in allReels array (ensure array exists)
        const updatedAllReels = Array.isArray(state.allReels) ? state.allReels.map(reel => {
          if (reel.id === reelId) {
            const isCurrentlyLiked = reel.likedBy?.includes(currentUserId) || false;
            const newIsLiked = !isCurrentlyLiked;
            
            // Update likedBy array
            let newLikedBy = [...(reel.likedBy || [])];
            if (newIsLiked) {
              if (!newLikedBy.includes(currentUserId)) {
                newLikedBy.push(currentUserId);
              }
            } else {
              newLikedBy = newLikedBy.filter(id => id !== currentUserId);
            }
            
            const newTotalLikes = newLikedBy.length;
            
            console.log("Updating reel in allReels:", {
              reelId,
              currentIsLiked: isCurrentlyLiked,
              newIsLiked,
              currentTotalLikes: reel.totalLikes,
              newTotalLikes,
              newLikedBy
            });
            
            return {
              ...reel,
              isLiked: newIsLiked,
              likedBy: newLikedBy,
              totalLikes: newTotalLikes,
              likesCount: newTotalLikes, // Keep both for compatibility
            };
          }
          return reel;
        }) : [];
        
        // Update the specific reel in userReels array (ensure array exists)
        const updatedUserReels = Array.isArray(state.userReels) ? state.userReels.map(reel => {
          if (reel.id === reelId) {
            const isCurrentlyLiked = reel.likedBy?.includes(currentUserId) || false;
            const newIsLiked = !isCurrentlyLiked;
            
            // Update likedBy array
            let newLikedBy = [...(reel.likedBy || [])];
            if (newIsLiked) {
              if (!newLikedBy.includes(currentUserId)) {
                newLikedBy.push(currentUserId);
              }
            } else {
              newLikedBy = newLikedBy.filter(id => id !== currentUserId);
            }
            
            const newTotalLikes = newLikedBy.length;
            
            console.log("Updating reel in userReels:", {
              reelId,
              currentIsLiked: isCurrentlyLiked,
              newIsLiked,
              currentTotalLikes: reel.totalLikes,
              newTotalLikes,
              newLikedBy
            });
            
            return {
              ...reel,
              isLiked: newIsLiked,
              likedBy: newLikedBy,
              totalLikes: newTotalLikes,
              likesCount: newTotalLikes, // Keep both for compatibility
            };
          }
          return reel;
        }) : [];
        
        return {
          ...state,
          loading: false,
          allReels: updatedAllReels,
          userReels: updatedUserReels,
          error: null,
        };
      }),
      builder.addCase(likeReel.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Add Reel Comment
      builder.addCase(addReelComment.pending, (state, action) => {
        // Don't set loading: true to prevent component re-render
        return { ...state, error: null };
      }),
      builder.addCase(addReelComment.fulfilled, (state, action) => {
        const { reelId, comment, shouldRefetch } = action.payload;
        console.log("addReelComment.fulfilled - reelId:", reelId, "comment:", comment, "shouldRefetch:", shouldRefetch);
        
        const currentComments = state.reelComments[reelId] || { comments: [], currentPage: 0, hasMore: true, loading: false };
        
        // Check if this is replacing an optimistic comment
        const hasOptimisticComment = currentComments.comments.some(c => c.isOptimistic);
        
        if (hasOptimisticComment) {
          // Replace optimistic comment with real comment
          const updatedComments = currentComments.comments.map(c => 
            c.isOptimistic ? { ...comment, isOptimistic: false } : c
          );
          
          return {
            ...state,
            // Don't set loading: false to prevent component re-render
            reelComments: {
              ...state.reelComments,
              [reelId]: {
                ...currentComments,
                comments: updatedComments,
              }
            },
            error: null,
          };
        } else {
          // Add new comment and update counts
          const updatedAllReels = Array.isArray(state.allReels) ? state.allReels.map(reel => {
            if (reel.id === reelId) {
              return {
                ...reel,
                totalComments: (reel.totalComments || 0) + 1,
                commentsCount: (reel.commentsCount || 0) + 1,
              };
            }
            return reel;
          }) : [];
          
          const updatedUserReels = Array.isArray(state.userReels) ? state.userReels.map(reel => {
            if (reel.id === reelId) {
              return {
                ...reel,
                totalComments: (reel.totalComments || 0) + 1,
                commentsCount: (reel.commentsCount || 0) + 1,
              };
            }
            return reel;
          }) : [];
          
          return {
            ...state,
            // Don't set loading: false to prevent component re-render
            allReels: updatedAllReels,
            userReels: updatedUserReels,
            reelComments: {
              ...state.reelComments,
              [reelId]: {
                ...currentComments,
                comments: [comment, ...currentComments.comments],
              }
            },
            error: null,
          };
        }
      }),
      builder.addCase(addReelComment.rejected, (state, action) => {
        // Remove optimistic comment if it exists
        const { reelId } = action.meta.arg;
        const currentComments = state.reelComments[reelId];
        
        if (currentComments) {
          const optimisticComment = currentComments.comments.find(c => c.isOptimistic);
          if (optimisticComment) {
            state.reelComments[reelId] = {
              ...currentComments,
              comments: currentComments.comments.filter(c => !c.isOptimistic),
            };
            
            // Revert comment count
            state.allReels = Array.isArray(state.allReels) ? state.allReels.map(reel => {
              if (reel.id === reelId) {
                return {
                  ...reel,
                  totalComments: Math.max((reel.totalComments || 0) - 1, 0),
                  commentsCount: Math.max((reel.commentsCount || 0) - 1, 0),
                };
              }
              return reel;
            }) : [];
            
            state.userReels = Array.isArray(state.userReels) ? state.userReels.map(reel => {
              if (reel.id === reelId) {
                return {
                  ...reel,
                  totalComments: Math.max((reel.totalComments || 0) - 1, 0),
                  commentsCount: Math.max((reel.commentsCount || 0) - 1, 0),
                };
              }
              return reel;
            }) : [];
          }
        }
        
        // Don't set loading: false to prevent component re-render
        return { ...state, error: action.payload };
      }),
      // Delete Reel Comment
      builder.addCase(deleteReelComment.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(deleteReelComment.fulfilled, (state, action) => {
        const { reelId, commentId } = action.payload;
        console.log("deleteReelComment.fulfilled - reelId:", reelId, "commentId:", commentId);
        
        // Remove comment from the specific reel's comments
        const currentComments = state.reelComments[reelId];
        if (currentComments) {
          const updatedComments = currentComments.comments.filter(comment => comment.id !== commentId);
          
          // Update totalComments count in allReels and userReels
          const updatedAllReels = Array.isArray(state.allReels) ? state.allReels.map(reel => {
            if (reel.id === reelId) {
              return {
                ...reel,
                totalComments: Math.max((reel.totalComments || 0) - 1, 0),
                commentsCount: Math.max((reel.commentsCount || 0) - 1, 0), // Keep both for compatibility
              };
            }
            return reel;
          }) : [];
          
          const updatedUserReels = Array.isArray(state.userReels) ? state.userReels.map(reel => {
            if (reel.id === reelId) {
              return {
                ...reel,
                totalComments: Math.max((reel.totalComments || 0) - 1, 0),
                commentsCount: Math.max((reel.commentsCount || 0) - 1, 0), // Keep both for compatibility
              };
            }
            return reel;
          }) : [];
          
          return {
            ...state,
            loading: false,
            allReels: updatedAllReels,
            userReels: updatedUserReels,
            reelComments: {
              ...state.reelComments,
              [reelId]: {
                ...currentComments,
                comments: updatedComments,
              }
            },
            error: null,
          };
        }
        
        return { ...state, loading: false, error: null };
      }),
      builder.addCase(deleteReelComment.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Delete Reel
      builder.addCase(deleteReel.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(deleteReel.fulfilled, (state, action) => {
        const { reelId } = action.payload;
        console.log("deleteReel.fulfilled - reelId:", reelId);
        
        // Remove reel from allReels and userReels
        const updatedAllReels = state.allReels.filter(reel => reel.id !== reelId);
        const updatedUserReels = state.userReels.filter(reel => reel.id !== reelId);
        
        // Remove reel comments from reelComments state
        const updatedReelComments = { ...state.reelComments };
        delete updatedReelComments[reelId];
        
        return {
          ...state,
          loading: false,
          allReels: updatedAllReels,
          userReels: updatedUserReels,
          reelComments: updatedReelComments,
          error: null,
        };
      }),
      builder.addCase(deleteReel.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Update Reel Comment
      builder.addCase(updateReelComment.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(updateReelComment.fulfilled, (state, action) => {
        const { reelId, commentId, comment } = action.payload;
        console.log("updateReelComment.fulfilled - reelId:", reelId, "commentId:", commentId, "comment:", comment);
        
        // Update comment in the specific reel's comments
        const currentComments = state.reelComments[reelId];
        if (currentComments) {
          const updatedComments = currentComments.comments.map(c => 
            c.id === commentId ? { ...c, ...comment } : c
          );
          
          return {
            ...state,
            loading: false,
            reelComments: {
              ...state.reelComments,
              [reelId]: {
                ...currentComments,
                comments: updatedComments,
              }
            },
            error: null,
          };
        }
        
        return { ...state, loading: false, error: null };
      }),
      builder.addCase(updateReelComment.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      }),
      // Get Reel Comments
      builder.addCase(getReelComments.pending, (state, action) => {
        const { reelId, page } = action.meta.arg;
        const currentComments = state.reelComments[reelId] || { comments: [], currentPage: 0, hasMore: true, loading: false };
        
        return {
          ...state,
          reelComments: {
            ...state.reelComments,
            [reelId]: {
              ...currentComments,
              loading: page === 0 ? true : false,
              loadingMore: page > 0,
            }
          },
          error: null
        };
      }),
      builder.addCase(getReelComments.fulfilled, (state, action) => {
        const { reelId, data, page, hasNext } = action.payload;
        const newComments = Array.isArray(data) ? data : [];
        const currentComments = state.reelComments[reelId] || { comments: [], currentPage: 0, hasMore: true, loading: false };
        
        console.log("getReelComments.fulfilled - reelId:", reelId, "page:", page, "newComments:", newComments.length);
        
        if (page === 0) {
          return {
            ...state,
            reelComments: {
              ...state.reelComments,
              [reelId]: {
                comments: newComments,
                currentPage: 0,
                hasMore: hasNext !== undefined ? hasNext : newComments.length > 0,
                loading: false,
                loadingMore: false,
              }
            },
            error: null,
          };
        } else {
          return {
            ...state,
            reelComments: {
              ...state.reelComments,
              [reelId]: {
                ...currentComments,
                comments: [...currentComments.comments, ...newComments],
                currentPage: page,
                hasMore: hasNext !== undefined ? hasNext : newComments.length > 0,
                loading: false,
                loadingMore: false,
              }
            },
            error: null,
          };
        }
      }),
      builder.addCase(getReelComments.rejected, (state, action) => {
        const { reelId } = action.meta.arg;
        const currentComments = state.reelComments[reelId] || { comments: [], currentPage: 0, hasMore: true, loading: false };
        
        return {
          ...state,
          reelComments: {
            ...state.reelComments,
            [reelId]: {
              ...currentComments,
              loading: false,
              loadingMore: false,
            }
          },
          error: action.payload
        };
      });

      // Get Post Likes
      builder.addCase(getPostLikes.pending, (state, action) => {
        const { postId, page } = action.meta.arg;
        if (page === 0) {
          state.postLikes[postId] = {
            likes: [],
            currentPage: 0,
            hasMore: true,
            loading: true,
          };
        } else {
          if (state.postLikes[postId]) {
            state.postLikes[postId].loading = true;
          }
        }
      }),
      builder.addCase(getPostLikes.fulfilled, (state, action) => {
        const { postId, content, page, hasNext } = action.payload;
        const likes = content || [];
        
        if (!state.postLikes[postId]) {
          state.postLikes[postId] = {
            likes: [],
            currentPage: 0,
            hasMore: true,
            loading: false,
          };
        }
        
        if (page === 0) {
          state.postLikes[postId].likes = likes;
        } else {
          state.postLikes[postId].likes = [...state.postLikes[postId].likes, ...likes];
        }
        
        state.postLikes[postId].currentPage = page;
        state.postLikes[postId].hasMore = hasNext;
        state.postLikes[postId].loading = false;
      }),
      builder.addCase(getPostLikes.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        if (state.postLikes[postId]) {
          state.postLikes[postId].loading = false;
        }
      }),

      // Get Post Comments
      builder.addCase(getPostComments.pending, (state, action) => {
        const { postId, page } = action.meta.arg;
        if (page === 0) {
          state.postComments[postId] = {
            comments: [],
            currentPage: 0,
            hasMore: true,
            loading: true,
          };
        } else {
          if (state.postComments[postId]) {
            state.postComments[postId].loading = true;
          }
        }
      }),
      builder.addCase(getPostComments.fulfilled, (state, action) => {
        const { postId, content, page, hasNext } = action.payload;
        const comments = content || [];
        
        if (!state.postComments[postId]) {
          state.postComments[postId] = {
            comments: [],
            currentPage: 0,
            hasMore: true,
            loading: false,
          };
        }
        
        if (page === 0) {
          state.postComments[postId].comments = comments;
        } else {
          state.postComments[postId].comments = [...state.postComments[postId].comments, ...comments];
        }
        
        state.postComments[postId].currentPage = page;
        state.postComments[postId].hasMore = hasNext;
        state.postComments[postId].loading = false;
      }),
      builder.addCase(getPostComments.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        if (state.postComments[postId]) {
          state.postComments[postId].loading = false;
        }
      }),

      // Like Reel Comment
      builder.addCase(likeReelComment.pending, (state, action) => {
        return { ...state, loading: true, error: null };
      }),
      builder.addCase(likeReelComment.fulfilled, (state, action) => {
        const { commentId, updatedComment } = action.payload;
        console.log("likeReelComment.fulfilled - commentId:", commentId, "updatedComment:", updatedComment);
        
        // Update the comment in all reel comments
        Object.keys(state.reelComments).forEach(reelId => {
          const reelCommentData = state.reelComments[reelId];
          if (reelCommentData && reelCommentData.comments) {
            const commentIndex = reelCommentData.comments.findIndex(comment => comment.id === commentId);
            if (commentIndex !== -1) {
              // Update the comment with new like data
              state.reelComments[reelId].comments[commentIndex] = {
                ...state.reelComments[reelId].comments[commentIndex],
                isLiked: updatedComment.isLiked,
                totalLikes: updatedComment.totalLikes
              };
              console.log("Updated reel comment in Redux:", state.reelComments[reelId].comments[commentIndex]);
            }
          }
        });
        
        return { ...state, loading: false, error: null };
      }),
      builder.addCase(likeReelComment.rejected, (state, action) => {
        return { ...state, loading: false, error: action.payload };
      });
  },
});

export const { addOptimisticReelComment, removeOptimisticReelComment } = postSlice.actions;
export default postSlice.reducer;
