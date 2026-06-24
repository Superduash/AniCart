import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';

function getStrength(pwd) {
  if (!pwd) return { label: '', color: '#475569', width: '0%' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: '', color: '#475569', width: '0%' },
    { label: 'Weak', color: '#ef4444', width: '20%' },
    { label: 'Fair', color: '#f59e0b', width: '40%' },
    { label: 'Good', color: '#00ccff', width: '60%' },
    { label: 'Strong', color: '#00f3ff', width: '80%' },
    { label: 'Excellent', color: '#22c55e', width: '100%' },
  ];
  return levels[Math.min(score, 5)];
}

export default function ResetPasswordPage() {
  useTitle('New Password');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { addToast } = useUI();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const strength = getStrength(form.password);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="glass-card auth-card animate-fade-up" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--color-error)' }}>✗</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 12 }}>Invalid Reset Link</div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 24 }}>This reset link is missing or has expired.</p>
            <Link to="/auth/forgot" className="btn btn-secondary">Request New Link</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password: form.password });
      addToast('Password updated! Please sign in.', 'success');
      navigate('/auth/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. The link may have expired.';
      addToast(msg, 'error');
      if (msg.includes('expired') || msg.includes('invalid')) {
        setErrors({ general: msg });
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="glass-card auth-card animate-fade-up">
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
            <div className="auth-title" style={{ marginTop: 20 }}>Create New Password</div>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◉</span>
                <input className={`form-input${errors.password ? ' error' : ''}`} type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }} autoComplete="new-password" disabled={loading} />
                <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)} tabIndex={-1} aria-label="Toggle">{showPwd ? '◎' : '●'}</button>
              </div>
              {errors.password && <div className="form-error">⚠ {errors.password}</div>}
              {form.password && (
                <div className="password-strength">
                  <div className="strength-bar"><div className="strength-fill" style={{ width: strength.width, background: strength.color }} /></div>
                  <span className="strength-text" style={{ color: strength.color }}>{strength.label && `Strength: ${strength.label}`}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◉</span>
                <input className={`form-input${errors.confirmPassword ? ' error' : ''}`} type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })); }} autoComplete="new-password" disabled={loading} />
              </div>
              {errors.confirmPassword && <div className="form-error">⚠ {errors.confirmPassword}</div>}
            </div>
            {errors.general && <div className="form-error" style={{ textAlign: 'center' }}>⚠ {errors.general} <Link to="/auth/forgot" style={{ color: 'var(--color-accent)' }}>Request new link</Link></div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="loading-spinner" /> Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
