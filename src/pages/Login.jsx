import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Submitting login to:', `${API_BASE_URL}/login`);
    console.log('Payload:', { email, rememberMe });

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      console.log('Response Status:', res.status);
      const data = await res.json();
      console.log('Response Data:', data);

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        window.location.hash = '#dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login Fetch Error:', err);
      setError(`Connection error (${err.message}). Is the server running?`);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card login-card"
      >
        <div className="login-header">
          <div className="logo-glow">
            <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1>School<span className="text-gradient">Asset</span></h1>
          <p className="text-muted">High School Property Management System</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-alert"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              className="input-modern"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password"
              className="input-modern"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="btn-primary w-full">
            <LogIn size={20} className="inline-mr-2" />
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={16} className="text-success" />
          <span>Secure Enterprise Access</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
