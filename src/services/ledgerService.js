import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // change when deploying
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendorToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ Token attached:", token);
  } else {
    console.warn("⚠️ No token found in localStorage");
  }
  return config;
});

// -------- Ledger Entries --------
const LEDGER_BASE = "/ledger";

// Get all ledger entries
export const getLedgerEntries = async () => {
  const { data } = await API.get(`${LEDGER_BASE}/`);
  return data;
};

// Get single ledger entry by ID
export const getLedgerEntryById = async (id) => {
  const { data } = await API.get(`${LEDGER_BASE}/${id}`);
  return data;
};

// Add new ledger entry
export const addLedgerEntry = async (entry) => {
  const { data } = await API.post(`${LEDGER_BASE}/`, entry);
  return data;
};

// Update ledger entry
export const updateLedgerEntry = async (id, entry) => {
  const { data } = await API.put(`${LEDGER_BASE}/${id}`, entry);
  return data;
};

// Delete ledger entry
export const deleteLedgerEntry = async (id) => {
  const { data } = await API.delete(`${LEDGER_BASE}/${id}`);
  return data;
};

// -------- Customers --------
const CUSTOMER_BASE = "/customers";

// Get all customers
export const getCustomers = async () => {
  const { data } = await API.get(`${CUSTOMER_BASE}/`);
  return data;
};

// Get single customer by ID
export const getCustomerById = async (id) => {
  const { data } = await API.get(`${CUSTOMER_BASE}/${id}`);
  return data;
};

// Add new customer
export const addCustomer = async (customer) => {
  const { data } = await API.post(`${CUSTOMER_BASE}/`, customer);
  return data;
};

// Update customer
export const updateCustomer = async (id, customer) => {
  const { data } = await API.put(`${CUSTOMER_BASE}/${id}`, customer);
  return data;
};

// Delete customer
export const deleteCustomer = async (id) => {
  const { data } = await API.delete(`${CUSTOMER_BASE}/${id}`);
  return data;
};

// -------- Reminders --------
const REMINDER_BASE = "/reminders";

// Get all reminders
export const getReminders = async () => {
  const { data } = await API.get(`${REMINDER_BASE}/`);
  return data;
};

// Get reminders for a specific customer
export const getRemindersByCustomer = async (customerId) => {
  const { data } = await API.get(`${REMINDER_BASE}/customer/${customerId}`);
  return data;
};

// Add new reminder
export const addReminder = async (reminder) => {
  const { data } = await API.post(`${REMINDER_BASE}/`, reminder);
  return data;
};

// Update reminder
export const updateReminder = async (id, reminder) => {
  const { data } = await API.put(`${REMINDER_BASE}/${id}`, reminder);
  return data;
};

// Delete reminder
export const deleteReminder = async (id) => {
  const { data } = await API.delete(`${REMINDER_BASE}/${id}`);
  return data;
};

// -------- Combined Operations --------
// Get customer with all related data
export const getCustomerWithData = async (customerId) => {
  const [customer, transactions, reminders] = await Promise.all([
    getCustomerById(customerId),
    getLedgerEntries().then(entries => entries.filter(entry => entry.customerId === customerId)),
    getRemindersByCustomer(customerId)
  ]);
  
  return { customer, transactions, reminders };
};

// Get all customers with their balance
export const getCustomersWithBalance = async () => {
  const { data } = await API.get('/customers/with-balance');
  return data;
};
