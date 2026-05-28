import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Tui import thêm Link ? ?ây nha
import { useAuth } from '../contexts/AuthContext';



const Login = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!userName || !password) {
        setError('Please enter username and password');
        return;
    }

    setError('');
    setLoading(true);

    try {
        const result = await login(userName, password);

        if (result.success) {
            // Lấy dữ liệu user từ localStorage
            const userString = localStorage.getItem('user');
            const userData = userString ? JSON.parse(userString) : null;

            // ✅ KIỂM TRA BẰNG CHỮ "Admin" VÌ C# TRẢ VỀ NHƯ VẬY
            if (userData && (userData.role === 'Admin' || userData.Role === 'Admin')) {
                // Admin thì bay vô Dashboard
                navigate('/dashboard', { replace: true });
            } else {
                // Khách thì bay ra Trang chủ
                navigate('/', { replace: true });
            }
        } else {
            setError(typeof result.error === 'string' ? result.error : 'Login failed.');
            setLoading(false);
        }
    } catch (err) {
        setError('An error occurred. Please try again.');
        setLoading(false);
    }
};

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

            <div className="col-sm-10 col-md-8 col-lg-5 col-xl-4">

                {/* LOGO */}
                <div className="text-center mb-4">
                    <h1 className="display-5 text-white fw-bold">BaseCore<span style={{ fontWeight: 'normal' }}>Sales</span></h1>
                </div>

                {/* TH? FORM ??NG NH?P */}
                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <p className="text-center text-muted mb-4">Sign in to start your session</p>

                        {/* BÁO L?I */}
                        {error && (
                            <div className="alert alert-danger text-center">
                                {error}
                            </div>
                        )}

                        {/* Ô NH?P TÀI KHO?N */}
                        <div className="input-group mb-4">
                            <input
                                type="text"
                                className="form-control py-3 bg-light border-end-0"
                                placeholder="Username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete="username"
                            />
                            <span className="input-group-text bg-light border-start-0">
                                <i className="fas fa-user text-muted"></i>
                            </span>
                        </div>

                        {/* Ô NH?P M?T KH?U */}
                        <div className="input-group mb-4">
                            <input
                                type="password"
                                className="form-control py-3 bg-light border-end-0"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete="current-password"
                            />
                            <span className="input-group-text bg-light border-start-0">
                                <i className="fas fa-lock text-muted"></i>
                            </span>
                        </div>

                        {/* REMEMBER ME & NÚT LOGIN */}
                        <div className="row align-items-center mt-2">
                            <div className="col-7">
                                <div className="form-check">
                                    <input type="checkbox" className="form-check-input" id="remember" />
                                    <label className="form-check-label text-muted" htmlFor="remember">Remember Me</label>
                                </div>
                            </div>
                            <div className="col-5">
                                <button
                                    type="button"
                                    className="btn btn-primary w-100 py-2 rounded-3 fw-bold shadow-sm"
                                    disabled={loading}
                                    onClick={handleLogin}
                                    style={{ backgroundColor: '#8BC34A', border: 'none' }} /* Màu xanh lá cho gi?ng Fruitables */
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* NÚT QUAY V? TRANG CH? ? ?ÂY NÈ NÍ */}
                <div className="text-center mt-4">
                    <Link to="/" className="text-white text-decoration-none" style={{ opacity: 0.9, fontSize: '15px' }}>
                        <i className="fas fa-arrow-left me-2">Back Home</i> 
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default Login;