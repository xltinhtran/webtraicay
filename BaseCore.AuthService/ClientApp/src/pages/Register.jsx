import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const errors = {};
        const name = formData.name.trim();
        const username = formData.username.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();
        const normalizedPhone = phone.replace(/\s/g, '');

        if (!name) {
            errors.name = 'Vui lòng nhập họ và tên.';
        } else if (name.length < 2 || name.length > 60) {
            errors.name = 'Họ tên phải từ 2 đến 60 ký tự.';
        }

        if (!username) {
            errors.username = 'Vui lòng nhập tên đăng nhập.';
        } else if (username.length < 3 || username.length > 30) {
            errors.username = 'Tên đăng nhập phải từ 3 đến 30 ký tự.';
        } else if (!/^[A-Za-z0-9_@.]+$/.test(username)) {
            errors.username = 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu gạch dưới, @ hoặc dấu chấm.';
        }

        if (!email) {
            errors.email = 'Vui lòng nhập email.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Email không đúng định dạng.';
        } else if (email.length > 100) {
            errors.email = 'Email không được vượt quá 100 ký tự.';
        }

        if (!phone) {
            errors.phone = 'Vui lòng nhập số điện thoại.';
        } else if (!/^(0|\+84)[0-9]{9,10}$/.test(normalizedPhone)) {
            errors.phone = 'Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có 10-11 chữ số.';
        }

        if (!formData.password) {
            errors.password = 'Vui lòng nhập mật khẩu.';
        } else if (formData.password.length < 6 || formData.password.length > 50) {
            errors.password = 'Mật khẩu phải từ 6 đến 50 ký tự.';
        } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
            errors.password = 'Mật khẩu nên có cả chữ và số.';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        }

        return errors;
    };

    const clearFieldError = (fieldName) => {
        setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: ''
        }));
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        clearFieldError(e.target.name);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Vui lòng kiểm tra lại thông tin đăng ký.');
            setSuccess('');
            return;
        }

        setLoading(true);
        setFieldErrors({});
        setError('');
        setSuccess('');

        try {
            await authApi.register({
                Username: formData.username.trim(),
                Password: formData.password,
                Name: formData.name.trim(),
                Email: formData.email.trim(),
                Phone: formData.phone.trim().replace(/\s/g, '')
            });

            setSuccess('Đăng ký thành công. Đang chuyển sang trang đăng nhập...');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 900);
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="container-fluid d-flex align-items-center justify-content-center"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '32px 12px'
            }}
        >
            <div className="col-sm-11 col-md-8 col-lg-6 col-xl-5">
                <div className="text-center mb-4">
                    <h1 className="display-5 text-white fw-bold">
                        BaseCore<span style={{ fontWeight: 'normal' }}>Sales</span>
                    </h1>
                    <p className="text-white mb-0" style={{ opacity: 0.9 }}>
                        Tạo tài khoản mua hàng
                    </p>
                </div>

                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <h3 className="text-center mb-2">Đăng ký tài khoản</h3>
                        <p className="text-center text-muted mb-4">
                            Nhập thông tin để bắt đầu mua hàng tại Fruitables
                        </p>

                        {error && (
                            <div className="alert alert-danger text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success text-center">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleRegister} noValidate>
                            <div className="mb-3">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control py-3 bg-light border-end-0 ${fieldErrors.name ? 'is-invalid' : ''}`}
                                        placeholder="Họ và tên"
                                        value={formData.name}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        minLength="2"
                                        maxLength="60"
                                        required
                                    />
                                    <span className="input-group-text bg-light border-start-0">
                                        <i className="fas fa-id-card text-muted"></i>
                                    </span>
                                </div>
                                {fieldErrors.name && (
                                    <small className="text-danger d-block mt-1">{fieldErrors.name}</small>
                                )}
                            </div>

                            <div className="mb-3">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="username"
                                        className={`form-control py-3 bg-light border-end-0 ${fieldErrors.username ? 'is-invalid' : ''}`}
                                        placeholder="Tên đăng nhập"
                                        value={formData.username}
                                        onChange={handleChange}
                                        autoComplete="username"
                                        minLength="3"
                                        maxLength="30"
                                        required
                                    />
                                    <span className="input-group-text bg-light border-start-0">
                                        <i className="fas fa-user text-muted"></i>
                                    </span>
                                </div>
                                {fieldErrors.username && (
                                    <small className="text-danger d-block mt-1">{fieldErrors.username}</small>
                                )}
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="input-group">
                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control py-3 bg-light border-end-0 ${fieldErrors.email ? 'is-invalid' : ''}`}
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                autoComplete="email"
                                                maxLength="100"
                                                required
                                            />
                                            <span className="input-group-text bg-light border-start-0">
                                                <i className="fas fa-envelope text-muted"></i>
                                            </span>
                                        </div>
                                        {fieldErrors.email && (
                                            <small className="text-danger d-block mt-1">{fieldErrors.email}</small>
                                        )}
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="input-group">
                                            <input
                                                type="tel"
                                                name="phone"
                                                className={`form-control py-3 bg-light border-end-0 ${fieldErrors.phone ? 'is-invalid' : ''}`}
                                                placeholder="Số điện thoại"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                autoComplete="tel"
                                                maxLength="13"
                                                required
                                            />
                                            <span className="input-group-text bg-light border-start-0">
                                                <i className="fas fa-phone text-muted"></i>
                                            </span>
                                        </div>
                                        {fieldErrors.phone && (
                                            <small className="text-danger d-block mt-1">{fieldErrors.phone}</small>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="input-group">
                                    <input
                                        type="password"
                                        name="password"
                                        className={`form-control py-3 bg-light border-end-0 ${fieldErrors.password ? 'is-invalid' : ''}`}
                                        placeholder="Mật khẩu"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
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

                            <div className="mb-4">
                                <div className="input-group">
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className={`form-control py-3 bg-light border-end-0 ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                                        placeholder="Nhập lại mật khẩu"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        minLength="6"
                                        maxLength="50"
                                        required
                                    />
                                    <span className="input-group-text bg-light border-start-0">
                                        <i className="fas fa-shield-alt text-muted"></i>
                                    </span>
                                </div>
                                {fieldErrors.confirmPassword && (
                                    <small className="text-danger d-block mt-1">{fieldErrors.confirmPassword}</small>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow-sm"
                                disabled={loading}
                                style={{ backgroundColor: '#8BC34A', border: 'none' }}
                            >
                                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            <span className="text-muted">Đã có tài khoản? </span>
                            <Link to="/login" className="fw-bold" style={{ color: '#81C408' }}>
                                Đăng nhập
                            </Link>
                        </div>
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

export default Register;
