import React, { useState, useEffect, useCallback } from 'react';
import { productsApi, categoriesApi, API_STATIC_BASE_URL } from '../services/api';

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

const getQualityClass = (quality) => {
    const value = quality || '';

    if (value === 'Organic') return 'bg-success text-white';
    if (value === 'Sales') return 'bg-danger text-white';
    if (value === 'Fresh') return 'bg-info text-dark';
    if (value === 'Discount') return 'bg-warning text-dark';
    if (value === 'Expired') return 'bg-dark text-white';
    if (value === 'Premium') return 'bg-warning text-white';

    return 'bg-secondary text-white';
};

const PRODUCT_UNITS = ['kg', 'g', 'quả', 'cái', 'chiếc', 'ổ', 'bó', 'hộp', 'chai', 'túi', 'sản phẩm'];

const formatQuantity = (value) => {
    const number = Number(value || 0);
    return Number.isInteger(number)
        ? number.toLocaleString('vi-VN')
        : number.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
};

const getProductUnit = (productOrUnit) => {
    if (typeof productOrUnit === 'string') return productOrUnit || 'sản phẩm';
    return productOrUnit?.unit || productOrUnit?.Unit || 'sản phẩm';
};

const getLowStockThreshold = (product) => {
    return Number(product?.lowStockThreshold ?? product?.LowStockThreshold ?? 20);
};

const getStockMeta = (stock, threshold = 20) => {
    const value = Number(stock || 0);
    const lowStockThreshold = Number(threshold || 20);

    if (value <= 0) {
        return { label: 'Hết hàng', className: 'bg-danger text-white' };
    }

    if (value <= lowStockThreshold) {
        return { label: 'Sắp hết', className: 'bg-warning text-dark' };
    }

    return { label: 'Còn hàng', className: 'bg-success text-white' };
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategoryId, setFilterCategoryId] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [qualityFilter, setQualityFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [statProducts, setStatProducts] = useState([]);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [existingGalleryImages, setExistingGalleryImages] = useState([]);

    // --- CẤU HÌNH STATE CHO FORM DỮ LIỆU ---
    // Đã thêm isFeatured để đồng bộ với formData
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        stock: 0,
        unit: 'kg',
        lowStockThreshold: 10,
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
                categoryId: filterCategoryId || undefined,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined,
                quality: qualityFilter || undefined,
                page,
                pageSize,
            });

            const data = response.data;
            setProducts(data.items || data || []);
            setTotalPages(Math.ceil((data.totalCount || data.length || 0) / pageSize) || 1);
        } catch (error) {
            console.error('Lỗi khi tải danh sách sản phẩm:', error);
        }
        setLoading(false);
    }, [search, filterCategoryId, minPrice, maxPrice, qualityFilter, page, pageSize]);

    const fetchProductStats = useCallback(async () => {
        try {
            const response = await productsApi.getAll({
                keyword: search,
                categoryId: filterCategoryId || undefined,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined,
                quality: qualityFilter || undefined,
                page: 1,
                pageSize: 10000,
            });

            const data = response.data;
            setStatProducts(data.items || data || []);
        } catch (error) {
            console.error('Lỗi khi tải thống kê sản phẩm:', error);
            setStatProducts([]);
        }
    }, [search, filterCategoryId, minPrice, maxPrice, qualityFilter]);

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
        fetchProductStats();
        fetchCategories();
    }, [fetchProducts, fetchProductStats]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            price: 0,
            stock: 0,
            unit: 'kg',
            lowStockThreshold: 10,
            imageUrl: '',
            description: '',
            categoryId: categories[0]?.id || 0,
            quality: 'Organic',
            isFeatured: false,
        });
        setSelectedImageFile(null);
        setImagePreview('');
        setSelectedGalleryFiles([]);
        setGalleryPreviews([]);
        setExistingGalleryImages([]);
        setShowModal(true);
    };

    const handleEdit = async (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            price: product.price || 0,
            stock: product.stock || 0,
            unit: getProductUnit(product),
            lowStockThreshold: getLowStockThreshold(product),
            imageUrl: product.imageUrl || product.ImageUrl || '',
            description: product.description || '',
            categoryId: product.categoryId || 0,
            quality: product.quality || product.Quality || 'Organic',
            isFeatured: product.isFeatured || false,
        });
        setSelectedImageFile(null);
        setImagePreview(getProductImageUrl(product.imageUrl || product.ImageUrl || ''));
        setSelectedGalleryFiles([]);
        setGalleryPreviews([]);
        setExistingGalleryImages([]);
        setShowModal(true);

        try {
            const response = await productsApi.getImages(product.id);
            setExistingGalleryImages(response.data || []);
        } catch (error) {
            console.error('Lỗi tải ảnh phụ sản phẩm:', error);
            setExistingGalleryImages([]);
        }
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setSelectedImageFile(file);

        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(getProductImageUrl(formData.imageUrl || ''));
        }
    };

    const handleGalleryFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setSelectedGalleryFiles(files);
        setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
    };

    const handleRemoveNewGalleryImage = (index) => {
        setSelectedGalleryFiles((files) => files.filter((_, currentIndex) => currentIndex !== index));
        setGalleryPreviews((previews) => previews.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleDeleteExistingGalleryImage = async (imageUrl) => {
        if (!editingProduct || !window.confirm('Bạn có chắc muốn xóa ảnh phụ này không?')) {
            return;
        }

        try {
            await productsApi.deleteImage(editingProduct.id, imageUrl);
            setExistingGalleryImages((images) => images.filter((image) => image.imageUrl !== imageUrl));
        } catch (error) {
            console.error('Xóa ảnh phụ thất bại:', error);
            alert('Xóa ảnh phụ thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
            try {
                await productsApi.delete(id);
                fetchProducts();
                fetchProductStats();
            } catch (error) {
                console.error('Xóa sản phẩm thất bại:', error);
                alert('Xóa sản phẩm thất bại');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let productData = {
                ...formData,
                price: Number(formData.price || 0),
                stock: Number(formData.stock || 0),
                unit: formData.unit || 'sản phẩm',
                lowStockThreshold: Number(formData.lowStockThreshold || 10)
            };

            if (selectedImageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('imageFile', selectedImageFile);

                const uploadResponse = await productsApi.uploadImage(uploadFormData);
                const uploadedImageUrl = uploadResponse.data?.imageUrl;

                if (uploadedImageUrl) {
                    productData.imageUrl = uploadedImageUrl.startsWith('http')
                        ? uploadedImageUrl
                        : `${API_STATIC_BASE_URL}${uploadedImageUrl}`;
                }
            }

            if (editingProduct) {
                await productsApi.update(editingProduct.id, productData);

                if (selectedGalleryFiles.length > 0) {
                    const galleryFormData = new FormData();
                    selectedGalleryFiles.forEach((file) => galleryFormData.append('imageFiles', file));
                    await productsApi.uploadImages(editingProduct.id, galleryFormData);
                }
            } else {
                const createResponse = await productsApi.create(productData);
                const createdProductId = createResponse.data?.id;

                if (createdProductId && selectedGalleryFiles.length > 0) {
                    const galleryFormData = new FormData();
                    selectedGalleryFiles.forEach((file) => galleryFormData.append('imageFiles', file));
                    await productsApi.uploadImages(createdProductId, galleryFormData);
                }
            }

            setShowModal(false);
            setSelectedImageFile(null);
            setImagePreview('');
            setSelectedGalleryFiles([]);
            setGalleryPreviews([]);
            setExistingGalleryImages([]);
            fetchProducts();
            fetchProductStats();
        } catch (error) {
            console.error('Lưu sản phẩm thất bại:', error);
            alert(error.response?.data?.message || error.response?.data || 'Lưu sản phẩm thất bại');
        }
    };

    const totalProducts = statProducts.length;
    const usedUnits = [...new Set(statProducts.map((product) => getProductUnit(product)).filter(Boolean))];
    const unitSummaryText = usedUnits.length > 0 ? usedUnits.slice(0, 4).join(', ') : 'Chưa có dữ liệu';
    const lowStockCount = statProducts.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= getLowStockThreshold(product)).length;
    const outOfStockCount = statProducts.filter((product) => Number(product.stock || 0) <= 0).length;
    const featuredCount = statProducts.filter((product) => product.isFeatured).length;

    const handleResetFilters = () => {
        setSearch('');
        setFilterCategoryId('');
        setMinPrice('');
        setMaxPrice('');
        setQualityFilter('');
        setPage(1);
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
                    <div className="row mb-3">
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Tổng sản phẩm</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{totalProducts}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Theo bộ lọc hiện tại</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#eef6ff', color: '#0b78a6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-box"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Đơn vị tính</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{usedUnits.length}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{unitSummaryText}</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#e8f7ee', color: '#16834a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-warehouse"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Cần nhập thêm</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{lowStockCount + outOfStockCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{lowStockCount} sắp hết, {outOfStockCount} hết hàng</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#fff4db', color: '#b77900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-exclamation-triangle"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Sản phẩm nổi bật</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{featuredCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Đang ưu tiên ngoài shop</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#fff4db', color: '#ffb300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-star"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-lg-10">
                                    <form
                                        onSubmit={handleSearch}
                                        className="form-inline"
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'nowrap',
                                            gap: 8,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div className="input-group" style={{ flex: '0 0 260px', minWidth: 220 }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tìm theo tên sản phẩm..."
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
                                                    setPage(1);
                                                }}
                                            />
                                        </div>

                                        <select
                                            className="form-control"
                                            value={filterCategoryId}
                                            onChange={(e) => {
                                                setFilterCategoryId(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 0 160px', minWidth: 150 }}
                                        >
                                            <option value="">Tất cả danh mục</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            className="form-control"
                                            value={qualityFilter}
                                            onChange={(e) => {
                                                setQualityFilter(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 0 150px', minWidth: 140 }}
                                        >
                                            <option value="">Tất cả quality</option>
                                            <option value="Organic">Organic</option>
                                            <option value="Fresh">Fresh</option>
                                            <option value="Premium">Premium</option>
                                            <option value="Discount">Discount</option>
                                            <option value="Sales">Sales</option>
                                            <option value="Expired">Expired</option>
                                        </select>

                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            className="form-control"
                                            placeholder="Giá từ"
                                            value={minPrice}
                                            onChange={(e) => {
                                                setMinPrice(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 0 105px', minWidth: 100 }}
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            className="form-control"
                                            placeholder="Đến giá"
                                            value={maxPrice}
                                            onChange={(e) => {
                                                setMaxPrice(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 0 105px', minWidth: 100 }}
                                        />

                                        <button
                                            type="submit"
                                            className="btn btn-default"
                                            title="Tìm kiếm"
                                            style={{ width: 42, flex: '0 0 42px' }}
                                        >
                                            <i className="fas fa-search"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-light"
                                            onClick={handleResetFilters}
                                            title="Xóa bộ lọc"
                                            style={{ width: 42, flex: '0 0 42px' }}
                                        >
                                            <i className="fas fa-undo"></i>
                                        </button>
                                    </form>
                                </div>
                                <div className="col-lg-2 mt-2 mt-lg-0" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <button className="btn btn-primary" onClick={handleAdd} style={{ whiteSpace: 'nowrap', minHeight: 46 }}>
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
                                            <th>Ảnh</th>
                                            <th>Tên sản phẩm</th>
                                            <th>Giá bán (VNĐ)</th>
                                            <th>Tồn kho</th>
                                            <th>Chất lượng</th>
                                            <th>Nổi bật</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length > 0 ? products.map((product) => {
                                            const quality = product.quality || product.Quality || 'Chưa phân loại';
                                            const unit = getProductUnit(product);
                                            const lowStockThreshold = getLowStockThreshold(product);
                                            const stockMeta = getStockMeta(product.stock, lowStockThreshold);

                                            return (
                                            <tr key={product.id}>
                                                <td>{product.id}</td>
                                                <td>
                                                    <img
                                                        src={getProductImageUrl(product.imageUrl || product.ImageUrl)}
                                                        alt={product.name}
                                                        style={{
                                                            width: 64,
                                                            height: 48,
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
                                                <td>
                                                    {Number(product.price || 0).toLocaleString('vi-VN')} ₫
                                                    <span className="text-muted"> / {unit}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge p-2 ${stockMeta.className}`}>{stockMeta.label}</span>
                                                    <div className="text-muted" style={{ fontSize: 13 }}>
                                                        {formatQuantity(product.stock)} {unit}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: 12 }}>
                                                        Ngưỡng: {formatQuantity(lowStockThreshold)} {unit}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge p-2 ${getQualityClass(quality)}`}
                                                        style={{ fontSize: '0.9em' }}
                                                    >
                                                        {quality}
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
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">Không có sản phẩm phù hợp.</td>
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
                    <div
                        className="modal-dialog"
                        style={{
                            maxWidth: 560,
                            width: 'calc(100% - 24px)',
                            margin: '12px auto'
                        }}
                    >
                        <div
                            className="modal-content"
                            style={{
                                maxHeight: 'calc(100vh - 24px)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            <div className="modal-header" style={{ flexShrink: 0 }}>
                                <h4 className="modal-title">
                                    {editingProduct ? 'Chỉnh sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
                                </h4>
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: '1 1 auto',
                                    minHeight: 0
                                }}
                            >
                                <div
                                    className="modal-body"
                                    style={{
                                        flex: '1 1 auto',
                                        minHeight: 0,
                                        overflowY: 'auto',
                                        paddingTop: 16,
                                        paddingBottom: 12
                                    }}
                                >
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
                                        <label>Giá bán theo đơn vị (VNĐ)</label>
                                        <input
                                            type="number"
                                            step="1000"
                                            className="form-control"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                        <small className="text-muted">
                                            Sẽ hiển thị: {Number(formData.price || 0).toLocaleString('vi-VN')} ₫ / {formData.unit || 'sản phẩm'}
                                        </small>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group col-md-7">
                                            <label>Số lượng tồn</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-5">
                                            <label>Đơn vị tính</label>
                                            <select
                                                className="form-control"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            >
                                                {PRODUCT_UNITS.map((unit) => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Ngưỡng cảnh báo sắp hết</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control"
                                                value={formData.lowStockThreshold}
                                                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                            <div className="input-group-append">
                                                <span className="input-group-text">{formData.unit || 'sản phẩm'}</span>
                                            </div>
                                        </div>
                                        <small className="text-muted">
                                            Khi tồn kho nhỏ hơn hoặc bằng ngưỡng này, sản phẩm sẽ được đánh dấu sắp hết.
                                        </small>
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
                                        <label>Ảnh chính</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                        />
                                        {imagePreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={imagePreview}
                                                    alt="Xem trước ảnh chính"
                                                    style={{
                                                        width: 120,
                                                        height: 82,
                                                        objectFit: 'cover',
                                                        borderRadius: 6,
                                                        border: '1px solid #dee2e6',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/img/avatar.jpg';
                                                    }}
                                                />
                                                <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                                                    Ảnh này sẽ hiển thị ngoài danh sách sản phẩm.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group mt-3">
                                        <label>Ảnh phụ</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            multiple
                                            onChange={handleGalleryFilesChange}
                                        />
                                        <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                                            Chọn nhiều ảnh để hiển thị trong trang chi tiết sản phẩm.
                                        </div>

                                        {(existingGalleryImages.length > 0 || galleryPreviews.length > 0) && (
                                            <div
                                                className="mt-2"
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                                                    gap: 10
                                                }}
                                            >
                                                {existingGalleryImages.map((image) => (
                                                    <div key={image.imageUrl} style={{ position: 'relative' }}>
                                                        <img
                                                            src={getProductImageUrl(image.imageUrl)}
                                                            alt="Ảnh phụ sản phẩm"
                                                            style={{
                                                                width: '100%',
                                                                height: 74,
                                                                objectFit: 'cover',
                                                                borderRadius: 6,
                                                                border: '1px solid #dee2e6',
                                                                backgroundColor: '#f8f9fa'
                                                            }}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/img/avatar.jpg';
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-danger"
                                                            onClick={() => handleDeleteExistingGalleryImage(image.imageUrl)}
                                                            title="Xóa ảnh phụ"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                padding: '1px 6px'
                                                            }}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}

                                                {galleryPreviews.map((preview, index) => (
                                                    <div key={preview} style={{ position: 'relative' }}>
                                                        <img
                                                            src={preview}
                                                            alt="Ảnh phụ mới"
                                                            style={{
                                                                width: '100%',
                                                                height: 74,
                                                                objectFit: 'cover',
                                                                borderRadius: 6,
                                                                border: '1px solid #dee2e6',
                                                                backgroundColor: '#f8f9fa'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-danger"
                                                            onClick={() => handleRemoveNewGalleryImage(index)}
                                                            title="Bỏ ảnh này"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                padding: '1px 6px'
                                                            }}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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

                                <div
                                    className="modal-footer"
                                    style={{
                                        flexShrink: 0,
                                        backgroundColor: '#fff',
                                        borderTop: '1px solid #dee2e6',
                                        padding: '10px 16px'
                                    }}
                                >
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
