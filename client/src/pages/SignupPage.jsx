import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast, useNavigation } from '../App';
import apiClient, { setAccessToken } from '../api/client';

function getPasswordStrength(pwd) {
  let score = 0;
  if (!pwd) return { score: 0, label: '', color: '#475569', width: '0%' };
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: '', color: '#475569', width: '0%' },
    { label: 'Weak', color: '#ff2d78', width: '20%' },
    { label: 'Fair', color: '#ffd700', width: '40%' },
    { label: 'Good', color: '#00ccff', width: '60%' },
    { label: 'Strong', color: '#00f3ff', width: '80%' },
    { label: 'Excellent', color: '#00ff88', width: '100%' },
  ];
  return levels[Math.min(score, 5)];
}

export default function SignupPage() {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const { navigate, PAGES } = useNavigation();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', terms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2-step signup
  const strength = getPasswordStrength(form.password);

  useEffect(() => { if (user) navigate(PAGES.DASHBOARD); }, [user]);

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Include at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Include at least one number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.terms) e.terms = 'You must accept the terms to continue';
    return e;
  };

  const handleChange = (field) => (e) => {
    const val = field === 'terms' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Check if email already "exists" (demo)
    const saved = localStorage.getItem('anicart_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.email?.toLowerCase() === form.email.toLowerCase()) {
        setErrors({ email: 'This email is already registered. Try logging in.' });
        return;
      }
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
      });

      const { user: newUser, accessToken } = res.data.data;
      setAccessToken(accessToken);

      login(newUser);
      addToast(`Welcome to AniCart, ${newUser.name}! Your account has been created. ✦`, 'success');
      navigate(PAGES.DASHBOARD);
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      addToast(msg, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 1, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(255,45,120,0.4))' }} />

        <div className="glass-card auth-card animate-fade-up">

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1, 2].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: s <= step
                    ? 'linear-gradient(90deg, var(--neon), var(--pink))'
                    : 'var(--glass-border)',
                  transition: 'all 0.5s ease',
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
            <div className="auth-subtitle">◈ New Profile Initialization ◈</div>
            <div style={{ marginTop: 20 }}>
              <div className="auth-title">
                {step === 1 ? 'Create Your Profile' : 'Secure Your Account'}
              </div>
              <div className="auth-desc">
                {step === 1
                  ? 'Step 1 of 2 — Identity Configuration'
                  : 'Step 2 of 2 — Security Protocol Setup'}
              </div>
            </div>
          </div>

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <form className="auth-form" onSubmit={handleStep1} noValidate>
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">✦</span>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Anime Pilot"
                    value={form.name}
                    onChange={handleChange('name')}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <div className="form-error">⚠ {errors.name}</div>}
              </div>

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
                  />
                </div>
                {errors.email && <div className="form-error">⚠ {errors.email}</div>}
              </div>

              <button type="submit" className="btn-primary btn-full" style={{ marginTop: 8 }}>
                Continue → Security Setup
              </button>

              {/* Back */}
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.88rem',
                    color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => navigate(PAGES.LOGIN)}
                >
                  Already have an account?{' '}
                  <span style={{ color: 'var(--neon)', fontWeight: 600 }}>Sign In →</span>
                </span>
              </div>
            </form>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Identity summary */}
              <div style={{ padding: '12px 16px', background: 'rgba(0,243,255,0.04)',
                border: '1px solid rgba(0,243,255,0.15)', borderRadius: 10, marginTop: -4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--neon), var(--purple-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '1rem',
                    color: 'var(--bg-void)' }}>
                    {form.name.trim()[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '1rem', color: 'var(--text-primary)' }}>{form.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{form.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none',
                      color: 'var(--neon)', cursor: 'pointer', fontSize: '0.82rem',
                      fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Create Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">◉</span>
                  <input
                    className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min 8 chars, uppercase + number"
                    value={form.password}
                    onChange={handleChange('password')}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button type="button" className="toggle-password"
                    onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                    {showPwd ? '◎' : '●'}
                  </button>
                </div>
                {errors.password && <div className="form-error">⚠ {errors.password}</div>}

                {/* Strength meter */}
                {form.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{ width: strength.width, background: strength.color }}
                      />
                    </div>
                    <span className="strength-text" style={{ color: strength.color }}>
                      {strength.label && `Strength: ${strength.label}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">◉</span>
                  <input
                    className="form-input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button type="button" className="toggle-password"
                    onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? '◎' : '●'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="form-error">⚠ {errors.confirmPassword}</div>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <div style={{ fontSize: '0.82rem', color: '#00ff88', display: 'flex', gap: 6, alignItems: 'center' }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="form-group">
                <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={handleChange('terms')}
                    style={{ accentColor: 'var(--neon)', marginTop: 3, flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.88rem',
                    color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <span style={{ color: 'var(--neon)', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => addToast('Terms of Service — AniCart Databank Protocol v2.4', 'info')}>
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span style={{ color: 'var(--neon)', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => addToast('Privacy Policy — Your data is protected by quantum encryption!', 'info')}>
                      Privacy Policy
                    </span>
                  </span>
                </label>
                {errors.terms && <div className="form-error">⚠ {errors.terms}</div>}
              </div>

              <button type="submit" className="btn-primary btn-full btn-pink" disabled={loading}
                style={{ marginTop: 4 }}>
                {loading ? (
                  <><span className="loading-spinner" style={{ borderTopColor: 'white' }} /> Initializing Profile...</>
                ) : (
                  <>✦ Create My AniCart Profile</>
                )}
              </button>

              <button type="button"
                onClick={() => { setStep(1); setErrors({}); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.88rem', fontFamily: 'Rajdhani, sans-serif', cursor: 'pointer',
                  textAlign: 'center', transition: 'all 0.2s' }}
              >
                ← Back to Step 1
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="auth-footer" style={{ marginTop: 24 }}>
            <span
              className="auth-link"
              onClick={() => navigate(PAGES.LANDING)}
              style={{ fontSize: '0.82rem', color: 'var(--text-muted)', opacity: 0.7 }}
            >
              ← Back to Landing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
