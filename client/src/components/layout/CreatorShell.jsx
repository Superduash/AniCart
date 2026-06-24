import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

const NAV = [
  { path: '/creator/uploads', label: 'My Uploads', icon: '📤' },
  { path: '/creator/stats',   label: 'Stats',      icon: '📊' },
];

export default function CreatorShell() {
  const { user, logout } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: isActive ? '10px 9px 10px 9px' : '10px 12px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
    background: isActive ? 'var(--color-accent-dim)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
    textDecoration: 'none', transition: 'all 0.15s', marginBottom: 2, cursor: 'pointer',
  });

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-user">
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.75rem', letterSpacing: 2, color: 'var(--color-accent)', marginBottom: 8, textTransform: 'uppercase' }}>
            Creator Studio
          </div>
          <div className="sidebar-name">{user?.name}</div>
          <div className="sidebar-email">{user?.email}</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => linkStyle(isActive)}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
          <NavLink to="/dashboard" style={({ isActive }) => linkStyle(isActive)}>
            <span>📚</span> My Dashboard
          </NavLink>
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
