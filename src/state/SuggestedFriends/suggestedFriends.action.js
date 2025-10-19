import { createAsyncThunk } from '@reduxjs/toolkit';
import suggestedFriendsService from '../../services/suggestedFriendsService';

// Action types
export const SUGGESTED_FRIENDS_TYPES = {
  GET_ALL_SUGGESTIONS: 'suggestedFriends/getAllSuggestions',
  GET_MUTUAL_SUGGESTIONS: 'suggestedFriends/getMutualSuggestions',
  GET_GENDER_BASED_SUGGESTIONS: 'suggestedFriends/getGenderBasedSuggestions',
  GET_ALL_TYPES_DETAILED: 'suggestedFriends/getAllTypesDetailed',
  FOLLOW_SUGGESTED_USER: 'suggestedFriends/followSuggestedUser',
  UNFOLLOW_SUGGESTED_USER: 'suggestedFriends/unfollowSuggestedUser',
  CLEAR_SUGGESTIONS: 'suggestedFriends/clearSuggestions',
  SET_FILTER_TYPE: 'suggestedFriends/setFilterType'
};

// Async thunks
export const getAllSuggestions = createAsyncThunk(
  SUGGESTED_FRIENDS_TYPES.GET_ALL_SUGGESTIONS,
  async (userId, { rejectWithValue }) => {
    try {
      const response = await suggestedFriendsService.getAllSuggestions(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch suggestions');
    }
  }
);

export const getMutualSuggestions = createAsyncThunk(
  SUGGESTED_FRIENDS_TYPES.GET_MUTUAL_SUGGESTIONS,
  async (userId, { rejectWithValue }) => {
    try {
      const response = await suggestedFriendsService.getMutualSuggestions(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch mutual suggestions');
    }
  }
);

export const getGenderBasedSuggestions = createAsyncThunk(
  SUGGESTED_FRIENDS_TYPES.GET_GENDER_BASED_SUGGESTIONS,
  async (userId, { rejectWithValue }) => {
    try {
      const response = await suggestedFriendsService.getGenderBasedSuggestions(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch gender-based suggestions');
    }
  }
);

export const getAllTypesDetailed = createAsyncThunk(
  SUGGESTED_FRIENDS_TYPES.GET_ALL_TYPES_DETAILED,
  async (userId, { rejectWithValue }) => {
    try {
      const response = await suggestedFriendsService.getAllTypesDetailed(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch detailed suggestions');
    }
  }
);

export const followSuggestedUser = createAsyncThunk(
  SUGGESTED_FRIENDS_TYPES.FOLLOW_SUGGESTED_USER,
  async (userId, { rejectWithValue }) => {
    try {
      const response = await suggestedFriendsService.followUser(userId);
      return { userId, response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to follow user');
    }
  }
);

export const unfollowSuggestedUser = createAsyncThunk(
  SUGGESTED_FRIENDS_TYPES.UNFOLLOW_SUGGESTED_USER,
  async (userId, { rejectWithValue }) => {
    try {
      const response = await suggestedFriendsService.unfollowUser(userId);
      return { userId, response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfollow user');
    }
  }
);

// Synchronous actions
export const clearSuggestions = () => ({
  type: SUGGESTED_FRIENDS_TYPES.CLEAR_SUGGESTIONS
});

export const setFilterType = (filterType) => ({
  type: SUGGESTED_FRIENDS_TYPES.SET_FILTER_TYPE,
  payload: filterType
});
