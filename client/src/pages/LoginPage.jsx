import React, { useState, useEffect } from 'react';
import { useAuth, useToast, useNavigation } from '../App';
import apiClient, { setAccessToken } from '../api/client';

const DEMO_USERS = [
  { email: 'ashwin@anicart.com', password: 'Anime@123', name: 'Ashwin', avatar: 'A' },
  { email: 'demo@anicart.com',   password: 'Demo@1234', name: 'Demo User', avatar: 'D' },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const { navigate, PAGES } = useNavigation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(PAGES.DASHBOARD);
  }, [user]);

  // Pre-fill from saved email
  useEffect(() => {
    const saved = localStorage.getItem('anicart_remember_email');
    if (saved) { setForm((p) => ({ ...p, email: saved })); setRememberMe(true); }
  }, []);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (loginAttempts >= 5) {
      addToast('Too many attempts. Please wait a moment.', 'error'); return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      const { user: loggedInUser, accessToken } = res.data.data;
      setAccessToken(accessToken);

      if (rememberMe) localStorage.setItem('anicart_remember_email', form.email);
      else localStorage.removeItem('anicart_remember_email');

      login(loggedInUser);
      addToast(`Welcome back, ${loggedInUser.name}! ⚡`, 'success');
      navigate(PAGES.DASHBOARD);
    } catch (error) {
      setLoginAttempts((p) => p + 1);
      const msg = error.response?.data?.message || 'Authentication failed. Check your credentials.';
      setErrors({ password: msg });
      addToast(msg, 'error');
    }

    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setForm({ email: 'demo@anicart.com', password: 'Demo@1234' });
    try {
      const res = await apiClient.post('/auth/login', {
        email: 'demo@anicart.com',
        password: 'Demo@1234',
      });
      const { user: loggedInUser, accessToken } = res.data.data;
      setAccessToken(accessToken);
      login(loggedInUser);
      addToast('Logged in as Demo User! Explore freely. ✦', 'success');
      navigate(PAGES.DASHBOARD);
    } catch (error) {
      addToast('Demo login failed. Is the server running?', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Decorative lines */}
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 1, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(0,243,255,0.4))' }} />

        <div className="glass-card auth-card animate-fade-up">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
            <div className="auth-subtitle">◈ Databank Access Terminal ◈</div>
            <div style={{ marginTop: 20 }}>
              <div className="auth-title">Initiate Link</div>
              <div className="auth-desc">Sign in to access your anime universe</div>
            </div>
          </div>

          {/* Demo login */}
          <button className="auth-social-btn" onClick={handleDemoLogin} disabled={loading}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            Enter with Demo Account
          </button>

          {/* Divider */}
          <div className="auth-divider" style={{ margin: '20px 0' }}>
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or continue with email</span>
            <div className="auth-divider-line" />
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◈</span>
                <input
                  className="form-input"
                  type="email"
                  placeholder="pilot@anicart.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {errors.email && <div className="form-error">⚠ {errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◉</span>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange('password')}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                >
                  {showPwd ? '◎' : '●'}
                </button>
              </div>
              {errors.password && <div className="form-error">⚠ {errors.password}</div>}
            </div>

            {/* Remember me & forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--neon)', width: 14, height: 14 }}
                />
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--neon)', fontSize: '0.88rem',
                  fontFamily: 'Rajdhani, sans-serif', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => addToast('Password reset link sent to your email! (demo mode)', 'info')}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <><span className="loading-spinner" /> Authenticating...</>
              ) : (
                <>◈ Initiate Link</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            No account yet?{' '}
            <span className="auth-link" onClick={() => navigate(PAGES.SIGNUP)}>
              Create Profile →
            </span>
          </div>

          {/* Back to landing */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span
              className="auth-link"
              onClick={() => navigate(PAGES.LANDING)}
              style={{ fontSize: '0.82rem', color: 'var(--text-muted)', opacity: 0.7 }}
            >
              ← Back to Landing
            </span>
          </div>

          {/* Hint */}
          <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(0,243,255,0.04)',
            border: '1px solid rgba(0,243,255,0.12)', borderRadius: 10 }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem',
              letterSpacing: '1px', color: 'var(--text-muted)', textAlign: 'center' }}>
              DEMO CREDENTIALS
            </div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: '0.82rem',
              color: 'var(--neon)', textAlign: 'center', marginTop: 4 }}>
              demo@anicart.com &nbsp;/&nbsp; Demo@1234
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
