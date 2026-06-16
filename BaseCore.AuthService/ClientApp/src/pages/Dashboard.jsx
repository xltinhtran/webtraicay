import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, usersApi, categoriesApi, ordersApi, couponsApi, API_STATIC_BASE_URL } from '../services/api';

const emptyStats = {
    products: 0,
    users: 0,
    categories: 0,
    coupons: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    availableProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    activeCoupons: 0,
    expiringCoupons: 0,
    expiredCoupons: 0,
    pendingOrderList: [],
    completedOrderList: [],
    lowStockList: [],
    voucherIssueList: [],
    revenueBars: [],
    topProducts: []
};

const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
};

const normalizeStatus = (status) => {
    const value = (status || 'Pending').toString().trim().toLowerCase();

    if (value === 'completed' || value.includes('hoàn thành') || value.includes('hoan thanh')) return 'Completed';
    if (value === 'cancelled' || value === 'canceled' || value.includes('hủy') || value.includes('huy')) return 'Cancelled';
    if (value === 'processing' || value === 'shipping' || value.includes('vận chuyển') || value.includes('van chuyen')) return 'Shipping';

    return 'Pending';
};

const getStatusMeta = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === 'Completed') return { label: 'Hoàn thành', className: 'bg-success text-white' };
    if (normalized === 'Cancelled') return { label: 'Đã hủy', className: 'bg-danger text-white' };
    if (normalized === 'Shipping') return { label: 'Vận chuyển', className: 'bg-info text-white' };

    return { label: 'Chờ xử lý', className: 'bg-warning text-dark' };
};

const getDaysUntilExpiry = (value) => {
    if (!value) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(value);
    expiryDate.setHours(0, 0, 0, 0);

    return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
};

const getList = (data) => {
    return data?.items || data || [];
};

const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return '/img/avatar.jpg';
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) return imageUrl;
    if (imageUrl.startsWith('/img/products/')) return `${API_STATIC_BASE_URL}${imageUrl}`;
    return imageUrl;
};

const getProductUnit = (product) => product?.unit || product?.Unit || 'sản phẩm';

const getLowStockThreshold = (product) => Number(product?.lowStockThreshold ?? product?.LowStockThreshold ?? 20);

const formatQuantity = (value) => {
    const number = Number(value || 0);
    return Number.isInteger(number)
        ? number.toLocaleString('vi-VN')
        : number.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
};

const buildRevenueBars = (orders) => {
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
        label: `T${index + 1}`,
        value: 0
    }));

    const completedOrders = orders
        .filter((order) => normalizeStatus(order.status) === 'Completed');

    completedOrders.forEach((order) => {
        const date = new Date(order.orderDate || order.createdAt || Date.now());
        if (Number.isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;

        monthlyRevenue[date.getMonth()].value += Number(order.totalAmount || order.total || 0);
    });

    return monthlyRevenue;
};

const buildTopProducts = (products, orderDetails = []) => {
    const productSales = orderDetails.reduce((result, detail) => {
        const productId = detail.productId || detail.ProductId;
        if (!productId) return result;

        const quantity = Number(detail.quantity || detail.Quantity || 0);
        const unitPrice = Number(detail.unitPrice || detail.UnitPrice || 0);

        if (!result[productId]) {
            result[productId] = {
                soldQuantity: 0,
                revenue: 0
            };
        }

        result[productId].soldQuantity += quantity;
        result[productId].revenue += quantity * unitPrice;

        return result;
    }, {});

    return [...products]
        .sort((a, b) => {
            const soldA = productSales[a.id]?.soldQuantity || 0;
            const soldB = productSales[b.id]?.soldQuantity || 0;

            if (soldA !== soldB) return soldB - soldA;

            const featuredA = a.isFeatured ? 1 : 0;
            const featuredB = b.isFeatured ? 1 : 0;
            return featuredB - featuredA || Number(b.price || 0) - Number(a.price || 0);
        })
        .slice(0, 5)
        .map((product) => ({
            id: product.id,
            name: product.name,
            price: Number(product.price || 0),
            stock: Number(product.stock || 0),
            unit: getProductUnit(product),
            lowStockThreshold: getLowStockThreshold(product),
            quality: product.quality || product.Quality || '-',
            imageUrl: product.imageUrl || product.ImageUrl,
            soldQuantity: productSales[product.id]?.soldQuantity || 0,
            revenue: productSales[product.id]?.revenue || 0
        }));
};

const RevenueBarChart = ({ bars }) => {
    const maxValue = Math.max(...bars.map((bar) => Number(bar.value || 0)), 1);

    return (
        <div style={{ minHeight: 280, display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 10,
                    borderLeft: '1px solid #d7dde5',
                    borderBottom: '1px solid #d7dde5',
                    padding: '18px 10px 0',
                    backgroundImage: 'linear-gradient(to top, #edf1f5 1px, transparent 1px)',
                    backgroundSize: '100% 48px'
                }}
            >
                {bars.map((bar) => {
                    const height = Math.max((Number(bar.value || 0) / maxValue) * 190, bar.value > 0 ? 16 : 4);

                    return (
                        <div key={bar.label} style={{ flex: 1, minWidth: 28, textAlign: 'center', position: 'relative' }}>
                            {bar.value > 0 && (
                                <small
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        bottom: height + 8,
                                        transform: 'translateX(-50%)',
                                        whiteSpace: 'nowrap',
                                        color: '#2f4f5b',
                                        fontWeight: 700
                                    }}
                                >
                                    {formatCurrency(bar.value)}
                                </small>
                            )}
                            <div
                                title={`${bar.label}: ${formatCurrency(bar.value)}`}
                                style={{
                                    height,
                                    maxWidth: 34,
                                    margin: '0 auto',
                                    borderRadius: '5px 5px 0 0',
                                    background: bar.value > 0
                                        ? 'linear-gradient(180deg, #7bd000 0%, #16834a 100%)'
                                        : '#dfe5eb',
                                    boxShadow: bar.value > 0 ? '0 8px 18px rgba(22, 131, 74, 0.16)' : 'none'
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '10px 10px 0 11px' }}>
                {bars.map((bar) => (
                    <div key={bar.label} style={{ flex: 1, minWidth: 28, textAlign: 'center', color: '#6c7a89', fontWeight: 700 }}>
                        {bar.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatusCircle = ({ stats }) => {
    const total = Math.max(stats.orders, 1);
    const completedPercent = Math.round((stats.completedOrders / total) * 100);
    const pendingPercent = (stats.pendingOrders / total) * 100;
    const shippingPercent = (stats.shippingOrders / total) * 100;
    const completedSlicePercent = (stats.completedOrders / total) * 100;
    const cancelledPercent = (stats.cancelledOrders / total) * 100;
    const pendingEnd = pendingPercent;
    const shippingEnd = pendingEnd + shippingPercent;
    const completedEnd = shippingEnd + completedSlicePercent;
    const cancelledEnd = completedEnd + cancelledPercent;

    return (
        <div className="d-flex align-items-center justify-content-center mt-3">
            <div
                style={{
                    width: 118,
                    height: 118,
                    borderRadius: '50%',
                    background: stats.orders > 0
                        ? `conic-gradient(
                            #ffc107 0 ${pendingEnd}%,
                            #17a2b8 ${pendingEnd}% ${shippingEnd}%,
                            #16834a ${shippingEnd}% ${completedEnd}%,
                            #dc3545 ${completedEnd}% ${cancelledEnd}%,
                            #e9edf2 ${cancelledEnd}% 100%
                        )`
                        : '#e9edf2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div
                    style={{
                        width: 82,
                        height: 82,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <strong style={{ fontSize: 24, color: '#2f4f5b' }}>{completedPercent}%</strong>
                    <small className="text-muted">hoàn thành</small>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState(emptyStats);
    const [detailModal, setDetailModal] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [productsRes, usersRes, categoriesRes, couponsRes, ordersRes] = await Promise.allSettled([
                    productsApi.getAll({ page: 1, pageSize: 10000 }),
                    usersApi.getAll({ page: 1, pageSize: 1 }),
                    categoriesApi.getAll(),
                    couponsApi.getAll({ page: 1, pageSize: 10000 }),
                    ordersApi.getAll()
                ]);

                const getData = (result, fallback) => {
                    if (result.status === 'fulfilled') {
                        return result.value.data;
                    }

                    console.error('Failed to fetch dashboard data:', result.reason);
                    return fallback;
                };

                const productsData = getData(productsRes, {});
                const usersData = getData(usersRes, {});
                const categoriesData = getData(categoriesRes, []);
                const couponsData = getData(couponsRes, {});
                const ordersData = getData(ordersRes, []);

                const products = getList(productsData);
                const coupons = getList(couponsData);
                const orders = getList(ordersData);

                const pendingOrderList = orders.filter((order) => normalizeStatus(order.status) === 'Pending');
                const shippingOrderList = orders.filter((order) => normalizeStatus(order.status) === 'Shipping');
                const completedOrderList = orders.filter((order) => normalizeStatus(order.status) === 'Completed');
                const cancelledOrderList = orders.filter((order) => normalizeStatus(order.status) === 'Cancelled');
                const lowStockList = products
                    .filter((product) => Number(product.stock || 0) <= getLowStockThreshold(product))
                    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

                const completedOrderDetailResults = await Promise.allSettled(
                    completedOrderList.map((order) => ordersApi.getById(order.id))
                );

                const completedOrderDetails = completedOrderDetailResults.flatMap((result) => {
                    if (result.status !== 'fulfilled') return [];
                    return result.value.data?.details || [];
                });

                const expiringCouponList = coupons.filter((coupon) => {
                    const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                    return coupon.isActive && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                });
                const expiredCouponList = coupons.filter((coupon) => {
                    const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                    return daysLeft !== null && daysLeft < 0;
                });
                const activeCoupons = coupons.filter((coupon) => {
                    const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                    return coupon.isActive && (daysLeft === null || daysLeft >= 0);
                }).length;

                setStats({
                    products: productsData.totalCount || products.length || 0,
                    users: usersData.totalCount || usersData.length || 0,
                    categories: categoriesData.length || 0,
                    coupons: couponsData.totalCount || coupons.length || 0,
                    orders: orders.length || ordersData.totalCount || 0,
                    revenue: completedOrderList.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0),
                    pendingOrders: pendingOrderList.length,
                    shippingOrders: shippingOrderList.length,
                    completedOrders: completedOrderList.length,
                    cancelledOrders: cancelledOrderList.length,
                    availableProducts: products.filter((product) => Number(product.stock || 0) > getLowStockThreshold(product)).length,
                    lowStockProducts: products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= getLowStockThreshold(product)).length,
                    outOfStockProducts: products.filter((product) => Number(product.stock || 0) <= 0).length,
                    activeCoupons,
                    expiringCoupons: expiringCouponList.length,
                    expiredCoupons: expiredCouponList.length,
                    pendingOrderList,
                    completedOrderList,
                    lowStockList,
                    voucherIssueList: [...expiringCouponList, ...expiredCouponList],
                    revenueBars: buildRevenueBars(orders),
                    topProducts: buildTopProducts(products, completedOrderDetails)
                });
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            }
        };

        fetchStats();
    }, []);

    const openDetail = (type) => {
        if (type === 'revenue') {
            setDetailModal({
                type,
                title: 'Đơn hàng đã hoàn thành',
                items: stats.completedOrderList
            });
            return;
        }

        if (type === 'pendingOrders') {
            setDetailModal({
                type,
                title: 'Đơn hàng chờ xử lý',
                items: stats.pendingOrderList
            });
            return;
        }

        if (type === 'lowStock') {
            setDetailModal({
                type,
                title: 'Sản phẩm cần nhập thêm',
                items: stats.lowStockList
            });
            return;
        }

        if (type === 'voucherIssues') {
            setDetailModal({
                type,
                title: 'Voucher cần chú ý',
                items: stats.voucherIssueList
            });
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Dashboard</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="row mb-3">
                        <div className="col-lg col-md-4 col-6 mb-3">
                            <div className="small-box bg-info h-100 mb-0" style={{ minHeight: 145 }}>
                                <div className="inner">
                                    <h3>{stats.products}</h3>
                                    <p>Products</p>
                                </div>
                                <div className="icon">
                                    <i className="fas fa-shopping-cart"></i>
                                </div>
                                <Link to="/products" className="small-box-footer">
                                    More info <i className="fas fa-arrow-circle-right"></i>
                                </Link>
                            </div>
                        </div>

                        <div className="col-lg col-md-4 col-6 mb-3">
                            <div className="small-box bg-success h-100 mb-0" style={{ minHeight: 145 }}>
                                <div className="inner">
                                    <h3>{stats.categories}</h3>
                                    <p>Categories</p>
                                </div>
                                <div className="icon">
                                    <i className="fas fa-tags"></i>
                                </div>
                                <Link to="/categories" className="small-box-footer">
                                    More info <i className="fas fa-arrow-circle-right"></i>
                                </Link>
                            </div>
                        </div>

                        <div className="col-lg col-md-4 col-6 mb-3">
                            <div className="small-box bg-warning h-100 mb-0" style={{ minHeight: 145 }}>
                                <div className="inner">
                                    <h3>{stats.users}</h3>
                                    <p>Users</p>
                                </div>
                                <div className="icon">
                                    <i className="fas fa-users"></i>
                                </div>
                                <Link to="/users" className="small-box-footer">
                                    More info <i className="fas fa-arrow-circle-right"></i>
                                </Link>
                            </div>
                        </div>

                        <div className="col-lg col-md-4 col-6 mb-3">
                            <div className="small-box bg-primary h-100 mb-0" style={{ minHeight: 145 }}>
                                <div className="inner">
                                    <h3>{stats.coupons}</h3>
                                    <p>Coupons</p>
                                </div>
                                <div className="icon">
                                    <i className="fas fa-ticket-alt"></i>
                                </div>
                                <Link to="/coupons" className="small-box-footer">
                                    More info <i className="fas fa-arrow-circle-right"></i>
                                </Link>
                            </div>
                        </div>

                        <div className="col-lg col-md-4 col-6 mb-3">
                            <div className="small-box bg-danger h-100 mb-0" style={{ minHeight: 145 }}>
                                <div className="inner">
                                    <h3>{stats.orders}</h3>
                                    <p>Orders</p>
                                </div>
                                <div className="icon">
                                    <i className="fas fa-file-invoice-dollar"></i>
                                </div>
                                <Link to="/orders" className="small-box-footer">
                                    More info <i className="fas fa-arrow-circle-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-3">
                        <div className="col-lg-3 col-md-6 mb-3">
                            <button type="button" className="card h-100 w-100 text-left border-0 p-0" onClick={() => openDetail('revenue')}>
                                <div className="card-body d-flex justify-content-between align-items-center" style={{ minHeight: 118 }}>
                                    <div>
                                        <div className="text-muted font-weight-bold">Doanh thu</div>
                                        <h4
                                            className="mb-0 text-success"
                                            style={{
                                                fontFamily: 'Arial, Helvetica, sans-serif',
                                                fontVariantNumeric: 'lining-nums tabular-nums',
                                                fontFeatureSettings: '"lnum" 1, "tnum" 1',
                                                lineHeight: 1.15,
                                                letterSpacing: 0,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {formatCurrency(stats.revenue)}
                                        </h4>
                                        <small>Từ đơn hoàn thành</small>
                                    </div>
                                    <i className="fas fa-coins fa-2x text-success"></i>
                                </div>
                            </button>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <button type="button" className="card h-100 w-100 text-left border-0 p-0" onClick={() => openDetail('pendingOrders')}>
                                <div className="card-body d-flex justify-content-between align-items-center" style={{ minHeight: 118 }}>
                                    <div>
                                        <div className="text-muted font-weight-bold">Đơn chờ xử lý</div>
                                        <h4 className="mb-0 text-warning">{stats.pendingOrders}</h4>
                                        <small>Bấm để xem chi tiết</small>
                                    </div>
                                    <i className="fas fa-clock fa-2x text-warning"></i>
                                </div>
                            </button>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <button type="button" className="card h-100 w-100 text-left border-0 p-0" onClick={() => openDetail('lowStock')}>
                                <div className="card-body d-flex justify-content-between align-items-center" style={{ minHeight: 118 }}>
                                    <div>
                                        <div className="text-muted font-weight-bold">Cần nhập thêm</div>
                                        <h4 className="mb-0 text-danger">{stats.lowStockProducts + stats.outOfStockProducts}</h4>
                                        <small>Sản phẩm tồn kho thấp</small>
                                    </div>
                                    <i className="fas fa-exclamation-triangle fa-2x text-danger"></i>
                                </div>
                            </button>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <button type="button" className="card h-100 w-100 text-left border-0 p-0" onClick={() => openDetail('voucherIssues')}>
                                <div className="card-body d-flex justify-content-between align-items-center" style={{ minHeight: 118 }}>
                                    <div>
                                        <div className="text-muted font-weight-bold">Voucher cần chú ý</div>
                                        <h4 className="mb-0 text-primary">{stats.expiringCoupons + stats.expiredCoupons}</h4>
                                        <small>{stats.expiringCoupons} sắp hết, {stats.expiredCoupons} hết hạn</small>
                                    </div>
                                    <i className="fas fa-ticket-alt fa-2x text-primary"></i>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="row align-items-stretch">
                        <div className="col-lg-8 mb-3">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h3 className="card-title">Doanh thu theo tháng</h3>
                                </div>
                                <div className="card-body">
                                    <RevenueBarChart bars={stats.revenueBars} />
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4 mb-3">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h3 className="card-title">Trạng thái đơn hàng</h3>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Chờ xử lý</span>
                                        <strong className="text-warning">{stats.pendingOrders}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Vận chuyển</span>
                                        <strong className="text-info">{stats.shippingOrders}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Hoàn thành</span>
                                        <strong className="text-success">{stats.completedOrders}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Đã hủy</span>
                                        <strong className="text-danger">{stats.cancelledOrders}</strong>
                                    </div>
                                    <StatusCircle stats={stats} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row align-items-stretch">
                        <div className="col-12 mb-3">
                            <div className="card h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title mb-0">Sản phẩm bán chạy</h3>
                                    <Link to="/products" className="btn btn-sm btn-outline-primary">
                                        Xem sản phẩm
                                    </Link>
                                </div>
                                <div className="card-body p-0">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 60 }}>#</th>
                                                <th style={{ width: 88 }}>Ảnh</th>
                                                <th>Sản phẩm</th>
                                                <th>Giá bán</th>
                                                <th>Đã bán</th>
                                                <th>Doanh thu</th>
                                                <th>Tồn kho</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topProducts.length > 0 ? stats.topProducts.map((product, index) => (
                                                <tr key={product.id}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <img
                                                            src={getProductImageUrl(product.imageUrl)}
                                                            alt={product.name}
                                                            style={{
                                                                width: 58,
                                                                height: 44,
                                                                objectFit: 'cover',
                                                                borderRadius: 6,
                                                                border: '1px solid #dee2e6',
                                                                backgroundColor: '#f8f9fa'
                                                            }}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/img/avatar.jpg';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <strong>{product.name}</strong>
                                                        <small className="d-block text-muted">{product.quality}</small>
                                                    </td>
                                                    <td>
                                                        {formatCurrency(product.price)}
                                                        <span className="text-muted"> / {product.unit}</span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-success text-white p-2">
                                                            {formatQuantity(product.soldQuantity)} {product.unit}
                                                        </span>
                                                    </td>
                                                    <td>{formatCurrency(product.revenue)}</td>
                                                    <td>
                                                        <span className={`badge p-2 ${product.stock <= product.lowStockThreshold ? 'bg-warning text-dark' : 'bg-light text-dark'}`}>
                                                            {formatQuantity(product.stock)} {product.unit}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted py-3">Không có dữ liệu</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {detailModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg" style={{ maxWidth: 900, width: 'calc(100% - 24px)' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">{detailModal.title}</h4>
                                <button type="button" className="close" onClick={() => setDetailModal(null)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body table-responsive p-0">
                                {detailModal.type === 'lowStock' ? (
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Giá bán</th>
                                                <th>Tồn kho</th>
                                                <th>Chất lượng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.items.length > 0 ? detailModal.items.map((product) => (
                                                <tr key={product.id}>
                                                    <td>{product.id}</td>
                                                    <td>{product.name}</td>
                                                    <td>
                                                        {formatCurrency(product.price)}
                                                        <span className="text-muted"> / {getProductUnit(product)}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${Number(product.stock || 0) <= 0 ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                                                            {formatQuantity(product.stock)} {getProductUnit(product)}
                                                        </span>
                                                        <small className="d-block text-muted">
                                                            Ngưỡng: {formatQuantity(getLowStockThreshold(product))} {getProductUnit(product)}
                                                        </small>
                                                    </td>
                                                    <td>{product.quality || product.Quality || '-'}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-3">Không có dữ liệu</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                ) : detailModal.type === 'voucherIssues' ? (
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Mã voucher</th>
                                                <th>Ưu đãi</th>
                                                <th>Ngày hết hạn</th>
                                                <th>Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.items.length > 0 ? detailModal.items.map((coupon) => {
                                                const daysLeft = getDaysUntilExpiry(coupon.expiryDate);

                                                return (
                                                    <tr key={coupon.id}>
                                                        <td>{coupon.id}</td>
                                                        <td>{coupon.code}</td>
                                                        <td>{coupon.discountPercent}%</td>
                                                        <td>{formatDate(coupon.expiryDate)}</td>
                                                        <td>{daysLeft < 0 ? 'Đã hết hạn' : `Còn ${daysLeft} ngày`}</td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-3">Không có dữ liệu</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Khách hàng</th>
                                                <th>Tổng tiền</th>
                                                <th>Ngày đặt</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailModal.items.length > 0 ? detailModal.items.map((order) => {
                                                const statusMeta = getStatusMeta(order.status);

                                                return (
                                                    <tr key={order.id}>
                                                        <td>{order.id}</td>
                                                        <td>{order.customerName || order.userName || order.name || '-'}</td>
                                                        <td>{formatCurrency(order.totalAmount || order.total)}</td>
                                                        <td>{formatDate(order.orderDate || order.createdAt)}</td>
                                                        <td>
                                                            <span className={`badge ${statusMeta.className}`}>
                                                                {statusMeta.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-3">Không có dữ liệu</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDetailModal(null)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
