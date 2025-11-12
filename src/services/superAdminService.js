import axios from 'axios';

// Get the token from wherever you store it (e.g., localStorage or auth context)
// This is just an example, adjust it to your project's logic.
const getToken = () => {
  return JSON.parse(localStorage.getItem('user'))?.token;
}

// Create an Axios instance for your API
const API_URL = 'https://smartbusiness-rr4o.onrender.com/api/superadmin'; // Or your .env variable

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

// Bundle all functions into a single service object
const superAdminService = {
  getSystemStats,
  getAllUsers,
  deleteUser,
};

export default superAdminService;