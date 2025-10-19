import { createSlice } from "@reduxjs/toolkit";
import {
  createStory,
  getStoryById,
  getUserStories,
  getFollowingStories,
  deleteStory,
  viewStory,
  likeStory,
  unlikeStory,
  replyToStory,
  getUnreadReplies,
  markReplyAsRead,
  getStoryAnalytics,
} from "./story.action";

const initialState = {
  // Stories data
  followingStories: [], // Stories from following users
  userStories: {}, // User stories by userId
  currentStory: null, // Currently viewed story
  unreadReplies: [], // Unread story replies
  
  // Pagination for following stories
  followingStoriesPage: 0,
  followingStoriesSize: 10,
  followingStoriesHasMore: true,
  followingStoriesLoading: false,
  
  // Analytics
  storyAnalytics: {}, // Analytics by storyId
  
  // UI state
  loading: false,
  error: null,
  
  // Story modal state
  storyModalOpen: false,
  selectedStoryIndex: 0,
  selectedUserStories: [],
  
  // Create story state
  createStoryModalOpen: false,
  creatingStory: false,
};

const storySlice = createSlice({
  name: "story",
  initialState,
  reducers: {
    // Story modal actions
    openStoryModal: (state, action) => {
      const { userStories, initialIndex = 0 } = action.payload;
      state.storyModalOpen = true;
      state.selectedUserStories = userStories;
      state.selectedStoryIndex = initialIndex;
    },
    
    closeStoryModal: (state) => {
      state.storyModalOpen = false;
      state.selectedUserStories = [];
      state.selectedStoryIndex = 0;
      state.currentStory = null;
    },
    
    nextStory: (state) => {
      if (state.selectedStoryIndex < state.selectedUserStories.length - 1) {
        state.selectedStoryIndex += 1;
      }
    },
    
    previousStory: (state) => {
      if (state.selectedStoryIndex > 0) {
        state.selectedStoryIndex -= 1;
      }
    },

    setSelectedStoryIndex: (state, action) => {
      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex < state.selectedUserStories.length) {
        state.selectedStoryIndex = newIndex;
      }
    },
    
    // Mark story as viewed locally
    markStoryAsViewed: (state, action) => {
      const { storyId } = action.payload;
      
      // Update in followingStories
      state.followingStories.forEach(userStory => {
        userStory.stories.forEach(story => {
          if (story.id === storyId) {
            story.isViewed = true;
          }
        });
        // Update hasUnviewedStories flag
        userStory.hasUnviewedStories = userStory.stories.some(story => !story.isViewed);
      });
      
      // Update in userStories
      Object.keys(state.userStories).forEach(userId => {
        if (state.userStories[userId]) {
          state.userStories[userId].forEach(story => {
            if (story.id === storyId) {
              story.isViewed = true;
            }
          });
        }
      });
    },
    
    // Create story modal actions
    openCreateStoryModal: (state) => {
      state.createStoryModalOpen = true;
    },
    
    closeCreateStoryModal: (state) => {
      state.createStoryModalOpen = false;
    },
    
    // Clear error
    clearStoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Story
    builder.addCase(createStory.pending, (state) => {
      state.creatingStory = true;
      state.error = null;
    });
    builder.addCase(createStory.fulfilled, (state, action) => {
      state.creatingStory = false;
      state.createStoryModalOpen = false;
      state.error = null;
      // Add to user's stories
      const story = action.payload;
      const userId = story.user?.id;
      if (userId) {
        if (!state.userStories[userId]) {
          state.userStories[userId] = [];
        }
        state.userStories[userId].unshift(story);
        
        // Also add to followingStories if the current user is in the following list
        const currentUserStoryIndex = state.followingStories.findIndex(
          userStory => userStory.user.id === userId
        );
        
        if (currentUserStoryIndex !== -1) {
          // User exists in followingStories, add the new story
          // Mark the new story as unviewed for the current user
          const newStory = { ...story, isViewed: false };
          state.followingStories[currentUserStoryIndex].stories.unshift(newStory);
          // Update hasUnviewedStories flag
          state.followingStories[currentUserStoryIndex].hasUnviewedStories = 
            state.followingStories[currentUserStoryIndex].stories.some(s => !s.isViewed);
        } else {
          // User doesn't exist in followingStories, add them with the new story
          const newStory = { ...story, isViewed: false };
          const newUserStory = {
            user: story.user,
            stories: [newStory],
            hasUnviewedStories: true
          };
          state.followingStories.unshift(newUserStory);
        }
      }
    });
    builder.addCase(createStory.rejected, (state, action) => {
      state.creatingStory = false;
      state.error = action.payload;
    });

    // Get Story by ID
    builder.addCase(getStoryById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getStoryById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentStory = action.payload;
      state.error = null;
    });
    builder.addCase(getStoryById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get User Stories
    builder.addCase(getUserStories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserStories.fulfilled, (state, action) => {
      state.loading = false;
      const { userId, stories } = action.payload;
      state.userStories[userId] = stories;
      state.error = null;
    });
    builder.addCase(getUserStories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get Following Stories
    builder.addCase(getFollowingStories.pending, (state) => {
      state.followingStoriesLoading = true;
      state.error = null;
    });
    builder.addCase(getFollowingStories.fulfilled, (state, action) => {
      state.followingStoriesLoading = false;
      console.log("getFollowingStories.fulfilled - action.payload:", action.payload);
      
      // Extract data from API response - backend returns userStories array
      const { userStories, currentPage, hasNext } = action.payload;
      
      console.log("getFollowingStories.fulfilled - extracted:", { userStories, currentPage, hasNext });
      
      if (currentPage === 0) {
        // First page - replace stories
        state.followingStories = userStories || [];
        console.log("getFollowingStories.fulfilled - replaced stories:", userStories);
      } else {
        // Subsequent pages - append stories
        state.followingStories = [...state.followingStories, ...(userStories || [])];
        console.log("getFollowingStories.fulfilled - appended stories:", userStories);
      }
      
      state.followingStoriesPage = currentPage;
      state.followingStoriesHasMore = hasNext;
      state.error = null;
      
      console.log("getFollowingStories.fulfilled - final state:", {
        followingStories: state.followingStories,
        page: state.followingStoriesPage,
        hasMore: state.followingStoriesHasMore
      });
    });
    builder.addCase(getFollowingStories.rejected, (state, action) => {
      state.followingStoriesLoading = false;
      state.error = action.payload;
    });

    // Delete Story
    builder.addCase(deleteStory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteStory.fulfilled, (state, action) => {
      state.loading = false;
      const { storyId } = action.payload;
      
      // Remove from user stories
      Object.keys(state.userStories).forEach(userId => {
        state.userStories[userId] = state.userStories[userId].filter(
          story => story.id !== storyId
        );
      });
      
      // Remove from following stories
      state.followingStories = state.followingStories.map(userStory => ({
        ...userStory,
        stories: userStory.stories.filter(story => story.id !== storyId)
      }));
      
      state.error = null;
    });
    builder.addCase(deleteStory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // View Story
    builder.addCase(viewStory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(viewStory.fulfilled, (state, action) => {
      state.loading = false;
      const { storyId, data } = action.payload;
      
      // Update story views in user stories
      Object.keys(state.userStories).forEach(userId => {
        state.userStories[userId] = state.userStories[userId].map(story =>
          story.id === storyId ? { ...story, ...data } : story
        );
      });
      
      // Update story views in following stories
      state.followingStories = state.followingStories.map(userStory => ({
        ...userStory,
        stories: userStory.stories.map(story =>
          story.id === storyId ? { ...story, ...data } : story
        )
      }));
      
      state.error = null;
    });
    builder.addCase(viewStory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Like Story
    builder.addCase(likeStory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(likeStory.fulfilled, (state, action) => {
      state.loading = false;
      const { storyId, data, userId } = action.payload;
      
      // Update story likes in user stories
      Object.keys(state.userStories).forEach(userIdKey => {
        state.userStories[userIdKey] = state.userStories[userIdKey].map(story =>
          story.id === storyId ? { ...story, ...data } : story
        );
      });
      
      // Update story likes in following stories
      state.followingStories = state.followingStories.map(userStory => ({
        ...userStory,
        stories: userStory.stories.map(story =>
          story.id === storyId ? { ...story, ...data } : story
        )
      }));
      
      state.error = null;
    });
    builder.addCase(likeStory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Unlike Story
    builder.addCase(unlikeStory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(unlikeStory.fulfilled, (state, action) => {
      state.loading = false;
      const { storyId, data, userId } = action.payload;
      
      // Update story likes in user stories
      Object.keys(state.userStories).forEach(userIdKey => {
        state.userStories[userIdKey] = state.userStories[userIdKey].map(story =>
          story.id === storyId ? { ...story, ...data } : story
        );
      });
      
      // Update story likes in following stories
      state.followingStories = state.followingStories.map(userStory => ({
        ...userStory,
        stories: userStory.stories.map(story =>
          story.id === storyId ? { ...story, ...data } : story
        )
      }));
      
      state.error = null;
    });
    builder.addCase(unlikeStory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Reply to Story
    builder.addCase(replyToStory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(replyToStory.fulfilled, (state, action) => {
      state.loading = false;
      const { storyId, reply, currentUser } = action.payload;
      
      // Add reply to story in user stories
      Object.keys(state.userStories).forEach(userId => {
        state.userStories[userId] = state.userStories[userId].map(story => {
          if (story.id === storyId) {
            const updatedReplies = [...(story.replies || []), reply];
            return { ...story, replies: updatedReplies, totalReplies: updatedReplies.length };
          }
          return story;
        });
      });
      
      // Add reply to story in following stories
      state.followingStories = state.followingStories.map(userStory => ({
        ...userStory,
        stories: userStory.stories.map(story => {
          if (story.id === storyId) {
            const updatedReplies = [...(story.replies || []), reply];
            return { ...story, replies: updatedReplies, totalReplies: updatedReplies.length };
          }
          return story;
        })
      }));
      
      state.error = null;
    });
    builder.addCase(replyToStory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get Unread Replies
    builder.addCase(getUnreadReplies.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUnreadReplies.fulfilled, (state, action) => {
      state.loading = false;
      state.unreadReplies = action.payload;
      state.error = null;
    });
    builder.addCase(getUnreadReplies.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Mark Reply as Read
    builder.addCase(markReplyAsRead.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(markReplyAsRead.fulfilled, (state, action) => {
      state.loading = false;
      const { replyId } = action.payload;
      state.unreadReplies = state.unreadReplies.filter(reply => reply.id !== replyId);
      state.error = null;
    });
    builder.addCase(markReplyAsRead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Get Story Analytics
    builder.addCase(getStoryAnalytics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getStoryAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      const { storyId, analytics } = action.payload;
      state.storyAnalytics[storyId] = analytics;
      state.error = null;
    });
    builder.addCase(getStoryAnalytics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const {
  openStoryModal,
  closeStoryModal,
  nextStory,
  previousStory,
  setSelectedStoryIndex,
  markStoryAsViewed,
  openCreateStoryModal,
  closeCreateStoryModal,
  clearStoryError,
} = storySlice.actions;

export default storySlice.reducer;
