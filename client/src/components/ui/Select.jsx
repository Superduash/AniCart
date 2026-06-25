import React from 'react';

export default function Select({
  name,
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  style = {},
  ...props
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9375rem',
        outline: 'none',
        transition: 'border-color 0.15s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxSizing: 'border-box',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 36,
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ background: 'var(--color-surface)' }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
