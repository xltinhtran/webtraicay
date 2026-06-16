import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersApi, couponsApi } from '../services/api';

const getProductUnit = (product) => product?.unit || product?.Unit || 'sản phẩm';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { subtotal, cartItems } = location.state || {
        subtotal: 0,
        cartItems: []
    };
 
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
    const [selectedDistrict, setSelectedDistrict] = useState({ code: '', name: '' });
    const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });
    const [addressDetail, setAddressDetail] = useState('');

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [showCouponDropdown, setShowCouponDropdown] = useState(false);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    const [shippingFee, setShippingFee] = useState(0);
    const [distanceKm, setDistanceKm] = useState(0);
    const [isCalculatingShip, setIsCalculatingShip] = useState(false);
    const [canDeliver, setCanDeliver] = useState(false);
    const [shippingMessage, setShippingMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        notes: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');

    // Modal QR + đếm ngược thanh toán
    const [showPaymentQr, setShowPaymentQr] = useState(false);
    const [paymentTimeLeft, setPaymentTimeLeft] = useState(0);
    const [isWaitingPayment, setIsWaitingPayment] = useState(false);

    const MAX_DELIVERY_DISTANCE_KM = 300;
    const totalAmount = Math.max(0, subtotal - discount) + shippingFee;

    const getCurrentUserId = () => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        return userData.userId || userData.id || '';
    };

    const formatCurrency = (value) => {
        return Number(value || 0).toLocaleString('vi-VN') + ' đ';
    };

    const formatDate = (value) => {
        if (!value) return 'Không giới hạn';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Không giới hạn';

        return date.toLocaleDateString('vi-VN');
    };

    const isCouponUsable = (coupon) => {
        if (!coupon?.isActive) return false;

        const expiryDate = new Date(coupon.expiryDate);
        if (Number.isNaN(expiryDate.getTime())) return true;

        expiryDate.setHours(23, 59, 59, 999);
        return expiryDate >= new Date();
    };

    const formatCountdown = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainSeconds = seconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${remainSeconds
            .toString()
            .padStart(2, '0')}`;
    };

    const resetShipping = () => {
        setShippingFee(0);
        setDistanceKm(0);
        setCanDeliver(false);
        setShippingMessage('');
    };

    const resetPaymentQr = () => {
        setShowPaymentQr(false);
        setIsWaitingPayment(false);
        setPaymentTimeLeft(0);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleGoBack = () => {
        navigate('/cart');
    };

    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
        resetPaymentQr();
    };

    useEffect(() => {
        fetch('https://provinces.open-api.vn/api/p/')
            .then(res => res.json())
            .then(data => setProvinces(data))
            .catch(err => console.log('Lỗi tải tỉnh thành:', err));
    }, []);

    useEffect(() => {
        const fetchAvailableCoupons = async () => {
            setIsLoadingCoupons(true);

            try {
                const currentUserId = getCurrentUserId();
                const response = await couponsApi.getAvailable({
                    userId: currentUserId || undefined,
                    subtotal
                });
                const data = response.data;
                const list = data.items || data || [];

                setAvailableCoupons(list.filter(isCouponUsable));
            } catch (error) {
                console.error('Lỗi tải danh sách voucher:', error);
                setAvailableCoupons([]);
            } finally {
                setIsLoadingCoupons(false);
            }
        };

        fetchAvailableCoupons();
    }, [subtotal]);

    const handleProvinceChange = (e) => {
        const pCode = e.target.value;
        const pName = e.target.options[e.target.selectedIndex].text;

        setSelectedProvince({ code: pCode, name: pName });
        setSelectedDistrict({ code: '', name: '' });
        setSelectedWard({ code: '', name: '' });
        setDistricts([]);
        setWards([]);
        resetShipping();
        resetPaymentQr();

        if (pCode) {
            fetch(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`)
                .then(res => res.json())
                .then(data => setDistricts(data.districts || []))
                .catch(err => console.log('Lỗi tải quận huyện:', err));
        }
    };

    const handleDistrictChange = (e) => {
        const dCode = e.target.value;
        const dName = e.target.options[e.target.selectedIndex].text;

        setSelectedDistrict({ code: dCode, name: dName });
        setSelectedWard({ code: '', name: '' });
        setWards([]);
        resetShipping();
        resetPaymentQr();

        if (dCode) {
            fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`)
                .then(res => res.json())
                .then(data => setWards(data.wards || []))
                .catch(err => console.log('Lỗi tải phường xã:', err));
        }
    };

    const handleWardChange = (e) => {
        const wCode = e.target.value;
        const wName = e.target.options[e.target.selectedIndex].text;

        setSelectedWard({ code: wCode, name: wName });
        resetShipping();
        resetPaymentQr();
    };

    const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    useEffect(() => {
        if (!selectedProvince.name || !selectedDistrict.name || !selectedWard.name) {
            return;
        }

        const autoCalculateShipping = async () => {
            setIsCalculatingShip(true);
            setCanDeliver(false);
            setShippingFee(0);
            setShippingMessage('');

            try {
                const addressList = [
                    `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}, Việt Nam`,
                    `${selectedDistrict.name}, ${selectedProvince.name}, Việt Nam`,
                    `${selectedProvince.name}, Việt Nam`
                ];

                let locationData = null;

                for (const address of addressList) {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
                    );

                    const data = await response.json();

                    if (data && data.length > 0) {
                        locationData = data[0];
                        break;
                    }
                }

                if (!locationData && selectedProvince.name.includes('Hà Nội')) {
                    locationData = {
                        lat: 21.028511,
                        lon: 105.804817
                    };
                }

                if (!locationData) {
                    setShippingFee(0);
                    setCanDeliver(false);
                    setShippingMessage('Không xác định được vị trí giao hàng. Vui lòng chọn lại địa chỉ khác.');
                    return;
                }

                const customerLat = parseFloat(locationData.lat);
                const customerLon = parseFloat(locationData.lon);

                // Tọa độ cửa hàng: 236 Hoàng Quốc Việt, Hà Nội
                const shopLat = 21.046386;
                const shopLon = 105.795495;

                const distance = calculateDistanceInKm(
                    shopLat,
                    shopLon,
                    customerLat,
                    customerLon
                );

                setDistanceKm(distance);

                if (distance > MAX_DELIVERY_DISTANCE_KM) {
                    setShippingFee(0);
                    setCanDeliver(false);
                    setShippingMessage(
                        `Khoảng cách ${distance.toFixed(1)} km vượt quá phạm vi giao hàng ${MAX_DELIVERY_DISTANCE_KM} km. Shop chỉ giao trong phạm vi 300km để trái cây luôn tươi ngon.`
                    );
                    return;
                }

                let calculatedFee = 15000 + Math.round(distance) * 5000;

                if (distance < 2) {
                    calculatedFee = 15000;
                }

                if (calculatedFee > 150000) {
                    calculatedFee = 150000;
                }

                setShippingFee(calculatedFee);
                setCanDeliver(true);
                setShippingMessage(`Khoảng cách: ${distance.toFixed(1)} km - Đủ điều kiện giao hàng.`);
            } catch (error) {
                console.error('Lỗi tính phí vận chuyển:', error);
                setShippingFee(0);
                setCanDeliver(false);
                setShippingMessage('Không thể tính phí vận chuyển lúc này. Vui lòng thử lại sau.');
            } finally {
                setIsCalculatingShip(false);
            }
        };

        autoCalculateShipping();
    }, [selectedProvince.name, selectedDistrict.name, selectedWard.name]);

    // Đếm ngược 10 phút khi hiện QR
    useEffect(() => {
        if (!showPaymentQr || paymentTimeLeft <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setPaymentTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setShowPaymentQr(false);
                    setIsWaitingPayment(false);
                    alert('Hết thời gian thanh toán. Đơn hàng chưa được tạo và đã bị hủy thanh toán.');
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showPaymentQr, paymentTimeLeft]);

    const handleApplyCoupon = async () => {
        const cleanCouponCode = couponCode.trim();
        setShowCouponDropdown(false);

        if (!cleanCouponCode) {
            alert('Ní vui lòng nhập mã giảm giá trước nhé!');
            return;
        }

        try {
            const currentUserId = getCurrentUserId();
            const response = await couponsApi.check(cleanCouponCode, currentUserId || undefined, subtotal);
            const data = response.data;
            const phanTramGiam = Number(data.discountPercent || 0) / 100;
            const discountAmount = subtotal * phanTramGiam;

            setDiscount(discountAmount);
            setCouponCode(cleanCouponCode);

            alert(`Áp dụng thành công! Giảm ${data.discountPercent}% cho đơn hàng. 🌟`);
        } catch (error) {
            setDiscount(0);
            alert(error.response?.data || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!');
        }
    };

    const handleSelectCoupon = (coupon) => {
        setCouponCode(coupon.code || '');
        setDiscount(0);
        setShowCouponDropdown(false);
        resetPaymentQr();
    };

    const filteredCoupons = availableCoupons
        .filter((coupon) => {
            const keyword = couponCode.trim().toLowerCase();
            if (!keyword) return true;

            return (coupon.code || '').toLowerCase().includes(keyword);
        })
        .slice(0, 6);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!cartItems || cartItems.length === 0) {
            alert('Giỏ hàng đang trống, không thể đặt hàng!');
            navigate('/cart');
            return;
        }

        if (!formData.name.trim() || !formData.phone.trim()) {
            alert('Ní vui lòng nhập đầy đủ họ tên và số điện thoại người nhận!');
            return;
        }

        if (!selectedProvince.name || !selectedDistrict.name || !selectedWard.name || !addressDetail.trim()) {
            alert('Ní vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và Số nhà nhé!');
            return;
        }

        if (!canDeliver) {
            alert('Địa chỉ này nằm ngoài phạm vi giao hàng 300km hoặc chưa tính được phí ship!');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert('Vui lòng đăng nhập tài khoản để đặt hàng!');
            navigate('/login');
            return;
        }

        // Chọn MoMo / Ngân hàng: bấm lần đầu chỉ hiện popup QR, chưa tạo đơn
        if ((paymentMethod === 'MoMo' || paymentMethod === 'Bank Transfer') && !isWaitingPayment) {
            setShowPaymentQr(true);
            setIsWaitingPayment(true);
            setPaymentTimeLeft(10 * 60);
            return;
        }

        const fullShippingAddress =
            `${addressDetail.trim()}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name} (KM: ${distanceKm.toFixed(1)})`;

        const cleanCouponCode = couponCode.trim();

        const orderData = {
            userId: currentUserId,
            receiverName: formData.name,
            shippingAddress: fullShippingAddress,
            phone: formData.phone,
            orderNotes: formData.notes,
            paymentMethod: paymentMethod,
            subTotal: subtotal,
            shippingFee: shippingFee,
            discountAmount: discount,
            totalAmount: totalAmount,
            couponCode: cleanCouponCode === '' ? null : cleanCouponCode,
            details: cartItems.map(item => ({
                productId: item.productId || item.id,
                quantity: item.quantity,
                unitPrice: item.discountPrice || item.price
            }))
        };

        try {
            await ordersApi.checkout(orderData);
            resetPaymentQr();
            alert('🎉 Đặt hàng thành công! Đơn hàng của ní đang chờ hệ thống xử lý.');
            navigate('/my-orders');
        } catch (error) {
            console.error('Lỗi đặt hàng:', error);
            alert(`Đặt hàng thất bại: ${error.response?.data || 'Lỗi máy chủ C#!'}`);
        }
    };

    return (
        <>
            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Thanh Toán Đơn Hàng</h1>
            </div>

            <div className="container-fluid py-5">
                <div className="container py-5">
                    <div className="mb-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold"
                            onClick={handleGoBack}
                        >
                            <i className="fa fa-arrow-left me-2"></i>
                            Quay lại giỏ hàng
                        </button>
                    </div>

                    <form onSubmit={handlePlaceOrder}>
                        <div className="row g-5">
                            <div className="col-md-12 col-lg-6 col-xl-7">
                                <h2 className="mb-4">Thông tin giao hàng</h2>

                                <div className="row">
                                    <div className="col-md-12 col-lg-6">
                                        <div className="form-item w-100 mb-3">
                                            <label className="form-label mb-2">
                                                Họ và Tên người nhận<sup>*</sup>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-12 col-lg-6">
                                        <div className="form-item w-100 mb-3">
                                            <label className="form-label mb-2">
                                                Số điện thoại<sup>*</sup>
                                            </label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className="form-control"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label mb-2">
                                            Tỉnh / Thành phố <sup>*</sup>
                                        </label>
                                        <select
                                            className="form-select border-warning"
                                            onChange={handleProvinceChange}
                                            value={selectedProvince.code}
                                            required
                                        >
                                            <option value="">-- Chọn Tỉnh --</option>
                                            {provinces.map(p => (
                                                <option key={p.code} value={p.code}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label mb-2">
                                            Quận / Huyện <sup>*</sup>
                                        </label>
                                        <select
                                            className="form-select border-warning"
                                            onChange={handleDistrictChange}
                                            value={selectedDistrict.code}
                                            disabled={!selectedProvince.code}
                                            required
                                        >
                                            <option value="">-- Chọn Quận --</option>
                                            {districts.map(d => (
                                                <option key={d.code} value={d.code}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label mb-2">
                                            Phường / Xã <sup>*</sup>
                                        </label>
                                        <select
                                            className="form-select border-warning"
                                            onChange={handleWardChange}
                                            value={selectedWard.code}
                                            disabled={!selectedDistrict.code}
                                            required
                                        >
                                            <option value="">-- Chọn Phường --</option>
                                            {wards.map(w => (
                                                <option key={w.code} value={w.code}>
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-item mb-4">
                                    <label className="form-label mb-2">
                                        Số nhà, Tên đường <sup>*</sup>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control border-warning"
                                        placeholder="Ví dụ: Số 236 đường Hoàng Quốc Việt..."
                                        value={addressDetail}
                                        onChange={(e) => {
                                            setAddressDetail(e.target.value);
                                            resetPaymentQr();
                                        }}
                                        required
                                    />
                                </div>

                                <div className="form-item mb-4">
                                    <textarea
                                        name="notes"
                                        className="form-control"
                                        rows="3"
                                        placeholder="Ghi chú cho Shipper (Tùy chọn)..."
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                    ></textarea>
                                </div>

                                <h2 className="mb-4 mt-5">Phương thức thanh toán</h2>

                                <div className="p-4 bg-light rounded border">
                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="payment"
                                            id="cod"
                                            value="Cash On Delivery"
                                            checked={paymentMethod === 'Cash On Delivery'}
                                            onChange={handlePaymentMethodChange}
                                        />
                                        <label className="form-check-label fw-bold" htmlFor="cod">
                                            Thanh toán khi nhận hàng (COD)
                                        </label>
                                    </div>

                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="payment"
                                            id="momo"
                                            value="MoMo"
                                            checked={paymentMethod === 'MoMo'}
                                            onChange={handlePaymentMethodChange}
                                        />
                                        <label className="form-check-label fw-bold" htmlFor="momo">
                                            Thanh toán qua Ví điện tử MoMo
                                        </label>
                                    </div>

                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="payment"
                                            id="bank"
                                            value="Bank Transfer"
                                            checked={paymentMethod === 'Bank Transfer'}
                                            onChange={handlePaymentMethodChange}
                                        />
                                        <label className="form-check-label fw-bold" htmlFor="bank">
                                            Chuyển khoản Ngân hàng (Quét mã QR)
                                        </label>
                                    </div>

                                    {(paymentMethod === 'MoMo' || paymentMethod === 'Bank Transfer') && (
                                        <div className="alert alert-info mt-4 mb-0">
                                            Sau khi bấm <strong>Xác nhận thanh toán</strong>, hệ thống sẽ hiện mã QR ở giữa màn hình và đếm ngược 10 phút.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-12 col-lg-6 col-xl-5">
                                <div className="table-responsive bg-light rounded p-5 border" style={{ overflow: 'visible' }}>
                                    <h2 className="display-6 mb-4" style={{ fontSize: '26px' }}>
                                        Hóa đơn đơn hàng
                                    </h2>

                                    <div className="mb-4" style={{ position: 'relative' }}>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control py-3"
                                                placeholder="Nhập mã giảm giá..."
                                                value={couponCode}
                                                onFocus={() => setShowCouponDropdown(true)}
                                                onClick={() => setShowCouponDropdown(true)}
                                                onBlur={() => {
                                                    setTimeout(() => setShowCouponDropdown(false), 150);
                                                }}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value);
                                                    setShowCouponDropdown(true);
                                                    resetPaymentQr();

                                                    if (e.target.value.trim() === '') {
                                                        setDiscount(0);
                                                    }
                                                }}
                                            />
                                            <button
                                                className="btn btn-warning fw-bold text-dark px-4"
                                                type="button"
                                                onClick={handleApplyCoupon}
                                            >
                                                ÁP DỤNG
                                            </button>
                                        </div>

                                        {showCouponDropdown && (
                                            <div
                                                className="bg-white border shadow-sm"
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 30,
                                                    marginTop: 4,
                                                    borderRadius: 8,
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {isLoadingCoupons ? (
                                                    <div className="px-3 py-3 text-muted">
                                                        Đang tải voucher...
                                                    </div>
                                                ) : filteredCoupons.length > 0 ? (
                                                    filteredCoupons.map((coupon) => (
                                                        <button
                                                            key={coupon.id || coupon.code}
                                                            type="button"
                                                            className="dropdown-item d-flex justify-content-between align-items-center py-3"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                handleSelectCoupon(coupon);
                                                            }}
                                                        >
                                                            <span>
                                                                <strong className="text-uppercase text-dark">
                                                                    {coupon.code}
                                                                </strong>
                                                                <small className="d-block text-muted">
                                                                    Hết hạn: {formatDate(coupon.expiryDate)}
                                                                </small>
                                                                {(coupon.couponType === 'Personal' || coupon.couponType === 'Loyalty') && (
                                                                    <small className="d-block text-success">
                                                                        Voucher riêng cho bạn
                                                                    </small>
                                                                )}
                                                                {coupon.minOrderAmount > 0 && (
                                                                    <small className="d-block text-muted">
                                                                        Đơn từ {formatCurrency(coupon.minOrderAmount)}
                                                                    </small>
                                                                )}
                                                            </span>
                                                            <span className="badge bg-warning text-dark">
                                                                -{coupon.discountPercent}%
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-3 text-muted">
                                                        Không có voucher phù hợp
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <table className="table align-middle mt-2">
                                        <thead>
                                            <tr>
                                                <th scope="col">Hình</th>
                                                <th scope="col">Sản phẩm</th>
                                                <th scope="col">Thành tiền</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {cartItems && cartItems.length > 0 ? (
                                                cartItems.map((item, index) => {
                                                    const finalPrice = item.discountPrice || item.price;

                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <img
                                                                    src={item.imageUrl || '/img/avatar.jpg'}
                                                                    style={{
                                                                        width: '45px',
                                                                        height: '45px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '50%'
                                                                    }}
                                                                    alt={item.name || 'Sản phẩm'}
                                                                />
                                                            </td>
                                                            <td>
                                                                {item.name}{' '}
                                                                <span className="text-muted fw-bold">
                                                                    x{item.quantity} {getProductUnit(item)}
                                                                </span>
                                                            </td>
                                                            <td className="fw-bold">
                                                                {formatCurrency(finalPrice * item.quantity)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="text-center text-danger fw-bold">
                                                        Không có sản phẩm trong đơn hàng.
                                                    </td>
                                                </tr>
                                            )}

                                            <tr className="border-top">
                                                <td colSpan="2">
                                                    <strong>Tổng tiền hàng:</strong>
                                                </td>
                                                <td className="fw-bold">
                                                    {formatCurrency(subtotal)}
                                                </td>
                                            </tr>

                                            {discount > 0 && (
                                                <tr className="text-success">
                                                    <td colSpan="2">
                                                        <strong>Khấu trừ mã giảm giá:</strong>
                                                    </td>
                                                    <td className="fw-bold">
                                                        -{formatCurrency(discount)}
                                                    </td>
                                                </tr>
                                            )}

                                            <tr>
                                                <td colSpan="2">
                                                    <strong>Phí vận chuyển:</strong>
                                                    <br />

                                                    {isCalculatingShip ? (
                                                        <small className="text-warning fw-bold">
                                                            <i className="fa fa-spinner fa-spin me-1"></i>
                                                            Đang tính phí...
                                                        </small>
                                                    ) : !selectedWard.name ? (
                                                        <small className="text-danger fw-bold">
                                                            *Chọn địa chỉ để tính phí
                                                        </small>
                                                    ) : !canDeliver ? (
                                                        <small className="text-danger fw-bold">
                                                            {shippingMessage}
                                                        </small>
                                                    ) : (
                                                        <small className="text-success fw-bold">
                                                            {shippingMessage}
                                                        </small>
                                                    )}
                                                </td>

                                                <td>
                                                    <strong className={shippingFee === 0 ? 'text-danger' : 'text-dark'}>
                                                        {shippingFee === 0 ? '---' : formatCurrency(shippingFee)}
                                                    </strong>
                                                </td>
                                            </tr>

                                            <tr className="border-top border-dark border-2 bg-white">
                                                <td colSpan="2">
                                                    <h5 className="mb-0 text-primary fw-bold">
                                                        TỔNG THANH TOÁN:
                                                    </h5>
                                                </td>
                                                <td>
                                                    <h5 className="mb-0 text-danger fw-bold">
                                                        {formatCurrency(totalAmount)}
                                                    </h5>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <button
                                        type="submit"
                                        className="btn border-secondary bg-primary text-white py-3 px-4 text-uppercase w-100 fw-bold mt-4"
                                        disabled={!canDeliver || shippingFee === 0 || isCalculatingShip}
                                    >
                                        {isCalculatingShip
                                            ? 'ĐANG TÍNH TIỀN...'
                                            : !canDeliver
                                                ? 'KHÔNG HỖ TRỢ GIAO HÀNG'
                                                : (paymentMethod === 'MoMo' || paymentMethod === 'Bank Transfer')
                                                    ? 'XÁC NHẬN THANH TOÁN'
                                                    : 'XÁC NHẬN ĐẶT HÀNG NGAY'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {showPaymentQr && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        zIndex: 9999
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    {paymentMethod === 'MoMo'
                                        ? 'Thanh toán qua MoMo'
                                        : 'Thanh toán qua Ngân hàng'}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={resetPaymentQr}
                                ></button>
                            </div>

                            <div className="modal-body text-center p-4">
                                <h4 className="text-danger fw-bold mb-3">
                                    Thời gian còn lại: {formatCountdown(paymentTimeLeft)}
                                </h4>

                                <p className="text-muted">
                                    Vui lòng quét mã QR để thanh toán. Nếu hết 10 phút chưa xác nhận,
                                    hệ thống sẽ hủy thanh toán và không tạo đơn hàng.
                                </p>

                                {paymentMethod === 'Bank Transfer' && (
                                    <>
                                        <h5 className="text-info mb-3">
                                            Quét mã QR ngân hàng
                                        </h5>

                                        <p className="small text-muted mb-2">
                                            Ngân hàng MB Bank - Chủ TK: TRAN VAN TINH
                                        </p>

                                        <img
                                            src={`https://img.vietqr.io/image/mbbank-0999888777-compact2.png?amount=${Math.round(totalAmount)}&addInfo=ThanhToanFruitables`}
                                            alt="QR Code Ngân Hàng"
                                            style={{
                                                width: '230px',
                                                maxWidth: '100%'
                                            }}
                                        />
                                    </>
                                )}

                                {paymentMethod === 'MoMo' && (
                                    <>
                                        <h5 className="mb-3" style={{ color: '#A50064' }}>
                                            Mở ứng dụng MoMo để quét mã
                                        </h5>

                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                                            alt="MoMo QR"
                                            style={{
                                                width: '210px',
                                                maxWidth: '100%',
                                                border: '6px solid #A50064',
                                                borderRadius: '14px'
                                            }}
                                        />
                                    </>
                                )}

                                <p className="mt-3 fw-bold text-danger fs-5">
                                    Tổng thanh toán: {formatCurrency(totalAmount)}
                                </p>

                                <div className="d-flex gap-3 justify-content-center mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={resetPaymentQr}
                                    >
                                        Hủy thanh toán
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary text-white rounded-pill px-4 fw-bold"
                                        onClick={handlePlaceOrder}
                                    >
                                        Tôi đã thanh toán
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Checkout;
