import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Import các trang Admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
// ... các import cũ giữ nguyên
import Orders from './pages/Orders'; // 1. Import trang Orders mới tạo

// Import các trang Fruitables Frontend
import Home from './pages/Home';
import Shop from './pages/Shop';
import ShopDetail from './pages/ShopDetail';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';


function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* ===== CÁC TRANG DÀNH CHO KHÁCH HÀNG ===== */}
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/shop-detail" element={<ShopDetail />} />
                    <Route path="/shop-detail/:id" element={<ShopDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    

                    {/* ===== HỆ THỐNG ĐĂNG NHẬP & QUẢN TRỊ ===== */}
                    <Route path="/login" element={<Login />} />

                    <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
                    <Route path="/products" element={<ProtectedRoute><MainLayout><Products /></MainLayout></ProtectedRoute>} />
                    <Route path="/categories" element={<ProtectedRoute><MainLayout><Categories /></MainLayout></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute><MainLayout><Users /></MainLayout></ProtectedRoute>} />
                    {/* 2. Đăng ký đường dẫn Orders và bọc bảo vệ bởi ProtectedRoute[cite: 33, 51] */}
                    <Route path="/orders" element={<ProtectedRoute><MainLayout><Orders /></MainLayout></ProtectedRoute>} />
                  
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;