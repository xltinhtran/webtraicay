// src/pages/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);

    // --- STATE CHO TÌM KIẾM VÀ PHÂN TRANG ---
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const statusMap = {
        "Pending": { label: "Chờ xử lý", color: "bg-secondary" },
        "Processing": { label: "Chờ vận chuyển", color: "bg-info" },
        "Shipping": { label: "Đang vận chuyển", color: "bg-warning" },
        "Completed": { label: "Hoàn thành", color: "bg-success" },
        "Cancelled": { label: "Đã hủy", color: "bg-danger" }
    };

    // 🌟 1. GỌI API C# CÓ KÈM TỪ KHÓA TÌM KIẾM
    const fetchOrders = useCallback(async () => {
        try {
            const res = await api.get(`/orders/all?keyword=${searchTerm}`);
            setOrders(res.data || []);
        } catch (err) {
            console.log("Lỗi tải đơn hàng:", err);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const updateStatus = async (id, newStatus) => {
        const currentOrder = orders.find(order => order.id === id);
        if (currentOrder?.status === "Completed" || currentOrder?.status === "Cancelled") {
            alert("Đơn hàng này đã kết thúc, không thể thay đổi trạng thái!");
            return;
        }
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            alert("Đã chuyển trạng thái đơn hàng! 🚚");
            fetchOrders();
        } catch (err) {
            alert("Không cập nhật được!");
        }
    };

    const deleteOrder = async (id) => {
        if (window.confirm("Ní có chắc muốn xóa vĩnh viễn đơn hàng này không?")) {
            try {
                await api.delete(`/orders/${id}`);
                alert("Xóa thành công!");
                fetchOrders();
            } catch (err) {
                alert("Không xóa được, đơn hàng đang có dữ liệu liên quan!");
            }
        }
    };

    // 🌟 2. KHI BẤM NÚT TÌM KIẾM PHẢI GỌI LẠI API
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchOrders(); // Gọi API ngay lập tức với từ khóa mới
    };

    // 🌟 3. PHÂN TRANG BẰNG REACT (Dựa trên mảng C# đã lọc sẵn)
    const totalPages = Math.ceil(orders.length / pageSize) || 1;
    const displayedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

    return (
        <>
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

                        {/* --- CARD HEADER: THANH TÌM KIẾM --- */}
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-6">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <div className="input-group" style={{ width: '100%' }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tìm mã hóa đơn, tên khách hàng..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setPage(1);
                                                }}
                                            />
                                            <div className="input-group-append">
                                                <button type="submit" className="btn btn-default">
                                                    <i className="fas fa-search"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="card-body table-responsive p-0">
                            <table className="table table-hover text-nowrap">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Khách hàng</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái hiện tại</th>
                                        <th>Xử lý chuyển trạng thái</th>
                                        <th>Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedOrders.length > 0 ? (
                                        displayedOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td>{order.id}</td>
                                                <td>
                                                    <div className="font-weight-bold">{order.customerName || order.userId}</div>
                                                    <small className="text-muted">{order.userId}</small>
                                                </td>
                                                <td>${order.totalAmount?.toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge ${statusMap[order.status]?.color} p-2 text-white`}>
                                                        {statusMap[order.status]?.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-control form-control-sm"
                                                        style={{ width: '160px' }}
                                                        value={order.status}
                                                        onChange={(e) => updateStatus(order.id, e.target.value)}
                                                        disabled={order.status === "Completed" || order.status === "Cancelled"}
                                                    >
                                                        <option value="Pending">Chờ xử lý</option>
                                                        <option value="Processing">Chờ vận chuyển</option>
                                                        <option value="Shipping">Đang vận chuyển</option>
                                                        <option value="Completed">Hoàn thành</option>
                                                        <option value="Cancelled">Hủy đơn</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(order.id)} title="Xóa đơn hàng">
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="text-center py-4">Chưa có đơn hàng nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* --- CARD FOOTER: PHÂN TRANG --- */}
                        <div className="card-footer">
                            <nav>
                                <ul className="pagination pagination-sm m-0 float-right">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => p - 1)}>Previous</button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => p + 1)}>Next</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
};

export default Orders;