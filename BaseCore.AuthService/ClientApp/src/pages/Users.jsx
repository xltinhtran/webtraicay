import React, { useCallback, useEffect, useState } from 'react';
import { usersApi } from '../services/api';

const emptyForm = {
    name: '',
    userName: '',
    password: '',
    email: '',
    phone: '',
    position: 'Customer',
    isActive: true,
    userType: 0,
};

const getUsername = (user) => user.username || user.userName || '';

const getIsActive = (user) => user.isActive !== false;

const getRole = (user) => {
    const position = (user.position || '').toLowerCase();

    if (Number(user.userType) === 1 || position.includes('admin')) {
        return 'Admin';
    }

    return 'Customer';
};

const getInitials = (name, username) => {
    const source = (name || username || '?').trim();
    const words = source.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await usersApi.getAll({
                keyword: search || undefined,
                role: role || undefined,
                status: status || undefined,
                page,
                pageSize,
            });

            const payload = response.data;
            const userList = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
            const total = payload?.totalCount || userList.length || 0;

            setUsers(userList);
            setTotalCount(total);
            setTotalPages(payload?.totalPages || Math.ceil(total / pageSize) || 1);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
            setTotalCount(0);
            alert(error.response?.data?.message || 'Không tải được danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [search, role, status, page, pageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const adminCount = users.filter((user) => getRole(user) === 'Admin').length;
    const customerCount = users.filter((user) => getRole(user) === 'Customer').length;
    const activeCount = users.filter((user) => getIsActive(user)).length;
    const inactiveCount = users.length - activeCount;

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleResetFilters = () => {
        setSearch('');
        setRole('');
        setStatus('');
        setPage(1);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        const normalizedRole = getRole(user);

        setEditingUser(user);
        setFormData({
            name: user.name || '',
            userName: getUsername(user),
            password: '',
            email: user.email || '',
            phone: user.phone || '',
            position: user.position || normalizedRole,
            isActive: getIsActive(user),
            userType: normalizedRole === 'Admin' ? 1 : 0,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
            return;
        }

        try {
            await usersApi.delete(id);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert(error.response?.data?.message || 'Xóa người dùng thất bại');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = {
            name: formData.name.trim(),
            username: formData.userName.trim(),
            password: formData.password,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            position: formData.position,
            isActive: Boolean(formData.isActive),
            userType: Number(formData.userType),
        };

        try {
            if (editingUser) {
                if (!submitData.password) submitData.password = '';
                await usersApi.update(editingUser.id, submitData);
            } else {
                await usersApi.create(submitData);
            }

            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
            alert(error.response?.data?.message || 'Lưu người dùng thất bại');
        }
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Quản lý Người Dùng</h1>
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
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Tổng người dùng</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{totalCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Theo bộ lọc hiện tại</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#eef6ff', color: '#0b78a6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-users"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Admin</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{adminCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Trên trang hiện tại</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#ffecec', color: '#c92a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-user-shield"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Customer</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{customerCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>Trên trang hiện tại</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#e8f7ee', color: '#16834a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-user"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6 mb-3">
                            <div style={{ minHeight: 118, padding: '16px 18px', borderRadius: 8, backgroundColor: '#fff', border: '1px solid #e3e8ef', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#6c7a89', fontSize: 14, fontWeight: 600 }}>Trạng thái</div>
                                    <div style={{ color: '#2f4f5b', fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{activeCount}</div>
                                    <div style={{ color: '#7b8794', fontSize: 13, marginTop: 6 }}>{inactiveCount} tài khoản bị khóa</div>
                                </div>
                                <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#fff4db', color: '#b77900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    <i className="fas fa-toggle-on"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-lg-10">
                                    <form onSubmit={handleSearch} className="form-inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tên, username, email, số điện thoại..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '1 1 320px', minWidth: 240 }}
                                        />

                                        <select
                                            className="form-control"
                                            value={role}
                                            onChange={(e) => {
                                                setRole(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 160px', minWidth: 140 }}
                                        >
                                            <option value="">Tất cả vai trò</option>
                                            <option value="admin">Admin</option>
                                            <option value="customer">Customer</option>
                                        </select>

                                        <select
                                            className="form-control"
                                            value={status}
                                            onChange={(e) => {
                                                setStatus(e.target.value);
                                                setPage(1);
                                            }}
                                            style={{ flex: '0 1 170px', minWidth: 150 }}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="active">Đang hoạt động</option>
                                            <option value="inactive">Bị khóa</option>
                                        </select>

                                        <button type="submit" className="btn btn-default" title="Tìm kiếm">
                                            <i className="fas fa-search"></i>
                                        </button>
                                        <button type="button" className="btn btn-light" onClick={handleResetFilters} title="Xóa bộ lọc">
                                            <i className="fas fa-undo"></i>
                                        </button>
                                    </form>
                                </div>
                                <div className="col-lg-2 text-right mt-2 mt-lg-0">
                                    <button className="btn btn-primary" onClick={handleAdd}>
                                        <i className="fas fa-plus"></i> Thêm User
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
                                            <th>Người dùng</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Số điện thoại</th>
                                            <th>Vai trò</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            users.map((user) => {
                                                const normalizedRole = getRole(user);
                                                const active = getIsActive(user);
                                                const username = getUsername(user);

                                                return (
                                                    <tr key={user.id || username}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: normalizedRole === 'Admin' ? '#ffecec' : '#e8f7ee', color: normalizedRole === 'Admin' ? '#c92a2a' : '#16834a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                                    {getInitials(user.name, username)}
                                                                </div>
                                                                <div>
                                                                    <strong>{user.name || '-'}</strong>
                                                                    <div className="text-muted" style={{ fontSize: 13 }}>
                                                                        ID: {user.id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{username}</td>
                                                        <td>{user.email || '-'}</td>
                                                        <td>{user.phone || '-'}</td>
                                                        <td>
                                                            <span className={`badge p-2 ${normalizedRole === 'Admin' ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                                                                {normalizedRole}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge p-2 ${active ? 'bg-info text-white' : 'bg-secondary text-white'}`}>
                                                                {active ? 'Đang hoạt động' : 'Bị khóa'}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(user.created || user.Created)}</td>
                                                        <td>
                                                            <button className="btn btn-sm btn-info mr-1" onClick={() => handleEdit(user)}>
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">Không có người dùng phù hợp.</td>
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
                                        <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
                                    </li>
                                    {[...Array(Math.max(1, totalPages))].map((_, i) => (
                                        <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" style={{ margin: '16px auto', maxWidth: 600, width: 'calc(100% - 24px)' }}>
                        <div className="modal-content" style={{ maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className="modal-header" style={{ flexShrink: 0 }}>
                                <h4 className="modal-title">{editingUser ? 'Chỉnh sửa User' : 'Thêm User'}</h4>
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
                                <div className="modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                                    <div className="form-group">
                                        <label>Họ tên</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.userName}
                                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                            required
                                            disabled={!!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu {editingUser && '(để trống nếu không đổi)'}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Số điện thoại</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Vai trò</label>
                                        <select
                                            className="form-control"
                                            value={formData.userType}
                                            onChange={(e) => {
                                                const userType = Number(e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    userType,
                                                    position: userType === 1 ? 'Admin' : 'Customer',
                                                });
                                            }}
                                        >
                                            <option value={0}>Customer</option>
                                            <option value={1}>Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Position</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label className="custom-control-label" htmlFor="isActive">Đang hoạt động</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ flexShrink: 0 }}>
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

export default Users;
