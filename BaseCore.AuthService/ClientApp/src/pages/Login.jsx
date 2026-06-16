import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const validateLogin = () => {
        const errors = {};
        const cleanUserName = userName.trim();

        if (!cleanUserName) {
            errors.userName = 'Vui lòng nhập tên đăng nhập.';
        } else if (cleanUserName.length < 3 || cleanUserName.length > 30) {
            errors.userName = 'Tên đăng nhập phải từ 3 đến 30 ký tự.';
        } else if (!/^[A-Za-z0-9_@.]+$/.test(cleanUserName)) {
            errors.userName = 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu gạch dưới, @ hoặc dấu chấm.';
        }

        if (!password) {
            errors.password = 'Vui lòng nhập mật khẩu.';
        } else if (password.length < 6 || password.length > 50) {
            errors.password = 'Mật khẩu phải từ 6 đến 50 ký tự.';
        }

        return errors;
    };

    const clearFieldError = (fieldName) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: ''
        }));
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        const validationErrors = validateLogin();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Vui lòng kiểm tra lại thông tin đăng nhập.');
            return;
        }

        setError('');
        setFieldErrors({});
        setLoading(true);

        try {
            const result = await login(userName.trim(), password);

            if (result.success) {
                const userString = localStorage.getItem('user');
                const userData = userString ? JSON.parse(userString) : null;

                if (userData && (userData.role === 'Admin' || userData.Role === 'Admin')) {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } else {
                setError(typeof result.error === 'string' ? result.error : 'Đăng nhập thất bại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="container-fluid d-flex align-items-center justify-content-center"
            style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
            <div className="col-sm-10 col-md-8 col-lg-5 col-xl-4">
                <div className="text-center mb-4">
                    <h1 className="display-5 text-white fw-bold">
                        BaseCore<span style={{ fontWeight: 'normal' }}>Sales</span>
                    </h1>
                </div>

                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <p className="text-center text-muted mb-4">Sign in to start your session</p>

                        {error && (
                            <div className="alert alert-danger text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} noValidate>
                            <div className="mb-4">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className={`form-control py-3 bg-light border-end-0 ${fieldErrors.userName ? 'is-invalid' : ''}`}
                                        placeholder="Username"
                                        value={userName}
                                        onChange={(e) => {
                                            setUserName(e.target.value);
                                            clearFieldError('userName');
                                        }}
                                        autoComplete="username"
                                        minLength="3"
                                        maxLength="30"
                                        required
                                    />
                                    <span className="input-group-text bg-light border-start-0">
                                        <i className="fas fa-user text-muted"></i>
                                    </span>
                                </div>
                                {fieldErrors.userName && (
                                    <small className="text-danger d-block mt-1">{fieldErrors.userName}</small>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="input-group">
                                    <input
                                        type="password"
                                        className={`form-control py-3 bg-light border-end-0 ${fieldErrors.password ? 'is-invalid' : ''}`}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            clearFieldError('password');
                                        }}
                                        autoComplete="current-password"
                                        minLength="6"
                                        maxLength="50"
                                        required
                                    />
                                    <span className="input-group-text bg-light border-start-0">
                                        <i className="fas fa-lock text-muted"></i>
                                    </span>
                                </div>
                                {fieldErrors.password && (
                                    <small className="text-danger d-block mt-1">{fieldErrors.password}</small>
                                )}
                            </div>

                            <div className="row align-items-center mt-2">
                                <div className="col-7">
                                    <div className="form-check">
                                        <input type="checkbox" className="form-check-input" id="remember" />
                                        <label className="form-check-label text-muted" htmlFor="remember">Remember Me</label>
                                    </div>
                                </div>
                                <div className="col-5">
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-2 rounded-3 fw-bold shadow-sm"
                                        disabled={loading}
                                        style={{ backgroundColor: '#8BC34A', border: 'none' }}
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mt-4">
                                <span className="text-muted">Chưa có tài khoản? </span>
                                <Link to="/register" className="fw-bold" style={{ color: '#81C408' }}>
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <Link to="/" className="text-white text-decoration-none" style={{ opacity: 0.9, fontSize: '15px' }}>
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
