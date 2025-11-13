import axios from 'axios';

// --- THIS IS THE FIX ---
// We get the token directly from "authToken", just like your authService does.
const getToken = () => {
  return localStorage.getItem('authToken'); 
}

// Create an Axios instance for your API
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = 'https://smartbusiness-rr4o.onrender.com/api/superadmin'; 

const getAuthHeaders = () => {
  const token = getToken(); // This will now find the correct token
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Fetches the system-wide stats from the backend
 */
export const getSystemStats = async () => {
  // We use the base API_URL and the correct endpoint
  const response = await axios.get(`${API_URL}/stats`, getAuthHeaders());
  return response.data;
};

/**
 * Fetches all users from the backend
 */
export const getAllUsers = async () => {
  const response = await axios.get(`${API_URL}/users`, getAuthHeaders());
  return response.data;
};

/**
 * Deletes a user by ID
 */
export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API_URL}/users/${userId}`, getAuthHeaders());
  return response.data;
};

export const approveUser = async (userId) => {
  const response = await axios.patch(`${API_URL}/users/${userId}/approve`, {}, getAuthHeaders());
  return response.data;
};

/**
 * Updates the superadmin's own settings
 */
export const updateMySettings = async (settingsData) => {
  // settingsData will be an object like { mobile, password }
  const response = await axios.patch(`${API_URL}/settings`, settingsData, getAuthHeaders());
  return response.data;
};
// Bundle all functions into a single service object
const superAdminService = {
  getSystemStats,
  getAllUsers,
  deleteUser,
  approveUser,
  updateMySettings,
};

export default superAdminService;