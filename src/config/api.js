import axios from "axios";

// Production backend URL (fallback if environment variable is not set)
const PRODUCTION_API_URL = "https://socialmedia-backend-o9n1.onrender.com";

// API base URL from environment variable or fallback to production URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PRODUCTION_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      console.log("Token invalid or expired, redirecting to login");
      localStorage.removeItem("token");
      
      // Only redirect if we're not already on auth pages and not in a loop
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && 
          !currentPath.includes('/register') && 
          !currentPath.includes('/auth') &&
          !error.config?.url?.includes('/auth/signin') &&
          !error.config?.url?.includes('/auth/signup')) {
        // Use setTimeout to prevent infinite loops
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else if (error.response?.status === 400) {
      // Bad Request - log the error details
      console.error("Bad Request Error:", error.response.data);
      console.error("Request URL:", error.config?.url);
      console.error("Request Method:", error.config?.method);
    }
    return Promise.reject(error);
  }
);
