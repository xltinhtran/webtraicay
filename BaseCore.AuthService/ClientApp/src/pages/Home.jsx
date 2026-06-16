import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi, cartsApi } from '../services/api';

const getProductUnit = (product) => product?.unit || product?.Unit || 'sản phẩm';

const Home = () => {
    const navigate = useNavigate();

    // --- 1. STATE LƯU DỮ LIỆU ---
    const [products, setProducts] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    // 2. STATE LƯU CHỮ TÌM KIẾM TRANG CHỦ
    const [heroSearch, setHeroSearch] = useState('');
    const [activeSlide, setActiveSlide] = useState(0);

    // Tính năng tự động chuyển ảnh mỗi 3 giây (Cho 4 ảnh)
    useEffect(() => {
        const timer = setInterval(() => {
            // Đang ở ảnh 3 (ảnh cuối) thì quay về 0, còn lại cứ cộng 1
            setActiveSlide((prev) => (prev === 3 ? 0 : prev + 1));
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // Nút sang phải
    const nextSlide = () => setActiveSlide((prev) => (prev === 3 ? 0 : prev + 1));

    // Nút sang trái
    const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? 3 : prev - 1));

    // --- 2. GỌI API LẤY SẢN PHẨM ---
    useEffect(() => {
        // Tải danh sách sản phẩm từ C#
        productsApi.getAll({ pageSize: 100 })
            .then(res => {
                const data = res.data;
                setProducts(Array.isArray(data) ? data : (data?.items || data?.data || []));
            })
            .catch(err => console.log("Lỗi tải SP trang chủ: ", err));

        // Lấy số lượng giỏ hàng của User đang đăng nhập
        let currentUserId = null;
        const userString = localStorage.getItem('user');

        if (userString && userString !== "undefined" && userString !== "null") {
            try {
                const userData = JSON.parse(userString);
                currentUserId = userData.userId || userData.id;
            } catch {
                localStorage.removeItem('user');
            }
        }

        if (currentUserId) {
            cartsApi.getByUserId(currentUserId)
                .then(res => setCartCount(res.data.length || 0))
                .catch(err => console.log("Lỗi đếm giỏ hàng: ", err));
        } else {
            setCartCount(0);
        }
    }, []);

    // --- 4. HÀM THÊM GIỎ HÀNG ---
    const handleAddToCart = async (e, product) => {
        e.preventDefault();
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert("Vui lòng đăng nhập để có thể mua hàng!");
            navigate('/login');
            return;
        }

        try {
            await cartsApi.addToCart({ userId: currentUserId, productId: product.id, quantity: 1 });
            alert(`Đã thêm "${product.name}" vào giỏ hàng thành công! 🛒`);
            setCartCount(prevCount => prevCount + 1);
        } catch {
            alert("Thêm vào giỏ thất bại, kiểm tra lại API nha ní!");
        }
    };

    // --- 5. CHUYỂN TRANG TÌM KIẾM ---
    const handleHeroSearch = () => {
        const closeBtn = document.getElementById('close-search-modal');
        if (closeBtn) closeBtn.click();
        navigate('/shop', { state: { searchTerm: heroSearch } });
    };

    // Hàm render Ngôi sao
    const renderStars = (rating = 5) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`fas fa-star ${i < rating ? 'text-primary' : 'text-muted'}`}></i>
        ));
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
                                <a href="#" className="text-white">236 Hoàng Quốc Việt, Hà Nội</a>
                            </small>
                            <small className="me-3">
                                <i className="fas fa-envelope me-2 text-secondary"></i>
                                <a href="#" className="text-white">Fruitables@gmail.com</a>
                            </small>
                        </div>
                        <div className="top-link pe-2">
                            <a href="#" className="text-white"><small className="text-white mx-2">Chính sách bảo mật</small>/</a>
                            <a href="#" className="text-white"><small className="text-white mx-2">Điều khoản sử dụng</small>/</a>
                            <a href="#" className="text-white"><small className="text-white ms-2">Bán hàng & Hoàn tiền</small></a>
                        </div>
                    </div>
                </div>
                <div className="container px-0">
                    <nav className="navbar navbar-light bg-white navbar-expand-xl">
                        <Link to="/" className="navbar-brand"><h1 className="text-primary display-6">Fruitables</h1></Link>
                        <button className="navbar-toggler py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                            <span className="fa fa-bars text-primary"></span>
                        </button>
                        <div className="collapse navbar-collapse bg-white" id="navbarCollapse">
                            <div className="navbar-nav mx-auto">
                                <Link to="/" className="nav-item nav-link active">Trang chủ</Link>
                                <Link to="/shop" className="nav-item nav-link">Cửa hàng</Link>
                                <Link to="/shop-detail" className="nav-item nav-link">Chi tiết sản phẩm</Link>
                                <div className="nav-item dropdown">
                                    <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">Trang</a>
                                    <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                        <Link to="/cart" className="dropdown-item">Giỏ hàng</Link>
                                        <Link to="/checkout" className="dropdown-item">Thanh toán</Link>
                                    </div>
                                </div>
                                <Link to="/contact" className="nav-item nav-link">Liên hệ</Link>
                            </div>

                            <div className="d-flex m-3 me-0">
                                <button className="btn-search btn border border-secondary btn-md-square rounded-circle bg-white me-4" data-bs-toggle="modal" data-bs-target="#searchModal">
                                    <i className="fas fa-search text-primary"></i>
                                </button>
                                <Link to="/cart" className="position-relative me-4 my-auto">
                                    <i className="fa fa-shopping-bag fa-2x"></i>
                                    <span className="position-absolute bg-secondary rounded-circle d-flex align-items-center justify-content-center text-dark px-1" style={{ top: '-5px', left: '15px', height: '20px', minWidth: '20px' }}>
                                        {cartCount}
                                    </span>
                                </Link>

                                {/* LOGIC HIỂN THỊ TÊN KHÁCH HÀNG */}
                                {(() => {
                                    const userStorage = localStorage.getItem('user');
                                    let currentUser = null;
                                    if (userStorage && userStorage !== "undefined" && userStorage !== "null") {
                                        try { currentUser = JSON.parse(userStorage); } catch { }
                                    }
                                    if (currentUser) {
                                        return (
                                            <div className="nav-item dropdown my-auto">
                                                <a href="#" className="nav-link dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown" style={{ padding: 0 }}>
                                                    <i className="fas fa-user fa-2x text-success"></i>
                                                    <span className="ms-2 fw-bold text-dark">{currentUser.name || currentUser.userName}</span>
                                                </a>
                                                <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                                    {(currentUser.role === 'Admin' || currentUser.Role === 'Admin') && (
                                                        <Link to="/dashboard" className="dropdown-item fw-bold text-warning">
                                                            <i className="fas fa-cog me-2"></i>Quản trị viên
                                                        </Link>
                                                    )}
                                                    <Link to="/my-orders" className="dropdown-item">Đơn hàng của tôi</Link>
                                                    <a href="#" className="dropdown-item" onClick={(e) => {
                                                        e.preventDefault();
                                                        localStorage.clear();
                                                        window.location.reload();
                                                    }}>Đăng xuất</a>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return <Link to="/login" className="my-auto"><i className="fas fa-user fa-2x"></i></Link>;
                                    }
                                })()}
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
            {/* Navbar End */}

            {/* Modal Search Start */}
            <div className="modal fade" id="searchModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-fullscreen">
                    <div className="modal-content rounded-0">
                        <div className="modal-header">
                            <h5 className="modal-title">Tìm kiếm bằng từ khóa</h5>
                            <button type="button" id="close-search-modal" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body d-flex align-items-center">
                            <div className="input-group w-75 mx-auto d-flex">
                                <input type="search" className="form-control p-3" placeholder="Nhập từ khóa..." value={heroSearch} onChange={(e) => setHeroSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()} />
                                <span className="input-group-text p-3" style={{ cursor: 'pointer' }} onClick={handleHeroSearch}><i className="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Start */}
            <div className="container-fluid py-5 mb-5 hero-header">
                <div className="container py-5">
                    <div className="row g-5 align-items-center">
                        <div className="col-md-12 col-lg-7">
                            <h4 className="mb-3 text-secondary">100% Thực phẩm Hữu cơ</h4>
                            <h1 className="mb-5 display-3 text-primary">Rau Củ & Trái Cây Sạch</h1>
                            <div className="position-relative mx-auto">
                                <input className="form-control border-2 border-secondary w-75 py-3 px-4 rounded-pill" type="text" placeholder="Tìm kiếm..." value={heroSearch} onChange={(e) => setHeroSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()} />
                                <button type="button" onClick={handleHeroSearch} className="btn btn-primary border-2 border-secondary py-3 px-4 position-absolute rounded-pill text-white h-100" style={{ top: 0, right: '25%' }}>Tìm ngay</button>
                            </div>
                        </div>
                        <div className="col-md-12 col-lg-5">
                            <div id="carouselId" className="carousel slide position-relative">
                                <div className="carousel-inner" role="listbox">
                                    <div className={`carousel-item rounded ${activeSlide === 0 ? 'active' : ''}`} style={{ transition: 'opacity 0.5s ease-in-out' }}>
                                        <img src="/img/hero-img-1.png" className="img-fluid w-100 h-100 bg-secondary rounded" alt="First slide" />
                                        <a href="#" className="btn px-4 py-2 text-white rounded">Trái cây</a>
                                    </div>
                                    <div className={`carousel-item rounded ${activeSlide === 1 ? 'active' : ''}`} style={{ transition: 'opacity 0.5s ease-in-out' }}>
                                        <img src="/img/hero-img-2.jpg" className="img-fluid w-100 h-100 rounded" alt="Second slide" />
                                        <a href="#" className="btn px-4 py-2 text-white rounded">Rau củ</a>
                                    </div>
                                    <div className={`carousel-item rounded ${activeSlide === 2 ? 'active' : ''}`} style={{ transition: 'opacity 0.5s ease-in-out' }}>
                                        <img src="/img/anh.jpg" className="img-fluid w-100 h-100 rounded" alt="Next slide" />
                                        <a href="#" className="btn px-4 py-2 text-white rounded">Thịt</a>
                                    </div>
                                    <div className={`carousel-item rounded ${activeSlide === 3 ? 'active' : ''}`} style={{ transition: 'opacity 0.5s ease-in-out' }}>
                                        <img src="/img/banhmi.jpg" className="img-fluid w-100 h-100 rounded" alt="Next slide" />
                                        <a href="#" className="btn px-4 py-2 text-white rounded">Bánh mì</a>
                                    </div>
                                </div>
                                <button className="carousel-control-prev" type="button" onClick={prevSlide}><span className="carousel-control-prev-icon"></span></button>
                                <button className="carousel-control-next" type="button" onClick={nextSlide}><span className="carousel-control-next-icon"></span></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featurs Section Start */}
            <div className="container-fluid featurs py-5">
                <div className="container py-5">
                    <div className="row g-4">
                        <div className="col-md-6 col-lg-3"><div className="featurs-item text-center rounded bg-light p-4"><div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto"><i className="fas fa-car-side fa-3x text-white"></i></div><h5>Miễn phí vận chuyển</h5><p className="mb-0">Cho đơn hàng trên 300$</p></div></div>
                        <div className="col-md-6 col-lg-3"><div className="featurs-item text-center rounded bg-light p-4"><div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto"><i className="fas fa-user-shield fa-3x text-white"></i></div><h5>Thanh toán an toàn</h5><p className="mb-0">Bảo mật thanh toán 100%</p></div></div>
                        <div className="col-md-6 col-lg-3"><div className="featurs-item text-center rounded bg-light p-4"><div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto"><i className="fas fa-exchange-alt fa-3x text-white"></i></div><h5>Đổi trả trong 30 ngày</h5><p className="mb-0">Đảm bảo hoàn tiền trong 30 ngày</p></div></div>
                        <div className="col-md-6 col-lg-3"><div className="featurs-item text-center rounded bg-light p-4"><div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto"><i className="fa fa-phone-alt fa-3x text-white"></i></div><h5>Hỗ trợ 24/7</h5><p className="mb-0">Giải đáp nhanh chóng mọi lúc</p></div></div>
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            <div className="container-fluid banner bg-secondary my-5">
                <div className="container py-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-6">
                            <div className="py-4">
                                <p className="fw-normal display-3 text-dark mb-4">tại Cửa Hàng Của Chúng Tôi</p>
                                <p className="mb-4 text-dark">
                                    Cung cấp những sản phẩm tươi sạch, chất lượng nhất, mang lại sức khỏe và niềm vui cho gia đình bạn mỗi ngày.
                                </p>
                                <Link to="/shop" className="banner-btn btn border-2 border-white rounded-pill text-dark py-3 px-5">MUA NGAY</Link>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="position-relative">
                                <img src="/img/baner-1.png" className="img-fluid w-100 rounded" alt="" />
                                <div className="d-flex align-items-center justify-content-center bg-white rounded-circle position-absolute" style={{ width: '140px', height: '140px', top: 0, left: 0 }}>
                                    <h1 style={{ fontSize: '100px' }}>1</h1>
                                    <div className="d-flex flex-column"><span className="h2 mb-0">50$</span><span className="h4 text-muted mb-0">kg</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* KHU VỰC 4: SẢN PHẨM BÁN CHẠY NHẤT (LẤY TỪ DB) */}
            {/* ========================================================= */}
            <div className="container-fluid py-5">
                <div className="container py-5">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '700px' }}>
                        <h1 className="display-4">Sản Phẩm Bán Chạy Nhất</h1>
                        <p>Hương vị tự nhiên, chất lượng đỉnh cao được hàng ngàn khách hàng tin dùng mỗi ngày.</p>
                    </div>
                    <div className="row g-4">
                        {/* 6 Sản phẩm hiển thị dạng List ngang */}
                        {products.slice(0, 6).map(item => (
                            <div className="col-lg-6 col-xl-4" key={`best-${item.id}`}>
                                <div className="p-4 rounded bg-light h-100">
                                    <div className="row align-items-center">
                                        <div className="col-6">
                                            <Link to={`/shop-detail/${item.id}`}>
                                                <img src={item.imageUrl} className="img-fluid rounded-circle w-100" style={{ aspectRatio: '1', objectFit: 'cover' }} alt="" />
                                            </Link>
                                        </div>
                                        <div className="col-6">
                                            <Link to={`/shop-detail/${item.id}`} className="h5 d-block text-truncate">{item.name}</Link>
                                            <div className="d-flex my-3">{renderStars(item.rating || 5)}</div>
                                            <h4 className="mb-3 text-danger">{item.discountPrice || item.price} đ / {getProductUnit(item)}</h4>
                                            <button onClick={(e) => handleAddToCart(e, item)} className="btn border border-secondary rounded-pill px-3 text-primary">
                                                <i className="fa fa-shopping-bag me-2 text-primary"></i> Thêm
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 4 Sản phẩm hiển thị dạng Grid đứng */}
                        {products.slice(6, 10).map(item => (
                            <div className="col-md-6 col-lg-6 col-xl-3 mt-5" key={`best-grid-${item.id}`}>
                                <div className="text-center">
                                    <Link to={`/shop-detail/${item.id}`}>
                                        <img src={item.imageUrl} className="img-fluid rounded" style={{ height: '200px', width: '100%', objectFit: 'cover' }} alt="" />
                                    </Link>
                                    <div className="py-4">
                                        <Link to={`/shop-detail/${item.id}`} className="h5 d-block text-truncate">{item.name}</Link>
                                        <div className="d-flex my-3 justify-content-center">{renderStars(item.rating || 5)}</div>
                                        <h4 className="mb-3 text-danger">{item.discountPrice || item.price} đ / {getProductUnit(item)}</h4>
                                        <button onClick={(e) => handleAddToCart(e, item)} className="btn border border-secondary rounded-pill px-3 text-primary">
                                            <i className="fa fa-shopping-bag me-2 text-primary"></i> Thêm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fact Start */}
            <div className="container-fluid py-5">
                <div className="container">
                    <div className="bg-light p-5 rounded">
                        <div className="row g-4 justify-content-center">
                            <div className="col-md-6 col-lg-6 col-xl-3"><div className="counter bg-white rounded p-5"><i className="fa fa-users text-secondary"></i><h4>Khách hàng hài lòng</h4><h1>1963</h1></div></div>
                            <div className="col-md-6 col-lg-6 col-xl-3"><div className="counter bg-white rounded p-5"><i className="fa fa-users text-secondary"></i><h4>Chất lượng dịch vụ</h4><h1>99%</h1></div></div>
                            <div className="col-md-6 col-lg-6 col-xl-3"><div className="counter bg-white rounded p-5"><i className="fa fa-users text-secondary"></i><h4>Chứng nhận chất lượng</h4><h1>33</h1></div></div>
                            <div className="col-md-6 col-lg-6 col-xl-3"><div className="counter bg-white rounded p-5"><i className="fa fa-users text-secondary"></i><h4>Sản phẩm có sẵn</h4><h1>789</h1></div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonial Start */}
            <div className="container-fluid testimonial py-5">
                <div className="container py-5">
                    <div className="testimonial-header text-center">
                        <h4 className="text-primary">Đánh giá của khách hàng</h4>
                        <h1 className="display-5 mb-5 text-dark">Khách hàng nói gì về chúng tôi!</h1>
                    </div>
                    {/* Testimonial tạm thời giữ cấu trúc lưới */}
                    <div className="row g-4">
                        <div className="col-md-6"><div className="testimonial-item img-border-radius bg-light rounded p-4"><div className="position-relative"><i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: 0 }}></i><div className="mb-4 pb-4 border-bottom border-secondary"><p className="mb-0">"Chất lượng sản phẩm tuyệt vời, giao hàng cực nhanh."</p></div><div className="d-flex align-items-center flex-nowrap"><div className="bg-secondary rounded"><img src="/img/testimonial-1.jpg" className="img-fluid rounded" style={{ width: '100px', height: '100px' }} alt="" /></div><div className="ms-4 d-block"><h4 className="text-dark">Maria Gomez</h4><p className="m-0 pb-3">Đầu bếp</p><div className="d-flex pe-5">{renderStars(5)}</div></div></div></div></div></div>
                        <div className="col-md-6"><div className="testimonial-item img-border-radius bg-light rounded p-4"><div className="position-relative"><i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: 0 }}></i><div className="mb-4 pb-4 border-bottom border-secondary"><p className="mb-0">"Rất yên tâm khi mua thực phẩm sạch cho gia đình tại Fruitables."</p></div><div className="d-flex align-items-center flex-nowrap"><div className="bg-secondary rounded"><img src="/img/testimonial-1.jpg" className="img-fluid rounded" style={{ width: '100px', height: '100px' }} alt="" /></div><div className="ms-4 d-block"><h4 className="text-dark">John Doe</h4><p className="m-0 pb-3">Khách hàng</p><div className="d-flex pe-5">{renderStars(5)}</div></div></div></div></div></div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="container-fluid bg-dark text-white-50 footer pt-5 mt-5">
                <div className="container py-5">
                    <div className="row g-5">
                        <div className="col-lg-3"><h4 className="text-light">Fruitables</h4><p>Sản phẩm tươi sạch nhất.</p></div>
                        <div className="col-lg-3"><h4 className="text-light">Thông tin</h4><a className="d-block text-white-50" href="#">Về chúng tôi</a><a className="d-block text-white-50" href="#">Liên hệ</a></div>
                        <div className="col-lg-3"><h4 className="text-light">Tài khoản</h4><a className="d-block text-white-50" href="#">Đơn hàng</a><a className="d-block text-white-50" href="#">Giỏ hàng</a></div>
                        <div className="col-lg-3"><h4 className="text-light">Liên hệ</h4><p>236 Hoàng Quốc Việt, Hà Nội</p></div>
                    </div>
                </div>
            </div>

            <a href="#" className="btn btn-primary border-3 border-primary rounded-circle back-to-top"><i className="fa fa-arrow-up"></i></a>
        </>
    );
};

export default Home;
