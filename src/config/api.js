import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://socialmedia-backend-o9n1.onrender.com";

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

// Add response interceptor to handle 401 errors and redirect to login
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
    }
    return Promise.reject(error);
  }
);
