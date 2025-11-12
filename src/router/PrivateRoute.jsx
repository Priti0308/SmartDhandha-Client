import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Or AuthCntext, whatever your file is

const PrivateRoute = () => {
  const { user, loading } = useAuth(); // Get user and loading state

  // 1. If it's still loading, show a loading screen.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // 2. If it's done loading, check the user and their role
  // We ONLY want to show the page if the user exists AND their role is 'user' or 'admin'.
  const isAuthorized = user && (user.role === 'user' || user.role === 'admin');

  // 3. If they are authorized, show the nested page (Dashboard, Ledger, etc.)
  // If not, redirect them to login.
  return isAuthorized ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;