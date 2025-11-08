import axios from 'axios';

// Create an axios instance for ALL inventory-related routes
// The specific sub-path (like '/products') will be passed into each function
const API = axios.create({
  baseURL: 'https://smartbusiness-rr4o.onrender.com/api', // Use the base API URL
});

// === IMPORTANT: Add the Interceptor ===
// This function attaches the token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('authToken'); // Make sure this key matches where you store the token
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/**
 * Generic GET function
 * @param {string} endpoint - The specific API endpoint (e.g., 'inventory/products', 'ledger/customers')
 */
export const get = async (endpoint) => {
  const { data } = await API.get(`/${endpoint}`);
  return data;
};

/**
 * Generic POST function
 * @param {string} endpoint - The specific API endpoint (e.g., 'inventory/products')
 * @param {object} bodyData - The data object to send in the request body
 */
export const post = async (endpoint, bodyData) => {
  const { data } = await API.post(`/${endpoint}`, bodyData);
  return data;
};

/**
 * Generic PUT function (assumes endpoint includes ID like /products/:id)
 * @param {string} endpoint - The specific API endpoint (e.g., 'inventory/products')
 * @param {object} bodyData - The data object to send, MUST include 'id' property
 */
export const put = async (endpoint, bodyData) => {
    if (!bodyData.id) {
        throw new Error("ID is required for PUT requests in bodyData");
    }
    const { id, ...updateData } = bodyData;
    const { data } = await API.put(`/${endpoint}/${id}`, updateData);
    return data;
};


/**
 * Generic DELETE function
 * @param {string} endpoint - The specific API endpoint (e.g., 'inventory/products')
 * @param {string} id - The ID of the item to delete
 */
export const deleteItem = async (endpoint, id) => {
  const { data } = await API.delete(`/${endpoint}/${id}`);
  return data;
};

/**
 * Specific function for posting invoices, as it uses a dedicated route
 * @param {object} invoiceData - The invoice data object
 */
export const postInvoice = async (invoiceData) => {
  // Assuming your invoice route is /api/inventory/invoices
  const { data } = await API.post('/inventory/invoices', invoiceData);
  return data;
};

/**
 * NEW: Records a payment for a specific invoice.
 * @param {string} invoiceId - The ID of the invoice to pay against.
 * @param {object} paymentData - The payment details (amount, date, etc.).
 */
export const recordPayment = async (invoiceId, paymentData) => {
  const { data } = await API.post(`/inventory/invoices/${invoiceId}/payments`, paymentData);
  return data;
};