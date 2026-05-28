// src/services/api.js
import axios from 'axios';

// AuthService: đăng nhập, đăng ký, user
const AUTH_BASE_URL = 'http://localhost:5000/api';

// APIService: products, categories, carts, orders, coupons, reviews
const API_SERVICE_BASE_URL = 'http://localhost:5001/api';

// Dùng để hiển thị ảnh review / ảnh upload từ APIService
export const API_STATIC_BASE_URL = 'http://localhost:5001';

// ===============================
// AXIOS CLIENTS
// ===============================

const authClient = axios.create({
    baseURL: AUTH_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

const apiClient = axios.create({
    baseURL: API_SERVICE_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ===============================
// TOKEN INTERCEPTOR
// ===============================

const attachToken = (config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
};

const handleRequestError = (error) => {
    return Promise.reject(error);
};

const handleResponseSuccess = (response) => {
    return response;
};

const handleResponseError = (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    return Promise.reject(error);
};

authClient.interceptors.request.use(attachToken, handleRequestError);
apiClient.interceptors.request.use(attachToken, handleRequestError);

authClient.interceptors.response.use(handleResponseSuccess, handleResponseError);
apiClient.interceptors.response.use(handleResponseSuccess, handleResponseError);

// ===============================
// AUTH API - PORT 5000
// ===============================

export const authApi = {
    login: (userName, password) =>
        authClient.post('/auth/login', {
            Username: userName,
            Password: password
        }),

    register: (userData) =>
        authClient.post('/auth/register', userData)
};

// ===============================
// USERS API - PORT 5000
// Nếu UsersController nằm bên APIService thì đổi authClient thành apiClient
// ===============================

export const usersApi = {
    getAll: (params) =>
        authClient.get('/users', { params }),

    getById: (id) =>
        authClient.get(`/users/${id}`),

    create: (data) =>
        authClient.post('/users', data),

    update: (id, data) =>
        authClient.put(`/users/${id}`, data),

    delete: (id) =>
        authClient.delete(`/users/${id}`)
};

// ===============================
// PRODUCTS API - PORT 5001
// ===============================

export const productsApi = {
    getAll: (params) =>
        apiClient.get('/products', { params }),

    getById: (id) =>
        apiClient.get(`/products/${id}`),

    getFeatured: () =>
        apiClient.get('/products/featured'),

    create: (data) =>
        apiClient.post('/products', data),

    update: (id, data) =>
        apiClient.put(`/products/${id}`, data),

    delete: (id) =>
        apiClient.delete(`/products/${id}`),

    filter: (name, startDate, endDate) =>
        apiClient.get('/products/filter', {
            params: {
                name,
                startDate,
                endDate
            }
        })
};

// ===============================
// CATEGORIES API - PORT 5001
// ===============================

export const categoriesApi = {
    getAll: () =>
        apiClient.get('/categories'),

    getById: (id) =>
        apiClient.get(`/categories/${id}`),

    create: (data) =>
        apiClient.post('/categories', data),

    update: (id, data) =>
        apiClient.put(`/categories/${id}`, data),

    delete: (id) =>
        apiClient.delete(`/categories/${id}`)
};

// ===============================
// ORDERS API - PORT 5001
// ===============================

export const ordersApi = {
    getAll: () =>
        apiClient.get('/orders/all'),

    updateStatus: (id, status) =>
        apiClient.put(`/orders/${id}/status`, { status }),

    checkout: (orderData) =>
        apiClient.post('/orders/checkout', orderData),

    getByUserId: (userId) =>
        apiClient.get(`/orders/user/${userId}`),

    getById: (id) =>
        apiClient.get(`/orders/${id}`),

    cancelOrder: (id, reason) =>
        apiClient.put(`/orders/${id}/cancel`, { reason }),
    updatePendingOrder: (id, data) =>
        apiClient.put(`/orders/${id}/pending-update`, data),
};

// ===============================
// CARTS API - PORT 5001
// ===============================

export const cartsApi = {
    getByUserId: (userId) =>
        apiClient.get(`/carts/${userId}`),

    addToCart: (cartData) =>
        apiClient.post('/carts/add', cartData),

    removeFromCart: (itemId) =>
        apiClient.delete(`/carts/remove/${itemId}`)
};

// ===============================
// COUPONS API - PORT 5001
// ===============================

export const couponsApi = {
    check: (code) =>
        apiClient.get('/coupons/check', {
            params: {
                code
            }
        })
};

// ===============================
// REVIEWS API - PORT 5001
// ===============================

export const reviewsApi = {
    getByProductId: (productId) =>
        apiClient.get(`/reviews/product/${productId}`),

    submitReview: (formData) =>
        apiClient.post('/reviews/submit', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),

    getSummary: () =>
        apiClient.get('/reviews/summary')
};

// Export mặc định là APIService vì đa số trang shop dùng APIService
export default apiClient;