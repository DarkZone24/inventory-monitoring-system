import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={20} className="inline-mr-2 animate-spin" />
            ) : (
              <LogIn size={20} className="inline-mr-2" />
            )}
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={16} className="text-success" />
          <span>Secure Enterprise Access</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(10, 10, 20, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px'
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="logo-glow"
              style={{ width: '80px', height: '80px', marginBottom: '10px' }}
            >
              <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </motion.div>
            <div className="loading-text">
              <h2 className="text-gradient" style={{ margin: 0 }}>Authenticating</h2>
              <div className="dots" style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px' }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
