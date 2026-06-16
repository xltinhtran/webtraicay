import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartsApi } from '../services/api';

const Contact = () => {
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    const [heroSearch, setHeroSearch] = useState('');

    // Lấy số lượng giỏ hàng để đồng bộ thanh Navbar
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (currentUserId) {
            cartsApi.getByUserId(currentUserId)
                .then(res => setCartCount(res.data.length || 0))
                .catch(err => console.log('Lỗi đếm giỏ hàng: ', err));
        } else {
            setCartCount(0);
        }
    }, []);

    const handleHeroSearch = () => {
        const closeBtn = document.getElementById('close-search-modal');
        if (closeBtn) closeBtn.click();

        navigate('/shop', {
            state: {
                searchTerm: heroSearch
            }
        });
    };
    const handleSendMessage = (e) => {
        e.preventDefault();
        alert('Cảm ơn ní đã liên hệ! Tụi tui sẽ phản hồi sớm nhất có thể. 🚀');
        e.target.reset();
    };

    return (
        <>
            {/* Navbar start */}
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
                                    <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                                        Trang
                                    </a>

                                    <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                        <Link to="/cart" className="dropdown-item">
                                            Giỏ hàng
                                        </Link>

                                        <Link to="/checkout" className="dropdown-item">
                                            Thanh toán
                                        </Link>
                                    </div>
                                </div>

                                <Link to="/contact" className="nav-item nav-link active">
                                    Liên hệ
                                </Link>
                            </div>

                            <div className="d-flex m-3 me-0">
                                <button
                                    className="btn-search btn border border-secondary btn-md-square rounded-circle bg-white me-4"
                                    data-bs-toggle="modal"
                                    data-bs-target="#searchModal"
                                >
                                    <i className="fas fa-search text-primary"></i>
                                </button>

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
                                        {cartCount}
                                    </span>
                                </Link>

                                {(() => {
                                    const userStorage = localStorage.getItem('user');
                                    let currentUser = null;

                                    if (userStorage && userStorage !== 'undefined' && userStorage !== 'null') {
                                        try {
                                            currentUser = JSON.parse(userStorage);
                                        } catch (e) {
                                            console.error('Lỗi đọc thông tin người dùng', e);
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

            {/* Modal Search Start */}
            <div
                className="modal fade"
                id="searchModal"
                tabIndex="-1"
                aria-labelledby="exampleModalLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-fullscreen">
                    <div className="modal-content rounded-0">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">
                                Tìm kiếm bằng từ khóa
                            </h5>

                            <button
                                type="button"
                                id="close-search-modal"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Đóng"
                            ></button>
                        </div>

                        <div className="modal-body d-flex align-items-center">
                            <div className="input-group w-75 mx-auto d-flex">
                                <input
                                    type="search"
                                    className="form-control p-3"
                                    placeholder="Nhập từ khóa..."
                                    value={heroSearch}
                                    onChange={(e) => setHeroSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                                />

                                <span
                                    id="search-icon-1"
                                    className="input-group-text p-3"
                                    style={{ cursor: 'pointer' }}
                                    onClick={handleHeroSearch}
                                >
                                    <i className="fa fa-search"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal Search End */}

            {/* Single Page Header start */}
            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Liên hệ</h1>

                <ol className="breadcrumb justify-content-center mb-0">
                    <li className="breadcrumb-item">
                        <Link to="/">Trang chủ</Link>
                    </li>

                    <li className="breadcrumb-item">
                        <a href="#">Trang</a>
                    </li>

                    <li className="breadcrumb-item active text-white">
                        Liên hệ
                    </li>
                </ol>
            </div>
            {/* Single Page Header End */}

            {/* Contact Start */}
            <div className="container-fluid contact py-5">
                <div className="container py-5">
                    <div className="p-5 bg-light rounded">
                        <div className="row g-4">
                            <div className="col-12">
                                <div className="text-center mx-auto" style={{ maxWidth: '700px' }}>
                                    <h1 className="text-primary">Liên hệ với chúng tôi</h1>

                                    <p className="mb-4">
                                        Liên hệ với Fruitables để nhận những sản phẩm tươi ngon nhất.
                                        Phản hồi của bạn giúp chúng tôi phục vụ tốt hơn mỗi ngày!
                                    </p>
                                </div>
                            </div>

                            <div className="col-lg-12">
                                <div className="h-100 rounded">
                                    <iframe
                                        className="rounded w-100"
                                        style={{ height: '400px', border: 0 }}
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.6571856852916!2d105.7827275!3d21.046397!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab32aabf6f5d%3A0xcfbd042b3221b6d!2zMjM2IEhvw6BuZyBRdeG7kWMgVmnhu4d0LCBD4buVIE5odeG6vywgQ-G6p3UgR2nhuqV5LCBIw6AgTuG7mWksIFZpZXRuYW0!5e0!3m2!1sen!2s!4v1690000000000!5m2!1sen!2s"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Bản đồ cửa hàng Fruitables"
                                    ></iframe>
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <form onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        className="w-100 form-control border-0 py-3 mb-4"
                                        placeholder="Tên của bạn"
                                        required
                                    />

                                    <input
                                        type="email"
                                        className="w-100 form-control border-0 py-3 mb-4"
                                        placeholder="Nhập email của bạn"
                                        required
                                    />

                                    <textarea
                                        className="w-100 form-control border-0 mb-4"
                                        rows="5"
                                        cols="10"
                                        placeholder="Nội dung tin nhắn"
                                        required
                                    ></textarea>

                                    <button
                                        className="w-100 btn form-control border-secondary py-3 bg-white text-primary"
                                        type="submit"
                                    >
                                        Gửi tin nhắn
                                    </button>
                                </form>
                            </div>

                            <div className="col-lg-5">
                                <div className="d-flex p-4 rounded mb-4 bg-white">
                                    <i className="fas fa-map-marker-alt fa-2x text-primary me-4"></i>

                                    <div>
                                        <h4>Địa chỉ</h4>
                                        <p className="mb-2">236 Hoàng Quốc Việt, Hà Nội</p>
                                    </div>
                                </div>

                                <div className="d-flex p-4 rounded mb-4 bg-white">
                                    <i className="fas fa-envelope fa-2x text-primary me-4"></i>

                                    <div>
                                        <h4>Gửi email</h4>
                                        <p className="mb-2">Email@Example.com</p>
                                    </div>
                                </div>

                                <div className="d-flex p-4 rounded bg-white">
                                    <i className="fa fa-phone-alt fa-2x text-primary me-4"></i>

                                    <div>
                                        <h4>Điện thoại</h4>
                                        <p className="mb-2">(+84) 987 654 321</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Contact End */}

            {/* Footer Start */}
            <div className="container-fluid bg-dark text-white-50 footer pt-5 mt-5">
                <div className="container py-5">
                    <div
                        className="pb-4 mb-4"
                        style={{ borderBottom: '1px solid rgba(226, 175, 24, 0.5)' }}
                    >
                        <div className="row g-4">
                            <div className="col-lg-3">
                                <a href="#">
                                    <h1 className="text-primary mb-0">Fruitables</h1>
                                    <p className="text-secondary mb-0">Sản phẩm tươi sạch</p>
                                </a>
                            </div>

                            <div className="col-lg-6">
                                <div className="position-relative mx-auto">
                                    <input
                                        className="form-control border-0 w-100 py-3 px-4 rounded-pill"
                                        type="email"
                                        placeholder="Email của bạn"
                                    />

                                    <button
                                        type="submit"
                                        className="btn btn-primary border-0 border-secondary py-3 px-4 position-absolute rounded-pill text-white"
                                        style={{
                                            top: 0,
                                            right: 0
                                        }}
                                    >
                                        Đăng ký ngay
                                    </button>
                                </div>
                            </div>

                            <div className="col-lg-3">
                                <div className="d-flex justify-content-end pt-3">
                                    <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href="">
                                        <i className="fab fa-twitter"></i>
                                    </a>

                                    <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href="">
                                        <i className="fab fa-facebook-f"></i>
                                    </a>

                                    <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href="">
                                        <i className="fab fa-youtube"></i>
                                    </a>

                                    <a className="btn btn-outline-secondary btn-md-square rounded-circle" href="">
                                        <i className="fab fa-linkedin-in"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-5">
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="text-light mb-3">Vì sao chọn chúng tôi?</h4>

                                <p className="mb-4">
                                    Chúng tôi cam kết mang đến thực phẩm an toàn, tươi ngon,
                                    không hóa chất độc hại và tốt cho sức khỏe người tiêu dùng.
                                </p>

                                <a href="" className="btn border-secondary py-2 px-4 rounded-pill text-primary">
                                    Xem thêm
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                            <div className="d-flex flex-column text-start footer-item">
                                <h4 className="text-light mb-3">Thông tin cửa hàng</h4>

                                <a className="btn-link" href="">Về chúng tôi</a>
                                <a className="btn-link" href="">Liên hệ</a>
                                <a className="btn-link" href="">Chính sách bảo mật</a>
                                <a className="btn-link" href="">Điều khoản & Điều kiện</a>
                                <a className="btn-link" href="">Chính sách đổi trả</a>
                                <a className="btn-link" href="">Câu hỏi thường gặp & Hỗ trợ</a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                            <div className="d-flex flex-column text-start footer-item">
                                <h4 className="text-light mb-3">Tài khoản</h4>

                                <a className="btn-link" href="">Tài khoản của tôi</a>
                                <a className="btn-link" href="">Chi tiết cửa hàng</a>
                                <a className="btn-link" href="">Giỏ hàng</a>
                                <a className="btn-link" href="">Danh sách yêu thích</a>
                                <a className="btn-link" href="">Lịch sử mua hàng</a>
                                <a className="btn-link" href="">Đơn hàng quốc tế</a>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="text-light mb-3">Liên hệ</h4>

                                <p>Địa chỉ: 236 Hoàng Quốc Việt, Hà Nội</p>
                                <p>Email: Example@gmail.com</p>
                                <p>Số điện thoại: +0123 4567 8910</p>
                                <p>Chấp nhận thanh toán</p>

                                <img
                                    src="/img/payment.png"
                                    className="img-fluid"
                                    alt="Phương thức thanh toán"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer End */}

            <div className="container-fluid copyright bg-dark py-4">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                            <span className="text-light">
                                <a href="#">
                                    <i className="fas fa-copyright text-light me-2"></i>
                                    Hệ thống Fruitables
                                </a>
                                , đã đăng ký bản quyền.
                            </span>
                        </div>

                        <div className="col-md-6 my-auto text-center text-md-end text-white">
                            Thiết kế bởi{' '}
                            <a className="border-bottom" href="https://htmlcodex.com">
                                HTML Codex
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <a href="#" className="btn btn-primary border-3 border-primary rounded-circle back-to-top">
                <i className="fa fa-arrow-up"></i>
            </a>
        </>
    );
};

export default Contact;