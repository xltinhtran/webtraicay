import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi, cartsApi, reviewsApi } from '../services/api';

const getProductUnit = (product) => product?.unit || product?.Unit || 'sản phẩm';

const Shop = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Thêm cái này để chuyển trang khi chưa đăng nhập

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingSummary, setRatingSummary] = useState({});
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [additionalFilter, setAdditionalFilter] = useState("All");

  const [selectedCategory, setSelectedCategory] = useState(
    location.state?.category || "All",
  );

  // SỬA: Thay thanh trượt bằng 2 ô nhập giá Từ - Đến
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState(""); // Mặc định 5 triệu

  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [searchQuery, setSearchQuery] = useState(
    location.state?.searchTerm || "",
  );

  useEffect(() => {
    if (location.state?.searchTerm !== undefined) {
      setSearchQuery(location.state.searchTerm);
    }
    if (location.state?.category !== undefined) {
      setSelectedCategory(location.state.category);
    }
  }, [location.state]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, additionalFilter]); // Đã đổi state price thành min/maxPrice

  useEffect(() => {
    // TẢI DANH MỤC
    categoriesApi
      .getAll()
      .then((res) => setCategories(res.data))
      .catch((err) => console.log("Lỗi tải Danh mục: ", err));

    // TẢI SP NỔI BẬT
    productsApi
      .getFeatured()
      .then((res) => setFeatured(res.data))
      .catch((err) => console.log("Lỗi tải SP nổi bật: ", err));

    reviewsApi
      .getSummary()
      .then((res) => {
        const summaryMap = {};

        (res.data || []).forEach((item) => {
          const productId = item.productId || item.ProductId;

          summaryMap[productId] = {
            averageRating: item.averageRating || item.AverageRating || 0,
            reviewCount: item.reviewCount || item.ReviewCount || 0,
          };
        });

        setRatingSummary(summaryMap);
      })
      .catch((err) => console.log("Lỗi tải sao đánh giá: ", err));
    // ✅ LẤY ID THỰC TẾ ĐỂ ĐẾM SỐ LƯỢNG GIỎ HÀNG
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = userData.userId || userData.id;

    if (currentUserId) {
      cartsApi
        .getByUserId(currentUserId)
        .then((res) => {
          setCartCount(res.data.length || 0);
        })
        .catch((err) => console.log("Lỗi đếm giỏ hàng: ", err));
    } else {
      setCartCount(0); // Khách vãng lai thì giỏ hàng trống
    }
  }, []);

  // ========================================================
  // LỌC + TÌM KIẾM + PHÂN TRANG BẰNG BACKEND
  // ========================================================
  useEffect(() => {
    const selectedCategoryData = categories.find((c) => c.name === selectedCategory);
    if (selectedCategory !== "All" && !selectedCategoryData) {
      return;
    }

    const quality =
      additionalFilter === "All"
        ? undefined
        : additionalFilter === "Discount"
          ? "Discount"
          : additionalFilter;

    productsApi
      .getAll({
        keyword: searchQuery || undefined,
        categoryId:
          selectedCategory === "All"
            ? undefined
            : selectedCategoryData?.id,
        minPrice: minPrice === "" ? undefined : Number(minPrice),
        maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
        quality,
        page: currentPage,
        pageSize: itemsPerPage,
      })
      .then((res) => {
        const data = res.data;
        const productList = Array.isArray(data)
          ? data
          : data?.items || data?.data || [];

        setProducts(productList);
        setTotalPages(data?.totalPages || Math.ceil(productList.length / itemsPerPage) || 1);
      })
      .catch((err) => console.log("Lỗi tải SP: ", err));
  }, [searchQuery, selectedCategory, minPrice, maxPrice, additionalFilter, currentPage, categories]);

  // RESET SẠCH SẼ KHI KHÁCH BẤM VÀO MỘT DANH MỤC
  const handleCategoryClick = (e, categoryName) => {
    e.preventDefault();
    setSelectedCategory(categoryName);
    setAdditionalFilter("All"); // Xóa lọc phụ
    setSearchQuery(""); // Xóa tìm kiếm chữ
  };

  // ========================================================
  // BỘ MÁY LỌC ĐÃ ĐƯỢC NÂNG CẤP LỌC GIÁ VNĐ TỪ - ĐẾN
  // ========================================================
  const handlePriceInput = (value, setter) => {
    // Chỉ cho nhập số từ bàn phím, không cho chữ/ký tự lạ
    const onlyNumber = value.replace(/\D/g, "");
    setter(onlyNumber);
  };

  const currentProducts = products;

  // --- HÀM THÊM GIỎ HÀNG (ĐÃ SỬ DỤNG AXIOS) ---
  const handleAddToCart = async (e, product) => {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = userData.userId || userData.id;

    if (!currentUserId) {
      alert("Vui lòng đăng nhập để có thể mua hàng!");
      navigate("/login");
      return;
    }

    try {
      await cartsApi.addToCart({
        userId: currentUserId,
        productId: product.id,
        quantity: 1,
      });
      alert(`Đã thêm "${product.name}" vào giỏ hàng! 🛒`);
      setCartCount((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      alert("Lỗi rồi, lưu giỏ hàng thất bại!");
    }
  };

  const paginate = (e, pageNumber) => {
    e.preventDefault();
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };
  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(Number(rating || 0));

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`fa fa-star ${i <= roundedRating ? "text-warning" : "text-muted"}`}
        ></i>,
      );
    }

    return stars;
  };

  const getProductRating = (productId) => {
    return (
      ratingSummary[productId] || {
        averageRating: 0,
        reviewCount: 0,
      }
    );
  };
  return (
    <>
      {/* Navbar start */}
      <div className="container-fluid fixed-top">
        <div className="container topbar bg-primary d-none d-lg-block">
          <div className="d-flex justify-content-between">
            <div className="top-info ps-2">
              <small className="me-3">
                <i className="fas fa-map-marker-alt me-2 text-secondary"></i>{" "}
                <a href="#" className="text-white">
                  236 Hoàng Quốc Việt, Hà Nội
                </a>
              </small>
              <small className="me-3">
                <i className="fas fa-envelope me-2 text-secondary"></i>
                <a href="#" className="text-white">
                  {" "}
                  Fruitables@gmail.com{" "}
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
            <div
              className="collapse navbar-collapse bg-white"
              id="navbarCollapse"
            >
              <div className="navbar-nav mx-auto">
                <Link to="/" className="nav-item nav-link">
                  Trang chủ
                </Link>
                <Link to="/shop" className="nav-item nav-link active">
                  Cửa hàng
                </Link>
                <Link to="/shop-detail" className="nav-item nav-link">
                  Chi tiết sản phẩm
                </Link>
                <div className="nav-item dropdown">
                  <a
                    href="#"
                    className="nav-link dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
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
                <Link to="/contact" className="nav-item nav-link">
                  Liên hệ
                </Link>
              </div>
              <div className="d-flex m-3 me-0">
                <Link to="/cart" className="position-relative me-4 my-auto">
                  <i className="fa fa-shopping-bag fa-2x"></i>
                  <span
                    className="position-absolute bg-secondary rounded-circle d-flex align-items-center justify-content-center text-dark px-1"
                    style={{
                      top: "-5px",
                      left: "15px",
                      height: "20px",
                      minWidth: "20px",
                    }}
                  >
                    {cartCount}
                  </span>
                </Link>
                {/* LOGIC HIỂN THỊ MENU ĐĂNG NHẬP THÔNG MINH */}
                {(() => {
                  const userStorage = localStorage.getItem("user");
                  let currentUser = null;
                  if (
                    userStorage &&
                    userStorage !== "undefined" &&
                    userStorage !== "null"
                  ) {
                    try {
                      currentUser = JSON.parse(userStorage);
                    } catch (e) {
                      console.error("Lỗi đọc user", e);
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
                          {(currentUser.role === "Admin" ||
                            currentUser.Role === "Admin") && (
                            <Link
                              to="/dashboard"
                              className="dropdown-item fw-bold text-warning"
                            >
                              <i className="fas fa-cog me-2"></i>Vào trang Quản
                              trị
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
                              window.location.href = "/";
                            }}
                          >
                            <i className="fas fa-sign-out-alt me-2"></i>Đăng
                            xuất
                          </a>
                        </div>
                      </div>
                    );
                  } else {
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

      {/* Single Page Header start */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Cửa hàng</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item">
            <Link to="/">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item active text-white">Cửa hàng</li>
          <li className="breadcrumb-item">
            <Link to="/cart">Giỏ hàng</Link>
          </li>
        </ol>
      </div>
      {/* Single Page Header End */}

      {/* Fruits Shop Start*/}
      <div className="container-fluid fruite py-5">
        <div className="container py-5">
          <h1 className="mb-4">Cửa hàng trái cây tươi</h1>
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-xl-3">
                  <div className="input-group w-100 mx-auto d-flex">
                    <input
                      type="search"
                      className="form-control p-3"
                      placeholder="Tìm kiếm sản phẩm..."
                      aria-describedby="search-icon-1"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span id="search-icon-1" className="input-group-text p-3">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </div>
              </div>
              <div className="row g-4">
                <div className="col-lg-3">
                  <div className="row g-4">
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <h4>Danh mục</h4>
                        <ul className="list-unstyled fruite-categorie">
                          <li>
                            <div className="d-flex justify-content-between fruite-name">
                              <a
                                href="#"
                                onClick={(e) => handleCategoryClick(e, "All")}
                                className={
                                  selectedCategory === "All"
                                    ? "text-primary fw-bold"
                                    : ""
                                }
                              >
                                <i className="fas fa-apple-alt me-2"></i>Tất cả
                                sản phẩm
                              </a>
                            </div>
                          </li>
                          {categories.map((cat) => (
                            <li key={cat.id}>
                              <div className="d-flex justify-content-between fruite-name">
                                <a
                                  href="#"
                                  onClick={(e) =>
                                    handleCategoryClick(e, cat.name)
                                  }
                                  className={
                                    selectedCategory === cat.name
                                      ? "text-primary fw-bold"
                                      : ""
                                  }
                                >
                                  <i className="fas fa-apple-alt me-2"></i>
                                  {cat.name}
                                </a>
                                <span>({cat.count || 0})</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* SỬA CHỖ NÀY THÀNH Ô NHẬP TỪ ĐẾN VNĐ */}
                    <div className="col-lg-12">
                      <div className="mb-3 bg-light p-3 rounded">
                        <h4 className="mb-3">Khoảng Giá (VNĐ)</h4>

                        <div className="d-flex align-items-center mb-2">
                          <span
                            className="me-2 text-muted fw-bold"
                            style={{ width: "40px" }}
                          >
                            Từ:
                          </span>

                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control form-control-sm"
                            placeholder="Nhập giá thấp nhất"
                            value={minPrice}
                            onChange={(e) =>
                              handlePriceInput(e.target.value, setMinPrice)
                            }
                          />
                        </div>

                        <div className="d-flex align-items-center">
                          <span
                            className="me-2 text-muted fw-bold"
                            style={{ width: "40px" }}
                          >
                            Đến:
                          </span>

                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control form-control-sm"
                            placeholder="Nhập giá cao nhất"
                            value={maxPrice}
                            onChange={(e) =>
                              handlePriceInput(e.target.value, setMaxPrice)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="mb-3">
                        <h4>Phân loại khác</h4>
                        <div className="mb-2">
                          <input
                            type="radio"
                            className="me-2"
                            id="add-organic"
                            name="additional"
                            checked={additionalFilter === "Organic"}
                            onClick={() =>
                              setAdditionalFilter((prev) =>
                                prev === "Organic" ? "All" : "Organic",
                              )
                            }
                            readOnly
                          />
                          <label htmlFor="add-organic"> Hữu cơ</label>
                        </div>
                        <div className="mb-2">
                          <input
                            type="radio"
                            className="me-2"
                            id="add-fresh"
                            name="additional"
                            checked={additionalFilter === "Fresh"}
                            onClick={() =>
                              setAdditionalFilter((prev) =>
                                prev === "Fresh" ? "All" : "Fresh",
                              )
                            }
                            readOnly
                          />
                          <label htmlFor="add-fresh"> Tươi mới</label>
                        </div>
                        <div className="mb-2">
                          <input
                            type="radio"
                            className="me-2"
                            id="add-sales"
                            name="additional"
                            checked={additionalFilter === "Sales"}
                            onClick={() =>
                              setAdditionalFilter((prev) =>
                                prev === "Sales" ? "All" : "Sales",
                              )
                            }
                            readOnly
                          />
                          <label htmlFor="add-sales"> Bán chạy</label>
                        </div>
                        <div className="mb-2">
                          <input
                            type="radio"
                            className="me-2"
                            id="add-discount"
                            name="additional"
                            checked={additionalFilter === "Discount"}
                            onClick={() =>
                              setAdditionalFilter((prev) =>
                                prev === "Discount" ? "All" : "Discount",
                              )
                            }
                            readOnly
                          />
                          <label htmlFor="add-discount"> Giảm giá</label>
                        </div>
                        <div className="mb-2">
                          <input
                            type="radio"
                            className="me-2"
                            id="add-expired"
                            name="additional"
                            checked={additionalFilter === "Expired"}
                            onClick={() =>
                              setAdditionalFilter((prev) =>
                                prev === "Expired" ? "All" : "Expired",
                              )
                            }
                            readOnly
                          />
                          <label htmlFor="add-expired"> Hết hạn</label>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <h4 className="mb-3">Sản phẩm nổi bật</h4>
                      {featured && featured.length > 0 ? (
                        featured
                          .slice(0, showAllFeatured ? featured.length : 3)
                          .map((item) => (
                            <div
                              className="d-flex align-items-center justify-content-start mb-4"
                              key={item.id}
                            >
                              <div
                                className="rounded me-4"
                                style={{ width: "100px", height: "100px" }}
                              >
                                <img
                                  src={
                                    item.imageUrl || "/img/fruite-item-5.jpg"
                                  }
                                  className="img-fluid rounded"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  alt={item.name}
                                />
                              </div>
                              <div>
                                <h6 className="mb-2">{item.name}</h6>
                                <div className="d-flex mb-2 flex-column">
                                  {item.discountPrice || item.DiscountPrice ? (
                                    <>
                                      <h5 className="fw-bold me-2 text-danger">
                                        {(
                                          item.discountPrice ||
                                          item.DiscountPrice
                                        ).toLocaleString("vi-VN")}{" "}
                                        đ / {getProductUnit(item)}
                                      </h5>
                                      <h5 className="text-muted text-decoration-line-through fs-6">
                                        {item.price.toLocaleString("vi-VN")} đ
                                      </h5>
                                    </>
                                  ) : (
                                    <h5 className="fw-bold me-2">
                                      {item.price.toLocaleString("vi-VN")} đ / {getProductUnit(item)}
                                    </h5>
                                  )}
                                </div>
                                <a
                                  href="#"
                                  onClick={(e) => handleAddToCart(e, item)}
                                  className="btn border border-secondary rounded-pill px-3 text-primary mt-2"
                                >
                                  <i className="fa fa-shopping-bag me-2 text-primary"></i>{" "}
                                  Thêm vào giỏ
                                </a>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p>Đang tải sản phẩm nổi bật...</p>
                      )}

                      <div className="d-flex justify-content-center my-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAllFeatured(!showAllFeatured);
                          }}
                          className="btn border border-secondary px-4 py-3 rounded-pill text-primary w-100"
                        >
                          {showAllFeatured ? "Thu gọn" : "Xem thêm"}
                        </button>
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="position-relative">
                        <img
                          src="/img/banner-fruits.jpg"
                          className="img-fluid w-100 rounded"
                          alt=""
                        />
                        <div
                          className="position-absolute"
                          style={{
                            top: "50%",
                            right: "10px",
                            transform: "translateY(-50%)",
                          }}
                        >
                          <h3 className="text-secondary fw-bold">
                            Trái cây <br /> Tươi <br /> Sạch
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-9">
                  <div className="row g-4 justify-content-center">
                    {Array.isArray(currentProducts) &&
                    currentProducts.length > 0 ? (
                      currentProducts.map((item) => (
                        <div
                          className="col-md-6 col-lg-6 col-xl-4"
                          key={item.id}
                        >
                          <div className="rounded position-relative fruite-item">
                            <div className="fruite-img">
                              <Link to={`/shop-detail/${item.id}`}>
                                <img
                                  src={item.imageUrl}
                                  className="img-fluid w-100 rounded-top"
                                  alt={item.name}
                                />
                              </Link>
                            </div>
                            <div
                              className="text-white bg-secondary px-3 py-1 rounded position-absolute"
                              style={{ top: "10px", left: "10px" }}
                            >
                              {item.categoryName || "Sản phẩm"}
                            </div>
                            <div
                              className="bg-white text-dark px-2 py-1 rounded position-absolute shadow-sm"
                              style={{
                                top: "10px",
                                right: "10px",
                                fontSize: "13px",
                              }}
                            >
                              <i className="fa fa-star text-warning me-1"></i>
                              {getProductRating(item.id).averageRating || "0.0"}
                            </div>
                            <div className="p-4 border border-secondary border-top-0 rounded-bottom">
                              <h4>{item.name}</h4>

                              <div className="d-flex align-items-center mb-2">
                                <div className="me-2">
                                  {renderStars(
                                    getProductRating(item.id).averageRating,
                                  )}
                                </div>
                                <small className="text-muted">
                                  {getProductRating(item.id).reviewCount > 0
                                    ? `${getProductRating(item.id).averageRating}/5 (${getProductRating(item.id).reviewCount} đánh giá)`
                                    : "Chưa có đánh giá"}
                                </small>
                              </div>

                              <p>{item.description}</p>
                              <div className="d-flex justify-content-between flex-lg-wrap">
                                <p className="text-dark fs-5 fw-bold mb-0">
                                  {item.discountPrice || item.DiscountPrice ? (
                                    <>
                                      <span className="text-danger">
                                        {(
                                          item.discountPrice ||
                                          item.DiscountPrice
                                        ).toLocaleString("vi-VN")}{" "}
                                        đ
                                      </span>
                                      <span className="text-muted text-decoration-line-through fs-6 ms-2">
                                        {item.price.toLocaleString("vi-VN")} đ
                                      </span>{" "}
                                      / {getProductUnit(item)}
                                    </>
                                  ) : (
                                    `${item.price.toLocaleString("vi-VN")} đ / ${getProductUnit(item)}`
                                  )}
                                </p>
                                <a
                                  href="#"
                                  onClick={(e) => handleAddToCart(e, item)}
                                  className="btn border border-secondary rounded-pill px-3 text-primary mt-2"
                                >
                                  <i className="fa fa-shopping-bag me-2 text-primary"></i>{" "}
                                  Thêm vào giỏ
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center mt-5">
                        <h4>
                          Không tìm thấy sản phẩm nào trong tầm giá này! 😥
                        </h4>
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="col-12">
                        <div className="pagination d-flex justify-content-center mt-5">
                          <a
                            href="#"
                            className={`rounded ${currentPage === 1 ? "disabled" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) paginate(e, currentPage - 1);
                            }}
                            style={
                              currentPage === 1
                                ? { pointerEvents: "none", opacity: 0.5 }
                                : {}
                            }
                          >
                            &laquo;
                          </a>

                          {[...Array(totalPages)].map((_, index) => (
                            <a
                              href="#"
                              key={index}
                              className={`rounded ${currentPage === index + 1 ? "active" : ""}`}
                              onClick={(e) => paginate(e, index + 1)}
                            >
                              {index + 1}
                            </a>
                          ))}

                          <a
                            href="#"
                            className={`rounded ${currentPage === totalPages ? "disabled" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages)
                                paginate(e, currentPage + 1);
                            }}
                            style={
                              currentPage === totalPages
                                ? { pointerEvents: "none", opacity: 0.5 }
                                : {}
                            }
                          >
                            &raquo;
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fruits Shop End*/}

      {/* Footer Start */}
      <div className="container-fluid bg-dark text-white-50 footer pt-5 mt-5">
        <div className="container py-5">
          <div
            className="pb-4 mb-4"
            style={{ borderBottom: "1px solid rgba(226, 175, 24, 0.5)" }}
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
                    style={{ top: 0, right: 0 }}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="d-flex justify-content-end pt-3">
                  <a
                    className="btn btn-outline-secondary me-2 btn-md-square rounded-circle"
                    href=""
                  >
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a
                    className="btn btn-outline-secondary me-2 btn-md-square rounded-circle"
                    href=""
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    className="btn btn-outline-secondary me-2 btn-md-square rounded-circle"
                    href=""
                  >
                    <i className="fab fa-youtube"></i>
                  </a>
                  <a
                    className="btn btn-outline-secondary btn-md-square rounded-circle"
                    href=""
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <div className="footer-item">
                <h4 className="text-light mb-3">Vì sao chọn chúng tôi!</h4>
                <p className="mb-4">
                  Chúng tôi cam kết mang đến thực phẩm an toàn, không hóa chất,
                  tốt cho sức khỏe người tiêu dùng, giữ nguyên sự tươi ngon từ
                  nông trại đến bàn ăn.
                </p>
                <a
                  href=""
                  className="btn border-secondary py-2 px-4 rounded-pill text-primary"
                >
                  Xem thêm
                </a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="d-flex flex-column text-start footer-item">
                <h4 className="text-light mb-3">Thông tin cửa hàng</h4>
                <a className="btn-link" href="">
                  Về chúng tôi
                </a>
                <a className="btn-link" href="">
                  Liên hệ
                </a>
                <a className="btn-link" href="">
                  Chính sách bảo mật
                </a>
                <a className="btn-link" href="">
                  Điều khoản & Điều kiện
                </a>
                <a className="btn-link" href="">
                  Chính sách đổi trả
                </a>
                <a className="btn-link" href="">
                  Câu hỏi thường gặp & Hỗ trợ
                </a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="d-flex flex-column text-start footer-item">
                <h4 className="text-light mb-3">Tài khoản</h4>
                <a className="btn-link" href="">
                  Tài khoản của tôi
                </a>
                <a className="btn-link" href="">
                  Chi tiết cửa hàng
                </a>
                <a className="btn-link" href="">
                  Giỏ hàng
                </a>
                <a className="btn-link" href="">
                  Danh sách yêu thích
                </a>
                <a className="btn-link" href="">
                  Lịch sử mua hàng
                </a>
                <a className="btn-link" href="">
                  Đơn hàng quốc tế
                </a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="footer-item">
                <h4 className="text-light mb-3">Liên hệ</h4>
                <p>Địa chỉ: 236 Hoàng Quốc Việt, Hà Nội</p>
                <p>Email: Fruitables@gmail.com</p>
                <p>Số điện thoại: +0123 4567 8910</p>
                <p>Chấp nhận thanh toán</p>
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
              <span className="text-light">
                <a href="#">
                  <i className="fas fa-copyright text-light me-2"></i>Hệ thống
                  Fruitables
                </a>
                , Bản quyền thuộc về chúng tôi.
              </span>
            </div>
            <div className="col-md-6 my-auto text-center text-md-end text-white">
              Thiết kế bởi{" "}
              <a className="border-bottom" href="https://htmlcodex.com">
                HTML Codex
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Copyright End */}

      <a
        href="#"
        className="btn btn-primary border-3 border-primary rounded-circle back-to-top"
      >
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  );
};

export default Shop;
