import axios from "axios";

// Create an axios instance
const API = axios.create({
  baseURL: "https://smartbusiness-rr4o.onrender.com/api",
});

// --- Axios Interceptor ---
// This function will automatically attach the auth token to EVERY request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("authToken"); // Make sure this key matches where you store the token
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- Profile Functions ---

/**
 * Fetches the current user's profile data from '/api/profile'.
 */
export const getProfile = async () => {
  try {
    console.log("Fetching profile from backend with axios...");
    const { data } = await API.get("/profile");
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Updates the user's profile using FormData at '/api/profile'.
 * @param {FormData} formData - The FormData object.
 */
export const updateProfile = async (formData) => {
  try {
    console.log("Updating profile on backend...");
    const { data } = await API.put("/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    console.error("Error updating profile:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Triggers a data backup process at '/api/profile/backup'.
 */
export const triggerBackup = async () => {
  try {
    console.log("Triggering backup on backend at /api/profile/backup...");
    const { data } = await API.post("/profile/backup");
    return data;
  } catch (error) {
    console.error("Error triggering backup:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


// --- Dashboard Functions ---

/**
 * Fetches KPI stats from '/api/dashboard/stats'.
 */
export const getDashboardStats = async () => {
  try {
    const { data } = await API.get("/dashboard/stats");
    return data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Fetches sales chart data from '/api/dashboard/sales-chart'.
 */
export const getSalesChartData = async () => {
  try {
    const { data } = await API.get("/dashboard/sales-chart");
    return data;
  } catch (error) {
    console.error("Error fetching sales chart data:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Fetches recent activity from '/api/dashboard/recent-activity'.
 */
export const getRecentActivity = async () => {
  try {
    const { data } = await API.get("/dashboard/recent-activity");
    return data;
  } catch (error) {
    console.error("Error fetching recent activity:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Fetches low stock items from '/api/dashboard/low-stock'.
 */
export const getLowStockItems = async () => {
  try {
    const { data } = await API.get("/dashboard/low-stock");
    return data;
  } catch (error) {
    console.error("Error fetching low stock items:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- NEWLY ADDED FUNCTIONS ---

/**
 * Fetches overdue invoices from '/api/dashboard/overdue-invoices'.
 */
export const getOverdueInvoices = async () => {
    try {
        const { data } = await API.get('/dashboard/overdue-invoices');
        return data;
    } catch (error) {
        console.error("Error fetching overdue invoices:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Fetches top selling products from '/api/dashboard/top-selling-products'.
 */
export const getTopSellingProducts = async () => {
    try {
        const { data } = await API.get('/dashboard/top-selling-products');
        return data;
    } catch (error) {
        console.error("Error fetching top selling products:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

/**
 * Fetches income vs. expense data from '/api/dashboard/income-expense-chart'.
 */
export const getIncomeVsExpenseChartData = async () => {
    try {
        const { data } = await API.get('/dashboard/income-expense-chart');
        return data;
    } catch (error) {
        console.error("Error fetching income/expense chart data:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};