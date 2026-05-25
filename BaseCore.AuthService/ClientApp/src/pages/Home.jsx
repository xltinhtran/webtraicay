import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
    // Khởi tạo công cụ chuyển trang
    const navigate = useNavigate();

    // --- 1. STATE LƯU DỮ LIỆU ---
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('All Products'); // Tab đang chọn mặc định
    const [cartCount, setCartCount] = useState(0); // Mặc định giỏ hàng trống = 0

    // 2. STATE LƯU CHỮ TÌM KIẾM TRANG CHỦ
    const [heroSearch, setHeroSearch] = useState('');

    // ---> THÊM BỘ NHỚ CHO CAROUSEL (BANNER) VÀO ĐÂY:
    const [activeSlide, setActiveSlide] = useState(0);

    // Tính năng tự động chuyển ảnh mỗi 3 giây
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev === 0 ? 1 : 0)); // Chỉ có 2 ảnh (0 và 1) nên cứ đảo qua lại
        }, 3000);
        return () => clearInterval(timer); // Xóa bộ đếm khi chuyển trang
    }, []);

    // Hàm cho nút Bấm Trái / Phải
    const nextSlide = () => setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? 1 : 0));

    // --- 2. GỌI API LẤY SẢN PHẨM TỪ SQL ---
    useEffect(() => {
        // Lấy danh sách sản phẩm
        fetch('http://localhost:5001/api/products')
            .then(res => res.json())
            .then(data => setProducts(data.items || data))
            .catch(err => console.log("Lỗi tải SP trang chủ: ", err));

        // Đoạn bọc thép chống crash "undefined"
        let currentUserId = null;
        const userString = localStorage.getItem('user');

        // Chỉ dịch JSON khi chuỗi có thật và không phải là chữ "undefined"
        if (userString && userString !== "undefined" && userString !== "null") {
            try {
                const userData = JSON.parse(userString);
                currentUserId = userData.userId || userData.id;
            } catch (e) {
                console.error("Lỗi rác LocalStorage, đang tự dọn...", e);
                localStorage.removeItem('user'); // Dọn rác
            }
        }

        if (currentUserId) {
            // Nếu đã đăng nhập thì đếm số lượng món trong giỏ
            fetch(`http://localhost:5001/api/carts/${currentUserId}`)
                .then(res => res.json())
                .then(data => {
                    setCartCount(data.length || 0);
                })
                .catch(err => console.log("Lỗi đếm giỏ hàng: ", err));
        } else {
            // Nếu khách vãng lai thì giỏ hàng bằng 0
            setCartCount(0);
        }
    }, []);

    // --- 3. LỌC SẢN PHẨM THEO TAB ---
    const filteredProducts = products.filter(item => {
        if (activeTab === 'All Products') return true;
        const catName = item.categoryName || item.category?.name || '';
        return catName.toLowerCase() === activeTab.toLowerCase();
    });

    // --- 4. HÀM THÊM GIỎ HÀNG (Lưu SQL) ---
    const handleAddToCart = async (e, product) => {
        e.preventDefault();

        // ✅ LẤY ID THỰC TẾ
        let currentUserId = null;
        const userString = localStorage.getItem('user');
        if (userString && userString !== "undefined" && userString !== "null") {
            try {
                const userData = JSON.parse(userString);
                currentUserId = userData.userId || userData.id;
            } catch (e) {
                console.error("Lỗi rác LocalStorage", e);
            }
        }

        // 🌟 BẪY AN TOÀN: Chưa đăng nhập thì không cho mua
        if (!currentUserId) {
            alert("Vui lòng đăng nhập để có thể mua hàng!");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/carts/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId, // Đã xóa chữ CUST-001
                    productId: product.id,
                    quantity: 1
                })
            });
            if (response.ok) {
                alert(`Đã bế em "${product.name}" vào giỏ hàng thành công! 🛒`);
                setCartCount(prevCount => prevCount + 1);
            } else {
                alert("Lỗi rồi, lưu SQL thất bại!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    };

    // --- 5. HÀM XỬ LÝ CHUYỂN TRANG TÌM KIẾM ---
    const handleHeroSearch = () => {
        // Lấy nút tắt Modal của Bootstrap (để tự đóng cái Modal màu đen lại trước khi chuyển trang)
        const closeBtn = document.getElementById('close-search-modal');
        if (closeBtn) closeBtn.click();

        // Chuyển sang trang /shop và mang theo từ khóa tìm kiếm
        navigate('/shop', { state: { searchTerm: heroSearch } });
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
                                <a href="#" className="text-white">236,Hoang Quoc Viet,Ha Noi</a>
                            </small>
                            <small className="me-3">
                                <i className="fas fa-envelope me-2 text-secondary"></i>
                                <a href="#" className="text-white">Email@Example.com</a>
                            </small>
                        </div>
                        <div className="top-link pe-2">
                            <a href="#" className="text-white"><small className="text-white mx-2">Privacy Policy</small>/</a>
                            <a href="#" className="text-white"><small className="text-white mx-2">Terms of Use</small>/</a>
                            <a href="#" className="text-white"><small className="text-white ms-2">Sales and Refunds</small></a>
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
                                <Link to="/" className="nav-item nav-link active">Home</Link>
                                <Link to="/shop" className="nav-item nav-link">Shop</Link>
                                <Link to="/shop-detail" className="nav-item nav-link">Shop Detail</Link>
                                <div className="nav-item dropdown">
                                    <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">Pages</a>
                                    <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                        <Link to="/cart" className="dropdown-item">Cart</Link>
                                        <Link to="/checkout" className="dropdown-item">Checkout</Link>
                                    </div>
                                </div>
                                <Link to="/contact" className="nav-item nav-link">Contact</Link>
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
                                
                                {/* LOGIC HIỂN THỊ MENU ĐĂNG NHẬP THÔNG MINH */}
                                {(() => {
                                    const userStorage = localStorage.getItem('user');
                                    let currentUser = null;
                                    if (userStorage && userStorage !== "undefined" && userStorage !== "null") {
                                        try {
                                            currentUser = JSON.parse(userStorage);
                                        } catch (e) {
                                            console.error("Lỗi đọc user", e);
                                        }
                                    }

                                    if (currentUser) {
                                        return (
                                            <div className="nav-item dropdown my-auto">
                                                <a href="#" className="nav-link dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown" style={{ padding: 0 }}>
                                                    <i className="fas fa-user fa-2x text-success"></i>
                                                    <span className="ms-2 fw-bold text-dark">{currentUser.name || currentUser.userName}</span>
                                                </a>
                                                <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                                    {/* NẾU LÀ ADMIN (Role = Admin) THÌ HIỆN NÚT VÀO DASHBOARD */}
                                                    {(currentUser.role === 'Admin' || currentUser.Role === 'Admin') && (
                                                        <Link to="/dashboard" className="dropdown-item fw-bold text-warning">
                                                            <i className="fas fa-cog me-2"></i>Vào trang Quản trị
                                                        </Link>
                                                    )}
                                                    <Link to="/cart" className="dropdown-item">Đơn hàng của tôi</Link>
                                                    <a href="#" className="dropdown-item" onClick={(e) => {
                                                        e.preventDefault();
                                                        localStorage.clear(); // Xóa sạch bộ nhớ
                                                        window.location.reload(); // Tải lại trang
                                                    }}>
                                                        <i className="fas fa-sign-out-alt me-2"></i>Đăng xuất
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // NẾU CHƯA ĐĂNG NHẬP THÌ HIỆN NÚT LOGIN BÌNH THƯỜNG
                                        return (
                                            <Link to="/login" className="my-auto">
                                                <i className="fas fa-user fa-2x"></i>
                                            </Link>
                                        );
                                    }
                                })()}
                            </div>

                        </div>
                    </nav>
                </div>
            </div>
            {/* Navbar End */}

            {/* Modal Search Start - ĐÃ CẮM DÂY ĐIỆN TÌM KIẾM */}
            <div className="modal fade" id="searchModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-fullscreen">
                    <div className="modal-content rounded-0">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Search by keyword</h5>
                            <button type="button" id="close-search-modal" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body d-flex align-items-center">
                            <div className="input-group w-75 mx-auto d-flex">
                                <input
                                    type="search"
                                    className="form-control p-3"
                                    placeholder="keywords"
                                    aria-describedby="search-icon-1"
                                    value={heroSearch} // Cắm chung biến heroSearch
                                    onChange={(e) => setHeroSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()} // Gõ xong bấm Enter chuyển trang
                                />
                                <span
                                    id="search-icon-1"
                                    className="input-group-text p-3"
                                    style={{ cursor: 'pointer' }}
                                    onClick={handleHeroSearch} // Click chuột vào kính lúp cũng chuyển trang
                                >
                                    <i className="fa fa-search"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal Search End */}

            {/* Hero Start */}
            <div className="container-fluid py-5 mb-5 hero-header">
                <div className="container py-5">
                    <div className="row g-5 align-items-center">
                        <div className="col-md-12 col-lg-7">
                            <h4 className="mb-3 text-secondary">100% Organic Foods</h4>
                            <h1 className="mb-5 display-3 text-primary">Organic Veggies & Fruits Foods</h1>
                            <div className="position-relative mx-auto">
                                <input
                                    className="form-control border-2 border-secondary w-75 py-3 px-4 rounded-pill"
                                    type="text"
                                    placeholder="Search..."
                                    value={heroSearch}
                                    onChange={(e) => setHeroSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                                />
                                <button
                                    type="button"
                                    onClick={handleHeroSearch}
                                    className="btn btn-primary border-2 border-secondary py-3 px-4 position-absolute rounded-pill text-white h-100"
                                    style={{ top: 0, right: '25%' }}
                                >
                                    Submit Now
                                </button>
                            </div>
                        </div>

                        {/* CỘT BÊN PHẢI CHỨA ẢNH CHUYỂN ĐỘNG - TỰ ĐỘNG CHUYỂN */}
                        <div className="col-md-12 col-lg-5">
                            <div id="carouselId" className="carousel slide position-relative">
                                <div className="carousel-inner" role="listbox">

                                    {/* ẢNH 1: Trái cây (Sẽ hiện khi activeSlide = 0) */}
                                    <div className={`carousel-item rounded ${activeSlide === 0 ? 'active' : ''}`} style={{ transition: 'opacity 0.5s ease-in-out' }}>
                                        <img src="/img/hero-img-1.png" className="img-fluid w-100 h-100 bg-secondary rounded" alt="First slide" />
                                        <a href="#" className="btn px-4 py-2 text-white rounded">Fruites</a>
                                    </div>

                                    {/* ẢNH 2: Rau củ (Sẽ hiện khi activeSlide = 1) */}
                                    <div className={`carousel-item rounded ${activeSlide === 1 ? 'active' : ''}`} style={{ transition: 'opacity 0.5s ease-in-out' }}>
                                        <img src="/img/hero-img-2.jpg" className="img-fluid w-100 h-100 rounded" alt="Second slide" />
                                        <a href="#" className="btn px-4 py-2 text-white rounded">Vesitables</a>
                                    </div>

                                </div>

                                {/* NÚT BẤM BÊN TRÁI */}
                                <button className="carousel-control-prev" type="button" onClick={prevSlide}>
                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                    <span className="visually-hidden">Previous</span>
                                </button>

                                {/* NÚT BẤM BÊN PHẢI */}
                                <button className="carousel-control-next" type="button" onClick={nextSlide}>
                                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span className="visually-hidden">Next</span>
                                </button>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {/* Hero End */}

            {/* Featurs Section Start */}
            <div className="container-fluid featurs py-5">
                <div className="container py-5">
                    <div className="row g-4">
                        <div className="col-md-6 col-lg-3">
                            <div className="featurs-item text-center rounded bg-light p-4">
                                <div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto">
                                    <i className="fas fa-car-side fa-3x text-white"></i>
                                </div>
                                <div className="featurs-content text-center">
                                    <h5>Free Shipping</h5>
                                    <p className="mb-0">Free on order over $300</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <div className="featurs-item text-center rounded bg-light p-4">
                                <div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto">
                                    <i className="fas fa-user-shield fa-3x text-white"></i>
                                </div>
                                <div className="featurs-content text-center">
                                    <h5>Security Payment</h5>
                                    <p className="mb-0">100% security payment</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <div className="featurs-item text-center rounded bg-light p-4">
                                <div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto">
                                    <i className="fas fa-exchange-alt fa-3x text-white"></i>
                                </div>
                                <div className="featurs-content text-center">
                                    <h5>30 Day Return</h5>
                                    <p className="mb-0">30 day money guarantee</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <div className="featurs-item text-center rounded bg-light p-4">
                                <div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto">
                                    <i className="fa fa-phone-alt fa-3x text-white"></i>
                                </div>
                                <div className="featurs-content text-center">
                                    <h5>24/7 Support</h5>
                                    <p className="mb-0">Support every time fast</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Featurs Section End */}

            {/* Banner Section Start*/}
            <div className="container-fluid banner bg-secondary my-5">
                <div className="container py-5">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-6">
                            <div className="py-4">
                                <h1 className="display-3 text-white">Fresh Exotic Fruits</h1>
                                <p className="fw-normal display-3 text-dark mb-4">in Our Store</p>
                                <p className="mb-4 text-dark">
                                    The generated Lorem Ipsum is therefore always free from
                                    repetition injected humour, or non-characteristic words etc.
                                </p>
                                <Link to="/shop" className="banner-btn btn border-2 border-white rounded-pill text-dark py-3 px-5">BUY</Link>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="position-relative">
                                <img src="/img/baner-1.png" className="img-fluid w-100 rounded" alt="" />
                                <div className="d-flex align-items-center justify-content-center bg-white rounded-circle position-absolute" style={{ width: '140px', height: '140px', top: 0, left: 0 }}>
                                    <h1 style={{ fontSize: '100px' }}>1</h1>
                                    <div className="d-flex flex-column">
                                        <span className="h2 mb-0">50$</span>
                                        <span className="h4 text-muted mb-0">kg</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Banner Section End */}

            {/* Fact Start */}
            <div className="container-fluid py-5">
                <div className="container">
                    <div className="bg-light p-5 rounded">
                        <div className="row g-4 justify-content-center">
                            <div className="col-md-6 col-lg-6 col-xl-3">
                                <div className="counter bg-white rounded p-5">
                                    <i className="fa fa-users text-secondary"></i>
                                    <h4>satisfied customers</h4>
                                    <h1>1963</h1>
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-6 col-xl-3">
                                <div className="counter bg-white rounded p-5">
                                    <i className="fa fa-users text-secondary"></i>
                                    <h4>quality of service</h4>
                                    <h1>99%</h1>
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-6 col-xl-3">
                                <div className="counter bg-white rounded p-5">
                                    <i className="fa fa-users text-secondary"></i>
                                    <h4>quality certificates</h4>
                                    <h1>33</h1>
                                </div>
                            </div>
                            <div className="col-md-6 col-lg-6 col-xl-3">
                                <div className="counter bg-white rounded p-5">
                                    <i className="fa fa-users text-secondary"></i>
                                    <h4>Available Products</h4>
                                    <h1>789</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Fact End */}

            {/* Tastimonial Start */}
            <div className="container-fluid testimonial py-5">
                <div className="container py-5">
                    <div className="testimonial-header text-center">
                        <h4 className="text-primary">Our Testimonial</h4>
                        <h1 className="display-5 mb-5 text-dark">Our Client Saying!</h1>
                    </div>
                    <div className="owl-carousel testimonial-carousel">
                        <div className="testimonial-item img-border-radius bg-light rounded p-4">
                            <div className="position-relative">
                                <i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: 0 }}></i>
                                <div className="mb-4 pb-4 border-bottom border-secondary">
                                    <p className="mb-0">
                                        Lorem Ipsum is simply dummy text of the printing Ipsum has
                                        been the industry's standard dummy text ever since the 1500s,
                                    </p>
                                </div>
                                <div className="d-flex align-items-center flex-nowrap">
                                    <div className="bg-secondary rounded">
                                        <img src="/img/testimonial-1.jpg" className="img-fluid rounded" style={{ width: '100px', height: '100px' }} alt="" />
                                    </div>
                                    <div className="ms-4 d-block">
                                        <h4 className="text-dark">Client Name</h4>
                                        <p className="m-0 pb-3">Profession</p>
                                        <div className="d-flex pe-5">
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-item img-border-radius bg-light rounded p-4">
                            <div className="position-relative">
                                <i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: 0 }}></i>
                                <div className="mb-4 pb-4 border-bottom border-secondary">
                                    <p className="mb-0">
                                        Lorem Ipsum is simply dummy text of the printing Ipsum has
                                        been the industry's standard dummy text ever since the 1500s,
                                    </p>
                                </div>
                                <div className="d-flex align-items-center flex-nowrap">
                                    <div className="bg-secondary rounded">
                                        <img src="/img/testimonial-1.jpg" className="img-fluid rounded" style={{ width: '100px', height: '100px' }} alt="" />
                                    </div>
                                    <div className="ms-4 d-block">
                                        <h4 className="text-dark">Client Name</h4>
                                        <p className="m-0 pb-3">Profession</p>
                                        <div className="d-flex pe-5">
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                            <i className="fas fa-star text-primary"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Tastimonial End */}

            {/* Footer Start */}
            <div className="container-fluid bg-dark text-white-50 footer pt-5 mt-5">
                <div className="container py-5">
                    <div className="pb-4 mb-4" style={{ borderBottom: '1px solid rgba(226, 175, 24, 0.5)' }}>
                        <div className="row g-4">
                            <div className="col-lg-3">
                                <a href="#">
                                    <h1 className="text-primary mb-0">Fruitables</h1>
                                    <p className="text-secondary mb-0">Fresh products</p>
                                </a>
                            </div>
                            <div className="col-lg-6">
                                <div className="position-relative mx-auto">
                                    <input className="form-control border-0 w-100 py-3 px-4 rounded-pill" type="number" placeholder="Your Email" />
                                    <button type="submit" className="btn btn-primary border-0 border-secondary py-3 px-4 position-absolute rounded-pill text-white" style={{ top: 0, right: 0 }}>Subscribe Now</button>
                                </div>
                            </div>
                            <div className="col-lg-3">
                                <div className="d-flex justify-content-end pt-3">
                                    <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href=""><i className="fab fa-twitter"></i></a>
                                    <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href=""><i className="fab fa-facebook-f"></i></a>
                                    <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href=""><i className="fab fa-youtube"></i></a>
                                    <a className="btn btn-outline-secondary btn-md-square rounded-circle" href=""><i className="fab fa-linkedin-in"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row g-5">
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="text-light mb-3">Why People Like us!</h4>
                                <p className="mb-4">typesetting, remaining essentially unchanged. It was
                                    popularised in the 1960s with the like Aldus PageMaker including of Lorem Ipsum.</p>
                                <a href="" className="btn border-secondary py-2 px-4 rounded-pill text-primary">Read More</a>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="d-flex flex-column text-start footer-item">
                                <h4 className="text-light mb-3">Shop Info</h4>
                                <a className="btn-link" href="">About Us</a>
                                <a className="btn-link" href="">Contact Us</a>
                                <a className="btn-link" href="">Privacy Policy</a>
                                <a className="btn-link" href="">Terms & Condition</a>
                                <a className="btn-link" href="">Return Policy</a>
                                <a className="btn-link" href="">FAQs & Help</a>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="d-flex flex-column text-start footer-item">
                                <h4 className="text-light mb-3">Account</h4>
                                <a className="btn-link" href="">My Account</a>
                                <a className="btn-link" href="">Shop details</a>
                                <a className="btn-link" href="">Shopping Cart</a>
                                <a className="btn-link" href="">Wishlist</a>
                                <a className="btn-link" href="">Order History</a>
                                <a className="btn-link" href="">International Orders</a>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="footer-item">
                                <h4 className="text-light mb-3">Contact</h4>
                                <p>Address: 1429 Netus Rd, NY 48247</p>
                                <p>Email: Example@gmail.com</p>
                                <p>Phone: +0123 4567 8910</p>
                                <p>Payment Accepted</p>
                                <img src="/img/payment.png" className="img-fluid" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer End */}

            {/* Copyright Start */}
            <div className="container-fluid copyright bg-dark py-4">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                            <span className="text-light"><a href="#"><i className="fas fa-copyright text-light me-2"></i>Fruitables System</a>, All right reserved.</span>
                        </div>
                        <div className="col-md-6 my-auto text-center text-md-end text-white">
                            Designed By <a className="border-bottom" href="https://htmlcodex.com">HTML Codex</a>
                        </div>
                    </div>
                </div>
            </div>
            {/* Copyright End */}

            {/* Back to Top */}
            <a href="#" className="btn btn-primary border-3 border-primary rounded-circle back-to-top"><i className="fa fa-arrow-up"></i></a>
        </>
    );
};

export default Home;