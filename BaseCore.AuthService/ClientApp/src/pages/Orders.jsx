import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const statusMap = {
    Pending: { label: 'Chờ xử lý', color: 'bg-warning text-dark' },
    Processing: { label: 'Chờ vận chuyển', color: 'bg-info text-white' },
    Shipping: { label: 'Đang vận chuyển', color: 'bg-primary text-white' },
    Completed: { label: 'Hoàn thành', color: 'bg-success text-white' },
    Cancelled: { label: 'Đã hủy', color: 'bg-danger text-white' },
    Canceled: { label: 'Đã hủy', color: 'bg-danger text-white' }
};

const normalizeStatus = (status) => {
    if (status === 'Canceled') return 'Cancelled';
    return status || 'Pending';
};

const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
};

const toDateValue = (value) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
};

const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return '/img/avatar.jpg';
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl;
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [minTotal, setMinTotal] = useState('');
    const [maxTotal, setMaxTotal] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const pageSize = 10;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/all', {
                params: { keyword: searchTerm || undefined }
            });
            setOrders(res.data || []);
        } catch (err) {
            console.error('Lỗi tải đơn hàng:', err);
            alert('Không tải được danh sách đơn hàng!');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const normalizedStatus = normalizeStatus(order.status);
            const totalAmount = Number(order.totalAmount || 0);
            const orderDate = toDateValue(order.orderDate);

            if (statusFilter && normalizedStatus !== statusFilter) return false;
            if (minTotal !== '' && totalAmount < Number(minTotal)) return false;
            if (maxTotal !== '' && totalAmount > Number(maxTotal)) return false;
            if (dateFrom && orderDate && orderDate < dateFrom) return false;
            if (dateTo && orderDate && orderDate > dateTo) return false;

            return true;
        });
    }, [orders, statusFilter, minTotal, maxTotal, dateFrom, dateTo]);

    const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
    const displayedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
    const totalRevenue = filteredOrders
        .filter((order) => normalizeStatus(order.status) === 'Completed')
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const pendingCount = filteredOrders.filter((order) => normalizeStatus(order.status) === 'Pending').length;
    const shippingCount = filteredOrders.filter((order) => ['Processing', 'Shipping'].includes(normalizeStatus(order.status))).length;
    const completedCount = filteredOrders.filter((order) => normalizeStatus(order.status) === 'Completed').length;
    const cancelledCount = filteredOrders.filter((order) => normalizeStatus(order.status) === 'Cancelled').length;

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchOrders();
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setMinTotal('');
        setMaxTotal('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const updateStatus = async (id, newStatus) => {
        const currentOrder = orders.find(order => order.id === id);
        const currentStatus = normalizeStatus(currentOrder?.status);

        if (currentStatus === 'Completed' || currentStatus === 'Cancelled') {
            alert('Đơn hàng này đã kết thúc, không thể thay đổi trạng thái!');
            return;
        }

        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            alert('Đã chuyển trạng thái đơn hàng!');
            fetchOrders();
        } catch (err) {
            console.error('Không cập nhật được trạng thái:', err);
            alert(err.response?.data || 'Không cập nhật được trạng thái đơn hàng!');
        }
    };

    const deleteOrder = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn đơn hàng này không?')) {
            return;
        }

        try {
            await api.delete(`/orders/${id}`);
            alert('Xóa thành công!');
            fetchOrders();
        } catch (err) {
            console.error('Không xóa được đơn hàng:', err);
            alert(err.response?.data?.message || 'Không xóa được đơn hàng!');
        }
    };

    const viewOrderDetail = async (order) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        setSelectedOrder({ ...order, details: [] });

        try {
            const res = await api.get(`/orders/${order.id}`);
            const orderData = res.data?.order || {};
            const details = res.data?.details || [];

            setSelectedOrder({
                ...order,
                ...orderData,
                customerName: order.customerName,
                details
            });
        } catch (err) {
            console.error('Lỗi tải chi tiết đơn hàng:', err);
            alert(err.response?.data?.message || 'Không tải được chi tiết đơn hàng!');
            setShowDetailModal(false);
            setSelectedOrder(null);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Đơn Hàng</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="row mb-3">
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Tổng đơn hàng</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{filteredOrders.length}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Theo bộ lọc hiện tại</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#eef6ff', color: '#0b78a6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-file-invoice-dollar"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Doanh thu</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{formatCurrency(totalRevenue)}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{completedCount} đơn hoàn thành</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#e8f7ee', color: '#16834a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-coins"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Cần xử lý</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{pendingCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{shippingCount} đơn đang giao/vận chuyển</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#fff4db', color: '#b77900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-clock"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Đơn đã hủy</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{cancelledCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Cần theo dõi lý do hủy</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#ffecec', color: '#c92a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-ban"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-12">
                                    <form onSubmit={handleSearch} className="form-inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Mã đơn, tên khách hàng..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '1 1 260px', minWidth: 220 }}
                                        />

                                        <select
                                            className="form-control"
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 180px', minWidth: 160 }}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="Pending">Chờ xử lý</option>
                                            <option value="Processing">Chờ vận chuyển</option>
                                            <option value="Shipping">Đang vận chuyển</option>
                                            <option value="Completed">Hoàn thành</option>
                                            <option value="Cancelled">Đã hủy</option>
                                        </select>

                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            className="form-control"
                                            placeholder="Tiền từ"
                                            value={minTotal}
                                            onChange={(e) => {
                                                setMinTotal(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 120px', minWidth: 110 }}
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            className="form-control"
                                            placeholder="Đến tiền"
                                            value={maxTotal}
                                            onChange={(e) => {
                                                setMaxTotal(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 125px', minWidth: 115 }}
                                        />

                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dateFrom}
                                            onChange={(e) => {
                                                setDateFrom(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 145px', minWidth: 135 }}
                                        />

                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dateTo}
                                            onChange={(e) => {
                                                setDateTo(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 145px', minWidth: 135 }}
                                        />

                                        <button type="submit" className="btn btn-default" title="Tìm kiếm">
                                            <i className="fas fa-search"></i>
                                        </button>
                                        <button type="button" className="btn btn-light" onClick={handleResetFilters} title="Xóa bộ lọc">
                                            <i className="fas fa-undo"></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="card-body table-responsive p-0">
                            {loading ? (
                                <div className="text-center p-3">Đang tải dữ liệu...</div>
                            ) : (
                                <table className="table table-hover text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Khách hàng</th>
                                            <th>Ngày đặt</th>
                                            <th>Tổng tiền</th>
                                            <th>Trạng thái</th>
                                            <th>Cập nhật trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedOrders.length > 0 ? (
                                            displayedOrders.map((order) => {
                                                const currentStatus = normalizeStatus(order.status);

                                                return (
                                                    <tr key={order.id}>
                                                        <td>#{order.id}</td>
                                                        <td>
                                                            <div className="font-weight-bold">{order.customerName || order.userId}</div>
                                                            <small className="text-muted">{order.userId}</small>
                                                        </td>
                                                        <td>{formatDate(order.orderDate)}</td>
                                                        <td className="font-weight-bold">{formatCurrency(order.totalAmount)}</td>
                                                        <td>
                                                            <span className={`badge ${statusMap[currentStatus]?.color || 'bg-secondary text-white'} p-2`}>
                                                                {statusMap[currentStatus]?.label || currentStatus}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="form-control form-control-sm"
                                                                style={{ width: 185 }}
                                                                value={currentStatus}
                                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                                disabled={currentStatus === 'Completed' || currentStatus === 'Cancelled'}
                                                            >
                                                                <option value="Pending">Chờ xử lý</option>
                                                                <option value="Processing">Chờ vận chuyển</option>
                                                                <option value="Shipping">Đang vận chuyển</option>
                                                                <option value="Completed">Hoàn thành</option>
                                                                <option value="Cancelled">Hủy đơn</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-info btn-sm mr-1"
                                                                onClick={() => viewOrderDetail(order)}
                                                                title="Xem chi tiết đơn hàng"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => deleteOrder(order.id)}
                                                                title="Xóa đơn hàng"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">Không có đơn hàng phù hợp.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="card-footer">
                            <nav>
                                <ul className="pagination pagination-sm m-0 float-right">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </section>

            {showDetailModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h4 className="modal-title">Chi tiết đơn hàng #{selectedOrder?.id}</h4>
                                <button type="button" className="close text-white" onClick={() => setShowDetailModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>

                            <div className="modal-body">
                                {detailLoading || !selectedOrder ? (
                                    <div className="text-center p-4">Đang tải chi tiết...</div>
                                ) : (
                                    <>
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="card h-100">
                                                    <div className="card-header">
                                                        <h5 className="card-title mb-0">Thông tin đơn hàng</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <p><strong>Mã đơn:</strong> #{selectedOrder.id}</p>
                                                        <p><strong>Khách hàng:</strong> {selectedOrder.customerName || selectedOrder.userId}</p>
                                                        <p><strong>User ID:</strong> {selectedOrder.userId}</p>
                                                        <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.orderDate)}</p>
                                                        <p>
                                                            <strong>Trạng thái:</strong>{' '}
                                                            <span className={`badge ${statusMap[normalizeStatus(selectedOrder.status)]?.color || 'bg-secondary text-white'} p-2`}>
                                                                {statusMap[normalizeStatus(selectedOrder.status)]?.label || selectedOrder.status}
                                                            </span>
                                                        </p>
                                                        <p><strong>Thanh toán:</strong> {selectedOrder.paymentMethod || 'Không có'}</p>
                                                        <p><strong>Mã giảm giá:</strong> {selectedOrder.couponCode || 'Không có'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="card h-100">
                                                    <div className="card-header">
                                                        <h5 className="card-title mb-0">Thông tin giao hàng</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <p><strong>Người nhận:</strong> {selectedOrder.receiverName || 'Chưa có'}</p>
                                                        <p><strong>Số điện thoại:</strong> {selectedOrder.phone || 'Chưa có'}</p>
                                                        <p><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress || 'Chưa có'}</p>
                                                        <p><strong>Ghi chú:</strong> {selectedOrder.orderNotes || 'Không có'}</p>
                                                        {selectedOrder.cancelReason && (
                                                            <p><strong>Lý do hủy:</strong> {selectedOrder.cancelReason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <h5 className="mb-3">Sản phẩm trong đơn</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered text-center align-middle">
                                                <thead>
                                                    <tr>
                                                        <th>Hình</th>
                                                        <th className="text-left">Sản phẩm</th>
                                                        <th>Đơn giá</th>
                                                        <th>Số lượng</th>
                                                        <th>Thành tiền</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedOrder.details || []).length > 0 ? (
                                                        selectedOrder.details.map((item) => {
                                                            const product = item.product || item.Product || {};
                                                            const productName = product.name || product.Name || item.productName || item.ProductName || `Sản phẩm #${item.productId}`;
                                                            const imageUrl = product.imageUrl || product.ImageUrl || item.productImageUrl || item.ProductImageUrl;
                                                            const unitPrice = Number(item.unitPrice || item.UnitPrice || 0);
                                                            const quantity = Number(item.quantity || item.Quantity || 0);

                                                            return (
                                                                <tr key={item.id || item.productId}>
                                                                    <td>
                                                                        <img
                                                                            src={getProductImageUrl(imageUrl)}
                                                                            alt={productName}
                                                                            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
                                                                        />
                                                                    </td>
                                                                    <td className="text-left font-weight-bold">{productName}</td>
                                                                    <td>{formatCurrency(unitPrice)}</td>
                                                                    <td>x{quantity}</td>
                                                                    <td className="font-weight-bold text-danger">{formatCurrency(unitPrice * quantity)}</td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="py-4">Đơn hàng chưa có sản phẩm.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="row justify-content-end mt-4">
                                            <div className="col-md-5">
                                                <div className="card bg-light">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Tạm tính:</span>
                                                            <strong>{formatCurrency(selectedOrder.subTotal)}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Phí vận chuyển:</span>
                                                            <strong>{formatCurrency(selectedOrder.shippingFee)}</strong>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex justify-content-between h5 mb-0">
                                                            <span>Tổng thanh toán:</span>
                                                            <strong className="text-danger">{formatCurrency(selectedOrder.totalAmount)}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Orders;
