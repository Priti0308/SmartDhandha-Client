import axios from "axios";

// NOTE: Ensure your BASE_URL points to the correct Express server address.
const API = axios.create({
    baseURL: "https://smartbusiness-rr4o.onrender.com/api/auth", 
});

// --- REGISTER (Simplified) ---
// Now handles direct user creation, no separate sendOtp/register-verify needed
export const registerUser = async (userData) => {
    // userData should contain: fullName, businessName, email, mobile, password
    // The previous 'otp' field is removed from the payload
    const { data } = await API.post("/register", userData); 
    return data;
};

// Removed: export const sendOtp = async (email) => ...

// --- LOGIN ---
export const loginUser = async (credentials) => {
    const { data } = await API.post("/login", credentials);

    if (data.token) {
        localStorage.setItem("authToken", data.token);
    }

    return data;
};

// --- UTILS ---
export const logoutUser = () => {
    localStorage.removeItem("authToken");
};

export const getToken = () => {
    return localStorage.getItem("authToken");
};

export const isAuthenticated = () => {
    return !!localStorage.getItem("authToken");
};