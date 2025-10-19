import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { api } from "../../config/api";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (loginData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        loginData.data
      );
      localStorage.setItem("token", data.token);
      console.log("Register Successful", data);
      return data;
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/signin`,
        loginData.data
      );
      localStorage.setItem("token", data.token);
      console.log("Login Successful", data);
      return data;
    } catch (error) {
      // Handle network errors gracefully
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn('Backend server not available, using mock login');
        // Create a mock user for development
        const mockUser = {
          token: 'mock-token-' + Date.now(),
          user: {
            id: 1,
            email: loginData.data.email,
            fname: 'Test',
            lname: 'User',
            profileImage: null
          }
        };
        localStorage.setItem("token", mockUser.token);
        return mockUser;
      }
      console.log(error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (jwt, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("Profile Fetched", data);
      return data;
    } catch (error) {
      // Handle network errors gracefully
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn('Backend server not available, using mock profile');
        // Return mock user profile for development
        return {
          id: 1,
          email: 'test@example.com',
          fname: 'Test',
          lname: 'User',
          profileImage: null,
          userBio: 'Test user for development'
        };
      }
      console.log(error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (reqData, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("Updating profile with data:", reqData);
      console.log("Using JWT token:", jwt ? "Token exists" : "No token found");

      const { data } = await api.put(`/api/users`, reqData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Profile Updated Successfully:", data);
      return data;
    } catch (error) {
      console.log("Error updating profile:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUserProfileImage = createAsyncThunk(
  "auth/updateUserProfileImage",
  async (imageUrl, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("Updating profile image with URL:", imageUrl);
      console.log("Using JWT token:", jwt ? "Token exists" : "No token found");

      const { data } = await api.put(
        `/api/users/profile-image`,
        imageUrl, // Send as raw string since server expects just the URL
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "text/plain", // Use text/plain to avoid JSON.stringify
          },
        }
      );
      console.log("Profile Image Updated Successfully:", data);
      return data;
    } catch (error) {
      console.log("Error updating profile image:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUserCoverImage = createAsyncThunk(
  "auth/updateUserCoverImage",
  async (imageUrl, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("token");
      console.log("Updating cover image with URL:", imageUrl);
      console.log("Using JWT token:", jwt ? "Token exists" : "No token found");

      const { data } = await api.put(
        `/api/users/cover-image`,
        imageUrl, // Send as raw string since server expects just the URL
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "text/plain", // Use text/plain to avoid JSON.stringify
          },
        }
      );
      console.log("Cover Image Updated Successfully:", data);
      return data;
    } catch (error) {
      console.log("Error updating cover image:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  "auth/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/api/users/search?query=${query}`
      );
      console.log("Users Searched", data);
      return data;
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

export const followUser = createAsyncThunk(
  "auth/followUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/users/follow/${userId}`);
      console.log("User Followed", data);
      return { userId, data };
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);

export const unfollowUser = createAsyncThunk(
  "auth/unfollowUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/users/unfollow/${userId}`);
      console.log("User Unfollowed", data);
      return { userId, data };
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);
