import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';

import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentRoute(hash);

      // Map hash to activeTab
      const tab = hash.replace('#', '') || 'dashboard';
      const validTabs = ['dashboard', 'inventory', 'analytics', 'settings'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
      }
    };

    // Initial sync
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const user = JSON.parse(localStorage.getItem('user'));

  // Auth Guard
  if (!user && currentRoute !== '#login') {
    window.location.hash = '#login';
    return <Login />;
  }

  if (user && (currentRoute === '#login' || !currentRoute)) {
    window.location.hash = '#dashboard';
    return null; // Will trigger re-render on hash change
  }

  if (currentRoute === '#login') {
    return <Login />;
  }

  return (
    <div className="layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
      </main>

    </div>
  );
}

export default App;
