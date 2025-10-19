import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../config/api";

// Create a new story
export const createStory = createAsyncThunk(
  "story/createStory",
  async (storyData, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post("/api/stories", storyData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Created", data);
      return data;
    } catch (error) {
      console.log("Error creating story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get story by ID
export const getStoryById = createAsyncThunk(
  "story/getStoryById",
  async (storyId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/stories/${storyId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story by ID", data);
      return data;
    } catch (error) {
      console.log("Error fetching story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get user's active stories
export const getUserStories = createAsyncThunk(
  "story/getUserStories",
  async (userId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/stories/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("User Stories", data);
      return { userId, stories: data };
    } catch (error) {
      console.log("Error fetching user stories:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get stories from following users (Instagram-like feed)
export const getFollowingStories = createAsyncThunk(
  "story/getFollowingStories",
  async ({ page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("getFollowingStories - Making API call with:", { page, size, jwt: !!jwt });
      const { data } = await api.get(`/api/stories/following/paginated?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Following Stories Paginated Response:", data);
      // Return the data as-is since backend already has the correct structure
      return data;
    } catch (error) {
      console.log("Error fetching following stories:", error.response?.data || error.message);
      console.log("Error details:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete a story
export const deleteStory = createAsyncThunk(
  "story/deleteStory",
  async (storyId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.delete(`/api/stories/${storyId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Deleted", data);
      return { storyId, data };
    } catch (error) {
      console.log("Error deleting story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// View a story
export const viewStory = createAsyncThunk(
  "story/viewStory",
  async (storyId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/stories/${storyId}/view`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Viewed", data);
      return { storyId, data };
    } catch (error) {
      console.log("Error viewing story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Like a story
export const likeStory = createAsyncThunk(
  "story/likeStory",
  async (storyId, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/stories/${storyId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Liked", data);
      const state = getState();
      const currentUserId = state.auth?.user?.id;
      return { storyId, data, userId: currentUserId };
    } catch (error) {
      console.log("Error liking story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Unlike a story
export const unlikeStory = createAsyncThunk(
  "story/unlikeStory",
  async (storyId, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.delete(`/api/stories/${storyId}/like`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Unliked", data);
      const state = getState();
      const currentUserId = state.auth?.user?.id;
      return { storyId, data, userId: currentUserId };
    } catch (error) {
      console.log("Error unliking story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Reply to a story
export const replyToStory = createAsyncThunk(
  "story/replyToStory",
  async ({ storyId, replyText }, { rejectWithValue, getState }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post("/api/stories/reply", {
        storyId,
        replyText,
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Reply", data);
      const state = getState();
      const currentUser = state.auth?.user;
      return { storyId, reply: data, currentUser };
    } catch (error) {
      console.log("Error replying to story:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get unread story replies
export const getUnreadReplies = createAsyncThunk(
  "story/getUnreadReplies",
  async (_, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get("/api/stories/replies/unread", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Unread Replies", data);
      return data;
    } catch (error) {
      console.log("Error fetching unread replies:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Mark reply as read
export const markReplyAsRead = createAsyncThunk(
  "story/markReplyAsRead",
  async (replyId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/stories/replies/${replyId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Reply Marked as Read", data);
      return { replyId, data };
    } catch (error) {
      console.log("Error marking reply as read:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get story analytics
export const getStoryAnalytics = createAsyncThunk(
  "story/getStoryAnalytics",
  async (storyId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/stories/${storyId}/analytics`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Story Analytics", data);
      return { storyId, analytics: data };
    } catch (error) {
      console.log("Error fetching story analytics:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
