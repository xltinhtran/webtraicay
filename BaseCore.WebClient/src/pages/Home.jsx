import React, { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await productApi.getAll();
            
            if (!response) {
                throw new Error('No response from server');
            }

            // Safely handle different response formats
            let productsData = [];
            
            if (response.data) {
                if (Array.isArray(response.data)) {
                    productsData = response.data;
                } else if (response.data?.items && Array.isArray(response.data.items)) {
                    productsData = response.data.items;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    productsData = response.data.data;
                }
            }
            
            // Ensure we have an array
            if (!Array.isArray(productsData)) {
                productsData = [];
            }
            
            setProducts(productsData.slice(0, 8)); // Show featured products
        } catch (error) {
            console.error('Failed to load products:', error);
            setError(`Không thể tải sản phẩm: ${error?.message || 'Lỗi không xác định'}. Vui lòng chắc chắn backend đang chạy trên port 5000.`);
            setProducts([]);
        } finally {
            setLoading(false);
        }
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
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '80px 20px',
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                <div className="container">
                    <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '20px' }}>
                        Welcome to BaseCore Shop
                    </h1>
                    <p className="hero-subtitle" style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                        Discover amazing products at great prices
                    </p>
                    <button 
                        className="btn btn-light btn-lg"
                        onClick={() => navigate('/shop')}
                    >
                        Shop Now
                    </button>
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-products" style={{ padding: '40px 20px' }}>
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        Featured Products
                    </h2>

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
                    ) : products.length > 0 ? (
                        <div className="row">
                            {products.map(product => (
                                <div key={product.id} className="col-md-6 col-lg-3 mb-4">
                                    <div className="card h-100" style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                        <div style={{
                                            height: '200px',
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
                                                <i className="fas fa-image" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <h5 className="card-title">{product.name}</h5>
                                            <p className="card-text text-muted" style={{ height: '40px', overflow: 'hidden' }}>
                                                {product.description}
                                            </p>
                                            <h4 className="text-primary">${product.price?.toFixed(2) || '0.00'}</h4>
                                            <div className="d-grid gap-2">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => navigate(`/product/${product.id}`)}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="btn btn-outline-success"
                                                    onClick={() => addToCart(product)}
                                                >
                                                    <i className="fas fa-shopping-cart"></i> Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="alert alert-info text-center">
                            No products available. Try again later.
                        </div>
                    )}
                </div>
            </section>

            {/* Call to Action */}
            <section style={{
                background: '#f8f9fa',
                padding: '60px 20px',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 style={{ marginBottom: '20px' }}>Browse Our Full Catalog</h2>
                    <p style={{ marginBottom: '30px', color: '#666' }}>
                        Explore thousands of products carefully selected for you
                    </p>
                    <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/shop')}
                    >
                        View All Products
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Home;
