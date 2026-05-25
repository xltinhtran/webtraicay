# 🚀 Hướng Dẫn Chạy Ứng Dụng BaseCore

## ⚠️ **Thông Báo Quan Trọng**

Bạn đang chạy `npm start` trong thư mục **sai**!

```
❌ SAII:  BaseCore.AuthService/ClientApp
✅ ĐÚNG: BaseCore.WebClient
```

## 📍 Cách Chạy Đúng

### 1. **Chạy Backend API (C# .NET)**
```bash
# Mở terminal riêng
cd D:\kali-linux-2025.2-virtualbox-amd64\Hocki2nam3\Cong_Nghe_Phan_Mem\FW\BaseCore

# Chạy API Gateway hoặc APIService
dotnet run --project BaseCore.APIService

# API sẽ chạy trên: http://localhost:5000
```

### 2. **Chạy React Frontend**
```bash
# Mở terminal khác
cd D:\kali-linux-2025.2-virtualbox-amd64\Hocki2nam3\Cong_Nghe_Phan_Mem\FW\BaseCore\BaseCore.WebClient

# Cài dependencies nếu chưa có
npm install

# Chạy development server
npm start

# Frontend sẽ chạy trên: http://localhost:3000
```

## 🔧 Cấu Trúc Thư Mục

```
BaseCore/
├── BaseCore.APIService/          ← Backend API (.NET)
├── BaseCore.WebClient/           ← Frontend React ← CHẠY TẠI ĐÂY!
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── BaseCore.AuthService/
├── BaseCore.AuditLog/
└── ... (các service khác)
```

## ✅ Kiểm Tra Kết Nối

1. **Backend chạy được?**
   - Mở: `http://localhost:5000/api/products`
   - Nên thấy JSON hoặc danh sách sản phẩm

2. **Frontend chạy được?**
   - Mở: `http://localhost:3000`
   - Nên thấy trang login

3. **API kết nối được?**
   - Đăng nhập thành công
   - Trang không còn lỗi JSON

## 🐛 Sửa Các Lỗi Thường Gặp

### Lỗi: "Cannot GET /api/..."
```
Nguyên nhân: Backend chưa chạy
Giải pháp:
1. Mở Power Shell mới
2. Chạy: dotnet run --project BaseCore.APIService
3. Chờ xem dòng: "Now listening on: http://localhost:5000"
```

### Lỗi: "JSON.parse undefined"
```
Nguyên nhân: API trả về undefined hoặc rỗng
Giải pháp:
1. Đảm bảo backend chạy
2. Kiểm tra endpoint /api/products tồn tại
3. Xóa cache browser (Ctrl+Shift+Delete)
4. Tải lại trang (Ctrl+R)
```

### Lỗi: "npm ERR! 404 Not Found"
```
Nguyên nhân: Thư mục package.json không tìm được
Giải pháp:
1. Kiểm tra thư mục hiện tại: pwd
2. Phải ở: BaseCore.WebClient
3. Chạy: npm install
```

## 📝 API Endpoints Cần Thiết

Backend phải có các endpoint này:

```
POST /api/auth/login
  Request:  { username, password }
  Response: { id, username, email, name, role, token }

GET /api/products
  Response: 
    - Mảng trực tiếp: [{ id, name, price, ... }]
    - Hoặc object: { items: [...], totalCount: 10 }

POST /api/orders
  Request: { userId, items: [...], totalAmount, ... }
  Response: { id, status, ... }
```

## 🎯 Các Bước Khởi Động Hoàn Chỉnh

```bash
# Terminal 1 - Backend
cd D:\kali-linux-2025.2-virtualbox-amd64\Hocki2nam3\Cong_Nghe_Phan_Mem\FW\BaseCore
dotnet run --project BaseCore.APIService
# Chờ: "Now listening on: http://localhost:5000"

# Terminal 2 - Frontend
cd D:\kali-linux-2025.2-virtualbox-amd64\Hocki2nam3\Cong_Nghe_Phan_Mem\FW\BaseCore\BaseCore.WebClient
npm install  # (nếu chưa cài)
npm start
# Chờ: "Local: http://localhost:3000"
```

## 🔐 Test Tính Năng

### 1. Kiểm Tra Admin Login
```
URL: http://localhost:3000/login
Username: admin
Password: admin

Kỳ vọng:
- Redirect đến /dashboard
- Sidebar: Dashboard, Products, Categories, Users, Admin Orders
```

### 2. Kiểm Tra Customer Login
```
URL: http://localhost:3000/login
Username: customer
Password: password

Kỳ vọng:
- Redirect đến /home
- Sidebar: Home, Shop, Cart, My Orders
```

### 3. Kiểm Tra Shopping
```
1. Vào /shop
2. Click "Add to Cart" trên sản phẩm
3. Vào /cart
4. Kiểm tra sản phẩm trong giỏ
5. Click "Proceed to Checkout"
```

## 💾 Cài Đặt Lại (Nếu Có Lỗi)

```bash
# Xóa node_modules và package-lock.json
cd BaseCore.WebClient
rm -r node_modules
rm package-lock.json

# Cài lại
npm install

# Chạy
npm start
```

---

**Nếu vẫn có vấn đề, hãy kiểm tra:**
1. ✅ Backend chạy trên port 5000
2. ✅ Frontend chạy từ folder BaseCore.WebClient
3. ✅ Browser console xem lỗi gì
4. ✅ Network tab xem API response

Good luck! 🚀
