/* ---------------------- Inventory Services ---------------------- */
// This file contains all API-related logic for the inventory application,
// configured to make HTTP requests to a local backend server.

// Define the base URL for the API
const API_BASE_URL = 'http://localhost:5000/api'; // Assuming your backend runs on port 3001

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
 * @param {string} endpoint - The API endpoint (e.g., 'products', 'invoices').
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${updatedItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'DELETE',
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`[API DELETE] Failed to remove from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Submits a new invoice and updates product stock accordingly.
 * This function assumes a specific backend endpoint handles the transactional logic.
 * @param {object} invoice - The invoice data to submit.
 * @returns {Promise<object>} - A promise that resolves to the new invoice.
 */
export const postInvoice = async (invoice) => {
  // In a real scenario, this would be a single, transactional endpoint.
  // For this example, we'll just use the regular post method.
  // A dedicated backend endpoint would be preferable for atomicity.
  try {
    const newInvoice = await post('invoices', invoice);
    return newInvoice;
  } catch (error) {
    console.error('[API POST Invoice] Failed to create invoice:', error);
    throw error;
  }
};