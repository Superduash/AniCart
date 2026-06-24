import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useNavigate } from 'react-router-dom';
import { useWindowWidth } from '../../hooks/useWindowWidth';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const NAV_ITEMS = [
  { path: '/dashboard/library',  label: 'Library',  icon: '📚' },
  { path: '/dashboard/orders',   label: 'Orders',   icon: '📦' },
  { path: '/dashboard/wishlist', label: 'Wishlist', icon: '♡' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙' },
];

export default function DashboardShell() {
  const { user, logout } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width < 768;

  const handleLogout = async () => {
    await logout();
    addToast('Signed out successfully.', 'info');
    navigate('/');
  };

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: isActive ? '10px 9px 10px 9px' : '10px 12px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
    background: isActive ? 'var(--color-accent-dim)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
    textDecoration: 'none',
    transition: 'all 0.15s',
    marginBottom: 2,
    cursor: 'pointer',
  });

  return (
    <div className="dashboard-layout">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="dashboard-sidebar">
          {/* User info */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-name">{user?.name}</div>
            <div className="sidebar-email">{user?.email}</div>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => linkStyle(isActive)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            {/* Creator studio link (if creator) */}
            {(user?.role === 'creator' || user?.role === 'admin') && (
              <>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
                <NavLink
                  to="/creator"
                  style={({ isActive }) => linkStyle(isActive)}
                >
                  <span className="sidebar-link-icon">🎨</span>
                  Creator Studio
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 12px', borderRadius: 'var(--radius-md)',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.88rem',
                color: 'var(--color-text-3)', background: 'none', border: 'none',
                cursor: 'pointer', transition: 'color 0.15s, background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-3)'; e.currentTarget.style.background = 'transparent'; }}
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Content */}
      <div className="dashboard-content">
        <Outlet />
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', zIndex: 100, padding: '8px 0 12px',
        }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '6px 4px', textDecoration: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
                transition: 'color 0.15s',
              })}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
