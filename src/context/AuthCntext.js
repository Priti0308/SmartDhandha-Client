import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getToken, logoutUser as logoutFromService } from '../services/authService'; // Assuming authService handles localStorage

// Create the context which components will consume
const AuthContext = createContext(null);

/**
 * The AuthProvider component wraps your application and provides the authentication state.
 * It checks for a token on initial load, fetches the user's profile, and makes
 * the user object available to all child components.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Manages the initial token verification state

    useEffect(() => {
        const verifyUser = async () => {
            const token = getToken(); // Get token from localStorage
            if (token) {
                // If a token exists, set it as the default authorization header for all future axios requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    // Fetch the user's profile from the protected backend route
                    const { data } = await axios.get('http://localhost:5000/api/profile/me');
                    setUser(data); // Set the user in the global state
                } catch (error) {
                    console.error("Token verification failed:", error);
                    logoutFromService(); // If token is invalid, clear it from localStorage
                    setUser(null);
                }
            }
            // Finished checking for a user
            setLoading(false);
        };

        verifyUser();
    }, []);

    // Function to be called from the Login/Register page
    const login = (userData, token) => {
        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    // Function to clear user state and token
    const logout = () => {
        logoutFromService(); // Clears localStorage
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // The value provided to consuming components
    const value = { user, login, logout, loading };

    // We only render the app after the initial loading check is complete
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

/**
 * A custom hook that provides a simple way for components
 * to access the authentication context.
 * e.g., const { user } = useAuth();
 */
export const useAuth = () => {
    return useContext(AuthContext);
};