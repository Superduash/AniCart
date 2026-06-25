import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useNavigate } from 'react-router-dom';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { Library, Package, Heart, Settings, Paintbrush, LogOut } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const NAV_ITEMS = [
  { path: '/dashboard/library',  label: 'Library',  icon: <Library size={18} /> },
  { path: '/dashboard/orders',   label: 'Orders',   icon: <Package size={18} /> },
  { path: '/dashboard/wishlist', label: 'Wishlist', icon: <Heart size={18} /> },
  { path: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
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
                  <span className="sidebar-link-icon"><Paintbrush size={18} /></span>
                  Creator Studio
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <button
              onClick={handleLogout}
              className="nav-dropdown-logout"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Navigation */}
        {isMobile && (
          <nav className="dashboard-mobile-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `dashboard-mobile-link${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            {(user?.role === 'creator' || user?.role === 'admin') && (
              <NavLink
                to="/creator"
                className={({ isActive }) => `dashboard-mobile-link${isActive ? ' active' : ''}`}
              >
                <Paintbrush size={18} />
                Creator Studio
              </NavLink>
            )}
          </nav>
        )}

        <div className="dashboard-content" style={{ padding: isMobile ? '24px 16px 100px' : '32px 40px' }}>
          <Outlet />
        </div>
      </div>

    </div>
  );
}
