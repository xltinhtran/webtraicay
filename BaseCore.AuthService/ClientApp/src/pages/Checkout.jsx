import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Nhận dữ liệu từ trang Cart truyền sang
    const { subtotal, shipping, discount, total, cartItems, couponCode } = location.state ||
        { subtotal: 0, shipping: 0, discount: 0, total: 0, cartItems: [], couponCode: null };

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', address: '', town: '', phone: '', email: '', notes: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.address || !formData.phone) {
            alert("Ní ơi điền đầy đủ Tên, Địa chỉ với Số điện thoại (có dấu *) giùm tui nha!");
            return;
        }

        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.userId || userData.id;

        if (!currentUserId) {
            alert("Ní chưa đăng nhập mà sao mua hàng được!");
            navigate('/login');
            return;
        }

        const orderData = {
            userId: currentUserId,
            shippingAddress: `${formData.address}, ${formData.town}`,
            phone: formData.phone,
            orderNotes: formData.notes,
            paymentMethod: paymentMethod,
            subTotal: subtotal,
            shippingFee: shipping,
            discountAmount: discount,
            totalAmount: total,
            couponCode: couponCode,
            details: cartItems.map(item => ({
                productId: item.productId || item.id,
                quantity: item.quantity,
                unitPrice: item.productInfo?.price || item.price
            }))
        };

        try {
            const response = await fetch('http://localhost:5001/api/orders/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                window.print();
                alert("🎉 Đặt hàng thành công!");
                navigate('/');
            } else {
                const errorData = await response.text();
                alert(`Có lỗi xảy ra: ${errorData}`);
            }
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
            alert("Lỗi kết nối máy chủ C#!");
        }
    };

    return (
        <>
            <div className="container-fluid page-header py-5">
                <h1 className="text-center text-white display-6">Checkout</h1>
                <ol className="breadcrumb justify-content-center mb-0">
                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                    <li className="breadcrumb-item"><a href="#">Pages</a></li>
                    <li className="breadcrumb-item active text-white">Checkout</li>
                </ol>
            </div>

            <div className="container-fluid py-5">
                <div className="container py-5">
                    <h1 className="mb-4">Billing details</h1>
                    <form onSubmit={handlePlaceOrder}>
                        <div className="row g-5">
                            {/* CỘT BÊN TRÁI */}
                            <div className="col-md-12 col-lg-6 col-xl-7">
                                <div className="row">
                                    <div className="col-md-12 col-lg-6">
                                        <div className="form-item w-100">
                                            <label className="form-label my-3">First Name<sup>*</sup></label>
                                            <input type="text" name="firstName" className="form-control" onChange={handleInputChange} required />
                                        </div>
                                    </div>
                                    <div className="col-md-12 col-lg-6">
                                        <div className="form-item w-100">
                                            <label className="form-label my-3">Last Name</label>
                                            <input type="text" name="lastName" className="form-control" onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-item">
                                    <label className="form-label my-3">Address <sup>*</sup></label>
                                    <input type="text" name="address" className="form-control" onChange={handleInputChange} required />
                                </div>
                                <div className="form-item">
                                    <label className="form-label my-3">Town/City<sup>*</sup></label>
                                    <input type="text" name="town" className="form-control" onChange={handleInputChange} required />
                                </div>
                                <div className="form-item">
                                    <label className="form-label my-3">Mobile<sup>*</sup></label>
                                    <input type="text" name="phone" className="form-control" onChange={handleInputChange} required />
                                </div>
                                <div className="form-item">
                                    <label className="form-label my-3">Email Address</label>
                                    <input type="email" name="email" className="form-control" onChange={handleInputChange} />
                                </div>
                                <div className="form-item mt-3">
                                    <textarea name="notes" className="form-control" rows="5" placeholder="Order Notes (Optional)" onChange={handleInputChange}></textarea>
                                </div>
                            </div>

                            {/* CỘT BÊN PHẢI */}
                            <div className="col-md-12 col-lg-6 col-xl-5">
                                <div className="table-responsive bg-light rounded p-5">
                                    <h2 className="display-6 mb-4">Cart Total</h2>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Products</th>
                                                <th scope="col">Name</th>
                                                <th scope="col">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cartItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td><img src={item.imageUrl || '/img/avatar.jpg'} style={{ width: '60px' }} alt="" /></td>
                                                    <td>{item.name}</td>
                                                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td><strong>Subtotal</strong></td>
                                                <td></td>
                                                <td><strong>${subtotal.toFixed(2)}</strong></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total</strong></td>
                                                <td></td>
                                                <td><strong>${total.toFixed(2)}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <button type="submit" className="btn border-secondary py-3 px-4 text-uppercase w-100 text-primary">Place Order</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Checkout;