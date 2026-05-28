import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi, reviewsApi, cartsApi } from '../services/api';

const MyOrders = () => {
    const navigate = useNavigate();

    const [myOrders, setMyOrders] = useState([]);

    // State quản lý Popup Đánh giá
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [reviewData, setReviewData] = useState({});

    // State hủy đơn
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [customCancelReason, setCustomCancelReason] = useState('');

    // State xem lý do hủy
    const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
    const [selectedCancelledOrder, setSelectedCancelledOrder] = useState(null);

    // State sửa đơn chờ xử lý
    const [showEditModal, setShowEditModal] = useState(false);
    const [editOrderData, setEditOrderData] = useState(null);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [selectedViewOrder, setSelectedViewOrder] = useState(null);
    const statusMap = {
        Pending: { label: 'Chờ xử lý', color: 'bg-secondary' },
        Processing: { label: 'Chờ vận chuyển', color: 'bg-info' },
        Shipping: { label: 'Đang giao hàng', color: 'bg-warning' },
        Completed: { label: 'Đã giao thành công', color: 'bg-success' },
        Cancelled: { label: 'Đã hủy', color: 'bg-danger' },
        Canceled: { label: 'Đã hủy', color: 'bg-danger' }
    };

    const cancelReasons = [
        'Thay đổi ý định: Bạn tìm thấy sản phẩm khác phù hợp hơn hoặc không còn nhu cầu mua nữa.',
        'Sai thông tin: Nhập sai địa chỉ nhận hàng, sai số điện thoại hoặc chọn nhầm phân loại sản phẩm.',
        'Sử dụng sai mã giảm giá: Đơn hàng chưa áp dụng được mã miễn phí vận chuyển hoặc voucher giảm giá như mong muốn.',
        'Thời gian giao hàng quá lâu: Đơn hàng chờ xác nhận hoặc chờ vận chuyển quá lâu so với dự kiến.',
        'Phát hiện chi phí phát sinh: Phí vận chuyển quá cao so với dự tính ban đầu.',
        'Lý do khác'
    ];

    const formatCurrency = (value) => {
        return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
    };

    const fetchMyOrders = () => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            navigate('/login');
            return;
        }

        ordersApi.getByUserId(currentUserId)
            .then(res => setMyOrders(res.data || []))
            .catch(err => console.log('Lỗi tải lịch sử đơn hàng: ', err));
    };

    useEffect(() => {
        fetchMyOrders();
    }, [navigate]);

    const handleOpenReview = (order) => {
        const details = order.details || [];

        setSelectedOrderDetails({
            orderId: order.id,
            items: details
        });

        const initialReviewState = {};

        details.forEach(item => {
            initialReviewState[item.productId] = {
                rating: 0,
                comment: '',
                imageFile: null,
                submitted: false
            };
        });

        setReviewData(initialReviewState);
        setShowReviewModal(true);
    };

    const handleReviewChange = (productId, field, value) => {
        setReviewData(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }));
    };

    const handleStarClick = (productId, star) => {
        const currentRating = Number(reviewData[productId]?.rating ?? 0);
        const newRating = currentRating === star ? star - 1 : star;

        handleReviewChange(productId, 'rating', newRating);
    };

    const handleSubmitSingleReview = async (productId) => {
        const data = reviewData[productId];

        if (!data || !data.rating || data.rating < 1) {
            alert('Ní vui lòng chọn số sao đánh giá nha!');
            return;
        }

        if (!data.comment || !data.comment.trim()) {
            alert('Ní vui lòng nhập chút nhận xét nha!');
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        const formData = new FormData();
        formData.append('OrderId', selectedOrderDetails.orderId);
        formData.append('ProductId', productId);
        formData.append('UserId', userData.userId || userData.id);
        formData.append('UserName', userData.name || userData.userName || 'Khách hàng');
        formData.append('Rating', data.rating);
        formData.append('Comment', data.comment.trim());

        if (data.imageFile) {
            formData.append('ImageFile', data.imageFile);
        }

        try {
            await reviewsApi.submitReview(formData);

            alert('Gửi đánh giá thành công! 🌟');

            handleReviewChange(productId, 'submitted', true);
            fetchMyOrders();
        } catch (error) {
            console.error(error);
            alert(error.response?.data || 'Lỗi kết nối Backend.');
        }
    };

    const handleOpenCancelModal = (order) => {
        setSelectedCancelOrder(order);
        setCancelReason('');
        setCustomCancelReason('');
        setShowCancelModal(true);
    };

    const handleCancelOrder = async () => {
        if (!selectedCancelOrder) {
            return;
        }

        let finalReason = cancelReason;

        if (cancelReason === 'Lý do khác') {
            finalReason = customCancelReason.trim();
        }

        if (!finalReason) {
            alert('Ní vui lòng chọn hoặc nhập lý do hủy đơn nha!');
            return;
        }

        if (!window.confirm(`Ní chắc chắn muốn hủy đơn hàng #${selectedCancelOrder.id} không?`)) {
            return;
        }

        try {
            await ordersApi.cancelOrder(selectedCancelOrder.id, finalReason);

            alert('Hủy đơn hàng thành công!');
            setShowCancelModal(false);
            setSelectedCancelOrder(null);
            setCancelReason('');
            setCustomCancelReason('');

            fetchMyOrders();
        } catch (error) {
            console.error(error);
            alert(error.response?.data || 'Hủy đơn hàng thất bại!');
        }
    };

    const handleOpenCancelReason = (order) => {
        setSelectedCancelledOrder(order);
        setShowCancelReasonModal(true);
    };

    const handleOpenEditOrder = (order) => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        setEditOrderData({
            id: order.id,
            receiverName:
                order.receiverName ||
                order.ReceiverName ||
                userData.name ||
                userData.userName ||
                '',
            phone:
                order.phone ||
                order.Phone ||
                userData.phone ||
                userData.phoneNumber ||
                '',
            shippingAddress:
                order.shippingAddress ||
                order.ShippingAddress ||
                '',
            orderNotes:
                order.orderNotes ||
                order.OrderNotes ||
                '',
            details: (order.details || []).map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: Number(item.quantity || 1),
                unitPrice: Number(item.unitPrice || 0)
            }))
        });

        setShowEditModal(true);
    };

    const handleEditOrderChange = (field, value) => {
        setEditOrderData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditQuantityChange = (productId, value) => {
        const newQuantity = Math.max(1, Number(value || 1));

        setEditOrderData(prev => ({
            ...prev,
            details: prev.details.map(item =>
                item.productId === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        }));
    };

    const getEditSubTotal = () => {
        if (!editOrderData?.details) return 0;

        return editOrderData.details.reduce((total, item) => {
            return total + Number(item.unitPrice || 0) * Number(item.quantity || 0);
        }, 0);
    };

    const handleUpdatePendingOrder = async () => {
        if (!editOrderData) return;

        if (!editOrderData.receiverName.trim()) {
            alert('Ní vui lòng nhập tên người nhận!');
            return;
        }

        if (!editOrderData.phone.trim()) {
            alert('Ní vui lòng nhập số điện thoại!');
            return;
        }

        if (!editOrderData.shippingAddress.trim()) {
            alert('Ní vui lòng nhập địa chỉ giao hàng!');
            return;
        }

        if (!editOrderData.details || editOrderData.details.length === 0) {
            alert('Đơn hàng không có sản phẩm để cập nhật!');
            return;
        }

        const payload = {
            receiverName: editOrderData.receiverName.trim(),
            phone: editOrderData.phone.trim(),
            shippingAddress: editOrderData.shippingAddress.trim(),
            orderNotes: editOrderData.orderNotes,
            details: editOrderData.details.map(item => ({
                productId: item.productId,
                quantity: Number(item.quantity || 1),
                unitPrice: Number(item.unitPrice || 0)
            }))
        };

        try {
            await ordersApi.updatePendingOrder(editOrderData.id, payload);

            alert('Cập nhật đơn hàng thành công!');
            setShowEditModal(false);
            setEditOrderData(null);
            fetchMyOrders();
        } catch (error) {
            console.error(error);
            alert(error.response?.data || 'Cập nhật đơn hàng thất bại!');
        }
    };
    const handleBuyAgain = async (order) => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert('Ní vui lòng đăng nhập để mua lại đơn hàng!');
            navigate('/login');
            return;
        }

        if (!order.details || order.details.length === 0) {
            alert('Đơn hàng này không có sản phẩm để mua lại!');
            return;
        }

        try {
            for (const item of order.details) {
                await cartsApi.addToCart({
                    userId: currentUserId,
                    productId: item.productId,
                    quantity: item.quantity || 1
                });
            }

            alert('Đã thêm lại sản phẩm vào giỏ hàng!');
            navigate('/cart');
        } catch (error) {
            console.error(error);
            alert(error.response?.data || 'Mua lại thất bại, ní kiểm tra lại giỏ hàng/API nha!');
        }
    };
    const getProductImageUrl = (imageUrl) => {
        if (!imageUrl) return '/img/avatar.jpg';

        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        return imageUrl;
    };

    const handleOpenOrderDetail = (order) => {
        setSelectedViewOrder(order);
        setShowOrderDetailModal(true);
    };

    return (
        <>
            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Lịch Sử Mua Hàng</h1>
            </div>

            <div className="container-fluid py-5">
                <div className="container py-5">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle text-center">
                            <thead className="table-dark">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Ngày đặt</th>
                                    <th className="text-start">Sản phẩm</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {myOrders && myOrders.length > 0 ? (
                                    myOrders.map((order) => {
                                        const isAllReviewed =
                                            order.details?.length > 0 &&
                                            order.details.every(d => d.isReviewed);

                                        const isCancelled =
                                            order.status === 'Cancelled' ||
                                            order.status === 'Canceled';

                                        return (
                                            <tr
                                                key={order.id}
                                                onClick={() => handleOpenOrderDetail(order)}
                                                style={{ cursor: 'pointer' }}
                                                title="Bấm để xem chi tiết đơn hàng"
                                            >
                                                <td className="fw-bold text-primary">
                                                    #{order.id}
                                                </td>
                                                <td>
                                                    {new Date(order.orderDate || order.createdAt).toLocaleDateString('vi-VN')}
                                                </td>

                                                <td className="text-start">
                                                    <ul className="mb-0" style={{ paddingLeft: '1rem' }}>
                                                        {order.details?.map(item => (
                                                            <li
                                                                key={item.productId}
                                                                className="text-muted d-flex align-items-center mb-1"
                                                                style={{ fontSize: '14px' }}
                                                            >
                                                                <img
                                                                    src={getProductImageUrl(
                                                                        item.productImageUrl ||
                                                                        item.ProductImageUrl ||
                                                                        item.imageUrl ||
                                                                        item.ImageUrl
                                                                    )}
                                                                    alt={item.productName || 'Sản phẩm'}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '50%',
                                                                        marginRight: '8px'
                                                                    }}
                                                                />

                                                                <span>
                                                                    {item.productName || item.ProductName}{' '}
                                                                    <span className="fw-bold text-dark">
                                                                        (x{item.quantity})
                                                                    </span>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>

                                                <td className="fw-bold text-danger">
                                                    {formatCurrency(order.totalAmount)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`badge ${statusMap[order.status]?.color || 'bg-secondary'} p-2 rounded-pill`}
                                                        style={{
                                                            cursor: isCancelled ? 'pointer' : 'default'
                                                        }}
                                                        onClick={(e) => {
                                                            if (isCancelled) {
                                                                e.stopPropagation();
                                                                handleOpenCancelReason(order);
                                                            }
                                                        }}
                                                        title={isCancelled ? 'Bấm để xem lý do hủy' : ''}
                                                    >
                                                        {statusMap[order.status]?.label || order.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {order.status === 'Pending' && (
                                                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary rounded-pill fw-bold"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenEditOrder(order);
                                                                }}
                                                            >
                                                                <i className="fa fa-edit me-1"></i>
                                                                Xem / Sửa
                                                            </button>

                                                            <button
                                                                className="btn btn-sm btn-outline-danger rounded-pill fw-bold"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenCancelModal(order);
                                                                }}
                                                            >
                                                                <i className="fa fa-times me-1"></i>
                                                                Hủy đơn
                                                            </button>
                                                        </div>
                                                    )}

                                                    {order.status === 'Completed' && (
                                                        isAllReviewed ? (
                                                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                                                                <span className="badge bg-success p-2 fs-7">
                                                                    <i className="fa fa-check me-1"></i>
                                                                    Đã đánh giá
                                                                </span>

                                                                <button
                                                                    className="btn btn-sm btn-outline-primary rounded-pill fw-bold"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleBuyAgain(order);
                                                                    }}
                                                                >
                                                                    <i className="fa fa-shopping-cart me-1"></i>
                                                                    Mua lại
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-warning rounded-pill fw-bold"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenReview(order);
                                                                        }}
                                                                    >
                                                                        <i className="fa fa-star me-1"></i>
                                                                        Đánh giá SP
                                                                    </button>

                                                                <button
                                                                    className="btn btn-sm btn-outline-primary rounded-pill fw-bold"
                                                                    onClick={() => handleBuyAgain(order)}
                                                                >
                                                                    <i className="fa fa-shopping-cart me-1"></i>
                                                                    Mua lại
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <h5 className="text-muted">Ní chưa có đơn hàng nào.</h5>
                                            <Link
                                                to="/shop"
                                                className="btn btn-primary rounded-pill px-4 py-2 text-white fw-bold mt-3"
                                            >
                                                Mua sắm ngay
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between mt-5">
                        <Link
                            to="/"
                            className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold"
                        >
                            <i className="fa fa-arrow-left me-2"></i>
                            Về Trang chủ
                        </Link>

                        <Link
                            to="/shop"
                            className="btn btn-primary rounded-pill px-4 py-2 text-white fw-bold"
                        >
                            Tiếp tục mua sắm
                            <i className="fa fa-arrow-right ms-2"></i>
                        </Link>
                    </div>
                </div>
            </div>

            {showReviewModal && selectedOrderDetails && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    Đánh giá Đơn hàng #{selectedOrderDetails.orderId}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowReviewModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                {selectedOrderDetails.items.map(item => {
                                    const rData = reviewData[item.productId] || {
                                        rating: 0,
                                        comment: '',
                                        imageFile: null,
                                        submitted: false
                                    };

                                    const currentRating = Number(rData.rating ?? 0);

                                    return (
                                        <div
                                            key={item.productId}
                                            className="border rounded p-3 mb-4 bg-light"
                                        >
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="fw-bold text-dark fs-5">
                                                    {item.productName}{' '}
                                                    <span className="text-muted fs-6">
                                                        (Mã SP: {item.productId})
                                                    </span>
                                                </div>
                                            </div>

                                            {(item.isReviewed || rData.submitted) ? (
                                                <div className="alert alert-success text-center mb-0 fw-bold">
                                                    <i className="fa fa-check-circle me-2"></i>
                                                    Ní đã đánh giá sản phẩm này rồi! Cảm ơn ní nha! 💖
                                                </div>
                                            ) : (
                                                <div className="row g-3">
                                                    <div className="col-12 d-flex align-items-center flex-wrap">
                                                        <label className="me-3 fw-bold">
                                                            Chất lượng:
                                                        </label>

                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                className="btn p-0 me-1 border-0 bg-transparent"
                                                                onClick={() => handleStarClick(item.productId, star)}
                                                                title={`${star} sao`}
                                                            >
                                                                <i
                                                                    className={`fa fa-star fs-3 ${star <= currentRating
                                                                            ? 'text-warning'
                                                                            : 'text-dark'
                                                                        }`}
                                                                ></i>
                                                            </button>
                                                        ))}

                                                        <span className="ms-2 fw-bold text-warning">
                                                            {currentRating} sao
                                                        </span>
                                                    </div>

                                                    <div className="col-12">
                                                        <textarea
                                                            className="form-control"
                                                            rows="3"
                                                            placeholder="Mô tả trải nghiệm của ní về sản phẩm này..."
                                                            value={rData.comment || ''}
                                                            onChange={(e) =>
                                                                handleReviewChange(
                                                                    item.productId,
                                                                    'comment',
                                                                    e.target.value
                                                                )
                                                            }
                                                        ></textarea>
                                                    </div>

                                                    <div className="col-12">
                                                        <label className="fw-bold mb-2">
                                                            Thêm hình ảnh thực tế (Không bắt buộc):
                                                        </label>

                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleReviewChange(
                                                                    item.productId,
                                                                    'imageFile',
                                                                    e.target.files[0]
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="col-12 text-end mt-3">
                                                        <button
                                                            className="btn btn-warning px-4 rounded-pill text-white fw-bold"
                                                            onClick={() => handleSubmitSingleReview(item.productId)}
                                                        >
                                                            Gửi Đánh Giá
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && selectedCancelOrder && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    Hủy đơn hàng #{selectedCancelOrder.id}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowCancelModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <p className="fw-bold mb-3">
                                    Ní vui lòng chọn lý do hủy đơn:
                                </p>

                                {cancelReasons.map((reason, index) => (
                                    <div className="form-check mb-3" key={index}>
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="cancelReason"
                                            id={`cancelReason${index}`}
                                            value={reason}
                                            checked={cancelReason === reason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                        />

                                        <label
                                            className="form-check-label"
                                            htmlFor={`cancelReason${index}`}
                                        >
                                            {reason}
                                        </label>
                                    </div>
                                ))}

                                {cancelReason === 'Lý do khác' && (
                                    <div className="mt-3">
                                        <label className="fw-bold mb-2">
                                            Nhập lý do khác:
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Nhập lý do hủy đơn của ní..."
                                            value={customCancelReason}
                                            onChange={(e) => setCustomCancelReason(e.target.value)}
                                        ></textarea>
                                    </div>
                                )}

                                <div className="alert alert-warning mt-4 mb-0">
                                    <strong>Lưu ý:</strong> Chỉ đơn hàng đang <strong>Chờ xử lý</strong> mới có thể hủy.
                                    Sau khi hủy, số lượng sản phẩm sẽ được hoàn lại vào kho.
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={() => setShowCancelModal(false)}
                                >
                                    Không hủy nữa
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-danger rounded-pill px-4 fw-bold"
                                    onClick={handleCancelOrder}
                                >
                                    Xác nhận hủy đơn
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCancelReasonModal && selectedCancelledOrder && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    Lý do hủy đơn #{selectedCancelledOrder.id}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowCancelReasonModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <p className="fw-bold mb-2">Lý do hủy:</p>

                                <div className="alert alert-danger mb-3">
                                    {selectedCancelledOrder.cancelReason ||
                                        selectedCancelledOrder.CancelReason ||
                                        'Chưa có lý do hủy được lưu.'}
                                </div>

                                {(selectedCancelledOrder.cancelledAt || selectedCancelledOrder.CancelledAt) && (
                                    <p className="text-muted mb-0">
                                        Thời gian hủy:{' '}
                                        {new Date(
                                            selectedCancelledOrder.cancelledAt ||
                                            selectedCancelledOrder.CancelledAt
                                        ).toLocaleString('vi-VN')}
                                    </p>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={() => setShowCancelReasonModal(false)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && editOrderData && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    Xem / Sửa đơn hàng #{editOrderData.id}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowEditModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">
                                            Tên người nhận
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editOrderData.receiverName}
                                            onChange={(e) =>
                                                handleEditOrderChange('receiverName', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editOrderData.phone}
                                            onChange={(e) =>
                                                handleEditOrderChange('phone', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-bold">
                                            Địa chỉ giao hàng
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={editOrderData.shippingAddress}
                                            onChange={(e) =>
                                                handleEditOrderChange('shippingAddress', e.target.value)
                                            }
                                        ></textarea>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-bold">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={editOrderData.orderNotes}
                                            onChange={(e) =>
                                                handleEditOrderChange('orderNotes', e.target.value)
                                            }
                                        ></textarea>
                                    </div>

                                    <div className="col-12">
                                        <h5 className="mt-3 mb-3">Sản phẩm trong đơn</h5>

                                        <div className="table-responsive">
                                            <table className="table table-bordered align-middle text-center">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Sản phẩm</th>
                                                        <th>Đơn giá</th>
                                                        <th style={{ width: '140px' }}>Số lượng</th>
                                                        <th>Thành tiền</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {editOrderData.details.map(item => (
                                                        <tr key={item.productId}>
                                                            <td className="text-start">
                                                                {item.productName}
                                                            </td>

                                                            <td>
                                                                {formatCurrency(item.unitPrice)}
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="form-control text-center"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        handleEditQuantityChange(
                                                                            item.productId,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="fw-bold text-danger">
                                                                {formatCurrency(item.unitPrice * item.quantity)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="text-end fw-bold fs-5">
                                            Tạm tính mới:{' '}
                                            <span className="text-danger">
                                                {formatCurrency(getEditSubTotal())}
                                            </span>
                                        </div>

                                        <div className="alert alert-info mt-3 mb-0">
                                            Chỉ đơn hàng đang <strong>Chờ xử lý</strong> mới được cập nhật.
                                            Phí vận chuyển giữ nguyên theo đơn ban đầu.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Đóng
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary text-white rounded-pill px-4 fw-bold"
                                    onClick={handleUpdatePendingOrder}
                                >
                                    Cập nhật đơn hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showOrderDetailModal && selectedViewOrder && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    Chi tiết đơn hàng #{selectedViewOrder.id}
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowOrderDetailModal(false)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="border rounded p-3 h-100">
                                            <h5 className="fw-bold mb-3 text-primary">
                                                Thông tin đơn hàng
                                            </h5>

                                            <p className="mb-2">
                                                <strong>Mã đơn:</strong> #{selectedViewOrder.id}
                                            </p>

                                            <p className="mb-2">
                                                <strong>Ngày đặt:</strong>{' '}
                                                {new Date(
                                                    selectedViewOrder.orderDate ||
                                                    selectedViewOrder.createdAt
                                                ).toLocaleDateString('vi-VN')}
                                            </p>

                                            <p className="mb-2">
                                                <strong>Trạng thái:</strong>{' '}
                                                <span
                                                    className={`badge ${statusMap[selectedViewOrder.status]?.color || 'bg-secondary'
                                                        } rounded-pill`}
                                                >
                                                    {statusMap[selectedViewOrder.status]?.label || selectedViewOrder.status}
                                                </span>
                                            </p>

                                            <p className="mb-0">
                                                <strong>Phương thức thanh toán:</strong>{' '}
                                                {selectedViewOrder.paymentMethod || selectedViewOrder.PaymentMethod || 'Không có'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="border rounded p-3 h-100">
                                            <h5 className="fw-bold mb-3 text-primary">
                                                Thông tin giao hàng
                                            </h5>

                                            <p className="mb-2">
                                                <strong>Người nhận:</strong>{' '}
                                                {selectedViewOrder.receiverName ||
                                                    selectedViewOrder.ReceiverName ||
                                                    'Chưa có'}
                                            </p>

                                            <p className="mb-2">
                                                <strong>Số điện thoại:</strong>{' '}
                                                {selectedViewOrder.phone ||
                                                    selectedViewOrder.Phone ||
                                                    'Chưa có'}
                                            </p>

                                            <p className="mb-2">
                                                <strong>Địa chỉ:</strong>{' '}
                                                {selectedViewOrder.shippingAddress ||
                                                    selectedViewOrder.ShippingAddress ||
                                                    'Chưa có'}
                                            </p>

                                            <p className="mb-0">
                                                <strong>Ghi chú:</strong>{' '}
                                                {selectedViewOrder.orderNotes ||
                                                    selectedViewOrder.OrderNotes ||
                                                    'Không có'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <h5 className="fw-bold mb-3">
                                    Sản phẩm trong đơn
                                </h5>

                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle text-center">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Hình</th>
                                                <th className="text-start">Sản phẩm</th>
                                                <th>Đơn giá</th>
                                                <th>Số lượng</th>
                                                <th>Thành tiền</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {(selectedViewOrder.details || []).map(item => {
                                                const imageUrl =
                                                    item.productImageUrl ||
                                                    item.ProductImageUrl ||
                                                    item.imageUrl ||
                                                    item.ImageUrl;

                                                const productName =
                                                    item.productName ||
                                                    item.ProductName ||
                                                    'Sản phẩm';

                                                const unitPrice = Number(item.unitPrice || item.UnitPrice || 0);
                                                const quantity = Number(item.quantity || item.Quantity || 0);

                                                return (
                                                    <tr key={item.productId || item.ProductId}>
                                                        <td>
                                                            <img
                                                                src={getProductImageUrl(imageUrl)}
                                                                alt={productName}
                                                                style={{
                                                                    width: '70px',
                                                                    height: '70px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '12px'
                                                                }}
                                                            />
                                                        </td>

                                                        <td className="text-start fw-bold">
                                                            {productName}
                                                        </td>

                                                        <td>
                                                            {formatCurrency(unitPrice)}
                                                        </td>

                                                        <td>
                                                            x{quantity}
                                                        </td>

                                                        <td className="fw-bold text-danger">
                                                            {formatCurrency(unitPrice * quantity)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="row justify-content-end mt-4">
                                    <div className="col-md-5">
                                        <div className="border rounded p-3 bg-light">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Tổng tiền hàng:</span>
                                                <strong>
                                                    {formatCurrency(
                                                        (selectedViewOrder.details || []).reduce((total, item) => {
                                                            const unitPrice = Number(item.unitPrice || item.UnitPrice || 0);
                                                            const quantity = Number(item.quantity || item.Quantity || 0);

                                                            return total + unitPrice * quantity;
                                                        }, 0)
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Phí vận chuyển:</span>
                                                <strong>
                                                    {formatCurrency(
                                                        selectedViewOrder.shippingFee ||
                                                        selectedViewOrder.ShippingFee ||
                                                        0
                                                    )}
                                                </strong>
                                            </div>

                                            <hr />

                                            <div className="d-flex justify-content-between fs-5">
                                                <span className="fw-bold">Tổng thanh toán:</span>
                                                <strong className="text-danger">
                                                    {formatCurrency(selectedViewOrder.totalAmount)}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary rounded-pill px-4"
                                    onClick={() => setShowOrderDetailModal(false)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyOrders;