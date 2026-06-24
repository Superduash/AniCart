import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useTitle } from '../../hooks/useTitle';
import apiClient, { setAccessToken } from '../../api/client';

export default function LoginPage() {
  useTitle('Sign In');
  const { login, user } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => { if (user) navigate(nextUrl, { replace: true }); }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('anicart_remember_email');
    if (saved) { setForm(p => ({ ...p, email: saved })); setRememberMe(true); }
  }, []);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email: form.email, password: form.password });
      const { user: loggedInUser, accessToken } = res.data.data;
      setAccessToken(accessToken);
      if (rememberMe) localStorage.setItem('anicart_remember_email', form.email);
      else localStorage.removeItem('anicart_remember_email');
      login(loggedInUser, accessToken);
      addToast(`Welcome back, ${loggedInUser.name}! ⚡`, 'success');
      navigate(nextUrl, { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || 'Authentication failed. Check your credentials.';
      setErrors({ password: msg });
      addToast(msg, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 1, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(0,243,255,0.4))' }} />

        <div className="glass-card auth-card animate-fade-up">
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
            <div className="auth-subtitle">◈ Access Terminal ◈</div>
            <div className="auth-title" style={{ marginTop: 20 }}>Welcome Back</div>
            <p className="auth-desc">Sign in to access your anime universe</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◈</span>
                <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="pilot@anicart.com" value={form.email} onChange={handleChange('email')} autoComplete="email" disabled={loading} />
              </div>
              {errors.email && <div className="form-error">⚠ {errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◉</span>
                <input className={`form-input${errors.password ? ' error' : ''}`} type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange('password')} autoComplete="current-password" disabled={loading} />
                <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)} tabIndex={-1} aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? '◎' : '●'}
                </button>
              </div>
              {errors.password && <div className="form-error">⚠ {errors.password}</div>}
            </div>

            {/* Remember me / forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>Remember me</span>
              </label>
              <Link to="/auth/forgot" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>Forgot Password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="loading-spinner" /> Authenticating...</> : '◈ Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            No account?{' '}
            <Link to="/auth/signup" className="auth-link">Create Profile →</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Link to="/" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', textDecoration: 'none' }}>← Back to Landing</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
