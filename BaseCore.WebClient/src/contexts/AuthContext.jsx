import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user on mount
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (storedUser && token) {
                // Safely parse stored user data
                if (storedUser !== 'undefined' && storedUser !== '') {
                    setUser(JSON.parse(storedUser));
                } else {
                    // Invalid stored data, clear it
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
        } catch (error) {
            console.error('Error parsing stored user:', error);
            // Clear invalid data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authApi.login(username, password);
            
            // Handle different response formats
            let userData = response.data;
            
            // Ensure userData is valid
            if (!userData || typeof userData !== 'object') {
                return { success: false, message: 'Invalid response from server' };
            }

            // Set token and user data
            const token = userData.token || response.headers?.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return { success: false, message: 'No authentication token received' };
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Login failed. Please check your credentials.';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = () => {
        return user?.role === 'Admin' || user?.role === 'ADMIN';
    };

    const value = {
        user,
        login,
        logout,
        isAdmin,
        isAuthenticated: !!user,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
