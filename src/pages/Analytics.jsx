import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Package,
    ShoppingCart,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Calendar
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const Analytics = () => {
    const [borrowings, setBorrowings] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);

    const getAuthHeader = () => {
        const userString = localStorage.getItem('user');
        if (!userString) return {};
        const user = JSON.parse(userString);
        return {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const borrowRes = await fetch(`${API_BASE_URL}/borrowings`, {
                headers: getAuthHeader()
            });
            const bData = await borrowRes.json();
            setBorrowings(Array.isArray(bData) ? bData : []);

            const statsRes = await fetch(`${API_BASE_URL}/analytics/category-stats`, {
                headers: getAuthHeader()
            });
            const cStats = await statsRes.json();
            setCategoryStats(Array.isArray(cStats) ? cStats : []);

            const invRes = await fetch(`${API_BASE_URL}/inventory`, {
                headers: getAuthHeader()
            });
            const invData = await invRes.json();
            setInventoryData(Array.isArray(invData) ? invData.slice(0, 5) : []);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    };

    const handleReturnItem = async (borrowingId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/borrowings/${borrowingId}/return`, {
                method: 'PUT',
                headers: getAuthHeader()
            });
            if (res.ok) {
                alert('Item returned successfully!');
                fetchData();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to return item'}`);
            }
        } catch (err) {
            console.error('Error returning item:', err);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            className="analytics-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header className="page-header">
                <div>
                    <h1>Analytics Dashboard</h1>
                    <p className="text-muted">Real-time performance metrics and inventory insights</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Calendar size={18} />
                        <span>Last 30 Days</span>
                    </button>
                    <button className="btn-primary">
                        <Download size={18} />
                        <span>Export Report</span>
                    </button>
                </div>
            </header>

            <section className="analytics-section">
                <div className="section-header">
                    <div className="title-with-icon">
                        <TrendingUp className="text-primary" size={24} />
                        <h2>Borrowing Activity</h2>
                    </div>
                </div>
                <div className="glass-card chart-container">
                    <div className="chart-placeholder">
                        <div className="bar-chart">
                            {borrowings && borrowings.length > 0 ? (
                                borrowings.slice(0, 7).map((log, i) => {
                                    const maxQty = Math.max(...borrowings.map(b => b.quantity), 10);
                                    const heightPercent = (log.quantity / maxQty) * 100;
                                    return (
                                        <motion.div
                                            key={i}
                                            className="bar"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(heightPercent, 10)}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                        >
                                            <span className="tooltip">
                                                {log.borrower_name}: {log.quantity} {log.product_name}
                                            </span>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-muted" style={{ padding: '20px' }}>No borrowing history found.</div>
                            )}
                        </div>
                        <div className="chart-labels">
                            {borrowings && borrowings.slice(0, 7).map((log, i) => (
                                <span key={i}>{new Date(log.borrow_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="analytics-grid">
                <section className="analytics-section">
                    <div className="section-header">
                        <div className="title-with-icon">
                            <ShoppingCart className="text-accent" size={24} />
                            <h2>Recent Borrowers</h2>
                        </div>
                    </div>
                    <div className="glass-card stats-summary-card">
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="label text-muted">Active Borrowings</span>
                                <span className="value">{borrowings.filter(b => b.status === 'Borrowed').length}</span>
                                <span className="trend">Currently held out</span>
                            </div>
                            <div className="stat-item">
                                <span className="label text-muted">Total Borrowed</span>
                                <span className="value">{borrowings.length}</span>
                                <span className="trend">Lifetime logs</span>
                            </div>
                        </div>
                        <div className="purchases-list">
                            {borrowings && borrowings.slice(0, 5).map((b, i) => (
                                <div className="purchase-item" key={i}>
                                    <div className="vendor-info">
                                        <div className="avatar-small" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                                            {b.borrower_name[0]}
                                        </div>
                                        <div>
                                            <p className="vendor-name" style={{ margin: 0, fontWeight: 500 }}>{b.borrower_name}</p>
                                            <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                                                {b.quantity}x {b.product_name} • {new Date(b.borrow_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`status-pill ${b.status?.toLowerCase() || ''}`}>{b.status}</span>
                                        {b.status === 'Borrowed' && (
                                            <button
                                                className="btn-tiny"
                                                onClick={() => handleReturnItem(b.id)}
                                                style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                Return
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className="analytics-grid" style={{ gridTemplateColumns: '1fr' }}>
                <section className="analytics-section">
                    <div className="section-header">
                        <div className="title-with-icon">
                            <BarChart3 className="text-secondary" size={24} />
                            <h2>Category Quantities</h2>
                        </div>
                    </div>
                    <div className="glass-card progress-grid-card" style={{ padding: '24px' }}>
                        <div className="progress-list">
                            {categoryStats && categoryStats.length > 0 ? (
                                categoryStats.map((c, i) => {
                                    const totalPossible = Math.max(...categoryStats.map(s => parseInt(s.total_qty) || 0), 100);
                                    const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--success)'];
                                    return (
                                        <div className="progress-item" key={i}>
                                            <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span>{c.name}</span>
                                                <span className="text-muted">{c.total_qty} units</span>
                                            </div>
                                            <div className="progress-bar-bg">
                                                <motion.div
                                                    className="progress-bar-fill"
                                                    style={{ background: colors[i % colors.length], height: '100%' }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(parseInt(c.total_qty) / totalPossible) * 100}%` }}
                                                    transition={{ delay: i * 0.1, duration: 1 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-muted">No category stats available.</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default Analytics;
