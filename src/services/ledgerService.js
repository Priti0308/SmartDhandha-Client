import axios from 'axios';

// Create an axios instance specifically for ledger routes
const API = axios.create({
  baseURL: 'https://smartbusiness-rr4o.onrender.com/api/ledger', // Use the specific module base URL
});

// === IMPORTANT: Add the Interceptor ===
// This function attaches the token to every request made with this API instance
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('authToken'); // Ensure this matches the key used in authService.js
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  // Log the request details for debugging
  // console.log('Sending request to:', req.url, 'with headers:', req.headers);
  return req;
});

/**
 * Generic GET function for ledger endpoints
 * @param {string} endpoint - The specific API endpoint relative to /api/ledger (e.g., 'customers', 'transactions')
 */
export const get = async (endpoint) => {
  try {
    const { data } = await API.get(`/${endpoint}`);
    return data;
  } catch (error) {
    console.error(`[API GET /ledger/${endpoint}] Failed:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Generic POST function for ledger endpoints
 * @param {string} endpoint - The specific API endpoint (e.g., 'customers')
 * @param {object} bodyData - The data object to send in the request body
 */
export const post = async (endpoint, bodyData) => {
  try {
    const { data } = await API.post(`/${endpoint}`, bodyData);
    return data;
  } catch (error) {
    console.error(`[API POST /ledger/${endpoint}] Failed:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Generic PUT function for ledger endpoints
 * @param {string} endpoint - The specific API endpoint (e.g., 'customers')
 * @param {object} bodyData - The data object to send, MUST include '_id' property
 */
export const put = async (endpoint, bodyData) => {
    if (!bodyData._id) {
        console.error("Missing _id in bodyData for PUT request:", bodyData);
        throw new Error("ID (_id) is required for PUT requests in bodyData");
    }
    const { _id, ...updateData } = bodyData; // Use _id which is standard for MongoDB/Mongoose
    try {
        const { data } = await API.put(`/${endpoint}/${_id}`, updateData);
        return data;
    } catch (error) {
        console.error(`[API PUT /ledger/${endpoint}/${_id}] Failed:`, error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


/**
 * Generic DELETE function for ledger endpoints
 * @param {string} endpoint - The specific API endpoint (e.g., 'customers')
 * @param {string} id - The ID of the item to delete
 */
export const deleteItem = async (endpoint, id) => {
  try {
    const { data } = await API.delete(`/${endpoint}/${id}`);
    return data;
  } catch (error) {
    console.error(`[API DELETE /ledger/${endpoint}/${id}] Failed:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/* ---------------------- Specific WhatsApp API Calls ---------------------- */
// These use the 'post' function but target specific routes defined in ledgerRoutes.js

/**
 * Sends a specific reminder via WhatsApp.
 * @param {string} reminderId - The ID of the reminder to send.
 */
export const sendWhatsappReminder = (reminderId) => {
  // Corresponds to POST /api/ledger/reminders/:id/send-whatsapp
  return post(`reminders/${reminderId}/send-whatsapp`, {});
};

/**
 * Sends a custom message to a customer via WhatsApp.
 * @param {string} customerId - The ID of the customer.
 * @param {string} message - The message content.
 */
export const sendWhatsappOffer = (customerId, message) => {
  // Corresponds to POST /api/ledger/customers/:id/send-whatsapp-offer
  return post(`customers/${customerId}/send-whatsapp-offer`, { message });
};

