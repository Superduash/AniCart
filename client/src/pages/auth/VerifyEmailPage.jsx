import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';
import apiClient from '../../api/client';

export default function VerifyEmailPage() {
  useTitle('Verify Email');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    apiClient.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="glass-card auth-card animate-fade-in">
          <div className="auth-header">
            <div className="auth-logo">ANI<span>CART</span></div>
          </div>

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="loading-spinner light" style={{ width: 40, height: 40, margin: '0 auto 20px' }} />
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-base)', color: 'var(--color-text-2)', letterSpacing: 2, textTransform: 'uppercase' }}>
                Verifying your email...
              </div>
            </div>
          )}

          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 20, color: 'var(--color-success)' }}>✓</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: 12 }}>Email Verified!</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 28 }}>
                Your account is now active. You can sign in and start browsing.
              </p>
              <Link to="/auth/login" className="btn btn-primary">Sign In →</Link>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 20, color: 'var(--color-error)' }}>✗</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: 12 }}>Link Expired</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 28 }}>
                This verification link has expired or is invalid. Request a new one.
              </p>
              <Link to="/auth/signup" className="btn btn-secondary">← Back to Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
