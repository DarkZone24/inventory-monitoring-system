import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    Shield,
    Key,
    Users,
    Check,
    X,
    Lock,
    Eye,
    EyeOff,
    MoreVertical,
    ChevronDown
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const Settings = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('security');
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [openActionMenu, setOpenActionMenu] = useState(null);

    const getAuthHeader = () => {
        const userString = localStorage.getItem('user');
        if (!userString) return {};
        const user = JSON.parse(userString);
        return {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.hash = '#login';
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const usersRes = await fetch(`${API_BASE_URL}/users`, {
                headers: getAuthHeader()
            });
            const usersData = await usersRes.json();
            setUsers(Array.isArray(usersData) ? usersData : []);

            const rolesRes = await fetch(`${API_BASE_URL}/roles`, {
                headers: getAuthHeader()
            });
            const rolesData = await rolesRes.json();
            const transformedRoles = Array.isArray(rolesData) ? rolesData.map(r => ({
                name: r.name,
                permissions: {
                    analytics: !!r.can_access_analytics,
                    inventory: !!r.can_access_inventory
                }
            })) : [];
            setRoles(transformedRoles);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const togglePermission = async (roleName, permission) => {
        const role = roles.find(r => r.name === roleName);
        if (!role) return;
        const newPermissions = { ...role.permissions, [permission]: !role.permissions[permission] };

        try {
            await fetch(`${API_BASE_URL}/roles/update-permissions`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    roleName,
                    analytics: newPermissions.analytics,
                    inventory: newPermissions.inventory
                })
            });

            setRoles(roles.map(r =>
                r.name === roleName
                    ? { ...r, permissions: newPermissions }
                    : r
            ));
        } catch (err) {
            console.error('Error updating permissions:', err);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (res.ok) {
                alert('User created successfully!');
                fetchData();
                setShowNewUserModal(false);
            } else {
                alert(`Error: ${data.error || 'Failed to create user'}`);
            }
        } catch (err) {
            console.error('Error creating user:', err);
            alert('Failed to connect to the server.');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify(userData)
            });

            if (res.ok) {
                alert('User updated successfully!');
                fetchData();
                setShowEditUserModal(false);
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to update user'}`);
            }
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (res.ok) {
                alert('User deleted successfully!');
                fetchData();
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            className="settings-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p className="text-muted">Manage your account, users, and system permissions</p>
                </div>
            </header>

            <div className="settings-container">
                <nav className="settings-nav">
                    <button
                        className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Lock size={18} /> Security
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={18} /> User Management
                    </button>
                    {currentUser.role === 'Admin' && (
                        <button
                            className={`nav-btn ${activeTab === 'roles' ? 'active' : ''}`}
                            onClick={() => setActiveTab('roles')}
                        >
                            <Shield size={18} /> Role Permissions
                        </button>
                    )}
                </nav>

                <main className="settings-content">
                    <AnimatePresence mode="wait">
                        {activeTab === 'security' && (
                            <motion.section
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="settings-section"
                            >
                                <div className="glass-card section-card">
                                    <div className="card-header">
                                        <Key className="text-primary" size={20} />
                                        <h3>Change Password</h3>
                                    </div>
                                    <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
                                        <div className="form-group">
                                            <label>Current Password</label>
                                            <input type="password" placeholder="••••••••" className="input-modern" />
                                        </div>
                                        <div className="form-group">
                                            <label>New Password</label>
                                            <input type="password" placeholder="••••••••" className="input-modern" />
                                        </div>
                                        <div className="form-group">
                                            <label>Confirm New Password</label>
                                            <input type="password" placeholder="••••••••" className="input-modern" />
                                        </div>
                                        <button className="btn-primary">Update Password</button>
                                    </form>
                                </div>
                            </motion.section>
                        )}

                        {activeTab === 'users' && (
                            <motion.section
                                key="users"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="settings-section"
                            >
                                <div className="section-actions">
                                    {currentUser.role === 'Admin' && (
                                        <button className="btn-primary" onClick={() => setShowNewUserModal(true)}>
                                            <UserPlus size={18} /> Add New User
                                        </button>
                                    )}
                                </div>
                                <div className="glass-card table-card" style={{ marginTop: '20px' }}>
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users && users.map(user => (
                                                <tr key={user.id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className="role-tag">{user.role}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${user.status?.toLowerCase() || 'active'}`}>
                                                            {user.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td style={{ position: 'relative' }}>
                                                        <button
                                                            className="icon-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionMenu(openActionMenu === user.id ? null : user.id);
                                                            }}
                                                            disabled={currentUser.role !== 'Admin'}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {openActionMenu === user.id && (
                                                                <motion.div
                                                                    className="action-menu glass-card"
                                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        right: '50px',
                                                                        top: '0',
                                                                        zIndex: 100,
                                                                        padding: '4px',
                                                                        minWidth: '130px',
                                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                                                        background: 'rgba(30, 30, 45, 0.95)',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                >
                                                                    <button
                                                                        className="menu-item"
                                                                        onClick={() => {
                                                                            setSelectedUser(user);
                                                                            setShowEditUserModal(true);
                                                                            setOpenActionMenu(null);
                                                                        }}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '8px 12px',
                                                                            borderRadius: '6px',
                                                                            cursor: 'pointer',
                                                                            border: 'none',
                                                                            background: 'transparent',
                                                                            color: '#fff',
                                                                            fontSize: '0.85rem',
                                                                            textAlign: 'left'
                                                                        }}
                                                                    >
                                                                        Edit User
                                                                    </button>
                                                                    <button
                                                                        className="menu-item text-danger"
                                                                        onClick={() => {
                                                                            handleDeleteUser(user.id);
                                                                            setOpenActionMenu(null);
                                                                        }}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '8px 12px',
                                                                            borderRadius: '6px',
                                                                            cursor: 'pointer',
                                                                            border: 'none',
                                                                            background: 'transparent',
                                                                            color: '#ef4444',
                                                                            fontSize: '0.85rem',
                                                                            textAlign: 'left'
                                                                        }}
                                                                    >
                                                                        Delete User
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.section>
                        )}

                        {activeTab === 'roles' && (
                            <motion.section
                                key="roles"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="settings-section"
                            >
                                <div className="glass-card roles-card">
                                    <div className="card-header">
                                        <Shield className="text-secondary" size={20} />
                                        <h3>Role Access Control</h3>
                                    </div>
                                    <div className="permissions-grid">
                                        <div className="grid-header">
                                            <div className="role-col">Role</div>
                                            <div className="perm-col">Analytics</div>
                                            <div className="perm-col">Inventory</div>
                                        </div>
                                        {roles && roles.map(role => (
                                            <div className="grid-row" key={role.name}>
                                                <div className="role-col font-medium">{role.name}</div>
                                                <div className="perm-col">
                                                    <label className="checkbox-ios">
                                                        <input
                                                            type="checkbox"
                                                            checked={role.permissions.analytics}
                                                            onChange={() => togglePermission(role.name, 'analytics')}
                                                            disabled={role.name === 'Admin'}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                                <div className="perm-col">
                                                    <label className="checkbox-ios">
                                                        <input
                                                            type="checkbox"
                                                            checked={role.permissions.inventory}
                                                            onChange={() => togglePermission(role.name, 'inventory')}
                                                            disabled={role.name === 'Admin'}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <AnimatePresence>
                {showNewUserModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="glass-card modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3>Create New User</h3>
                                <button className="close-btn" onClick={() => setShowNewUserModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form className="modal-form" onSubmit={handleCreateUser}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" className="input-modern" placeholder="e.g. John Doe" required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" className="input-modern" placeholder="user@tcsnhs.edu.ph" required />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <div className="select-wrapper">
                                        <select name="role" className="input-modern select-modern" required>
                                            <option value="">Select a role</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Staff">Staff</option>
                                        </select>
                                        <ChevronDown size={18} className="select-icon" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input type="password" name="password" className="input-modern" placeholder="••••••••" required />
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                    <button type="button" className="btn-outline" onClick={() => setShowNewUserModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Create Account</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditUserModal && selectedUser && (
                    <div className="modal-overlay">
                        <motion.div
                            className="glass-card modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3>Edit User</h3>
                                <button className="close-btn" onClick={() => setShowEditUserModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form className="modal-form" onSubmit={handleEditUser}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="input-modern"
                                        defaultValue={selectedUser.name}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input-modern"
                                        defaultValue={selectedUser.email}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <div className="select-wrapper">
                                        <select name="role" className="input-modern select-modern" defaultValue={selectedUser.role} required>
                                            <option value="Admin">Admin</option>
                                            <option value="Staff">Staff</option>
                                        </select>
                                        <ChevronDown size={18} className="select-icon" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <div className="select-wrapper">
                                        <select name="status" className="input-modern select-modern" defaultValue={selectedUser.status || 'Active'} required>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                        <ChevronDown size={18} className="select-icon" />
                                    </div>
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                    <button type="button" className="btn-outline" onClick={() => setShowEditUserModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Update User</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Settings;
