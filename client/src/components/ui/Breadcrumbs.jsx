import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 24 }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '0.95rem',
        fontWeight: 600,
        letterSpacing: 1
      }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isLast ? (
                <span style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    to={item.path}
                    style={{
                      color: 'var(--color-text-3)',
                      textDecoration: 'none',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-3)'}
                  >
                    {item.label}
                  </Link>
                  <span style={{ color: 'var(--color-border)', fontSize: '0.8rem' }}>/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
