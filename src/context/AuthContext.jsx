
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getToken, logoutUser as logoutFromService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const verifyUser = async () => {
            const token = getToken(); 
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const { data } = await axios.get('https://smartbusiness-rr4o.onrender.com/api/profile');
                    setUser(data); 
                } catch (error) {
                    console.error("Token verification failed:", error);
                    logoutFromService(); 
                    setUser(null);
                }
            }
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
        logoutFromService(); 
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const value = { user, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};