import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import SEO from '../../components/SEO';
import { useTitle } from '../../hooks/useTitle';
import apiClient from '../../api/client';

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '#475569', width: '0%' };
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

export default function SignupPage() {
  useTitle('Create Account');
  const { user } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = getPasswordStrength(form.password);

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'At least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Include a number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await apiClient.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });
      setSubmittedEmail(form.email);
      setSubmitted(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      addToast(msg, 'error');
      if (msg.toLowerCase().includes('email')) setStep(1);
    }
    setLoading(false);
  };

  // Step indicators
  const steps = [1, 2];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 1, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(255,45,120,0.4))' }} />

        <div className="glass-card auth-card animate-fade-up">
          {/* Submitted / verify email */}
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>✉</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: 12 }}>Check Your Email</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 24 }}>
                We sent a verification link to <strong style={{ color: 'var(--color-accent)' }}>{submittedEmail}</strong>. Click it to activate your account.
              </p>
              <button onClick={() => { setSubmitted(false); setStep(1); setForm({ name: '', email: '', password: '', confirmPassword: '' }); }} className="btn btn-secondary btn-sm">
                ← Change email
              </button>
              {/* H5 Fix: resend verification email button — backend POST /auth/resend-verification exists */}
              <button
                onClick={async () => {
                  try {
                    await apiClient.post('/auth/resend-verification', { email: submittedEmail });
                    addToast('Verification email resent!', 'success');
                  } catch { addToast('Failed to resend. Try again later.', 'error'); }
                }}
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12, display: 'block', width: '100%' }}
              >
                Resend verification email
              </button>
            </div>
          ) : (
            <>
              {/* Step progress */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {steps.map(s => (
                  <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'linear-gradient(90deg, var(--color-accent), var(--color-pink))' : 'var(--color-border)', transition: 'background 0.5s' }} />
                ))}
              </div>

              <div className="auth-header" style={{ marginBottom: 24 }}>
                <div className="auth-logo">ANI<span>CART</span></div>
                <div className="auth-subtitle">◈ New Profile Initialization ◈</div>
                <div className="auth-title" style={{ marginTop: 16 }}>
                  {step === 1 ? 'Create Your Profile' : 'Secure Your Account'}
                </div>
                <p className="auth-desc">Step {step} of 2</p>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <form className="auth-form" onSubmit={handleStep1} noValidate>
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">✦</span>
                      <input className={`form-input${errors.name ? ' error' : ''}`} type="text" placeholder="Anime Pilot" value={form.name} onChange={handleChange('name')} autoComplete="name" />
                    </div>
                    {errors.name && <div className="form-error">⚠ {errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">◈</span>
                      <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="pilot@anicart.com" value={form.email} onChange={handleChange('email')} autoComplete="email" />
                    </div>
                    {errors.email && <div className="form-error">⚠ {errors.email}</div>}
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
                    Continue → Security Setup
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <Link to="/auth/login" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)', textDecoration: 'none' }}>
                      Already have an account? <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Sign In →</span>
                    </Link>
                  </div>
                </form>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  {/* Summary */}
                  <div style={{ padding: '10px 14px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-glow)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-void)', flexShrink: 0, overflow: 'hidden' }}>
                      {form.name[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--color-text)', fontSize: 'var(--text-base)' }}>{form.name}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.email}</div>
                    </div>
                    <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Edit</button>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label">Create Password</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">◉</span>
                      <input className={`form-input${errors.password ? ' error' : ''}`} type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars, uppercase + number" value={form.password} onChange={handleChange('password')} autoComplete="new-password" disabled={loading} />
                      <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)} tabIndex={-1} aria-label="Toggle password visibility">{showPwd ? '◎' : '●'}</button>
                    </div>
                    {errors.password && <div className="form-error">⚠ {errors.password}</div>}
                    {form.password && (
                      <div className="password-strength">
                        <div className="strength-bar"><div className="strength-fill" style={{ width: strength.width, background: strength.color }} /></div>
                        <span className="strength-text" style={{ color: strength.color }}>{strength.label && `Strength: ${strength.label}`}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">◉</span>
                      <input className={`form-input${errors.confirmPassword ? ' error' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} autoComplete="new-password" disabled={loading} />
                      <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label="Toggle confirm password visibility">{showConfirm ? '◎' : '●'}</button>
                    </div>
                    {errors.confirmPassword && <div className="form-error">⚠ {errors.confirmPassword}</div>}
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', gap: 6 }}>✓ Passwords match</div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
                    {loading ? <><span className="loading-spinner" /> Creating account...</> : '✦ Create My AniCart Profile'}
                  </button>
                  <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="btn btn-muted btn-full">← Back to Step 1</button>
                </form>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', textDecoration: 'none' }}>← Back to Landing</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
