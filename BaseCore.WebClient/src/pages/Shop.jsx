import React, { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const navigate = useNavigate();

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterAndSortProducts();
    }, [products, searchTerm, sortBy]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await productApi.getAll();
            
            // Handle different response formats
            let productsData = [];
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    productsData = response.data;
                } else if (response.data?.items && Array.isArray(response.data.items)) {
                    productsData = response.data.items;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    productsData = response.data.data;
                }
            }
            
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to load products:', error);
            setError('Failed to load products. Please try again later.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortProducts = () => {
        let result = products.filter(product =>
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'name':
                default:
                    return a.name?.localeCompare(b.name);
            }
        });

        setFilteredProducts(result);
    };

    const addToCart = (product) => {
        try {
            const cartStr = localStorage.getItem('cart');
            let cart = [];
            
            // Safely parse cart
            if (cartStr && cartStr !== 'undefined' && cartStr.trim() !== '') {
                try {
                    cart = JSON.parse(cartStr);
                    if (!Array.isArray(cart)) {
                        cart = [];
                    }
                } catch (e) {
                    console.error('Error parsing cart:', e);
                    cart = [];
                }
            }
            
            const existingItem = cart.find(item => item?.id === product?.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            alert('Đã thêm sản phẩm vào giỏ!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Không thể thêm sản phẩm vào giỏ');
        }
    };

    return (
        <div className="shop-page" style={{ padding: '20px 0', minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Header */}
            <section style={{
                background: '#667eea',
                color: 'white',
                padding: '40px 20px',
                marginBottom: '40px'
            }}>
                <div className="container">
                    <h1>Shop</h1>
                    <p>Browse our complete collection of products</p>
                </div>
            </section>

            <div className="container">
                <div className="row mb-4">
                    {/* Search and Filter */}
                    <div className="col-md-3">
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">Search & Filter</h5>
                                
                                <div className="mb-3">
                                    <label className="form-label">Search Products</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Sort By</label>
                                    <select
                                        className="form-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="name">Name (A-Z)</option>
                                        <option value="price-asc">Price (Low to High)</option>
                                        <option value="price-desc">Price (High to Low)</option>
                                    </select>
                                </div>

                                <button
                                    className="btn btn-secondary w-100"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSortBy('name');
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="col-md-9">
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                <i className="fas fa-exclamation-triangle"></i> {error}
                                <button
                                    className="btn btn-sm btn-outline-danger ms-3"
                                    onClick={loadProducts}
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <>
                                <div className="alert alert-info">
                                    Found <strong>{filteredProducts.length}</strong> product(s)
                                </div>
                                <div className="row">
                                    {filteredProducts.map(product => (
                                        <div key={product.id} className="col-md-6 col-lg-4 mb-4">
                                            <div className="card h-100" style={{
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                transition: 'transform 0.3s, box-shadow 0.3s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            }}>
                                                <div style={{
                                                    height: '250px',
                                                    background: '#f0f0f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {product.imageUrl ? (
                                                        <img 
                                                            src={product.imageUrl} 
                                                            alt={product.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <i className="fas fa-image" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                                                    )}
                                                </div>
                                                <div className="card-body d-flex flex-column">
                                                    <h5 className="card-title">{product.name}</h5>
                                                    <p className="card-text text-muted" style={{ height: '40px', overflow: 'hidden' }}>
                                                        {product.description}
                                                    </p>
                                                    <div className="mt-auto">
                                                        <h4 className="text-primary mb-3">
                                                            ${product.price?.toFixed(2) || '0.00'}
                                                        </h4>
                                                        <div className="d-grid gap-2">
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => navigate(`/product/${product.id}`)}
                                                            >
                                                                View Details
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-success btn-sm"
                                                                onClick={() => addToCart(product)}
                                                            >
                                                                <i className="fas fa-shopping-cart"></i> Add to Cart
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="alert alert-warning text-center">
                                {products.length === 0 ? 'No products available.' : 'No products match your search.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Shop;
