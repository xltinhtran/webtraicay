import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await orderApi.getAll();
            setOrders(response.data || []);
        } catch (error) {
            console.error('Failed to load orders:', error);
            setError(error.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            0: { label: 'Pending', class: 'badge-warning' },
            1: { label: 'Processing', class: 'badge-info' },
            2: { label: 'Shipped', class: 'badge-primary' },
            3: { label: 'Delivered', class: 'badge-success' },
            4: { label: 'Cancelled', class: 'badge-danger' },
        };
        const statusInfo = statusMap[status] || { label: 'Unknown', class: 'badge-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    const viewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedOrder(null);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await orderApi.updateStatus(orderId, newStatus);
            loadOrders();
            setShowDetails(false);
        } catch (error) {
            alert('Failed to update order status: ' + error.response?.data?.message);
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Danh sách hóa đơn</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <button className="btn btn-primary" onClick={loadOrders} disabled={loading}>
                                <i className="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {error}
                                    <button
                                        type="button"
                                        className="close"
                                        data-dismiss="alert"
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            )}

                            {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="alert alert-info text-center">
                                    Chưa có đơn hàng nào.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover">
                                        <thead className="bg-primary">
                                            <tr>
                                                <th>ID</th>
                                                <th>Khách hàng</th>
                                                <th>Tổng tiền</th>
                                                <th>Trạng thái hiện tại</th>
                                                <th>Xử lý chuyển trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>{order.id}</td>
                                                    <td>{order.userId || order.customerName || 'N/A'}</td>
                                                    <td className="font-weight-bold">
                                                        {new Intl.NumberFormat('vi-VN', {
                                                            style: 'currency',
                                                            currency: 'VND'
                                                        }).format(order.totalAmount || 0)}
                                                    </td>
                                                    <td>
                                                        {getStatusBadge(order.status)}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-info"
                                                            onClick={() => viewDetails(order)}
                                                        >
                                                            <i className="fas fa-eye"></i> Xem chi tiết
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Order Details Modal */}
            {showDetails && selectedOrder && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Chi tiết đơn hàng #{selectedOrder.id}</h5>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={closeDetails}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <strong>ID Đơn hàng:</strong> {selectedOrder.id}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Trạng thái:</strong> {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <strong>Khách hàng:</strong> {selectedOrder.userId || selectedOrder.customerName}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Ngày đặt:</strong> {new Date(selectedOrder.createdDate || selectedOrder.created).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-12">
                                        <strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(selectedOrder.totalAmount || 0)}
                                    </div>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="row mb-3">
                                        <div className="col-md-12">
                                            <strong>Ghi chú:</strong> {selectedOrder.notes}
                                        </div>
                                    </div>
                                )}
                                <hr />
                                <div className="row mb-3">
                                    <div className="col-md-12">
                                        <strong>Chuyển trạng thái:</strong>
                                    </div>
                                </div>
                                <div className="btn-group w-100" role="group">
                                    <button
                                        type="button"
                                        className="btn btn-warning btn-sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Pending')}
                                    >
                                        ⏳ Chờ xử lí
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-info btn-sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Processing')}
                                    >
                                        ⚙️ Chờ vận chuyển
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Shipped')}
                                    >
                                        🚚 Đang vận chuyển
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success btn-sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Delivered')}
                                    >
                                        ✅ Hoàn tất
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'Cancelled')}
                                    >
                                        ❌ Hủy
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeDetails}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
