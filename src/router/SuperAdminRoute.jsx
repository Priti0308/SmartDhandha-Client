import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const SuperAdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // --- THIS IS THE FIX ---
  // 1. Get the role (if user exists) and convert it to lowercase
  const userRole = user ? user.role.toLowerCase() : '';
  
  // 2. Check against the lowercase string
  const isAuthorized = userRole === 'superadmin';

  return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default SuperAdminRoute;