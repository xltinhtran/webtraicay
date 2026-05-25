import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        // Thêm flex-column để Header, Body, Footer xếp dọc theo trang
        <div className="wrapper d-flex flex-column" style={{ minHeight: '100vh' }}>

            {/* Navbar (Nằm trên cùng) */}
            <nav className="main-header navbar navbar-expand navbar-white navbar-light m-0" style={{ width: '100%', zIndex: 1000 }}>
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" data-widget="pushmenu" href="#" role="button">
                            <i className="fas fa-bars"></i>
                        </a>
                    </li>
                </ul>
                <ul className="navbar-nav ml-auto">
                    <li className="nav-item dropdown">
                        <a className="nav-link" data-toggle="dropdown" href="#">
                            <i className="fas fa-user"></i> {user?.name || 'Administrator'}
                        </a>
                        <div className="dropdown-menu dropdown-menu-right">
                            <a href="#" className="dropdown-item" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt mr-2"></i> Logout
                            </a>
                        </div>
                    </li>
                </ul>
            </nav>

            {/* KHU VỰC CHÍNH: CHIA 2 CỘT TRÁI (SIDEBAR) VÀ PHẢI (CONTENT) */}
            <div className="d-flex flex-grow-1" style={{ overflow: 'hidden' }}>

                {/* Sidebar Bên Trái (Ép width cố định 250px) */}
                <aside
                    className="main-sidebar sidebar-dark-primary elevation-4"
                    style={{ position: 'relative', width: '250px', flexShrink: 0, overflowY: 'auto' }}
                >
                    <Link to="/" className="brand-link">
                        <span className="brand-text font-weight-light ml-3">
                            <b>BaseCore</b>Sales
                        </span>
                    </Link>
                    <div className="sidebar">
                        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                            <div className="image">
                                <i className="fas fa-user-circle fa-2x text-light"></i>
                            </div>
                            <div className="info">
                                <a href="#" className="d-block">{user?.name || 'Administrator'}</a>
                            </div>
                        </div>
                        <nav className="mt-2">
                            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                                <li className="nav-item">
                                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                                        <i className="nav-icon fas fa-tachometer-alt"></i>
                                        <p>Dashboard</p>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                                        <i className="nav-icon fas fa-shopping-cart"></i>
                                        <p>Products</p>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/categories" className={`nav-link ${isActive('/categories')}`}>
                                        <i className="nav-icon fas fa-tags"></i>
                                        <p>Categories</p>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                                        <i className="nav-icon fas fa-users"></i>
                                        <p>Users</p>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                                        <i className="nav-icon fas fa-file-invoice-dollar"></i>
                                        <p>Orders</p>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </aside>

                {/* Content Wrapper Bên Phải (Chiếm toàn bộ không gian còn lại) */}
                <div
                    className="content-wrapper p-4"
                    style={{ flex: 1, overflowY: 'auto', marginLeft: 0, backgroundColor: '#f4f6f9' }}
                >
                    {children}
                </div>

            </div>

            {/* Footer (Nằm dưới cùng) */}
            <footer className="main-footer m-0" style={{ width: '100%' }}>
                <strong>BaseCore Admin</strong> - Teaching Framework
                <div className="float-right d-none d-sm-inline-block">
                    <b>Version</b> 1.0.0
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;