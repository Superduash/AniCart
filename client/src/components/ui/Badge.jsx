import React from 'react';

const variantStyles = {
  neon: { background: 'rgba(0,210,255,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(0,210,255,0.25)' },
  pink: { background: 'rgba(255,45,120,0.12)', color: 'var(--color-pink)', border: '1px solid rgba(255,45,120,0.25)' },
  success: { background: 'rgba(0,200,100,0.12)', color: '#00c864', border: '1px solid rgba(0,200,100,0.25)' },
  error: { background: 'rgba(255,60,60,0.12)', color: 'var(--color-error)', border: '1px solid rgba(255,60,60,0.25)' },
  warning: { background: 'rgba(255,200,0,0.12)', color: '#f5c400', border: '1px solid rgba(255,200,0,0.25)' },
  default: { background: 'var(--color-surface-2)', color: 'var(--color-text-2)', border: '1px solid var(--color-border)' },
};

export default function Badge({ children, variant = 'default', style = {} }) {
  const vs = variantStyles[variant] || variantStyles.default;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        fontSize: '0.75rem',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        ...vs,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
