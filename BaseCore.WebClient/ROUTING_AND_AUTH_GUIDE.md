# Authentication & Role-Based Routing - Setup Guide

## Overview
Your application now has complete role-based authentication and routing:
- **Admin Users** → Dashboard with management pages
- **Customer Users** → Home/Shop interface with shopping cart

## What Was Fixed

### 1. JSON Parsing Error
**Issue**: `JSON.parse()` error with "undefined" is not valid JSON
**Fix**: Added safe parsing in `AuthContext.jsx` with error handling

```javascript
// Now safely handles undefined/invalid responses
if (storedUser !== 'undefined' && storedUser !== '') {
    setUser(JSON.parse(storedUser));
}
```

### 2. Role-Based Routing
**Before**: Both admin and customer users saw the same pages
**After**: 
- Login → Automatically redirects to correct page based on role
- Admin users see `/dashboard` and management pages
- Customer users see `/home` and shop pages

### 3. New Pages Created
- `Home.jsx` - Welcome page with featured products
- `Shop.jsx` - Full product catalog with search/filter
- `Cart.jsx` - Shopping cart with checkout

## Routes Map

### Admin Routes (Protected - Admin Only)
```
/login                    - Login page
/dashboard                - Admin dashboard with stats
/products                 - Product management
/categories               - Category management
/users                    - User management
/admin-orders             - Order management
```

### Customer Routes (Protected - All Authenticated Users)
```
/login                    - Login page
/home                     - Home/featured products
/shop                     - Browse all products
/cart                     - Shopping cart
/orders                   - View my orders
```

## How to Test

### Test Admin Account
1. Go to `/login`
2. Login with admin credentials (username: `admin`, password: `admin`)
3. Should be redirected to `/dashboard`
4. Sidebar shows: Dashboard, Products, Categories, Admin Orders, Users

### Test Customer Account
1. Go to `/login`
2. Login with customer credentials
3. Should be redirected to `/home`
4. Sidebar shows: Home, Shop, Cart, My Orders

### Test Root Route
1. When not logged in: `/` → redirects to `/login`
2. When logged in as admin: `/` → redirects to `/dashboard`
3. When logged in as customer: `/` → redirects to `/home`

## Shopping Cart Feature

### Add to Cart
1. On `Home` or `Shop` page, click "Add to Cart"
2. Product saved to browser's localStorage
3. Cart badge shows item count in navbar

### View Cart
1. Click "Cart" in sidebar or cart icon in navbar
2. See all items with quantity controls
3. Modify quantities or remove items

### Checkout
1. Click "Proceed to Checkout" button
2. Order sent to `/api/orders` endpoint
3. Cart cleared after successful order

## Backend API Requirements

Make sure your backend is running on `localhost:5000` and has these endpoints:

### Authentication
```
POST /api/auth/login
  Request: { username: string, password: string }
  Response: { 
    id: string,
    username: string,
    email: string,
    name: string,
    role: "Admin" | "Customer",
    token: string
  }
```

### Products
```
GET /api/products
  Response: {
    items: [...],
    totalCount: number
  } or just array of products

GET /api/products/{id}
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}
```

### Orders
```
POST /api/orders
  Request: {
    userId: string,
    items: [{ productId, quantity, price }],
    totalAmount: number,
    shippingAddress: string,
    status: string
  }
  
GET /api/orders
  (Get user's orders)

GET /api/orders/all
  (Admin only - Get all orders)
```

## Troubleshooting

### "Cannot GET /api/..."
- Ensure backend is running on port 5000
- Check API endpoints in `src/services/api.js`
- Verify Vite proxy configuration in `vite.config.js`

### Login fails
- Check username/password are correct
- Verify `/api/auth/login` endpoint exists
- Check browser console for detailed error messages

### Shopping cart won't work
- Ensure localStorage is enabled in browser
- Check browser DevTools → Application → Local Storage

### Role-based routing not working
- Clear browser cache and localStorage
- Check that user object has `role` property
- Verify role value is exactly "Admin" or "Customer"

## File Structure
```
src/
├── pages/
│   ├── Home.jsx           (Customer home)
│   ├── Shop.jsx           (Product catalog)
│   ├── Cart.jsx           (Shopping cart)
│   ├── Dashboard.jsx      (Admin dashboard)
│   ├── Products.jsx       (Admin products)
│   ├── Categories.jsx     (Admin categories)
│   ├── Users.jsx          (Admin users)
│   ├── Orders.jsx         (Orders - dual use)
│   └── Login.jsx          (Login page)
├── components/
│   ├── MainLayout.jsx     (Layout with role-based nav)
│   └── ProtectedRoute.jsx (Route protection)
├── contexts/
│   └── AuthContext.jsx    (Authentication logic)
├── services/
│   └── api.js             (API configuration)
└── App.jsx                (Routing configuration)
```

## Next Steps

1. **Customize branding**: Update logo/colors in `MainLayout.jsx`
2. **Add user profile**: Create `Profile.jsx` page
3. **Add product details**: Create `ProductDetail.jsx` page
4. **Add checkout form**: Enhance `Cart.jsx` with address form
5. **Add order tracking**: Enhance `Orders.jsx` with order details

Good luck! 🚀
