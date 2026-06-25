import React from 'react';

export default function TextArea({
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
  style = {},
  ...props
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
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
        resize: 'vertical',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      {...props}
    />
  );
}
