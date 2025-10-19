import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }) {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const [token, setToken] = useState(null);
  const location = useLocation();

  // Get token once on mount
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  // If loading, show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no token or no user, redirect to login
  if (!token || !user) {
    console.log("No token or user found, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the protected component
  return children;
}

export default ProtectedRoute;
