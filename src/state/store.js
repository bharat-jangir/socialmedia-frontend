import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  updateUserProfileImage,
  updateUserCoverImage,
  searchUsers,
  followUser,
  unfollowUser,
} from "./Auth/authActions";

const initialState = {
  jwt: null,
  loading: false,
  error: null,
  user: null,
  users: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: (state) => {
      return { ...state, user: null, jwt: null, loading: false, error: null };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(registerUser.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      return {
        ...state,
        loading: false,
        jwt: action.payload.token,
        error: null,
      };
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(loginUser.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      return {
        ...state,
        loading: false,
        jwt: action.payload.token,
        error: null,
      };
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(getUserProfile.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(getUserProfile.fulfilled, (state, action) => {
      return { ...state, loading: false, user: action.payload, error: null };
    });
    builder.addCase(getUserProfile.rejected, (state, action) => {
      // If token validation fails, clear auth state
      localStorage.removeItem("token");
      return { ...state, loading: false, user: null, jwt: null, error: action.payload };
    });
    builder.addCase(updateUserProfile.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      return { ...state, loading: false, user: action.payload, error: null };
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(updateUserProfileImage.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(updateUserProfileImage.fulfilled, (state, action) => {
      return { ...state, loading: false, user: action.payload, error: null };
    });
    builder.addCase(updateUserProfileImage.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(updateUserCoverImage.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(updateUserCoverImage.fulfilled, (state, action) => {
      return { ...state, loading: false, user: action.payload, error: null };
    });
    builder.addCase(updateUserCoverImage.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(searchUsers.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(searchUsers.fulfilled, (state, action) => {
      return { ...state, loading: false, users: action.payload, error: null };
    });
    builder.addCase(searchUsers.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(followUser.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(followUser.fulfilled, (state, action) => {
      return { ...state, loading: false, error: null };
    });
    builder.addCase(followUser.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
    builder.addCase(unfollowUser.pending, (state, action) => {
      return { ...state, loading: true, error: null };
    });
    builder.addCase(unfollowUser.fulfilled, (state, action) => {
      return { ...state, loading: false, error: null };
    });
    builder.addCase(unfollowUser.rejected, (state, action) => {
      return { ...state, loading: false, error: action.payload };
    });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
