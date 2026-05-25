import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
    // Khởi tạo công cụ chuyển trang
    const navigate = useNavigate();

    // 1. STATE LƯU GIỎ HÀNG & MÃ GIẢM GIÁ
    const [cart, setCart] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);

    // 2. TỰ ĐỘNG GỌI API LẤY GIỎ HÀNG CỦA NGƯỜI ĐĂNG NHẬP KHI MỞ TRANG
    useEffect(() => {
        // ✅ LẤY ID KHÁCH HÀNG THỰC TẾ
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (currentUserId) {
            // Thay CUST-001 bằng currentUserId
            fetch(`http://localhost:5001/api/carts/${currentUserId}`)
                .then(res => res.json())
                .then(data => {
                    // Lấy được data từ SQL thì nhét vào state
                    setCart(data);
                })
                .catch(err => console.log("Lỗi tải giỏ hàng: ", err));
        } else {
            // Khách chưa đăng nhập thì giỏ hàng trống
            setCart([]);
        }
    }, []);

    // 3. HÀM TĂNG GIẢM SỐ LƯỢNG (Tạm thời xử lý trên giao diện)
    const handleQuantityChange = (itemId, change) => {
        setCart(cart.map(item => {
            if (item.id === itemId) {
                const newQuantity = item.quantity + change;
                return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 }; // Không cho giảm xuống 0
            }
            return item;
        }));
    };

    // 4. HÀM XÓA MÓN HÀNG (ĐÃ NÂNG CẤP GỌI API XÓA SQL)
    const handleRemove = async (itemId) => {
        if (window.confirm("Ní có chắc muốn bỏ món này ra khỏi giỏ không? ")) {
            try {
                // Phóng API chém thẳng xuống cổng 5001 của C#
                const response = await fetch(`http://localhost:5001/api/carts/remove/${itemId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Nếu SQL báo đã xóa thành công, thì mình lọc nó ra khỏi màn hình React
                    setCart(cart.filter(item => item.id !== itemId));
                } else {
                    alert("Á đù, có lỗi gì đó, xóa không được ní ơi!");
                }
            } catch (error) {
                console.error("Lỗi kết nối mất tiêu:", error);
            }
        }
    };

    // 5. HÀM TÍNH TỔNG TIỀN TỰ ĐỘNG
    const subtotal = cart.reduce((total, item) => {
        // Ưu tiên giá giảm, không có thì lấy giá gốc
        const priceToUse = item.discountPrice || item.price;
        return total + (priceToUse * item.quantity);
    }, 0);

    const shippingFee = cart.length > 0 ? 3.00 : 0; // Phí ship mặc định 3$ (nếu có mua hàng)
    const totalAmount = subtotal + shippingFee - discount; // Đã trừ đi tiền giảm giá

    // 6. HÀM GỌI API KIỂM TRA MÃ GIẢM GIÁ (HÀNG REAL)
    const handleApplyCoupon = async () => {
        if (!couponCode) {
            alert("Ní chưa nhập mã mà đòi giảm giá gì!");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/api/coupons/check?code=${couponCode}`);
            if (response.ok) {
                const data = await response.json();
                const phanTramGiam = data.discountPercent / 100;
                setDiscount(subtotal * phanTramGiam);
                alert(`Áp dụng thành công mã giảm ${data.discountPercent}%! 🌟`);
            } else {
                const errorText = await response.text();
                setDiscount(0);
                alert(errorText || "Mã giảm giá không hợp lệ!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi kết nối máy chủ C#!");
        }
    };

    // 7. HÀM CHUYỂN TRANG THANH TOÁN
    const handleProceedCheckout = () => {
        if (cart.length === 0) {
            alert("Giỏ hàng đang trống, mua thêm đồ đi ní!");
            return;
        }

        // 🌟 BẪY BẢO VỆ: CHƯA ĐĂNG NHẬP THÌ KHÔNG CHO CHECKOUT
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert("Vui lòng đăng nhập để tiến hành thanh toán!");
            navigate('/login');
            return;
        }

        // Gói ghém toàn bộ tiền bạc và mã giảm giá ném sang trang Checkout
        navigate('/checkout', {
            state: {
                subtotal: subtotal,
                shipping: shippingFee,
                discount: discount,
                total: totalAmount,
                cartItems: cart,
                couponCode: couponCode
            }
        });
    };

    return (
        <>
            {/* Navbar start */}
            <div className="container-fluid fixed-top">
                <div className="container topbar bg-primary d-none d-lg-block">
                    <div className="d-flex justify-content-between">
                        <div className="top-info ps-2">
                            <small className="me-3"><i className="fas fa-map-marker-alt me-2 text-secondary"></i> <a href="#" className="text-white">236,Hoang Quoc Viet,Ha Noi</a></small>
                            <small className="me-3"><i className="fas fa-envelope me-2 text-secondary"></i><a href="#" className="text-white">Email@Example.com</a></small>
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
                                <Link to="/shop-detail" className="nav-item nav-link">Shop Detail</Link>
                                <div className="nav-item dropdown">
                                    <a href="#" className="nav-link dropdown-toggle active" data-bs-toggle="dropdown">Pages</a>
                                    <div className="dropdown-menu m-0 bg-secondary rounded-0">
                                        <Link to="/cart" className="dropdown-item active">Cart</Link>
                                        <Link to="/checkout" className="dropdown-item">Checkout</Link>

                                    </div>
                                </div>
                                <Link to="/contact" className="nav-item nav-link">Contact</Link>
                            </div>
                            <div className="d-flex m-3 me-0">
                                <button className="btn-search btn border border-secondary btn-md-square rounded-circle bg-white me-4" data-bs-toggle="modal" data-bs-target="#searchModal"><i className="fas fa-search text-primary"></i></button>
                                <Link to="/cart" className="position-relative me-4 my-auto">
                                    <i className="fa fa-shopping-bag fa-2x"></i>
                                    {/* Hiển thị linh hoạt số món đồ trong giỏ */}
                                    <span className="position-absolute bg-secondary rounded-circle d-flex align-items-center justify-content-center text-dark px-1" style={{ top: '-5px', left: '15px', height: '20px', minWidth: '20px' }}>{cart.length}</span>
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

            {/* Modal Search Start (Giữ nguyên) */}
            <div className="modal fade" id="searchModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-fullscreen">
                    <div className="modal-content rounded-0">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Search by keyword</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body d-flex align-items-center">
                            <div className="input-group w-75 mx-auto d-flex">
                                <input type="search" className="form-control p-3" placeholder="keywords" aria-describedby="search-icon-1" />
                                <span id="search-icon-1" className="input-group-text p-3"><i className="fa fa-search"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Single Page Header start */}
            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Cart</h1>
                <ol className="breadcrumb justify-content-center mb-0">
                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                    <li className="breadcrumb-item"><a href="#">Pages</a></li>
                    <li className="breadcrumb-item active text-white">Cart</li>
                </ol>
            </div>
            {/* Single Page Header End */}

            {/* Cart Page Start */}
            <div className="container-fluid py-5">
                <div className="container py-5">
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th scope="col">Products</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Price</th>
                                    <th scope="col">Quantity</th>
                                    <th scope="col">Total</th>
                                    <th scope="col">Handle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* LỌC DỮ LIỆU Ở ĐÂY NÈ NÍ */}
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <h4 className="text-secondary">Giỏ hàng của ní đang trống trơn! 🛒</h4>
                                            <Link to="/shop" className="btn btn-primary mt-3 rounded-pill px-4 py-2 text-white">Đi mua sắm ngay</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item) => {
                                        // Ưu tiên giá giảm
                                        const priceToUse = item.discountPrice || item.price;
                                        return (
                                            <tr key={item.id}>
                                                <th scope="row">
                                                    <div className="d-flex align-items-center">
                                                        <img src={item.imageUrl || '/img/avatar.jpg'} className="img-fluid me-5 rounded-circle" style={{ width: '80px', height: '80px', objectFit: 'cover' }} alt={item.name} />
                                                    </div>
                                                </th>
                                                <td>
                                                    <p className="mb-0 mt-4">{item.name}</p>
                                                </td>
                                                <td>
                                                    <p className="mb-0 mt-4">{priceToUse.toFixed(2)} $</p>
                                                </td>
                                                <td>
                                                    <div className="input-group quantity mt-4" style={{ width: '100px' }}>
                                                        <div className="input-group-btn">
                                                            {/* Nút Trừ */}
                                                            <button onClick={() => handleQuantityChange(item.id, -1)} className="btn btn-sm btn-minus rounded-circle bg-light border">
                                                                <i className="fa fa-minus"></i>
                                                            </button>
                                                        </div>
                                                        <input type="text" className="form-control form-control-sm text-center border-0" value={item.quantity} readOnly />
                                                        <div className="input-group-btn">
                                                            {/* Nút Cộng */}
                                                            <button onClick={() => handleQuantityChange(item.id, 1)} className="btn btn-sm btn-plus rounded-circle bg-light border">
                                                                <i className="fa fa-plus"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p className="mb-0 mt-4">{(priceToUse * item.quantity).toFixed(2)} $</p>
                                                </td>
                                                <td>
                                                    {/* Nút Xóa */}
                                                    <button onClick={() => handleRemove(item.id)} className="btn btn-md rounded-circle bg-light border mt-4">
                                                        <i className="fa fa-times text-danger"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* KHU VỰC TÍNH TIỀN TỰ ĐỘNG */}
                    <div className="mt-5">
                        <input
                            type="text"
                            className="border-0 border-bottom rounded me-5 py-3 mb-4"
                            placeholder="Coupon Code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button className="btn border-secondary rounded-pill px-4 py-3 text-primary" type="button" onClick={handleApplyCoupon}>Apply Coupon</button>
                    </div>
                    <div className="row g-4 justify-content-end">
                        <div className="col-8"></div>
                        <div className="col-sm-8 col-md-7 col-lg-6 col-xl-4">
                            <div className="bg-light rounded">
                                <div className="p-4">
                                    <h1 className="display-6 mb-4">Cart <span className="fw-normal">Total</span></h1>
                                    <div className="d-flex justify-content-between mb-4">
                                        <h5 className="mb-0 me-4">Subtotal:</h5>
                                        <p className="mb-0">${subtotal.toFixed(2)}</p>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <h5 className="mb-0 me-4">Shipping</h5>
                                        <div className="">
                                            <p className="mb-0">Flat rate: ${shippingFee.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* HIỂN THỊ TIỀN ĐƯỢC GIẢM KHI NHẬP MÃ THÀNH CÔNG */}
                                    {discount > 0 && (
                                        <div className="d-flex justify-content-between text-success mt-3">
                                            <h5 className="mb-0 me-4">Discount ({couponCode})</h5>
                                            <p className="mb-0">-${discount.toFixed(2)}</p>
                                        </div>
                                    )}

                                    <p className="mb-0 text-end mt-3">Shipping to Ukraine.</p>
                                </div>
                                <div className="py-4 mb-4 border-top border-bottom d-flex justify-content-between">
                                    <h5 className="mb-0 ps-4 me-4">Total</h5>
                                    <p className="mb-0 pe-4 fw-bold">${totalAmount.toFixed(2)}</p>
                                </div>

                                {/* NÚT BẤM SANG TRANG CHECKOUT ĐÃ CẮM ĐIỆN */}
                                <button className="btn border-secondary rounded-pill px-4 py-3 text-primary text-uppercase mb-4 ms-4" type="button" onClick={handleProceedCheckout}>
                                    Proceed Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Cart Page End */}

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

            <a href="#" className="btn btn-primary border-3 border-primary rounded-circle back-to-top"><i className="fa fa-arrow-up"></i></a>
        </>
    );
};

export default Cart;