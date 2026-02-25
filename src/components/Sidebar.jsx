import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="glass sidebar">
      <div className="sidebar-header">
        <div className="logo-small">
          <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span className="logo-text">TCSNHS<span className="text-secondary" style={{ color: '#00BFFF' }}>ims</span></span>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="active-pill"
                className="active-pill"
              />
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          className="menu-item logout"
          onClick={() => {
            localStorage.removeItem('user');
            window.location.hash = '#login';
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
