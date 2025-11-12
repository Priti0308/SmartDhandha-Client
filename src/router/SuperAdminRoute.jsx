import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Or AuthCntext

const SuperAdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Check if user is loaded, logged in, AND has the 'superadmin' role
  const isAuthorized = user && user.role === 'superadmin';

  return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default SuperAdminRoute;