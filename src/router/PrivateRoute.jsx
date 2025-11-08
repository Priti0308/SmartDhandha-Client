import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // Change if using another auth method
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
