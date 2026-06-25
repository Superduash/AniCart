import React from 'react';
import { Link } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import Footer from '../components/layout/Footer';

export default function CheckoutSuccessPage() {
  useTitle('Payment Successful');

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 480, width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 48, textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.1)', border: '2px solid var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '3rem', color: 'var(--color-success)' }}>
            ✓
          </div>
          
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-text)', marginBottom: 12 }}>
            Payment Successful!
          </h1>
          
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-base)', color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 32 }}>
            Thank you for your purchase. Your payment has been processed and your wallpapers have been added to your library.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/dashboard/library" className="btn btn-primary btn-lg">
              Go to My Library
            </Link>
            <Link to="/marketplace" className="btn btn-secondary btn-lg">
              Continue Shopping
            </Link>
          </div>
          
          <div style={{ marginTop: 32, fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
            A receipt has been sent to your email address.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
