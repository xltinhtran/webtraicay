import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = () => {
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
            
            setCartItems(cart);
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const updatedCart = cartItems.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const removeFromCart = (productId) => {
        const updatedCart = cartItems.filter(item => item.id !== productId);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            setCartItems([]);
            localStorage.removeItem('cart');
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.1; // 10% tax
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        try {
            setLoading(true);
            const orderData = {
                userId: user?.id,
                items: cartItems.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: calculateTotal(),
                shippingAddress: 'Default Address', // You can add a form for this
                status: 'Pending'
            };

            await orderApi.create(orderData);
            alert('Order placed successfully!');
            setCartItems([]);
            localStorage.removeItem('cart');
            navigate('/orders');
        } catch (error) {
            console.error('Failed to place order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cart-page" style={{ padding: '40px 20px', minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Header */}
            <section style={{
                background: '#667eea',
                color: 'white',
                padding: '40px 20px',
                marginBottom: '40px'
            }}>
                <div className="container">
                    <h1>Shopping Cart</h1>
                    <p>Review your items and proceed to checkout</p>
                </div>
            </section>

            <div className="container">
                <div className="row">
                    {/* Cart Items */}
                    <div className="col-lg-8">
                        {cartItems.length > 0 ? (
                            <>
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <h5 className="card-title mb-4">
                                            Items in Cart ({cartItems.length})
                                        </h5>
                                        
                                        <div className="table-responsive">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Price</th>
                                                        <th>Quantity</th>
                                                        <th>Subtotal</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cartItems.map(item => (
                                                        <tr key={item.id}>
                                                            <td>
                                                                <div>
                                                                    <strong>{item.name}</strong>
                                                                    <br />
                                                                    <small className="text-muted">{item.description}</small>
                                                                </div>
                                                            </td>
                                                            <td>${item.price?.toFixed(2) || '0.00'}</td>
                                                            <td>
                                                                <div className="input-group" style={{ width: '120px' }}>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control text-center"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                        min="1"
                                                                    />
                                                                    <button
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                ${(item.price * item.quantity)?.toFixed(2) || '0.00'}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => removeFromCart(item.id)}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="text-end mt-3">
                                            <button
                                                className="btn btn-warning"
                                                onClick={() => navigate('/shop')}
                                                style={{ marginRight: '10px' }}
                                            >
                                                <i className="fas fa-arrow-left"></i> Continue Shopping
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={clearCart}
                                            >
                                                <i className="fas fa-trash"></i> Clear Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="card mb-4">
                                <div className="card-body text-center py-5">
                                    <i className="fas fa-shopping-cart" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px', display: 'block' }}></i>
                                    <h5>Your cart is empty</h5>
                                    <p className="text-muted mb-3">Add some products to your cart to get started</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate('/shop')}
                                    >
                                        <i className="fas fa-shopping-bag"></i> Start Shopping
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="col-lg-4">
                        <div className="card sticky-top" style={{ top: '20px' }}>
                            <div className="card-body">
                                <h5 className="card-title mb-4">Order Summary</h5>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Subtotal:</span>
                                        <span>${calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Tax (10%):</span>
                                        <span>${calculateTax().toFixed(2)}</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between mb-3">
                                        <strong>Total:</strong>
                                        <strong style={{ color: '#667eea', fontSize: '1.2rem' }}>
                                            ${calculateTotal().toFixed(2)}
                                        </strong>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-success w-100 mb-2"
                                    onClick={handleCheckout}
                                    disabled={cartItems.length === 0 || loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check-circle"></i> Proceed to Checkout
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => navigate('/shop')}
                                >
                                    <i className="fas fa-arrow-left"></i> Continue Shopping
                                </button>

                                <div className="alert alert-info mt-3" style={{ fontSize: '0.9rem' }}>
                                    <i className="fas fa-shield-alt"></i> Your payment is secure and encrypted
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
