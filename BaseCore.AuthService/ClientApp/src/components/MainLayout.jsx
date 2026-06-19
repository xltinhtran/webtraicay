import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");
  const sidebarWidth = isSidebarCollapsed ? 74 : 250;
  const navLinkStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: isSidebarCollapsed ? "center" : "flex-start",
    minHeight: 48,
    gap: isSidebarCollapsed ? 0 : 10,
    paddingLeft: isSidebarCollapsed ? 0 : 14,
    paddingRight: isSidebarCollapsed ? 0 : 14,
    transition: "all 0.2s ease",
  };
  const navIconStyle = {
    width: 22,
    marginRight: 0,
    textAlign: "center",
    fontSize: 18,
  };
  const renderNavLink = (to, iconClass, label) => (
    <li className="nav-item">
      <Link
        to={to}
        className={`nav-link ${isActive(to)}`}
        title={isSidebarCollapsed ? label : undefined}
        style={navLinkStyle}
      >
        <i className={`nav-icon ${iconClass}`} style={navIconStyle}></i>
        {!isSidebarCollapsed && <p style={{ margin: 0 }}>{label}</p>}
      </Link>
    </li>
  );

  return (
    // Thêm flex-column để Header, Body, Footer xếp dọc theo trang
    <div className="wrapper d-flex flex-column" style={{ minHeight: "100vh" }}>
      {/* Navbar (Nằm trên cùng) */}
      <nav
        className="main-header navbar navbar-expand navbar-white navbar-light m-0"
        style={{ width: "100%", zIndex: 1000, minHeight: 56 }}
      >
        <ul className="navbar-nav">
          <li className="nav-item">
            <button
              type="button"
              className="nav-link btn btn-link"
              role="button"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              aria-label={isSidebarCollapsed ? "Mo rong menu" : "Thu gon menu"}
              style={{ color: "#6c757d", boxShadow: "none" }}
            >
              <i className="fas fa-bars"></i>
            </button>
          </li>
        </ul>
        <ul className="navbar-nav" style={{ marginLeft: "auto" }}>
          <li className="nav-item dropdown">
            <a
              className="nav-link"
              data-toggle="dropdown"
              href="#"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="fas fa-user"></i> {user?.name || "Administrator"}
            </a>
            <div
              className="dropdown-menu dropdown-menu-right"
              style={{
                left: "auto",
                right: 0,
                minWidth: 170,
                zIndex: 2000,
              }}
            >
              <a href="#" className="dropdown-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
              </a>
            </div>
          </li>
        </ul>
      </nav>

      {/* KHU VỰC CHÍNH: CHIA 2 CỘT TRÁI (SIDEBAR) VÀ PHẢI (CONTENT) */}
      <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
        {/* Sidebar Bên Trái (Ép width cố định 250px) */}
        <aside
          className="main-sidebar sidebar-dark-primary elevation-4"
          style={{
            position: "relative",
            width: sidebarWidth,
            flexShrink: 0,
            overflowY: "auto",
            overflowX: "hidden",
            zIndex: 1,
            transition: "width 0.2s ease",
          }}
        >
          <Link
            to="/"
            className="brand-link"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              gap: 10,
              minHeight: 68,
              padding: isSidebarCollapsed ? "14px 0" : "14px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
            title="Về trang mua hàng"
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: "#7bd000",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              <i className="fas fa-leaf"></i>
            </span>
            {!isSidebarCollapsed && (
              <span className="brand-text" style={{ lineHeight: 1.1 }}>
                <span
                  style={{
                    display: "block",
                    color: "#2f4f5b",
                    fontSize: 19,
                    fontWeight: 800,
                  }}
                >
                  Cửa hàng
                </span>
                <small
                  style={{ color: "#7b8794", fontSize: 12, fontWeight: 600 }}
                >
                  Admin Panel
                </small>
              </span>
            )}
          </Link>
          <div className="sidebar" style={{ padding: "14px 12px" }}>
            <nav className="mt-2">
              <ul
                className="nav nav-pills nav-sidebar flex-column"
                data-widget="treeview"
                role="menu"
              >
                {renderNavLink(
                  "/dashboard",
                  "fas fa-tachometer-alt",
                  "Tổng quan",
                )}
                {renderNavLink("/products", "fas fa-shopping-cart", "Sản phẩm")}
                {renderNavLink("/categories", "fas fa-tags", "Danh mục")}
                {renderNavLink("/coupons", "fas fa-ticket-alt", "Mã giảm giá")}
                {renderNavLink("/users", "fas fa-users", "Người dùng")}
                {renderNavLink(
                  "/orders",
                  "fas fa-file-invoice-dollar",
                  "Đơn hàng",
                )}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Content Wrapper Bên Phải (Chiếm toàn bộ không gian còn lại) */}
        <div
          className="content-wrapper p-4"
          style={{
            flex: 1,
            overflowY: "auto",
            marginLeft: 0,
            backgroundColor: "#f4f6f9",
          }}
        >
          {children}
        </div>
      </div>

      {/* Footer (Nằm dưới cùng) */}
      <footer className="main-footer m-0" style={{ width: "100%" }}>
        <strong>BaseCore Admin</strong> - Teaching Framework
        <div className="float-right d-none d-sm-inline-block">
          <b>Version</b> 1.0.0
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
