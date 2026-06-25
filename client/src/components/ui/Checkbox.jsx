import React from 'react';

export default function Checkbox({
  name,
  checked,
  onChange,
  label,
  disabled,
  style = {},
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: 16,
          height: 16,
          accentColor: 'var(--color-accent)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      {label && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9375rem',
            color: 'var(--color-text-2)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
