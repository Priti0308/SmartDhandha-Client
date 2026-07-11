import axios from 'axios';
import getBaseURL from './apiClient';

const getToken = () => {
  return localStorage.getItem('authToken'); 
}

const API_URL = getBaseURL('admin'); 

const getAuthHeaders = () => {
  const token = getToken(); 
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
 * Updates the admin's own settings
 */
export const updateMySettings = async (settingsData) => {
  const response = await axios.patch(`${API_URL}/settings`, settingsData, getAuthHeaders());
  return response.data;
};

/**
 * Updates a user's details by admin
 */
export const updateUser = async (userId, userData) => {
  const response = await axios.patch(`${API_URL}/users/${userId}`, userData, getAuthHeaders());
  return response.data;
};

// Bundle all functions into a single service object
const adminService = {
  getSystemStats,
  getAllUsers,
  deleteUser,
  approveUser,
  updateMySettings,
  updateUser,
};

export default adminService;
