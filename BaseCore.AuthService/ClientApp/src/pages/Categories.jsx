import React, { useState, useEffect, useCallback } from 'react';
import { categoriesApi, productsApi, API_STATIC_BASE_URL } from '../services/api';

const getCategoryImageUrl = (category) => {
    const name = (category?.name || '').toLowerCase();

    if (name.includes('rau')) return '/img/carot.jfif';
    if (name.includes('trái') || name.includes('trai') || name.includes('fruit')) return '/img/banner-fruits.jpg';
    if (name.includes('thịt') || name.includes('thit')) return '/img/thitbo.jfif';
    if (name.includes('bánh') || name.includes('banh')) return '/img/banhmi.jpg';

    return '/img/fruite-item-5.jpg';
};

const getProductCount = (category) => {
    return category.count ?? category.Count ?? category.productCount ?? category.ProductCount ?? 0;
};

const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) return '/img/avatar.jpg';
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return imageUrl;
    }

    if (imageUrl.startsWith('/img/products/')) {
        return `${API_STATIC_BASE_URL}${imageUrl}`;
    }

    return imageUrl;
};

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await categoriesApi.getAll({
                keyword: search || undefined
            });
            setCategories(response.data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh mục:', error);
            alert('Không tải được danh sách danh mục');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const totalPages = Math.ceil(categories.length / pageSize) || 1;
    const displayedCategories = categories.slice((page - 1) * pageSize, page * pageSize);
    const totalProducts = categories.reduce((total, category) => total + getProductCount(category), 0);
    const largestCategory = categories.reduce((largest, category) => {
        return getProductCount(category) > getProductCount(largest) ? category : largest;
    }, categories[0] || null);
    const averageProducts = categories.length > 0 ? Math.round(totalProducts / categories.length) : 0;
    const emptyCategories = categories.filter(category => getProductCount(category) === 0).length;

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCategories();
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || ''
        });
        setShowModal(true);
    };

    const handleViewProducts = async (category) => {
        setSelectedCategory(category);
        setCategoryProducts([]);
        setShowProductsModal(true);
        setLoadingProducts(true);

        try {
            const response = await productsApi.getAll({
                categoryId: category.id,
                page: 1,
                pageSize: 100
            });

            const data = response.data;
            setCategoryProducts(data.items || data || []);
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm theo danh mục:', error);
            alert('Không tải được sản phẩm của danh mục này');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) {
            try {
                await categoriesApi.delete(id);
                fetchCategories();
            } catch (error) {
                console.error('Xóa danh mục thất bại:', error);
                alert('Xóa danh mục thất bại');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoriesApi.update(editingCategory.id, formData);
            } else {
                await categoriesApi.create(formData);
            }

            setShowModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Lưu danh mục thất bại:', error);
            alert('Lưu danh mục thất bại');
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Danh Mục</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="row mb-3">
                        <div className="col-lg-4 col-md-6 mb-3">
                            <div
                                style={{
                                    minHeight: 126,
                                    padding: '18px 20px',
                                    borderRadius: 8,
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e3e8ef',
                                    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>
                                        Tổng danh mục
                                    </div>
                                    <div style={{ color: '#2f4f5b', fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
                                        {categories.length}
                                    </div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>
                                        {emptyCategories} danh mục chưa có sản phẩm
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: 8,
                                        backgroundColor: '#e8f7ee',
                                        color: '#16834a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 25
                                    }}
                                >
                                    <i className="fas fa-tags"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4 col-md-6 mb-3">
                            <div
                                style={{
                                    minHeight: 126,
                                    padding: '18px 20px',
                                    borderRadius: 8,
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e3e8ef',
                                    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>
                                        Sản phẩm đã phân loại
                                    </div>
                                    <div style={{ color: '#2f4f5b', fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
                                        {totalProducts}
                                    </div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>
                                        Trung bình {averageProducts} sản phẩm / danh mục
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: 8,
                                        backgroundColor: '#e7f5ff',
                                        color: '#0b78a6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 25
                                    }}
                                >
                                    <i className="fas fa-box-open"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4 col-md-12 mb-3">
                            <div
                                style={{
                                    minHeight: 126,
                                    padding: '18px 20px',
                                    borderRadius: 8,
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e3e8ef',
                                    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>
                                        Danh mục nổi bật
                                    </div>
                                    <div
                                        style={{
                                            color: '#2f4f5b',
                                            fontSize: 26,
                                            fontWeight: 800,
                                            lineHeight: 1.15,
                                            maxWidth: 210,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {largestCategory ? largestCategory.name : '-'}
                                    </div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>
                                        {largestCategory ? `${getProductCount(largestCategory)} sản phẩm trong danh mục này` : 'Chưa có dữ liệu'}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: 8,
                                        backgroundColor: '#fff4db',
                                        color: '#b77900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 25
                                    }}
                                >
                                    <i className="fas fa-chart-bar"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-md-7">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <div className="input-group" style={{ width: '100%', maxWidth: 520 }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tìm theo tên hoặc mô tả danh mục..."
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
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
                                <div className="col-md-5 text-right mt-2 mt-md-0">
                                    <button className="btn btn-primary" onClick={handleAdd}>
                                        <i className="fas fa-plus"></i> Thêm Danh Mục
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
                                            <th>Ảnh</th>
                                            <th>Tên danh mục</th>
                                            <th>Số sản phẩm</th>
                                            <th>Mô tả</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedCategories.length > 0 ? (
                                            displayedCategories.map((category) => (
                                                <tr key={category.id}>
                                                    <td>{category.id}</td>
                                                    <td>
                                                        <img
                                                            src={getCategoryImageUrl(category)}
                                                            alt={category.name}
                                                            style={{
                                                                width: 72,
                                                                height: 52,
                                                                objectFit: 'cover',
                                                                borderRadius: 6,
                                                                border: '1px solid #dee2e6',
                                                                backgroundColor: '#f8f9fa'
                                                            }}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/img/fruite-item-5.jpg';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <strong>{category.name}</strong>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-success text-white p-2">
                                                            {getProductCount(category)} sản phẩm
                                                        </span>
                                                    </td>
                                                    <td style={{ maxWidth: 520, whiteSpace: 'normal' }}>
                                                        {category.description || 'Chưa có mô tả'}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success mr-1"
                                                            onClick={() => handleViewProducts(category)}
                                                            disabled={getProductCount(category) === 0}
                                                            title="Xem sản phẩm thuộc danh mục"
                                                        >
                                                            <i className="fas fa-list"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-info mr-1" onClick={() => handleEdit(category)}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(category.id)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4">
                                                    Không tìm thấy danh mục phù hợp.
                                                </td>
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

            {showProductsModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div
                        className="modal-dialog modal-lg"
                        style={{
                            margin: '20px auto',
                            maxWidth: 880,
                            width: 'calc(100% - 24px)'
                        }}
                    >
                        <div
                            className="modal-content"
                            style={{
                                maxHeight: 'calc(100vh - 40px)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            <div className="modal-header" style={{ flexShrink: 0 }}>
                                <div>
                                    <h4 className="modal-title mb-1">
                                        Sản phẩm trong danh mục: {selectedCategory?.name || ''}
                                    </h4>
                                    <span className="text-muted">
                                        {categoryProducts.length} sản phẩm đang thuộc danh mục này
                                    </span>
                                </div>
                                <button type="button" className="close" onClick={() => setShowProductsModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>

                            <div className="modal-body table-responsive p-0" style={{ overflowY: 'auto' }}>
                                {loadingProducts ? (
                                    <div className="text-center p-4">Đang tải sản phẩm...</div>
                                ) : categoryProducts.length > 0 ? (
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 80 }}>Ảnh</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Giá bán</th>
                                                <th>Tồn kho</th>
                                                <th>Chất lượng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryProducts.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <img
                                                            src={getProductImageUrl(product.imageUrl || product.ImageUrl)}
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
                                                        <div className="text-muted" style={{ fontSize: 13 }}>
                                                            ID: {product.id}
                                                        </div>
                                                    </td>
                                                    <td>{Number(product.price || 0).toLocaleString('vi-VN')} đ</td>
                                                    <td>{product.stock}</td>
                                                    <td>
                                                        <span className="badge bg-success text-white p-2">
                                                            {product.quality || product.Quality || 'Chưa phân loại'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center p-4">
                                        Danh mục này chưa có sản phẩm nào.
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer" style={{ flexShrink: 0 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowProductsModal(false)}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" style={{ margin: '24px auto', maxWidth: 560, width: 'calc(100% - 24px)' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">{editingCategory ? 'Chỉnh sửa Danh Mục' : 'Thêm Danh Mục'}</h4>
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Tên danh mục</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea
                                            className="form-control"
                                            rows="4"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
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

export default Categories;
