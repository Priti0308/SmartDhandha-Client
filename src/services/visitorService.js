import axios from 'axios';

// Create an axios instance consistent with your project's setup
const API = axios.create({
  baseURL: 'https://smartbusiness-rr4o.onrender.com/api', // Base URL for all API requests
});

// Interceptor to add auth token to requests (if you use authentication)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('authToken'); 
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/**
 * Fetches all visitor entries.
 * @returns {Promise<any>} The list of visitors.
 */
export const getVisitors = async () => {
    const { data } = await API.get('/visitors');
    return data;
};

/**
 * Adds a new visitor entry (Check-in).
 * @param {object} visitorData - The data for the new visitor.
 * @returns {Promise<any>} The newly created visitor record.
 */
export const addVisitor = async (visitorData) => {
    const { data } = await API.post('/visitors', visitorData);
    return data;
};

/**
 * Updates a visitor, typically for check-out.
 * @param {string} visitorId - The ID of the visitor to update.
 * @param {object} updateData - The fields to update (e.g., { checkOutTime: ... }).
 * @returns {Promise<any>} The updated visitor record.
 */
export const updateVisitor = async (visitorId, updateData) => {
    // Note: This matches the backend route `PUT /api/visitors/:id`
    const { data } = await API.put(`/visitors/${visitorId}`, updateData);
    return data;
};