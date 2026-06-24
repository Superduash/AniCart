import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useTitle } from '../../hooks/useTitle';
import apiClient from '../../api/client';

export default function CreatorApplyPage() {
  useTitle('Apply to Become a Creator | AniCart');
  const { user, updateUser } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const [form, setForm] = useState({ displayName: '', portfolioLink: '', paymentEmail: '', rightsAgreement: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If user is already a creator or admin, redirect to creator studio
  useEffect(() => {
    if (user?.role === 'creator' || user?.role === 'admin') {
      navigate('/creator/uploads', { replace: true });
    }
    // Pre-fill email
    if (user?.email) {
      setForm(p => ({ ...p, paymentEmail: p.paymentEmail || user.email }));
    }
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = 'Display name is required';
    else if (form.displayName.trim().length < 2) e.displayName = 'At least 2 characters';
    if (!form.paymentEmail.trim()) e.paymentEmail = 'Payment email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.paymentEmail)) e.paymentEmail = 'Enter a valid email';
    if (!form.rightsAgreement) e.rightsAgreement = 'You must agree to the rights policy';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await apiClient.post('/creator/apply', {
        displayName: form.displayName.trim(),
        portfolioLink: form.portfolioLink.trim() || undefined,
        paymentEmail: form.paymentEmail.trim().toLowerCase(),
        rightsAgreement: true,
      });

      const { role, creatorRequest } = res.data?.data || {};

      if (role === 'creator') {
        // Auto-approved! Update auth context and redirect to creator studio
        updateUser({ role: 'creator', creatorRequest });
        addToast('You are now a Creator! Welcome aboard. 🎨', 'success');
        navigate('/creator/uploads', { replace: true });
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Application failed. Please try again.';
      addToast(msg, 'error');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="glass-card auth-card animate-fade-up" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>📋</div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: 12 }}>
              Application Submitted!
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 24 }}>
              Your creator application is under review. You'll be notified once an admin reviews it.
            </p>
            <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 560 }}>
        <div className="glass-card auth-card animate-fade-up">
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
            <div className="auth-subtitle">◈ Creator Application ◈</div>
            <div className="auth-title" style={{ marginTop: 20 }}>Become a Creator</div>
            <p className="auth-desc">Share your anime art and start earning from your passion</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Display Name */}
            <div className="form-group">
              <label className="form-label">Creator Display Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">✦</span>
                <input
                  className={`form-input${errors.displayName ? ' error' : ''}`}
                  type="text"
                  placeholder="Your artist name"
                  value={form.displayName}
                  onChange={e => { setForm(p => ({ ...p, displayName: e.target.value })); if (errors.displayName) setErrors(p => ({ ...p, displayName: '' })); }}
                  disabled={loading}
                />
              </div>
              {errors.displayName && <div className="form-error">⚠ {errors.displayName}</div>}
            </div>

            {/* Portfolio Link */}
            <div className="form-group">
              <label className="form-label">Portfolio / Social Link (Optional)</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">🔗</span>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://twitter.com/yourhandle"
                  value={form.portfolioLink}
                  onChange={e => setForm(p => ({ ...p, portfolioLink: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Payment Email */}
            <div className="form-group">
              <label className="form-label">Payment Email</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◈</span>
                <input
                  className={`form-input${errors.paymentEmail ? ' error' : ''}`}
                  type="email"
                  placeholder="payouts@example.com"
                  value={form.paymentEmail}
                  onChange={e => { setForm(p => ({ ...p, paymentEmail: e.target.value })); if (errors.paymentEmail) setErrors(p => ({ ...p, paymentEmail: '' })); }}
                  disabled={loading}
                />
              </div>
              {errors.paymentEmail && <div className="form-error">⚠ {errors.paymentEmail}</div>}
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 4 }}>
                This email will be used for revenue payouts.
              </div>
            </div>

            {/* Rights Agreement */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.rightsAgreement}
                  onChange={e => { setForm(p => ({ ...p, rightsAgreement: e.target.checked })); if (errors.rightsAgreement) setErrors(p => ({ ...p, rightsAgreement: '' })); }}
                  style={{ accentColor: 'var(--color-accent)', marginTop: 2, flexShrink: 0 }}
                  disabled={loading}
                />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.6 }}>
                  I confirm that I hold original rights to all content I upload and agree to AniCart's Creator Terms & Rights Policy.
                </span>
              </label>
              {errors.rightsAgreement && <div className="form-error">⚠ {errors.rightsAgreement}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="loading-spinner" /> Submitting...</> : '✦ Submit Application'}
            </button>

            <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost btn-full" disabled={loading} style={{ marginTop: 8 }}>
              ← Go Back
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
