import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming this is your auth hook

const SuperAdminRoute = () => {
  const { user, loading } = useAuth(); // Get user from your AuthContext

  if (loading) {
    return <div>Loading...</div>; // Or your loading spinner component
  }

  // Check if user is loaded, logged in, AND has the 'superadmin' role
  return user && user.role === 'superadmin' ? (
    <Outlet /> // Render the nested superadmin pages
  ) : (
    <Navigate to="/login" replace /> // Redirect to login if not a superadmin
  );
};

export default SuperAdminRoute;