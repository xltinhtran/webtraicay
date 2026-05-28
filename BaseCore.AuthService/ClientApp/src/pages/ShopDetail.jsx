import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi, cartsApi, reviewsApi } from '../services/api';

const ShopDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [featured, setFeatured] = useState([]);

    const [cartCount, setCartCount] = useState(0);
    const [heroSearch, setHeroSearch] = useState('');
    const [ratingSummary, setRatingSummary] = useState({});

    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    const [reviews, setReviews] = useState([]);

    const formatCurrency = (value) => {
        return Number(value || 0).toLocaleString('vi-VN') + ' đ';
    };

    const getQualityText = (quality) => {
        switch (quality) {
            case 'Organic':
                return 'Hữu cơ';
            case 'Fresh':
                return 'Tươi mới';
            case 'Sales':
                return 'Bán chạy';
            case 'Discount':
                return 'Giảm giá';
            case 'Expired':
                return 'Hết hạn';
            case 'Premium':
                return 'Cao cấp';
            default:
                return quality || 'Hữu cơ';
        }
    };

    useEffect(() => {
        setQuantity(1);
        setActiveTab('description');

        if (id) {
            productsApi.getById(id)
                .then(res => setProduct(res.data))
                .catch(err => console.log('Lỗi tải sản phẩm chi tiết: ', err));

            reviewsApi.getByProductId(id)
                .then(res => setReviews(res.data || []))
                .catch(err => console.log('Lỗi tải danh sách đánh giá: ', err));
        } else {
            productsApi.getAll()
                .then(res => {
                    const items = res.data.items || res.data;

                    if (items.length > 0) {
                        setProduct(items[0]);

                        reviewsApi.getByProductId(items[0].id)
                            .then(revRes => setReviews(revRes.data || []))
                            .catch(err => console.log('Lỗi tải đánh giá sản phẩm mặc định: ', err));
                    }
                })
                .catch(err => console.log('Lỗi tải danh sách sản phẩm: ', err));
        }

        categoriesApi.getAll()
            .then(res => setCategories(res.data || []))
            .catch(err => console.log('Lỗi tải danh mục: ', err));

        productsApi.getFeatured()
            .then(res => setFeatured(res.data || []))
            .catch(err => console.log('Lỗi tải sản phẩm nổi bật: ', err));

        reviewsApi.getSummary()
            .then(res => {
                const summaryMap = {};

                (res.data || []).forEach(item => {
                    const productId = item.productId || item.ProductId;

                    if (!productId) {
                        return;
                    }

                    summaryMap[productId] = {
                        averageRating: Number(item.averageRating || item.AverageRating || 0),
                        reviewCount: Number(item.reviewCount || item.ReviewCount || 0)
                    };
                });

                setRatingSummary(summaryMap);
            })
            .catch(err => console.log('Lỗi tải sao trung bình:', err));

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (currentUserId) {
            cartsApi.getByUserId(currentUserId)
                .then(res => setCartCount(res.data.length || 0))
                .catch(err => console.log('Lỗi đếm giỏ hàng: ', err));
        } else {
            setCartCount(0);
        }
    }, [id]);

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
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

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert('Vui lòng đăng nhập để có thể mua hàng!');
            navigate('/login');
            return;
        }

        try {
            await cartsApi.addToCart({
                userId: currentUserId,
                productId: itemToBuy.id,
                quantity: qty
            });

            alert(`Đã thêm ${qty} "${itemToBuy.name}" vào giỏ hàng thành công! 🛒`);

            cartsApi.getByUserId(currentUserId)
                .then(res => setCartCount(res.data.length || 0))
                .catch(err => console.log('Lỗi cập nhật giỏ hàng: ', err));
        } catch (error) {
            console.error('Lỗi thêm vào giỏ hàng:', error);
            alert('Thêm vào giỏ hàng thất bại!');
        }
    };

    const handleHeroSearch = () => {
        const closeBtn = document.getElementById('close-search-modal');
        if (closeBtn) closeBtn.click();

        navigate('/shop', {
            state: {
                searchTerm: heroSearch
            }
        });
    };

    const renderStars = (rating) => {
        const stars = [];
        const value = Number(rating || 0);

        for (let i = 1; i <= 5; i++) {
            if (value >= i) {
                stars.push(
                    <i key={i} className="fas fa-star text-warning"></i>
                );
            } else if (value >= i - 0.5) {
                stars.push(
                    <i key={i} className="fas fa-star-half-alt text-warning"></i>
                );
            } else {
                stars.push(
                    <i key={i} className="far fa-star text-secondary"></i>
                );
            }
        }

        return stars;
    };

    const getAverageRating = () => {
        if (!reviews || reviews.length === 0) return 0;

        const total = reviews.reduce((sum, rev) => {
            return sum + Number(rev.rating || rev.Rating || 0);
        }, 0);

        return Number((total / reviews.length).toFixed(1));
    };

    const getProductRating = (productId) => {
        const summary = ratingSummary[productId];

        if (summary) {
            return summary;
        }

        if (product && Number(product.id) === Number(productId) && reviews.length > 0) {
            return {
                averageRating: getAverageRating(),
                reviewCount: reviews.length
            };
        }

        return {
            averageRating: 0,
            reviewCount: 0
        };
    };

    const getReviewImageUrl = (imageUrl) => {
        if (!imageUrl) return '';

        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        const backendUrl = 'http://localhost:5001';

        return `${backendUrl}${imageUrl}`;
    };

    if (!product) {
        return (
            <div className="text-center py-5 mt-5">
                <h2>Đang tải dữ liệu sản phẩm...</h2>
            </div>
        );
    }

    return (
        <>
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
                                <Link to="/" className="nav-item nav-link">Trang chủ</Link>
                                <Link to="/shop" className="nav-item nav-link">Cửa hàng</Link>
                                <Link to="/shop-detail" className="nav-item nav-link active">Chi tiết sản phẩm</Link>

                                <div className="nav-item dropdown">
                                    <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                                        Trang
                                    </a>

                                    <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                        <Link to="/cart" className="dropdown-item">Giỏ hàng</Link>
                                        <Link to="/checkout" className="dropdown-item">Thanh toán</Link>
                                    </div>
                                </div>

                                <Link to="/contact" className="nav-item nav-link">Liên hệ</Link>
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

            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Chi tiết sản phẩm</h1>

                <ol className="breadcrumb justify-content-center mb-0">
                    <li className="breadcrumb-item">
                        <Link to="/">Trang chủ</Link>
                    </li>

                    <li className="breadcrumb-item">
                        <Link to="/shop">Cửa hàng</Link>
                    </li>

                    <li className="breadcrumb-item active text-white">
                        Chi tiết sản phẩm
                    </li>
                </ol>
            </div>

            <div className="container-fluid mt-5 py-5">
                <div className="container py-5">
                    <div className="row g-4 mb-5">
                        <div className="col-lg-8 col-xl-9">
                            <div className="row g-4">
                                <div className="col-lg-6">
                                    <div className="border rounded">
                                        <a href="#">
                                            <img
                                                src={product.imageUrl || '/img/single-item.jpg'}
                                                className="img-fluid rounded"
                                                alt={product.name}
                                                style={{
                                                    width: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </a>
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <h4 className="fw-bold mb-3">{product.name}</h4>

                                    <p className="mb-3">
                                        Danh mục: {product.categoryName || product.category?.name || 'Sản phẩm'}
                                    </p>

                                    <h5 className="fw-bold mb-3">
                                        {(product.discountPrice || product.DiscountPrice) ? (
                                            <>
                                                <span className="text-danger">
                                                    {formatCurrency(product.discountPrice || product.DiscountPrice)}
                                                </span>

                                                <span className="text-muted text-decoration-line-through fs-6 ms-2">
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </>
                                        ) : (
                                            formatCurrency(product.price)
                                        )}
                                    </h5>

                                    <div className="d-flex align-items-center mb-4">
                                        <div className="me-2">
                                            {renderStars(getAverageRating())}
                                        </div>

                                        <span className="text-muted">
                                            {reviews.length > 0
                                                ? `${getAverageRating()}/5 (${reviews.length} đánh giá)`
                                                : 'Chưa có đánh giá'}
                                        </span>
                                    </div>

                                    <p className="mb-4">
                                        {product.description || 'Sản phẩm này rất tươi ngon, đảm bảo chất lượng và phù hợp cho bữa ăn hằng ngày của gia đình bạn.'}
                                    </p>

                                    <p className="mb-4">
                                        Kho còn: <span className="fw-bold">{product.stock}</span> sản phẩm
                                    </p>

                                    <div className="input-group quantity mb-5" style={{ width: '100px' }}>
                                        <div className="input-group-btn">
                                            <button
                                                className="btn btn-sm btn-minus rounded-circle bg-light border"
                                                onClick={decreaseQuantity}
                                            >
                                                <i className="fa fa-minus"></i>
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm text-center border-0"
                                            value={quantity}
                                            readOnly
                                        />

                                        <div className="input-group-btn">
                                            <button
                                                className="btn btn-sm btn-plus rounded-circle bg-light border"
                                                onClick={increaseQuantity}
                                            >
                                                <i className="fa fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleAddToCart(e, product, quantity)}
                                        className="btn border border-secondary rounded-pill px-4 py-2 mb-4 text-primary"
                                    >
                                        <i className="fa fa-shopping-bag me-2 text-primary"></i>
                                        Thêm vào giỏ hàng
                                    </button>
                                </div>

                                <div className="col-lg-12">
                                    <nav>
                                        <div className="nav nav-tabs mb-3">
                                            <button
                                                className={`nav-link border-white border-bottom-0 ${activeTab === 'description' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('description')}
                                            >
                                                Mô tả
                                            </button>

                                            <button
                                                className={`nav-link border-white border-bottom-0 ${activeTab === 'reviews' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('reviews')}
                                            >
                                                Đánh giá
                                            </button>
                                        </div>
                                    </nav>

                                    <div className="tab-content mb-5">
                                        <div className={`tab-pane ${activeTab === 'description' ? 'active d-block' : 'd-none'}`}>
                                            <p>
                                                {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                                            </p>

                                            <div className="px-2 mt-4">
                                                <div className="row g-4">
                                                    <div className="col-6">
                                                        <div className="row bg-light align-items-center text-center justify-content-center py-2">
                                                            <div className="col-6">
                                                                <p className="mb-0">Khối lượng</p>
                                                            </div>

                                                            <div className="col-6">
                                                                <p className="mb-0">{product.weight || '1 kg'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="row text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6">
                                                                <p className="mb-0">Xuất xứ</p>
                                                            </div>

                                                            <div className="col-6">
                                                                <p className="mb-0">
                                                                    {product.countryOfOrigin || 'Nông trại Việt Nam'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="row bg-light text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6">
                                                                <p className="mb-0">Chất lượng</p>
                                                            </div>

                                                            <div className="col-6">
                                                                <p className="mb-0">
                                                                    {getQualityText(product.quality || product.Quality)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="row text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6">
                                                                <p className="mb-0">Tình trạng</p>
                                                            </div>

                                                            <div className="col-6">
                                                                <p className="mb-0">Đạt chuẩn</p>
                                                            </div>
                                                        </div>

                                                        <div className="row bg-light text-center align-items-center justify-content-center py-2">
                                                            <div className="col-6">
                                                                <p className="mb-0">Khối lượng tối thiểu</p>
                                                            </div>

                                                            <div className="col-6">
                                                                <p className="mb-0">250 g</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`tab-pane ${activeTab === 'reviews' ? 'active d-block' : 'd-none'}`}>
                                            {reviews && reviews.length > 0 ? (
                                                reviews.map((rev) => (
                                                    <div className="d-flex mb-4" key={rev.id}>
                                                        <img
                                                            src={rev.userImage || '/img/avatar.jpg'}
                                                            className="img-fluid rounded-circle p-3"
                                                            style={{
                                                                width: '100px',
                                                                height: '100px'
                                                            }}
                                                            alt="Ảnh người đánh giá"
                                                        />

                                                        <div className="flex-grow-1">
                                                            <p className="mb-2" style={{ fontSize: '14px' }}>
                                                                {new Date(rev.reviewDate).toLocaleDateString('vi-VN')}
                                                            </p>

                                                            <div className="d-flex justify-content-between">
                                                                <h5>{rev.userName || rev.name || 'Khách hàng'}</h5>

                                                                <div className="d-flex mb-3">
                                                                    {renderStars(rev.rating || rev.Rating || 0)}
                                                                </div>
                                                            </div>

                                                            <p className="text-dark mb-2">
                                                                {rev.comment || rev.Comment || rev.content || rev.Content || 'Người dùng chưa để lại nội dung đánh giá.'}
                                                            </p>

                                                            {(rev.imageUrl || rev.ImageUrl) && (
                                                                <div className="mt-3">
                                                                    <img
                                                                        src={getReviewImageUrl(rev.imageUrl || rev.ImageUrl)}
                                                                        alt="Ảnh đánh giá sản phẩm"
                                                                        className="img-fluid rounded border"
                                                                        style={{
                                                                            width: '180px',
                                                                            height: '120px',
                                                                            objectFit: 'cover'
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>
                                                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá sản phẩm nhé!
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4 col-xl-3">
                            <div className="row g-4 fruite">
                                <div className="col-lg-12">
                                    <div className="input-group w-100 mx-auto d-flex mb-4">
                                        <input
                                            type="search"
                                            className="form-control p-3"
                                            placeholder="Nhập từ khóa..."
                                            aria-describedby="search-icon-1"
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

                                    <div className="mb-4">
                                        <h4>Danh mục</h4>

                                        <ul className="list-unstyled fruite-categorie">
                                            {categories.map((cat) => (
                                                <li key={cat.id}>
                                                    <div className="d-flex justify-content-between fruite-name">
                                                        <Link to="/shop" state={{ category: cat.name }}>
                                                            <i className="fas fa-apple-alt me-2"></i>
                                                            {cat.name}
                                                        </Link>

                                                        <span>({cat.count || 0})</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="col-lg-12">
                                    <h4 className="mb-4">Sản phẩm nổi bật</h4>

                                    {featured && featured.slice(0, 4).map(item => {
                                        const itemRating = getProductRating(item.id);

                                        return (
                                            <div
                                                className="d-flex align-items-center justify-content-start mb-4"
                                                key={item.id}
                                            >
                                                <div className="rounded" style={{ width: '100px', height: '100px' }}>
                                                    <img
                                                        src={item.imageUrl || '/img/fruite-item-5.jpg'}
                                                        className="img-fluid rounded"
                                                        alt={item.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </div>

                                                <div className="ms-4">
                                                    <h6 className="mb-2">{item.name}</h6>

                                                    <div className="d-flex align-items-center mb-2" style={{ fontSize: '12px' }}>
                                                        <div className="me-2">
                                                            {renderStars(itemRating.averageRating)}
                                                        </div>

                                                        <small className="text-muted">
                                                            {itemRating.reviewCount > 0
                                                                ? `${itemRating.averageRating}/5`
                                                                : 'Chưa có'}
                                                        </small>
                                                    </div>

                                                    <div className="d-flex mb-2 flex-column">
                                                        {(item.discountPrice || item.DiscountPrice) ? (
                                                            <>
                                                                <h5 className="fw-bold me-2 text-danger">
                                                                    {formatCurrency(item.discountPrice || item.DiscountPrice)}
                                                                </h5>

                                                                <h5 className="text-muted text-decoration-line-through">
                                                                    {formatCurrency(item.price)}
                                                                </h5>
                                                            </>
                                                        ) : (
                                                            <h5 className="fw-bold me-2">
                                                                {formatCurrency(item.price)}
                                                            </h5>
                                                        )}
                                                    </div>

                                                    <Link
                                                        to={`/shop-detail/${item.id}`}
                                                        className="btn border border-secondary rounded-pill px-3 py-1 text-primary"
                                                        style={{ fontSize: '12px' }}
                                                    >
                                                        Xem chi tiết
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="d-flex justify-content-center my-4">
                                        <Link
                                            to="/shop"
                                            className="btn border border-secondary px-4 py-3 rounded-pill text-primary w-100"
                                        >
                                            Xem thêm
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShopDetail;