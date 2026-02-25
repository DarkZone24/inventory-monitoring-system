import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  Search,
  Bell
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    total_products: 0,
    active_borrowings: 0,
    low_stock: 0,
    total_users: 0,
    total_stock: 0,
    recent_activity: []
  });
  const [categoryStats, setCategoryStats] = useState([]);

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
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
          headers: getAuthHeader()
        });
        const data = await res.json();
        if (data && !data.error) {
          setStatsData({
            total_products: data.total_products || 0,
            active_borrowings: data.active_borrowings || 0,
            low_stock: data.low_stock || 0,
            total_users: data.total_users || 0,
            total_stock: data.total_stock || 0,
            recent_activity: Array.isArray(data.recent_activity) ? data.recent_activity : []
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    const fetchCategoryStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/category-stats`, {
          headers: getAuthHeader()
        });
        const catData = await res.json();
        if (Array.isArray(catData)) setCategoryStats(catData);
      } catch (err) {
        console.error('Error fetching category stats:', err);
      }
    };
    fetchStats();
    fetchCategoryStats();
  }, []);

  const stats = [
    { label: 'Total Equipment', value: statsData.total_products, icon: Package, color: 'var(--primary)', trend: 'System total' },
    { label: 'Active Borrowings', value: statsData.active_borrowings, icon: Users, color: 'var(--success)', trend: 'Currently Out' },
    { label: 'Low Stock Items', value: statsData.low_stock, icon: TrendingUp, color: 'var(--secondary)', trend: 'Restock needed' },
    { label: 'Total Stock', value: statsData.total_stock, icon: AlertCircle, color: 'var(--accent)', trend: 'Bulk quantity' },
  ];

  return (
    <div className="dashboard">
      <header className="content-header">
        <div>
          <h2>Dashboard <span className="text-muted">Overview</span></h2>
          <p className="text-muted">Welcome back, Admin</p>
        </div>
        <div className="header-actions">
          <div className="search-bar glass">
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Search anything..." />
          </div>
          <button className="icon-btn glass">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card stat-card"
          >
            <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <p className="text-muted">{stat.label}</p>
              <h3>{stat.value}</h3>
              <span className={`trend ${stat.trend.startsWith('+') ? 'up' : 'down'}`}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="glass-card chart-placeholder">
          <div className="card-header">
            <h3>Inventory Analytics</h3>
            <div className="time-filters">
              <button className="active">Week</button>
              <button>Month</button>
            </div>
          </div>
          <div className="dash-chart-container">
            <div className="dash-bar-chart">
              {categoryStats.length > 0 ? (
                (() => {
                  const maxQty = categoryStats.reduce((max, c) => Math.max(max, c.total_qty), 1);
                  return categoryStats.map((c, i) => (
                    <div className="dash-bar-container" key={i}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(c.total_qty / maxQty) * 100}%` }}
                        className="dash-bar"
                        title={`${c.name}: ${c.total_qty} (${c.total_qty <= 0 ? 'Out of Stock' : c.total_qty < 5 ? 'Low Stock' : c.total_qty > 20 ? 'High Stock' : 'Optimal'})`}
                      />
                      <div className="dash-bar-label">{c.name}</div>
                    </div>
                  ));
                })()
              ) : (
                <p className="text-muted">No inventory data available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card recent-activity">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="text-btn">View All</button>
          </div>
          <div className="activity-list">
            {statsData.recent_activity.length > 0 ? statsData.recent_activity.map((activity, i) => (
              <div key={i} className="activity-item">
                <div className={`dot ${activity.type}`}></div>
                <div className="activity-details">
                  <p><strong>{activity.text}</strong>: {activity.action}</p>
                  <span>{new Date(activity.time).toLocaleString()}</span>
                </div>
              </div>
            )) : (
              <p className="text-muted">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
