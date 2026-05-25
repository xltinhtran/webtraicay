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
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = async (userName, password) => {
        try {
            const response = await authApi.login(userName, password);
            const data = response.data;

            // 🌟 HỐT HẾT CÁC TRƯỜNG HỢP CHỮ HOA/CHỮ THƯỜNG CỦA C#
            const token = data.token || data.Token;
            const userId = data.userId || data.UserId || '';
            const role = data.role || data.Role || 'User'; // Mặc định là User nếu ko thấy
            const name = data.name || data.Name || userName;
            const email = data.email || data.Email || '';

            if (!token || !userId) {
                return { success: false, error: 'Lỗi API: Không lấy được Token hoặc UserId' };
            }

            // 🌟 DỌN SẠCH BỘ NHỚ CŨ ĐỂ KHÔNG BỊ KẸT
            localStorage.clear();

            // 🌟 LƯU ID VÀ ROLE ĐỂ CÁC TRANG KHÁC DÙNG (CỰC KỲ QUAN TRỌNG)
            localStorage.setItem('token', token);
            localStorage.setItem('userId', String(userId));
            localStorage.setItem('role', role);

            const userData = { userId, userName, name, email, role };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true, role: role };
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data || 'Login failed';
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    const value = { user, loading, login, logout, isAuthenticated: !!user };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;