import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';
import apiClient from '../../api/client';

export default function ForgotPasswordPage() {
  useTitle('Reset Password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch { /* Always show same message */ }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="glass-card auth-card animate-fade-up">
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
            <div className="auth-title" style={{ marginTop: 20 }}>Reset Your Password</div>
            <p className="auth-desc">Enter your email and we'll send a reset link if an account exists.</p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>✉</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 24 }}>
                If that email is registered, a reset link is on its way.
              </p>
              <Link to="/auth/login" className="auth-link">← Back to Login</Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">◈</span>
                  <input className={`form-input${error ? ' error' : ''}`} type="email" placeholder="pilot@anicart.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoComplete="email" disabled={loading} />
                </div>
                {error && <div className="form-error">⚠ {error}</div>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="loading-spinner" /> Sending...</> : 'Send Reset Link'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <Link to="/auth/login" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', textDecoration: 'none' }}>← Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
