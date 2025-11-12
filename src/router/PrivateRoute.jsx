import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"; // Or AuthCntext, whatever your file is

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Get user AND loading state from context
  const location = useLocation();

  // 1. If it's still loading, show a loading screen.
  // This is the CRITICAL fix. It waits for the /me API call.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // 2. If it's done loading and there is NO user, redirect to login.
  if (!user) {
    // Redirect them to the /login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If it's done loading and there IS a user, show the page.
  return children;
};

export default PrivateRoute;