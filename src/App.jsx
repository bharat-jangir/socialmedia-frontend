import Authentication from "./Pages/Authentication/Authentication";
import HomePage from "./Pages/HomePage";
import Message from "./Pages/Message";
import { Routes, Route } from "react-router-dom";
// import Reels from "./components/Reels";
// import CreateReelsForm from "./components/CreateReelsForm";
// import Profile from "./Pages/Profile";
import Login from "./Pages/Authentication/Login";
import Register from "./Pages/Authentication/Register";
import { useSelector, useDispatch } from "react-redux";
import { getUserProfile } from "./state/Auth/authActions";
import { clearAuth } from "./state/store";
import { useEffect, useRef } from "react";
import Feed from "./components/Feed";
import { getAllPosts, getSavedPostIds } from "./state/Post/post.action";
import { CustomThemeProvider } from "./context/ThemeContext";
import { AppLoadingSkeleton } from "./components/SkeletonLoader";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import WebSocketService from "./utils/sockets";
// import WebSocketStatus from "./components/WebSocketStatus"; // Commented out - using ConnectionStatusDot in bottom navigation instead

function App() {
  const dispatch = useDispatch();
  const hasInitialized = useRef(false);
  
  // Get auth state first
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const jwt = useSelector((state) => state.auth.jwt);
  const error = useSelector((state) => state.auth.error);

  useEffect(() => {
    // Only run once on app initialization
    if (hasInitialized.current) return;
    
    const token = localStorage.getItem("token");
    console.log("🔐 App - Initializing authentication:", {
      hasToken: !!token,
      hasUser: !!user,
      loading: loading,
      token: token ? "Token exists" : "No token"
    });
    
    if (token && !user && !loading) {
      // Only fetch user profile if we have a token but no user and not loading
      console.log("🔐 App - Fetching user profile with token");
      dispatch(getUserProfile(token));
    } else if (!token && user) {
      // Clear auth state if no token but user exists
      console.log("🔐 App - Clearing auth state - no token but user exists");
      dispatch(clearAuth());
    } else if (!token && !user) {
      console.log("🔐 App - No token and no user - user needs to login");
    } else if (token && user) {
      console.log("🔐 App - User already authenticated");
    }
    
    hasInitialized.current = true;
  }, [dispatch, user, loading]);

  // Initialize WebSocket connection and load saved post IDs when user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      console.log("🚀 App.jsx - Initializing WebSocket connection for user:", user.email);
      console.log("🚀 App.jsx - User object:", user);
      console.log("🚀 App.jsx - User ID:", user.id);
      console.log("🚀 App.jsx - Token exists:", !!token);
      WebSocketService.initializeWebSocketConnection(user).then(() => {
        console.log("WebSocket connection established successfully");
        console.log("WebSocket isConnected:", WebSocketService.isConnected);
      }).catch(error => {
        console.error("Failed to initialize WebSocket:", error);
      });
      
      // Load saved post IDs for the current user
      console.log("Loading saved post IDs for user:", user.id);
      dispatch(getSavedPostIds());
    } else if (!user) {
      // Disconnect WebSocket when user logs out
      WebSocketService.disconnectWebSocket();
    }
  }, [user, dispatch]);

  // Cleanup WebSocket on page unload to prevent notification spam
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("Page unloading, disconnecting WebSocket");
      WebSocketService.disconnectWebSocket();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, but keeping WebSocket connection for real-time updates");
        // Don't disconnect on page hidden - keep connection for real-time updates
        // Only disconnect on actual page unload
      } else if (user && jwt && !WebSocketService.isConnected) {
        console.log("Page visible and WebSocket not connected, reconnecting...");
        WebSocketService.initializeWebSocketConnection(user).catch(error => {
          console.error("Failed to reconnect WebSocket:", error);
        });
      } else if (user && jwt && WebSocketService.isConnected) {
        console.log("Page visible and WebSocket already connected");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, jwt]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  console.log("App State - User:", user, "Loading:", loading, "JWT:", jwt, "Error:", error, "HasInitialized:", hasInitialized.current);

  // Show loading state when we have a token but no user yet, or when loading
  const token = localStorage.getItem("token");
  if ((token && !user && loading) || (token && !user && !hasInitialized.current)) {
    console.log("🔐 App - Showing loading state:", {
      hasToken: !!token,
      hasUser: !!user,
      loading: loading,
      hasInitialized: hasInitialized.current
    });
    return (
      <CustomThemeProvider>
        <AppLoadingSkeleton />
      </CustomThemeProvider>
    );
  }

  // If there's an auth error and no user, ensure we're on auth pages
  if (error && !user && !loading) {
    console.log("Auth error detected, user should be redirected to login");
  }

  return (
    <CustomThemeProvider>
      <NotificationProvider>
        <Routes>
          {user ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/feed" element={<HomePage />} />
              <Route path="/reels" element={<HomePage />} />
              <Route path="/create-reels" element={<HomePage />} />
              <Route path="/profile/:id" element={<HomePage />} />
              <Route path="/notifications" element={<HomePage />} />
              <Route path="/communities" element={<HomePage />} />
              <Route path="/message" element={<Message />} />
              <Route path="*" element={<HomePage />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Authentication />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Authentication />} />
            </>
          )}
        </Routes>
        {/* WebSocket Connection Status Monitor - Commented out, using ConnectionStatusDot in bottom navigation instead */}
        {/* <WebSocketStatus /> */}
      </NotificationProvider>
    </CustomThemeProvider>
  );
}

export default App;
