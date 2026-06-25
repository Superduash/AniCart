import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
  const location = useLocation();
  const pageTitle = location.pathname.includes('privacy') ? 'Privacy Policy' : 'Terms of Service';

  return (
    <div style={{ padding: '60px 24px', maxWidth: 800, margin: '0 auto', minHeight: 'calc(100vh - 200px)' }}>
      <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 24 }}>
        {pageTitle}
      </h1>
      <div style={{ padding: '32px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-text-2)', lineHeight: 1.6 }}>
          This page is under construction. Please check back later.
        </p>
      </div>
    </div>
  );
}
