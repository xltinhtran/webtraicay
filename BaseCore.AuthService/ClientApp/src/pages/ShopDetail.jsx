import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const ShopDetail = () => {
    const navigate = useNavigate();

    // Lấy ID sản phẩm từ URL (nếu có set route là /shop-detail/:id)
    const { id } = useParams();

    // --- 1. STATE LƯU DỮ LIỆU ---
    const [product, setProduct] = useState(null); // Lưu thông tin 1 sản phẩm đang xem
    const [categories, setCategories] = useState([]);
    const [featured, setFeatured] = useState([]);

    const [cartCount, setCartCount] = useState(0); // Đồng bộ giỏ hàng
    const [heroSearch, setHeroSearch] = useState('');

    // State cho trang chi tiết
    const [quantity, setQuantity] = useState(1); // Số lượng khách muốn mua
    const [activeTab, setActiveTab] = useState('description'); // Chuyển đổi Tab Mô tả / Đánh giá

    // State cho Đánh giá (Review)
    const [reviewName, setReviewName] = useState('');
    const [reviewEmail, setReviewEmail] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviews, setReviews] = useState([]); // Hứng danh sách review từ C#

    // --- 2. GỌI API LẤY DỮ LIỆU ---
    useEffect(() => {
        // LẤY CHI TIẾT SẢN PHẨM
        if (id) {
            fetch(`http://localhost:5001/api/products/${id}`)
                .then(res => res.json())
                .then(data => setProduct(data))
                .catch(err => console.log("Lỗi tải SP chi tiết: ", err));

            // LẤY DANH SÁCH ĐÁNH GIÁ CỦA SẢN PHẨM NÀY TỪ C#
            fetch(`http://localhost:5001/api/reviews/product/${id}`)
                .then(res => res.json())
                .then(data => setReviews(data))
                .catch(err => console.log("Lỗi tải danh sách đánh giá: ", err));
        } else {
            // Backup: Nếu khách bấm vào link trên Navbar không có ID
            fetch('http://localhost:5001/api/products')
                .then(res => res.json())
                .then(data => {
                    const items = data.items || data;
                    if (items.length > 0) {
                        setProduct(items[0]);
                        // Lấy review cho SP backup
                        fetch(`http://localhost:5001/api/reviews/product/${items[0].id}`)
                            .then(res => res.json())
                            .then(revData => setReviews(revData));
                    }
                });
        }

        // LẤY DANH MỤC
        fetch('http://localhost:5001/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.log("Lỗi tải Danh mục: ", err));

        // LẤY SẢN PHẨM NỔI BẬT
        fetch('http://localhost:5001/api/products/featured')
            .then(res => res.json())
            .then(data => setFeatured(data))
            .catch(err => console.log("Lỗi tải SP nổi bật: ", err));

        // ✅ LẤY ID THỰC TẾ ĐỂ ĐẾM SỐ LƯỢNG GIỎ HÀNG
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (currentUserId) {
            fetch(`http://localhost:5001/api/carts/${currentUserId}`)
                .then(res => res.json())
                .then(data => setCartCount(data.length || 0))
                .catch(err => console.log("Lỗi đếm giỏ hàng: ", err));
        } else {
            setCartCount(0); // Khách vãng lai thì giỏ hàng bằng 0
        }
    }, [id]);

    // --- 3. CÁC HÀM XỬ LÝ LƯỢNG MUA & GIỎ HÀNG ---
    const decreaseQuantity = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const increaseQuantity = () => {
        if (product && quantity < product.stock) {
            setQuantity(quantity + 1);
        } else {
            alert(`Trong kho chỉ còn ${product?.stock} sản phẩm thôi ní ơi!`);
        }
    };

    const handleAddToCart = async (e, itemToBuy, qty = 1) => {
        e.preventDefault();

        // ✅ LẤY ID KHÁCH HÀNG THỰC TẾ
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        // 🌟 BẪY AN TOÀN: Chưa đăng nhập chặn lại luôn
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
                    userId: currentUserId, // Đã xóa cứng CUST-001
                    productId: itemToBuy.id,
                    quantity: qty
                })
            });
            if (response.ok) {
                alert(`Đã thêm ${qty} "${itemToBuy.name}" vào giỏ hàng thành công! 🛒`);
                // Cập nhật lại số lượng giỏ hàng sau khi thêm
                fetch(`http://localhost:5001/api/carts/${currentUserId}`)
                    .then(res => res.json())
                    .then(data => setCartCount(data.length || 0));
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    };

    // Hàm xử lý khi khách bấm nút "Post Comment"
    const handlePostReview = async (e) => {
        e.preventDefault();

        if (!reviewName || !reviewEmail || !reviewText) {
            alert("Ní ơi điền đủ Tên, Email với Nội dung giùm tui nha!");
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    name: reviewName,
                    email: reviewEmail,
                    content: reviewText,
                    rating: reviewRating
                })
            });

            if (response.ok) {
                alert("Cảm ơn ní đã đánh giá sản phẩm! 🌟");
                // Xóa trắng form
                setReviewName('');
                setReviewEmail('');
                setReviewText('');
                setReviewRating(5);

                // LẤY LẠI DANH SÁCH REVIEW MỚI NHẤT ĐỂ HIỆN LÊN LIỀN
                fetch(`http://localhost:5001/api/reviews/product/${product.id}`)
                    .then(res => res.json())
                    .then(data => setReviews(data));
            } else {
                alert("Lưu đánh giá thất bại, ní check lại Server C# nha!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    };

    // Hàm chuyển trang tìm kiếm
    const handleHeroSearch = () => {
        const closeBtn = document.getElementById('close-search-modal');
        if (closeBtn) closeBtn.click();
        navigate('/shop', { state: { searchTerm: heroSearch } });
    };

    // Hàm in sao
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<i key={i} className={`fas fa-star ${i <= rating ? 'text-warning' : 'text-muted'}`}></i>);
        }
        return stars;
    };

    if (!product) return <div className="text-center py-5 mt-5"><h2>Đang tải dữ liệu sản phẩm...</h2></div>;

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
                                <Link to="/" className="nav-item nav-link">Home</Link>
                                <Link to="/shop" className="nav-item nav-link">Shop</Link>
                                <Link to="/shop-detail" className="nav-item nav-link active">Shop Detail</Link>
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
                                <Link to="/login" className="my-auto">
                                    <i className="fas fa-user fa-2x"></i>
                                </Link>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
            {/* Navbar End */}

            {/* Modal Search Start */}
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
                                    value={heroSearch}
                                    onChange={(e) => setHeroSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                                />
                                <span id="search-icon-1" className="input-group-text p-3" style={{ cursor: 'pointer' }} onClick={handleHeroSearch}>
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
                <h1 className="text-center text-white display-6">Shop Detail</h1>
                <ol className="breadcrumb justify-content-center mb-0">
                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                    <li className="breadcrumb-item"><Link to="/shop">Shop</Link></li>
                    <li className="breadcrumb-item active text-white">Shop Detail</li>
                </ol>
            </div>
            {/* Single Page Header End */}

            {/* Single Product Start */}
            <div className="container-fluid mt-5 py-5">
                <div className="container py-5">
                    <div className="row g-4 mb-5">
                        <div className="col-lg-8 col-xl-9">
                            <div className="row g-4">
                                {/* HÌNH ẢNH SẢN PHẨM */}
                                <div className="col-lg-6">
                                    <div className="border rounded">
                                        <a href="#">
                                            <img src={product.imageUrl || "/img/single-item.jpg"} className="img-fluid rounded" alt={product.name} style={{ width: '100%', objectFit: 'cover' }} />
                                        </a>
                                    </div>
                                </div>

                                {/* THÔNG TIN SẢN PHẨM */}
                                <div className="col-lg-6">
                                    <h4 className="fw-bold mb-3">{product.name}</h4>
                                    <p className="mb-3">Category: {product.categoryName || 'Sản phẩm'}</p>
                                    <h5 className="fw-bold mb-3">
                                        {(product.discountPrice || product.DiscountPrice) ? (
                                            <>
                                                <span className="text-danger">${(product.discountPrice || product.DiscountPrice)}</span>
                                                <span className="text-muted text-decoration-line-through fs-6 ms-2">${product.price}</span>
                                            </>
                                        ) : (
                                            `$${product.price}`
                                        )}
                                    </h5>

                                    <div className="d-flex mb-4">
                                        {renderStars(product.rating || 5)}
                                    </div>

                                    <p className="mb-4">{product.description || 'Sản phẩm này rất tuyệt vời, tươi ngon và đảm bảo chất lượng. Mua ngay kẻo lỡ nha quý dị!'}</p>

                                    <p className="mb-4">Kho còn: <span className="fw-bold">{product.stock}</span> sản phẩm</p>

                                    {/* BỘ TĂNG GIẢM SỐ LƯỢNG */}
                                    <div className="input-group quantity mb-5" style={{ width: '100px' }}>
                                        <div className="input-group-btn">
                                            <button className="btn btn-sm btn-minus rounded-circle bg-light border" onClick={decreaseQuantity}>
                                                <i className="fa fa-minus"></i>
                                            </button>
                                        </div>
                                        <input type="text" className="form-control form-control-sm text-center border-0" value={quantity} readOnly />
                                        <div className="input-group-btn">
                                            <button className="btn btn-sm btn-plus rounded-circle bg-light border" onClick={increaseQuantity}>
                                                <i className="fa fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* NÚT THÊM VÀO GIỎ */}
                                    <button onClick={(e) => handleAddToCart(e, product, quantity)} className="btn border border-secondary rounded-pill px-4 py-2 mb-4 text-primary">
                                        <i className="fa fa-shopping-bag me-2 text-primary"></i> Add to cart
                                    </button>
                                </div>

                                {/* TAB MÔ TẢ & ĐÁNH GIÁ */}
                                <div className="col-lg-12">
                                    <nav>
                                        <div className="nav nav-tabs mb-3">
                                            <button className={`nav-link border-white border-bottom-0 ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
                                            <button className={`nav-link border-white border-bottom-0 ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
                                        </div>
                                    </nav>

                                    <div className="tab-content mb-5">
                                        {/* TAB DESCRIPTION */}
                                        <div className={`tab-pane ${activeTab === 'description' ? 'active d-block' : 'd-none'}`}>
                                            <p>{product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>

                                            <div className="px-2 mt-4">
                                                <div className="row g-4">
                                                    <div className="col-6">
                                                        <div className="row bg-light align-items-center text-center justify-content-center py-2">
                                                            <div className="col-6"><p className="mb-0">Weight</p></div>
                                                            <div className="col-6"><p className="mb-0">{product.weight || '1 kg'}</p></div>
                                                        </div>
                                                        <div className="row text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6"><p className="mb-0">Country of Origin</p></div>
                                                            <div className="col-6"><p className="mb-0">{product.countryOfOrigin || 'Vietnam Farm'}</p></div>
                                                        </div>
                                                        <div className="row bg-light text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6"><p className="mb-0">Quality</p></div>
                                                            <div className="col-6"><p className="mb-0">{product.quality || product.Quality || 'Organic'}</p></div>
                                                        </div>
                                                        <div className="row text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6"><p className="mb-0">Check</p></div>
                                                            <div className="col-6"><p className="mb-0">Healthy</p></div>
                                                        </div>
                                                        <div className="row bg-light text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6"><p className="mb-0">Min Weight</p></div>
                                                            <div className="col-6"><p className="mb-0">250 Kg</p></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TAB REVIEWS TỰ ĐỘNG ĐỔ DỮ LIỆU TỪ C# */}
                                        <div className={`tab-pane ${activeTab === 'reviews' ? 'active d-block' : 'd-none'}`}>
                                            {reviews && reviews.length > 0 ? (
                                                reviews.map((rev) => (
                                                    <div className="d-flex mb-4" key={rev.id}>
                                                        <img src={rev.userImage || "/img/avatar.jpg"} className="img-fluid rounded-circle p-3" style={{ width: '100px', height: '100px' }} alt="" />
                                                        <div className="flex-grow-1">
                                                            <p className="mb-2" style={{ fontSize: '14px' }}>
                                                                {new Date(rev.reviewDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                            <div className="d-flex justify-content-between">
                                                                <h5>{rev.userName}</h5>
                                                                <div className="d-flex mb-3">
                                                                    {renderStars(rev.rating)}
                                                                </div>
                                                            </div>
                                                            <p className="text-dark">{rev.comment}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên bóc tem em nó nha ní!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CỘT BÊN PHẢI (SIDEBAR) */}
                        <div className="col-lg-4 col-xl-3">
                            <div className="row g-4 fruite">
                                <div className="col-lg-12">
                                    {/* TÌM KIẾM */}
                                    <div className="input-group w-100 mx-auto d-flex mb-4">
                                        <input
                                            type="search"
                                            className="form-control p-3"
                                            placeholder="keywords"
                                            aria-describedby="search-icon-1"
                                            value={heroSearch}
                                            onChange={(e) => setHeroSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                                        />
                                        <span id="search-icon-1" className="input-group-text p-3" style={{ cursor: 'pointer' }} onClick={handleHeroSearch}>
                                            <i className="fa fa-search"></i>
                                        </span>
                                    </div>

                                    {/* DANH MỤC */}
                                    <div className="mb-4">
                                        <h4>Categories</h4>
                                        <ul className="list-unstyled fruite-categorie">
                                            {categories.map((cat) => (
                                                <li key={cat.id}>
                                                    <div className="d-flex justify-content-between fruite-name">
                                                        <Link to="/shop" state={{ category: cat.name }}>
                                                            <i className="fas fa-apple-alt me-2"></i>{cat.name}
                                                        </Link>
                                                        <span>({cat.count || 0})</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* SẢN PHẨM NỔI BẬT DỌC */}
                                <div className="col-lg-12">
                                    <h4 className="mb-4">Featured products</h4>
                                    {featured && featured.slice(0, 4).map(item => (
                                        <div className="d-flex align-items-center justify-content-start mb-4" key={item.id}>
                                            <div className="rounded" style={{ width: '100px', height: '100px' }}>
                                                <img src={item.imageUrl || '/img/fruite-item-5.jpg'} className="img-fluid rounded" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div className="ms-4">
                                                <h6 className="mb-2">{item.name}</h6>
                                                <div className="d-flex mb-2" style={{ fontSize: '12px' }}>
                                                    {renderStars(item.rating || 5)}
                                                </div>
                                                <div className="d-flex mb-2">
                                                    {(item.discountPrice || item.DiscountPrice) ? (
                                                        <>
                                                            <h5 className="fw-bold me-2 text-danger">{(item.discountPrice || item.DiscountPrice)} $</h5>
                                                            <h5 className="text-muted text-decoration-line-through">{item.price} $</h5>
                                                        </>
                                                    ) : (
                                                        <h5 className="fw-bold me-2">{item.price} $</h5>
                                                    )}
                                                </div>
                                                <Link to={`/shop-detail/${item.id}`} className="btn border border-secondary rounded-pill px-3 py-1 text-primary" style={{ fontSize: '12px' }}>
                                                    Xem chi tiết
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-center my-4">
                                        <Link to="/shop" className="btn border border-secondary px-4 py-3 rounded-pill text-primary w-100">View More</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Single Product End */}

            {/* FORM ĐỂ LẠI BÌNH LUẬN ĐÃ ĐƯỢC CẮM ĐIỆN */}
            <div className={`container mb-5 ${activeTab === 'reviews' ? 'd-block' : 'd-none'}`}>
                <div className="row">
                    <div className="col-lg-8 col-xl-9">
                        <form onSubmit={handlePostReview}>
                            <h4 className="mb-5 fw-bold">Leave a Reply</h4>
                            <div className="row g-4">
                                <div className="col-lg-6">
                                    <div className="border-bottom rounded">
                                        <input
                                            type="text"
                                            className="form-control border-0 me-4"
                                            placeholder="Your Name *"
                                            value={reviewName}
                                            onChange={(e) => setReviewName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="border-bottom rounded">
                                        <input
                                            type="email"
                                            className="form-control border-0"
                                            placeholder="Your Email *"
                                            value={reviewEmail}
                                            onChange={(e) => setReviewEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-lg-12">
                                    <div className="border-bottom rounded my-4">
                                        <textarea
                                            className="form-control border-0"
                                            cols="30" rows="8"
                                            placeholder="Your Review *"
                                            spellCheck="false"
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="col-lg-12">
                                    <div className="d-flex justify-content-between py-3 mb-5">
                                        <div className="d-flex align-items-center">
                                            <p className="mb-0 me-3">Please rate:</p>
                                            <div className="d-flex align-items-center" style={{ fontSize: '18px', cursor: 'pointer' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <i
                                                        key={star}
                                                        className={`fa fa-star ${star <= reviewRating ? 'text-warning' : 'text-muted'}`}
                                                        onClick={() => setReviewRating(star)}
                                                        style={{ transition: 'color 0.2s' }}
                                                    ></i>
                                                ))}
                                            </div>
                                        </div>
                                        <button type="submit" className="btn border border-secondary text-primary rounded-pill px-4 py-3">
                                            Post Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

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

            <a href="#" className="btn btn-primary border-3 border-primary rounded-circle back-to-top"><i className="fa fa-arrow-up"></i></a>
        </>
    );
};

export default ShopDetail;