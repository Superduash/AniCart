import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const NAV = [
  { path: '/admin/products', label: 'Product Queue', icon: '⚡' },
  { path: '/admin/creators', label: 'Creator Apps',  icon: '👤' },
  { path: '/admin/homepage', label: 'Homepage Layout', icon: '🏠' },
];

export default function AdminShell() {
  const navigate = useNavigate();

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: isActive ? '10px 9px' : '10px 12px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem',
    color: isActive ? 'var(--color-pink)' : 'var(--color-text-2)',
    background: isActive ? 'rgba(255,45,120,0.08)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--color-pink)' : '3px solid transparent',
    textDecoration: 'none', transition: 'all 0.15s', marginBottom: 2, cursor: 'pointer',
  });

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar" style={{ background: 'var(--color-deep)', borderRight: '1px solid var(--color-border)' }}>
        <div className="sidebar-user" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', letterSpacing: 2, color: 'var(--color-pink)', marginBottom: 8 }}>ADMIN PANEL</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => linkStyle(isActive)}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            ← Back to Site
          </button>
        </div>
      </aside>
      <div className="dashboard-content"><Outlet /></div>
    </div>
  );
}
