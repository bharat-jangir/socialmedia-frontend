import { createSlice } from '@reduxjs/toolkit';
import { 
  getAllSuggestions, 
  getMutualSuggestions, 
  getGenderBasedSuggestions, 
  getAllTypesDetailed,
  followSuggestedUser,
  unfollowSuggestedUser,
  clearSuggestions,
  setFilterType
} from './suggestedFriends.action';

const initialState = {
  suggestions: [],
  mutualSuggestions: [],
  genderBasedSuggestions: [],
  detailedSuggestions: [],
  currentFilter: 'all', // 'all', 'mutual', 'gender', 'detailed'
  loading: false,
  error: null,
  followedUsers: [], // Track which users are being followed (serializable array)
  unfollowedUsers: [] // Track which users are being unfollowed (serializable array)
};

const suggestedFriendsSlice = createSlice({
  name: 'suggestedFriends',
  initialState,
  reducers: {
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.mutualSuggestions = [];
      state.genderBasedSuggestions = [];
      state.detailedSuggestions = [];
      state.error = null;
    },
    setFilterType: (state, action) => {
      state.currentFilter = action.payload;
    },
    updateUserFollowStatus: (state, action) => {
      const { userId, isFollowing } = action.payload;
      if (isFollowing) {
        if (!state.followedUsers.includes(userId)) {
          state.followedUsers.push(userId);
        }
        state.unfollowedUsers = state.unfollowedUsers.filter(id => id !== userId);
      } else {
        if (!state.unfollowedUsers.includes(userId)) {
          state.unfollowedUsers.push(userId);
        }
        state.followedUsers = state.followedUsers.filter(id => id !== userId);
      }
    }
  },
  extraReducers: (builder) => {
    // Get all suggestions
    builder
      .addCase(getAllSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(getAllSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get mutual suggestions
    builder
      .addCase(getMutualSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMutualSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.mutualSuggestions = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(getMutualSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get gender-based suggestions
    builder
      .addCase(getGenderBasedSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGenderBasedSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.genderBasedSuggestions = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(getGenderBasedSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get all types detailed
    builder
      .addCase(getAllTypesDetailed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTypesDetailed.fulfilled, (state, action) => {
        state.loading = false;
        state.detailedSuggestions = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(getAllTypesDetailed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Follow suggested user
    builder
      .addCase(followSuggestedUser.pending, (state, action) => {
        const userId = action.meta.arg;
        if (!state.followedUsers.includes(userId)) {
          state.followedUsers.push(userId);
        }
      })
      .addCase(followSuggestedUser.fulfilled, (state, action) => {
        const { userId } = action.payload;
        // Remove from followedUsers array since action is complete
        state.followedUsers = state.followedUsers.filter(id => id !== userId);
        
        // Update the suggestion to reflect the follow status
        const updateSuggestions = (suggestions) => {
          return suggestions.map(suggestion => 
            suggestion.id === userId 
              ? { ...suggestion, isFollowing: true, isFollowed: true }
              : suggestion
          );
        };
        
        state.suggestions = updateSuggestions(state.suggestions);
        state.mutualSuggestions = updateSuggestions(state.mutualSuggestions);
        state.genderBasedSuggestions = updateSuggestions(state.genderBasedSuggestions);
        state.detailedSuggestions = updateSuggestions(state.detailedSuggestions);
      })
      .addCase(followSuggestedUser.rejected, (state, action) => {
        const userId = action.meta.arg;
        state.followedUsers = state.followedUsers.filter(id => id !== userId);
        state.error = action.payload;
      })

    // Unfollow suggested user
    builder
      .addCase(unfollowSuggestedUser.pending, (state, action) => {
        const userId = action.meta.arg;
        if (!state.unfollowedUsers.includes(userId)) {
          state.unfollowedUsers.push(userId);
        }
      })
      .addCase(unfollowSuggestedUser.fulfilled, (state, action) => {
        const { userId } = action.payload;
        // Remove from unfollowedUsers array since action is complete
        state.unfollowedUsers = state.unfollowedUsers.filter(id => id !== userId);
        
        // Update the suggestion to reflect the unfollow status
        const updateSuggestions = (suggestions) => {
          return suggestions.map(suggestion => 
            suggestion.id === userId 
              ? { ...suggestion, isFollowing: false, isFollowed: false }
              : suggestion
          );
        };
        
        state.suggestions = updateSuggestions(state.suggestions);
        state.mutualSuggestions = updateSuggestions(state.mutualSuggestions);
        state.genderBasedSuggestions = updateSuggestions(state.genderBasedSuggestions);
        state.detailedSuggestions = updateSuggestions(state.detailedSuggestions);
      })
      .addCase(unfollowSuggestedUser.rejected, (state, action) => {
        const userId = action.meta.arg;
        state.unfollowedUsers = state.unfollowedUsers.filter(id => id !== userId);
        state.error = action.payload;
      });
  }
});

export const { updateUserFollowStatus } = suggestedFriendsSlice.actions;
export default suggestedFriendsSlice.reducer;
