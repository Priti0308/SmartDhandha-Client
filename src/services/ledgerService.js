// This file handles all API calls for the ledger application.
// It is configured to connect to a backend running on http://localhost:5000.

const API_BASE_URL = "http://localhost:5000/api";

/**
 * Handles HTTP responses, checking for success and parsing JSON.
 * @param {Response} response - The fetch API response object.
 * @returns {Promise<any>} - A promise that resolves with the parsed JSON data.
 * @throws {Error} If the response is not ok.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API call failed with status ${response.status}`);
  }
  return response.json();
};

/**
 * Fetches data from a specified endpoint.
 * @param {string} endpoint - The API endpoint (e.g., 'customers', 'transactions').
 * @returns {Promise<Array>} - A promise that resolves to the fetched data.
 */
export const get = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`[API GET] Failed to fetch from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Adds a new item to a specified endpoint using a POST request.
 * @param {string} endpoint - The API endpoint.
 * @param {object} item - The item to add.
 * @returns {Promise<object>} - A promise that resolves to the newly created item.
 */
export const post = async (endpoint, item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`[API POST] Failed to add to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Updates an existing item at a specified endpoint using a PUT request.
 * @param {string} endpoint - The API endpoint.
 * @param {object} updatedItem - The item with updated data.
 * @returns {Promise<object>} - A promise that resolves to the updated item.
 */
export const put = async (endpoint, updatedItem) => {
  try {
    // Use `updatedItem._id` to match the data structure from your database
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${updatedItem._id}`, { // <-- Corrected line
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`[API PUT] Failed to update in ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Deletes an item from a specified endpoint using a DELETE request.
 * @param {string} endpoint - The API endpoint.
 * @param {string} id - The ID of the item to delete.
 * @returns {Promise<object>} - A promise that resolves to the ID of the deleted item.
 */
export const deleteItem = async (endpoint, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`[API DELETE] Failed to remove from ${endpoint}:`, error);
    throw error;
  }
};

/* ---------------------- NEW: WhatsApp API Calls ---------------------- */

/**
 * Sends a specific reminder via WhatsApp.
 * @param {string} reminderId - The ID of the reminder to send.
 */
export const sendWhatsappReminder = (reminderId) => {
  return post(`reminders/${reminderId}/send-whatsapp`, {});
};

/**
 * Sends a custom message to a customer via WhatsApp.
 * @param {string} customerId - The ID of the customer.
 * @param {string} message - The message content.
 */
export const sendWhatsappOffer = (customerId, message) => {
  return post(`customers/${customerId}/send-whatsapp-offer`, { message });
};