import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../config/api";

// Get all likes for a post with pagination
export const getPostLikes = createAsyncThunk(
  "post/getPostLikes",
  async ({ postId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/posts/${postId}/likes?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log(`Post ${postId} Likes Fetched:`, data);
      return { postId, ...data };
    } catch (error) {
      console.log("Error fetching post likes:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all comments for a post with pagination
export const getPostComments = createAsyncThunk(
  "post/getPostComments",
  async ({ postId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/posts/${postId}/comments?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log(`Post ${postId} Comments Fetched:`, data);
      console.log("Comments structure check:", {
        hasContent: !!data.content,
        contentLength: data.content?.length,
        firstComment: data.content?.[0],
        firstCommentStructure: data.content?.[0] ? {
          hasId: !!data.content[0].id,
          hasIsLiked: 'isLiked' in data.content[0],
          hasTotalLikes: 'totalLikes' in data.content[0],
          isLikedValue: data.content[0].isLiked,
          totalLikesValue: data.content[0].totalLikes
        } : null
      });
      return { postId, ...data };
    } catch (error) {
      console.log("Error fetching post comments:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
