import React, { useState, useEffect } from 'react';
import api, { productsApi, usersApi, categoriesApi, ordersApi } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    categories: 0,
    orders: 0, // 2. Thêm state lưu số lượng đơn hàng
  });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // BƯỚC 1: Gọi tất cả API cùng lúc và hứng vào 4 biến tương ứng
                const [productsRes, usersRes, categoriesRes, ordersRes] = await Promise.all([
                    productsApi.getAll({ pageSize: 1 }),
                    usersApi.getAll({ pageSize: 1 }),
                    categoriesApi.getAll(),
                    ordersApi.getAll() // Hàm này ní vừa khai báo trong api.js
                ]);

                // BƯỚC 2: Cập nhật dữ liệu vào state để hiển thị lên các ô màu
                setStats({
                    products: productsRes.data.totalCount || productsRes.data.length || 0,
                    users: usersRes.data.totalCount || usersRes.data.length || 0,
                    categories: categoriesRes.data.length || 0,
                    // Lấy độ dài mảng đơn hàng từ ordersRes
                    orders: ordersRes.data.length || ordersRes.data.totalCount || 0,
                });
            } catch (error) {
                // Nếu có lỗi, nó sẽ hiện ở F12 để ní biết đường sửa
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchStats();
    }, []);

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
          <div className="row">
            <div className="col-lg-3 col-6">
              <div className="small-box bg-info">
                <div className="inner">
                  <h3>{stats.products}</h3>
                  <p>Products</p>
                </div>
                <div className="icon">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <a href="/products" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </a>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="small-box bg-success">
                <div className="inner">
                  <h3>{stats.categories}</h3>
                  <p>Categories</p>
                </div>
                <div className="icon">
                  <i className="fas fa-tags"></i>
                </div>
                <a href="/categories" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </a>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="small-box bg-warning">
                <div className="inner">
                  <h3>{stats.users}</h3>
                  <p>Users</p>
                </div>
                <div className="icon">
                  <i className="fas fa-users"></i>
                </div>
                <a href="/users" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </a>
              </div>
            </div>
                      {/* 4. Cập nhật ô Orders: Thay số 0 bằng stats.orders và đổi link sang /orders[cite: 43] */}
            <div className="col-lg-3 col-6">
              <div className="small-box bg-danger">
                <div className="inner">
                  <h3>{stats.orders}</h3>
                  <p>Orders</p>
                </div>
                <div className="icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <a href="/orders" className="small-box-footer">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Welcome to BaseCore Admin</h3>
                </div>
                <div className="card-body">
                  <p>This is the admin dashboard for managing products, categories, and users.</p>
                  <ul>
                    <li><strong>Products:</strong> Manage your product catalog</li>
                    <li><strong>Categories:</strong> Organize products into categories</li>
                    <li><strong>Users:</strong> Manage user accounts</li>
                    {/* Thêm dòng này cho đầy đủ bộ[cite: 32] */}
                    <li><strong>Orders:</strong> Handle customer invoices and shipping status</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
