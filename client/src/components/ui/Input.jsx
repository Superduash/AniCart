import React from 'react';

const inputBaseStyle = {
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
  boxSizing: 'border-box',
};

export default function Input({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  min,
  max,
  step,
  style = {},
  ...props
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      style={{ ...inputBaseStyle, ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      {...props}
    />
  );
}
