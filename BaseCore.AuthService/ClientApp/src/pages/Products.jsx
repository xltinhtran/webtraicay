import React, { useState, useEffect, useCallback } from 'react';
import { productsApi, categoriesApi } from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // --- CẤU HÌNH STATE CHO FORM DỮ LIỆU ---
    // Đã thêm isFeatured để đồng bộ với formData
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        stock: 0,
        imageUrl: '',
        description: '',
        categoryId: 0,
        quality: 'Organic',
        isFeatured: false,
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await productsApi.getAll({
                keyword: search,
                page,
                pageSize,
            });

            const data = response.data;
            setProducts(data.items || data || []);
            setTotalPages(Math.ceil((data.totalCount || data.length || 0) / pageSize));
        } catch (error) {
            console.error('Lỗi khi tải danh sách sản phẩm:', error);
        }
        setLoading(false);
    }, [search, page, pageSize]);

    const fetchCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh mục:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            price: 0,
            stock: 0,
            imageUrl: '',
            description: '',
            categoryId: categories[0]?.id || 0,
            quality: 'Organic',
            isFeatured: false,
        });
        setShowModal(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            price: product.price || 0,
            stock: product.stock || 0,
            imageUrl: product.imageUrl || '',
            description: product.description || '',
            categoryId: product.categoryId || 0,
            quality: product.quality || product.Quality || 'Organic',
            isFeatured: product.isFeatured || false,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
            try {
                await productsApi.delete(id);
                fetchProducts();
            } catch (error) {
                console.error('Xóa sản phẩm thất bại:', error);
                alert('Xóa sản phẩm thất bại');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingProduct) {
                await productsApi.update(editingProduct.id, formData);
            } else {
                await productsApi.create(formData);
            }

            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Lưu sản phẩm thất bại:', error);
            alert('Lưu sản phẩm thất bại');
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Sản Phẩm</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-6">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tìm kiếm..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <div className="input-group-append">
                                                <button type="submit" className="btn btn-default">
                                                    <i className="fas fa-search"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="col-md-6 text-right">
                                    <button className="btn btn-primary" onClick={handleAdd}>
                                        <i className="fas fa-plus"></i> Thêm Sản Phẩm
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
                                            <th>Tên sản phẩm</th>
                                            <th>Giá bán (VNĐ)</th>
                                            <th>Tồn kho</th>
                                            <th>Danh mục</th>
                                            <th>Chất lượng</th>
                                            <th>Nổi bật</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td>{product.id}</td>
                                                <td>{product.name}</td>
                                                <td>{Number(product.price || 0).toLocaleString('vi-VN')} ₫</td>
                                                <td>{product.stock}</td>
                                                <td>{categories.find(c => c.id === product.categoryId)?.name || '-'}</td>
                                                <td>
                                                    <span
                                                        className={`badge p-2 ${(product.quality || product.Quality) === 'Organic' ? 'bg-success text-white' :
                                                                (product.quality || product.Quality) === 'Sales' ? 'bg-danger text-white' :
                                                                    (product.quality || product.Quality) === 'Fresh' ? 'bg-info text-dark' :
                                                                        (product.quality || product.Quality) === 'Discount' ? 'bg-warning text-dark' :
                                                                            (product.quality || product.Quality) === 'Expired' ? 'bg-dark text-white' :
                                                                                'bg-secondary text-white'
                                                            }`}
                                                        style={{ fontSize: '0.9em' }}
                                                    >
                                                        {product.quality || product.Quality || 'Chưa phân loại'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {product.isFeatured ? (
                                                        <i className="fas fa-star text-warning" title="Nổi bật"></i>
                                                    ) : (
                                                        <i className="far fa-star text-muted" title="Không nổi bật"></i>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-info mr-1" onClick={() => handleEdit(product)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="card-footer">
                            <nav>
                                <ul className="pagination pagination-sm m-0 float-right">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => p - 1)}>Trước</button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => p + 1)}>Sau</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">
                                    {editingProduct ? 'Chỉnh sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
                                </h4>
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Tên sản phẩm</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Giá bán (VNĐ)</label>
                                        <input
                                            type="number"
                                            step="1000"
                                            className="form-control"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Số lượng tồn</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Danh mục</label>
                                        <select
                                            className="form-control"
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) || 0 })}
                                            required
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Đặc tính (Quality)</label>
                                        <select
                                            className="form-control"
                                            value={formData.quality}
                                            onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                                        >
                                            <option value="Organic">Organic (Hữu cơ)</option>
                                            <option value="Fresh">Fresh (Tươi mới)</option>
                                            <option value="Sales">Sales (Bán chạy)</option>
                                            <option value="Discount">Discount (Giảm giá)</option>
                                            <option value="Expired">Expired (Hết hạn)</option>
                                            <option value="Premium">Premium (Cao cấp)</option>
                                        </select>
                                    </div>

                                    <div className="form-group mt-3">
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="featuredSwitch"
                                                checked={formData.isFeatured}
                                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            />
                                            <label className="custom-control-label font-weight-bold text-danger" htmlFor="featuredSwitch">
                                                Sản phẩm nổi bật
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-group mt-3">
                                        <label>Đường dẫn ảnh (URL)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Mô tả chi tiết</label>
                                        <textarea
                                            className="form-control"
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

export default Products;