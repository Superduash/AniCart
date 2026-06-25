import React from 'react';

const variants = {
  primary: {
    background: 'var(--color-pink)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-surface-2)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-2)',
    border: '1px solid var(--color-border)',
  },
  danger: {
    background: 'var(--color-error)',
    color: '#fff',
    border: 'none',
  },
  accent: {
    background: 'var(--color-accent)',
    color: 'var(--color-void)',
    border: 'none',
  },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: '0.8125rem' },
  md: { padding: '10px 20px', fontSize: '0.9375rem' },
  lg: { padding: '14px 28px', fontSize: '1rem' },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  style = {},
  className = '',
  ...props
}) {
  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 'var(--radius-md)',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.5px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        outline: 'none',
        ...variantStyle,
        ...sizeStyle,
        ...style,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '1'; }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
}
