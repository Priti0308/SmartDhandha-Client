import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Get the role (if user exists) and convert it to lowercase
  const userRole = user ? user.role.toLowerCase() : '';
  
  // Check if they are the admin
  const isAuthorized = userRole === 'admin';

  return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AdminRoute;
