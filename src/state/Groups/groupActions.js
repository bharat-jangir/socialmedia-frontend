import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../config/api";

// Create a new group
export const createGroup = createAsyncThunk(
  "groups/createGroup",
  async (groupData, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post("/api/groups", groupData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group created successfully:", data);
      return data;
    } catch (error) {
      console.error("Error creating group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get user's groups
export const getUserGroups = createAsyncThunk(
  "groups/getUserGroups",
  async (_, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      if (!jwt) {
        throw new Error("No authentication token found");
      }
      
      const { data } = await api.get("/api/groups", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("User groups retrieved:", data);
      return data;
    } catch (error) {
      console.error("Error fetching user groups:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get user's groups with pagination
export const getUserGroupsPaginated = createAsyncThunk(
  "groups/getUserGroupsPaginated",
  async ({ page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/groups/paginated?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("User groups retrieved (paginated):", data);
      return data;
    } catch (error) {
      console.error("Error fetching user groups (paginated):", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get group by ID
export const getGroupById = createAsyncThunk(
  "groups/getGroupById",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Group retrieved by ID:", data);
      return data;
    } catch (error) {
      console.error("Error fetching group by ID:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update group
export const updateGroup = createAsyncThunk(
  "groups/updateGroup",
  async ({ groupId, updateData }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/groups/${groupId}`, updateData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group updated successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error updating group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete group
export const deleteGroup = createAsyncThunk(
  "groups/deleteGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.delete(`/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Group deleted successfully:", data);
      return groupId;
    } catch (error) {
      console.error("Error deleting group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Join group
export const joinGroup = createAsyncThunk(
  "groups/joinGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Joined group successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error joining group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Leave group
export const leaveGroup = createAsyncThunk(
  "groups/leaveGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/leave`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Left group successfully:", data);
      return groupId;
    } catch (error) {
      console.error("Error leaving group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add member to group
export const addGroupMember = createAsyncThunk(
  "groups/addGroupMember",
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/members`, { memberId }, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Member added to group successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error adding member to group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Remove member from group
export const removeGroupMember = createAsyncThunk(
  "groups/removeGroupMember",
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.delete(`/api/groups/${groupId}/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Member removed from group successfully:", data);
      return { groupId, memberId };
    } catch (error) {
      console.error("Error removing member from group:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Mute/Unmute group
export const toggleGroupMute = createAsyncThunk(
  "groups/toggleGroupMute",
  async ({ groupId, memberId, isMuted }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/groups/${groupId}/members/${memberId}/mute`, { isMuted }, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group mute status updated:", data);
      return { groupId, memberId, isMuted };
    } catch (error) {
      console.error("Error updating group mute status:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Pin/Unpin group
export const toggleGroupPin = createAsyncThunk(
  "groups/toggleGroupPin",
  async ({ groupId, memberId, isPinned }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/groups/${groupId}/members/${memberId}/pin`, { isPinned }, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group pin status updated:", data);
      return { groupId, memberId, isPinned };
    } catch (error) {
      console.error("Error updating group pin status:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get group members
export const getGroupMembers = createAsyncThunk(
  "groups/getGroupMembers",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/groups/${groupId}/members`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Group members retrieved:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error fetching group members:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get group admins
export const getGroupAdmins = createAsyncThunk(
  "groups/getGroupAdmins",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/groups/${groupId}/admins`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Group admins retrieved:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error fetching group admins:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get public groups
export const getPublicGroups = createAsyncThunk(
  "groups/getPublicGroups",
  async (_, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get("/api/groups/public", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Public groups retrieved:", data);
      return data;
    } catch (error) {
      console.error("Error fetching public groups:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Search groups
export const searchGroups = createAsyncThunk(
  "groups/searchGroups",
  async (query, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/groups/search?query=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Groups search completed:", data);
      return data;
    } catch (error) {
      console.error("Error searching groups:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update group image
export const updateGroupImage = createAsyncThunk(
  "groups/updateGroupImage",
  async ({ groupId, imageUrl }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/groups/${groupId}/image`, imageUrl, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group image updated successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error updating group image:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update group cover image
export const updateGroupCoverImage = createAsyncThunk(
  "groups/updateGroupCoverImage",
  async ({ groupId, coverImageUrl }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.put(`/api/groups/${groupId}/cover-image`, coverImageUrl, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group cover image updated successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error updating group cover image:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get group messages
export const getGroupMessages = createAsyncThunk(
  "groups/getGroupMessages",
  async ({ groupId, page = 0, size = 50 }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.get(`/api/groups/${groupId}/messages?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Group messages retrieved:", data);
      // Handle different response structures
      let messages = [];
      if (Array.isArray(data)) {
        messages = data;
        console.log("Using direct array:", messages);
      } else if (data.data && data.data.content && Array.isArray(data.data.content)) {
        messages = data.data.content;
        console.log("Using data.data.content:", messages);
      } else if (data.data && Array.isArray(data.data)) {
        messages = data.data;
        console.log("Using data.data:", messages);
      } else if (data.content && Array.isArray(data.content)) {
        messages = data.content;
        console.log("Using data.content:", messages);
      } else if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages;
        console.log("Using data.messages:", messages);
      } else {
        console.log("No valid messages array found in response:", data);
        console.log("Available keys in data:", Object.keys(data));
        if (data.data) {
          console.log("Available keys in data.data:", Object.keys(data.data));
        }
      }
      console.log("Final messages array:", messages);
      return { groupId, messages };
    } catch (error) {
      console.error("Error fetching group messages:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Send group message
export const sendGroupMessage = createAsyncThunk(
  "groups/sendGroupMessage",
  async ({ groupId, messageData }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/messages`, messageData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group message sent successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error sending group message:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Send group media message
export const sendGroupMediaMessage = createAsyncThunk(
  "groups/sendGroupMediaMessage",
  async ({ groupId, mediaData }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/messages/media`, mediaData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group media message sent successfully:", data);
      return { groupId, data };
    } catch (error) {
      console.error("Error sending group media message:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add reaction to group message
export const addGroupMessageReaction = createAsyncThunk(
  "groups/addGroupMessageReaction",
  async ({ groupId, messageId, emoji }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/messages/${messageId}/reactions`, { emoji }, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Group message reaction added successfully:", data);
      return { groupId, messageId, data };
    } catch (error) {
      console.error("Error adding group message reaction:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Mark group messages as read
export const markGroupMessagesAsRead = createAsyncThunk(
  "groups/markGroupMessagesAsRead",
  async (groupId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      const { data } = await api.post(`/api/groups/${groupId}/messages/read`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Group messages marked as read:", data);
      return groupId;
    } catch (error) {
      console.error("Error marking group messages as read:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

