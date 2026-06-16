import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartsApi } from '../services/api';

const getProductUnit = (product) => product?.unit || product?.Unit || 'sản phẩm';

const Cart = () => {
    const navigate = useNavigate();

    const [cart, setCart] = useState([]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (currentUserId) {
            cartsApi.getByUserId(currentUserId)
                .then(res => setCart(res.data))
                .catch(err => console.log('Lỗi tải giỏ hàng: ', err));
        } else {
            setCart([]);
        }
    }, []);

    const handleQuantityChange = (itemId, change) => {
        setCart(cart.map(item => {
            if (item.id === itemId) {
                const newQuantity = item.quantity + change;
                return {
                    ...item,
                    quantity: newQuantity > 0 ? newQuantity : 1
                };
            }

            return item;
        }));
    };

    const handleRemove = async (itemId) => {
        if (window.confirm('Ní có chắc muốn bỏ món này ra khỏi giỏ không? 🛒')) {
            try {
                await cartsApi.removeFromCart(itemId);
                setCart(cart.filter(item => item.id !== itemId));
            } catch (error) {
                alert('Xóa không thành công, vui lòng thử lại sau ní nhé!');
            }
        }
    };

    const subtotal = cart.reduce((total, item) => {
        const priceToUse = item.discountPrice || item.price;
        return total + priceToUse * item.quantity;
    }, 0);

    const handleProceedCheckout = () => {
        if (cart.length === 0) {
            alert('Giỏ hàng đang trống trơn hà, ní mua thêm đồ đi nhé!');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert('Vui lòng đăng nhập tài khoản để tiến hành thanh toán đơn hàng!');
            navigate('/login');
            return;
        }

        navigate('/checkout', {
            state: {
                subtotal: subtotal,
                cartItems: cart
            }
        });
    };

    return (
        <>
            {/* Navbar Start */}
            <div className="container-fluid fixed-top">
                <div className="container topbar bg-primary d-none d-lg-block">
                    <div className="d-flex justify-content-between">
                        <div className="top-info ps-2">
                            <small className="me-3">
                                <i className="fas fa-map-marker-alt me-2 text-secondary"></i>
                                <a href="#" className="text-white">
                                    236 Hoàng Quốc Việt, Hà Nội
                                </a>
                            </small>

                            <small className="me-3">
                                <i className="fas fa-envelope me-2 text-secondary"></i>
                                <a href="#" className="text-white">
                                    Fruitables@gmail.com
                                </a>
                            </small>
                        </div>

                        <div className="top-link pe-2">
                            <a href="#" className="text-white">
                                <small className="text-white mx-2">Chính sách bảo mật</small>/
                            </a>

                            <a href="#" className="text-white">
                                <small className="text-white mx-2">Điều khoản sử dụng</small>/
                            </a>

                            <a href="#" className="text-white">
                                <small className="text-white ms-2">Bán hàng & Hoàn tiền</small>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="container px-0">
                    <nav className="navbar navbar-light bg-white navbar-expand-xl">
                        <Link to="/" className="navbar-brand">
                            <h1 className="text-primary display-6">Fruitables</h1>
                        </Link>

                        <button
                            className="navbar-toggler py-2 px-3"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarCollapse"
                        >
                            <span className="fa fa-bars text-primary"></span>
                        </button>

                        <div className="collapse navbar-collapse bg-white" id="navbarCollapse">
                            <div className="navbar-nav mx-auto">
                                <Link to="/" className="nav-item nav-link">
                                    Trang chủ
                                </Link>

                                <Link to="/shop" className="nav-item nav-link">
                                    Cửa hàng
                                </Link>

                                <Link to="/shop-detail" className="nav-item nav-link">
                                    Chi tiết sản phẩm
                                </Link>

                                <div className="nav-item dropdown">
                                    <a href="#" className="nav-link dropdown-toggle active" data-bs-toggle="dropdown">
                                        Trang
                                    </a>

                                    <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                        <Link to="/cart" className="dropdown-item active">
                                            Giỏ hàng
                                        </Link>

                                        <Link to="/checkout" className="dropdown-item">
                                            Thanh toán
                                        </Link>
                                    </div>
                                </div>

                                <Link to="/contact" className="nav-item nav-link">
                                    Liên hệ
                                </Link>
                            </div>

                            <div className="d-flex m-3 me-0">
                                <Link
                                    to="/shop"
                                    className="btn-search btn border border-secondary btn-md-square rounded-circle bg-white me-4"
                                    aria-label="Đi tới cửa hàng"
                                >
                                    <i className="fas fa-search text-primary"></i>
                                </Link>

                                <Link to="/cart" className="position-relative me-4 my-auto">
                                    <i className="fa fa-shopping-bag fa-2x"></i>

                                    <span
                                        className="position-absolute bg-secondary rounded-circle d-flex align-items-center justify-content-center text-dark px-1"
                                        style={{
                                            top: '-5px',
                                            left: '15px',
                                            height: '20px',
                                            minWidth: '20px'
                                        }}
                                    >
                                        {cart.length}
                                    </span>
                                </Link>

                                {(() => {
                                    const userStorage = localStorage.getItem('user');
                                    let currentUser = null;

                                    if (userStorage && userStorage !== 'undefined' && userStorage !== 'null') {
                                        try {
                                            currentUser = JSON.parse(userStorage);
                                        } catch (e) {
                                            console.error('Lỗi đọc user', e);
                                        }
                                    }

                                    if (currentUser) {
                                        return (
                                            <div className="nav-item dropdown my-auto">
                                                <a
                                                    href="#"
                                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                                    data-bs-toggle="dropdown"
                                                    style={{ padding: 0 }}
                                                >
                                                    <i className="fas fa-user fa-2x text-success"></i>

                                                    <span className="ms-2 fw-bold text-dark">
                                                        {currentUser.name || currentUser.userName}
                                                    </span>
                                                </a>

                                                <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                                    {(currentUser.role === 'Admin' || currentUser.Role === 'Admin') && (
                                                        <Link to="/dashboard" className="dropdown-item fw-bold text-warning">
                                                            <i className="fas fa-cog me-2"></i>
                                                            Vào trang Quản trị
                                                        </Link>
                                                    )}

                                                    <Link to="/my-orders" className="dropdown-item">
                                                        Đơn hàng của tôi
                                                    </Link>

                                                    <a
                                                        href="#"
                                                        className="dropdown-item"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            localStorage.clear();
                                                            window.location.href = '/';
                                                        }}
                                                    >
                                                        <i className="fas fa-sign-out-alt me-2"></i>
                                                        Đăng xuất
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link to="/login" className="my-auto">
                                            <i className="fas fa-user fa-2x"></i>
                                        </Link>
                                    );
                                })()}
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
            {/* Navbar End */}

            {/* Page Header Start */}
            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Giỏ hàng</h1>

                <ol className="breadcrumb justify-content-center mb-0">
                    <li className="breadcrumb-item">
                        <Link to="/">Trang chủ</Link>
                    </li>

                    <li className="breadcrumb-item">
                        <Link to="/shop">Cửa hàng</Link>
                    </li>

                    <li className="breadcrumb-item active text-white">
                        Giỏ hàng
                    </li>
                </ol>
            </div>
            {/* Page Header End */}

            {/* Cart Start */}
            <div className="container-fluid py-5">
                <div className="container py-5">
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th scope="col">Hình ảnh</th>
                                    <th scope="col">Tên sản phẩm</th>
                                    <th scope="col">Đơn giá</th>
                                    <th scope="col">Số lượng</th>
                                    <th scope="col">Thành tiền</th>
                                    <th scope="col">Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <h4 className="text-secondary">
                                                Giỏ hàng của ní hiện tại đang trống trơn! 🛒
                                            </h4>

                                            <Link
                                                to="/shop"
                                                className="btn btn-primary mt-3 rounded-pill px-4 py-2 text-white fw-bold"
                                            >
                                                Mua sắm ngay
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item) => {
                                        const priceToUse = item.discountPrice || item.price;

                                        return (
                                            <tr key={item.id}>
                                                <th scope="row">
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={item.imageUrl || '/img/avatar.jpg'}
                                                            className="img-fluid me-5 rounded-circle"
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                objectFit: 'cover'
                                                            }}
                                                            alt={item.name}
                                                        />
                                                    </div>
                                                </th>

                                                <td>
                                                    <p className="mb-0 fw-bold">{item.name}</p>
                                                </td>

                                                <td>
                                                    <p className="mb-0">
                                                        {priceToUse.toLocaleString('vi-VN')} VNĐ / {getProductUnit(item)}
                                                    </p>
                                                </td>

                                                <td>
                                                    <div className="input-group quantity" style={{ width: '100px' }}>
                                                        <div className="input-group-btn">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                                className="btn btn-sm btn-minus rounded-circle bg-light border"
                                                            >
                                                                <i className="fa fa-minus"></i>
                                                            </button>
                                                        </div>

                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm text-center border-0"
                                                            value={item.quantity}
                                                            readOnly
                                                        />

                                                        <div className="input-group-btn">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                                className="btn btn-sm btn-plus rounded-circle bg-light border"
                                                            >
                                                                <i className="fa fa-plus"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <p className="mb-0 fw-bold text-danger">
                                                        {(priceToUse * item.quantity).toLocaleString('vi-VN')} VNĐ
                                                        <small className="d-block text-muted">
                                                            {item.quantity} {getProductUnit(item)}
                                                        </small>
                                                    </p>
                                                </td>

                                                <td>
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        className="btn btn-md rounded-circle bg-light border"
                                                    >
                                                        <i className="fa fa-times text-danger"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="row g-4 justify-content-end mt-4">
                        <div className="col-8"></div>

                        <div className="col-sm-8 col-md-7 col-lg-6 col-xl-4">
                            <div className="bg-light rounded p-4 border border-secondary">
                                <h1 className="display-6 mb-4" style={{ fontSize: '28px' }}>
                                    Tóm tắt <span className="fw-normal">đơn hàng</span>
                                </h1>

                                <div className="d-flex justify-content-between mb-3">
                                    <h5 className="mb-0">Tổng tiền hàng:</h5>

                                    <p className="mb-0 fw-bold text-danger" style={{ fontSize: '20px' }}>
                                        {subtotal.toLocaleString('vi-VN')} VNĐ
                                    </p>
                                </div>

                                <div className="d-flex justify-content-between mb-3">
                                    <small className="text-muted">
                                        *Phí vận chuyển và mã giảm giá sẽ được áp dụng ở bước thanh toán.
                                    </small>
                                </div>

                                <button
                                    className="btn border-secondary rounded-pill px-4 py-3 text-primary text-uppercase w-100 fw-bold mt-4"
                                    type="button"
                                    onClick={handleProceedCheckout}
                                >
                                    Tiến hành thanh toán
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Cart End */}
        </>
    );
};

export default Cart;
