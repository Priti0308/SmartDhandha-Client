// src/services/authService.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://smartbusiness-rr4o.onrender.com/api/auth", // adjust if your routes differ
});

// Register user
export const registerUser = async (userData) => {
  const { data } = await API.post("/register", userData);
  return data;
};

export const sendOtp = async (email) => {
  const { data } = await API.post("/send-otp", { email });
  return data;
};

// Login user
export const loginUser = async (credentials) => {
  const { data } = await API.post("/login", credentials);

  // Store token in localStorage
  if (data.token) {
    localStorage.setItem("authToken", data.token);
  }

  return data;
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem("authToken");
};

// Get stored token
export const getToken = () => {
  return localStorage.getItem("authToken");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};
