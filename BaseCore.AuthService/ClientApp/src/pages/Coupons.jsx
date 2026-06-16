import React, { useCallback, useEffect, useState } from 'react';
import { couponsApi, usersApi } from '../services/api';

const emptyForm = {
    code: '',
    discountPercent: 10,
    expiryDate: '',
    isActive: true,
    couponType: 'Public',
    userId: '',
    minOrderAmount: '',
    usageLimit: '',
    usedCount: 0,
};

const toDateInputValue = (value) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
};

const getDaysUntilExpiry = (value) => {
    if (!value) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(value);
    expiryDate.setHours(0, 0, 0, 0);

    return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
};

const getCouponStatus = (coupon) => {
    const daysLeft = getDaysUntilExpiry(coupon.expiryDate);

    if (daysLeft !== null && daysLeft < 0) {
        return {
            label: 'Hết hạn',
            className: 'bg-secondary text-white',
            note: 'Không còn áp dụng'
        };
    }

    if (!coupon.isActive) {
        return {
            label: 'Đã khóa',
            className: 'bg-danger text-white',
            note: 'Admin đang tắt mã'
        };
    }

    if (daysLeft !== null && daysLeft <= 7) {
        return {
            label: 'Sắp hết hạn',
            className: 'bg-warning text-dark',
            note: `Còn ${daysLeft} ngày`
        };
    }

    return {
        label: 'Đang dùng',
        className: 'bg-success text-white',
        note: 'Có thể áp dụng'
    };
};

const getCouponTypeLabel = (type) => {
    switch (type) {
        case 'Personal':
            return 'Riêng cho khách';
        case 'Loyalty':
            return 'Khách thân thiết';
        default:
            return 'Công khai';
    }
};

const formatCurrency = (value) => {
    if (!value) return '-';
    return Number(value).toLocaleString('vi-VN') + ' đ';
};

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [couponType, setCouponType] = useState('');
    const [minDiscount, setMinDiscount] = useState('');
    const [maxDiscount, setMaxDiscount] = useState('');
    const [expiryFrom, setExpiryFrom] = useState('');
    const [expiryTo, setExpiryTo] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [users, setUsers] = useState([]);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const response = await couponsApi.getAll({
                keyword: search || undefined,
                status: status || undefined,
                couponType: couponType || undefined,
                minDiscount: minDiscount || undefined,
                maxDiscount: maxDiscount || undefined,
                expiryFrom: expiryFrom || undefined,
                expiryTo: expiryTo || undefined,
                page,
                pageSize,
            });

            const data = response.data;
            setCoupons(data.items || data || []);
            setTotalCount(data.totalCount || (data.items || data || []).length || 0);
            setTotalPages(data.totalPages || Math.ceil((data.totalCount || data.length || 0) / pageSize) || 1);
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
            alert(error.response?.data?.message || 'Không tải được danh sách voucher');
        } finally {
            setLoading(false);
        }
    }, [search, status, couponType, minDiscount, maxDiscount, expiryFrom, expiryTo, page, pageSize]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await usersApi.getAll({ page: 1, pageSize: 1000 });
                const data = response.data;
                setUsers(data.data || data.items || data || []);
            } catch (error) {
                console.error('Failed to fetch users for coupons:', error);
                setUsers([]);
            }
        };

        fetchUsers();
    }, []);

    const activeCount = coupons.filter((coupon) => getCouponStatus(coupon).label === 'Đang dùng').length;
    const expiringCount = coupons.filter((coupon) => getCouponStatus(coupon).label === 'Sắp hết hạn').length;
    const expiredCount = coupons.filter((coupon) => getCouponStatus(coupon).label === 'Hết hạn').length;
    const privateCount = coupons.filter((coupon) => coupon.couponType === 'Personal' || coupon.couponType === 'Loyalty').length;
    const bestCoupon = coupons.reduce((best, coupon) => {
        if (!best) return coupon;
        return coupon.discountPercent > best.discountPercent ? coupon : best;
    }, null);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCoupons();
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setCouponType('');
        setMinDiscount('');
        setMaxDiscount('');
        setExpiryFrom('');
        setExpiryTo('');
        setPage(1);
    };

    const handleAdd = () => {
        setEditingCoupon(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code || '',
            discountPercent: coupon.discountPercent || 1,
            expiryDate: toDateInputValue(coupon.expiryDate),
            isActive: Boolean(coupon.isActive),
            couponType: coupon.couponType || 'Public',
            userId: coupon.userId || '',
            minOrderAmount: coupon.minOrderAmount || '',
            usageLimit: coupon.usageLimit || '',
            usedCount: coupon.usedCount || 0,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này không?')) {
            return;
        }

        try {
            await couponsApi.delete(id);
            fetchCoupons();
        } catch (error) {
            console.error('Failed to delete coupon:', error);
            alert(error.response?.data?.message || 'Xóa voucher thất bại');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            code: formData.code.trim().toUpperCase(),
            discountPercent: Number(formData.discountPercent),
            expiryDate: formData.expiryDate,
            isActive: Boolean(formData.isActive),
            couponType: formData.couponType || 'Public',
            userId: formData.couponType === 'Public' ? null : formData.userId,
            minOrderAmount: formData.minOrderAmount === '' ? null : Number(formData.minOrderAmount),
            usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit),
            usedCount: Number(formData.usedCount || 0),
        };

        try {
            if (editingCoupon) {
                await couponsApi.update(editingCoupon.id, payload);
            } else {
                await couponsApi.create(payload);
            }

            setShowModal(false);
            fetchCoupons();
        } catch (error) {
            console.error('Failed to save coupon:', error);
            alert(error.response?.data?.message || 'Lưu voucher thất bại');
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Coupons</h1>
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
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Tổng voucher</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{totalCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{privateCount} voucher riêng</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#eef6ff', color: '#0b78a6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-ticket-alt"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Đang dùng</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{activeCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Còn hiệu lực và active</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#e8f7ee', color: '#16834a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-check-circle"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Cần chú ý</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{expiringCount + expiredCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{expiringCount} sắp hết, {expiredCount} hết hạn</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#fff4db', color: '#b77900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-clock"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Ưu đãi mạnh nhất</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
                                        {bestCoupon ? `${bestCoupon.discountPercent}%` : '-'}
                                    </div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {bestCoupon ? bestCoupon.code : 'Chưa có voucher'}
                                    </div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#ffecec', color: '#c92a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-percent"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-lg-10">
                                    <form onSubmit={handleSearch} className="form-inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tên voucher..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '1 1 190px', minWidth: 160 }}
                                        />

                                        <select
                                            className="form-control"
                                            value={status}
                                            onChange={(e) => {
                                                setStatus(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 150px', minWidth: 135 }}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="active">Đang dùng</option>
                                            <option value="inactive">Đã khóa</option>
                                            <option value="expired">Hết hạn</option>
                                        </select>

                                        <select
                                            className="form-control"
                                            value={couponType}
                                            onChange={(e) => {
                                                setCouponType(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 170px', minWidth: 150 }}
                                        >
                                            <option value="">Tất cả loại</option>
                                            <option value="Public">Công khai</option>
                                            <option value="Personal">Riêng cho khách</option>
                                            <option value="Loyalty">Khách thân thiết</option>
                                        </select>

                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="form-control"
                                            placeholder="Giảm từ %"
                                            value={minDiscount}
                                            onChange={(e) => {
                                                setMinDiscount(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 110px', minWidth: 100 }}
                                        />

                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="form-control"
                                            placeholder="Đến %"
                                            value={maxDiscount}
                                            onChange={(e) => {
                                                setMaxDiscount(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 100px', minWidth: 90 }}
                                        />

                                        <input
                                            type="date"
                                            className="form-control"
                                            value={expiryFrom}
                                            onChange={(e) => {
                                                setExpiryFrom(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 145px', minWidth: 135 }}
                                        />

                                        <input
                                            type="date"
                                            className="form-control"
                                            value={expiryTo}
                                            onChange={(e) => {
                                                setExpiryTo(e.target.value);
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
                                <div className="col-lg-2 text-right mt-2 mt-lg-0">
                                    <button className="btn btn-primary" onClick={handleAdd}>
                                        <i className="fas fa-plus"></i> Thêm Coupon
                                    </button>
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
                                            <th>Tên voucher</th>
                                            <th>Loại</th>
                                            <th>Ưu đãi</th>
                                            <th>Ngày hết hạn</th>
                                            <th>Trạng thái</th>
                                            <th>Điều kiện</th>
                                            <th>Ghi chú</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coupons.length > 0 ? (
                                            coupons.map((coupon) => {
                                                const statusMeta = getCouponStatus(coupon);
                                                const daysLeft = getDaysUntilExpiry(coupon.expiryDate);

                                                return (
                                                    <tr key={coupon.id}>
                                                        <td>{coupon.id}</td>
                                                        <td>
                                                            <span className="badge bg-info text-white p-2" style={{ letterSpacing: 0.5 }}>
                                                                {coupon.code}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge p-2 ${(coupon.couponType || 'Public') === 'Public' ? 'bg-light text-dark' : 'bg-primary text-white'}`}>
                                                                {getCouponTypeLabel(coupon.couponType)}
                                                            </span>
                                                            {coupon.userId && (
                                                                <small className="d-block text-muted mt-1">
                                                                    {users.find((user) => user.id === coupon.userId)?.name || coupon.userId}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <strong style={{ color: '#c92a2a', fontSize: 18 }}>
                                                                {coupon.discountPercent}%
                                                            </strong>
                                                        </td>
                                                        <td>{formatDate(coupon.expiryDate)}</td>
                                                        <td>
                                                            <span className={`badge p-2 ${statusMeta.className}`}>
                                                                {statusMeta.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <small className="d-block">
                                                                Đơn từ: {formatCurrency(coupon.minOrderAmount)}
                                                            </small>
                                                            <small className="d-block text-muted">
                                                                Lượt dùng: {coupon.usedCount || 0}{coupon.usageLimit ? `/${coupon.usageLimit}` : '/không giới hạn'}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            {daysLeft !== null && daysLeft >= 0
                                                                ? `Còn ${daysLeft} ngày`
                                                                : statusMeta.note}
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-info mr-1" onClick={() => handleEdit(coupon)}>
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(coupon.id)}>
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4">Không có voucher phù hợp.</td>
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
                                        <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" style={{ margin: '24px auto', maxWidth: 640, width: 'calc(100% - 24px)' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    {editingCoupon ? 'Chỉnh sửa Coupon' : 'Thêm Coupon'}
                                </h4>
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Tên voucher</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phần trăm giảm giá</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            max="100"
                                            value={formData.discountPercent}
                                            onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Ngày hết hạn</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Loại voucher</label>
                                        <select
                                            className="form-control"
                                            value={formData.couponType}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                couponType: e.target.value,
                                                userId: e.target.value === 'Public' ? '' : formData.userId
                                            })}
                                        >
                                            <option value="Public">Công khai - ai cũng dùng được</option>
                                            <option value="Personal">Riêng cho khách được chọn</option>
                                            <option value="Loyalty">Khách thân thiết / mua nhiều</option>
                                        </select>
                                    </div>

                                    {formData.couponType !== 'Public' && (
                                        <div className="form-group">
                                            <label>Khách nhận voucher</label>
                                            <select
                                                className="form-control"
                                                value={formData.userId}
                                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Chọn khách hàng --</option>
                                                {users
                                                    .filter((user) => user.userType !== 1)
                                                    .map((user) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.name} - {user.email || user.username}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Đơn tối thiểu (VNĐ)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    value={formData.minOrderAmount}
                                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                                    placeholder="Bỏ trống nếu không giới hạn"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Giới hạn lượt dùng</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="1"
                                                    value={formData.usageLimit}
                                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                                    placeholder="Bỏ trống nếu không giới hạn"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group mt-3">
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="couponActiveSwitch"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label className="custom-control-label font-weight-bold" htmlFor="couponActiveSwitch">
                                                Đang kích hoạt
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">Lưu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Coupons;
