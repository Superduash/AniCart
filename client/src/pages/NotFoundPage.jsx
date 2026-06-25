import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 20, fontFamily: 'Orbitron, monospace', fontWeight: 800, color: 'var(--color-accent)' }}>404</div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-text)', marginBottom: 16 }}>Page Not Found</div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 32 }}>
        We couldn't find the page you're looking for. It might have been removed or the link is incorrect.
      </p>
      <Link to="/marketplace" className="btn btn-primary">
        Go to Marketplace
      </Link>
    </div>
  );
}
