import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    // Safe cart count getter
    const getCartCount = () => {
        try {
            const cartStr = localStorage.getItem('cart');
            if (!cartStr || cartStr === 'undefined' || cartStr.trim() === '') {
                return 0;
            }
            const cart = JSON.parse(cartStr);
            return Array.isArray(cart) ? cart.length : 0;
        } catch (error) {
            console.error('Error getting cart count:', error);
            return 0;
        }
    };

    return (
        <div className="wrapper">
            {/* Navbar */}
            <nav className="main-header navbar navbar-expand navbar-white navbar-light">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" data-widget="pushmenu" href="#" role="button">
                            <i className="fas fa-bars"></i>
                        </a>
                    </li>
                    <li className="nav-item d-none d-sm-inline-block">
                        <Link to="/" className="nav-link">Home</Link>
                    </li>
                </ul>

                <ul className="navbar-nav ml-auto">
                    <li className="nav-item">
                        <a 
                            href="#" 
                            className="nav-link" 
                            title="Shopping Cart"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/cart');
                            }}
                        >
                            <i className="fas fa-shopping-cart"></i>
                            <span className="badge badge-danger navbar-badge">
                                {getCartCount()}
                            </span>
                        </a>
                    </li>
                    <li className="nav-item dropdown">
                        <a className="nav-link" data-toggle="dropdown" href="#">
                            <i className="far fa-user"></i> {user?.name || user?.username}
                        </a>
                        <div className="dropdown-menu dropdown-menu-right">
                            <span className="dropdown-item dropdown-header">
                                {user?.email}
                            </span>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt mr-2"></i> Logout
                            </button>
                        </div>
                    </li>
                </ul>
            </nav>

            {/* Sidebar */}
            <aside className="main-sidebar sidebar-dark-primary elevation-4">
                <Link to="/" className="brand-link">
                    <span className="brand-text font-weight-light ml-3">
                        <b>Store</b> Sales
                    </span>
                </Link>

                <div className="sidebar">
                    <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                        <div className="image">
                            <i className="fas fa-user-circle fa-2x text-light"></i>
                        </div>
                        <div className="info">
                            <Link to="#" className="d-block">{user?.name || user?.username}</Link>
                        </div>
                    </div>

                    <nav className="mt-2">
                        <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                            {isAdmin() ? (
                                // ADMIN NAVIGATION
                                <>
                                    <li className="nav-item">
                                        <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                                            <i className="nav-icon fas fa-tachometer-alt"></i>
                                            <p>Dashboard</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/products" className={`nav-link ${isActive('/products')}`}>
                                            <i className="nav-icon fas fa-box"></i>
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
                                        <Link to="/admin-orders" className={`nav-link ${isActive('/admin-orders')}`}>
                                            <i className="nav-icon fas fa-shopping-cart"></i>
                                            <p>Orders</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                                            <i className="nav-icon fas fa-users"></i>
                                            <p>Users</p>
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                // CUSTOMER NAVIGATION
                                <>
                                    <li className="nav-item">
                                        <Link to="/home" className={`nav-link ${isActive('/home')}`}>
                                            <i className="nav-icon fas fa-home"></i>
                                            <p>Home</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/shop" className={`nav-link ${isActive('/shop')}`}>
                                            <i className="nav-icon fas fa-shopping-bag"></i>
                                            <p>Shop</p>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/cart" className={`nav-link ${isActive('/cart')}`}>
                                            <i className="nav-icon fas fa-shopping-cart"></i>
                                            <p>Cart</p>
                                            <span className="badge badge-primary right">
                                                {getCartCount()}
                                            </span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                                            <i className="nav-icon fas fa-list"></i>
                                            <p>My Orders</p>
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Content */}
            {children}

            {/* Footer */}
            <footer className="main-footer">
                <strong>Copyright &copy; 2024 <a href="#">BaseCore Sales</a>.</strong>
                <div className="float-right d-none d-sm-inline-block">
                    <b>Version</b> 1.0.0
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
