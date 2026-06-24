import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useUI } from '../../contexts/UIContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { motion, AnimatePresence } from 'framer-motion';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function AvatarDropdown({ user, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleLogout = async () => {
    await logout();
    addToast('Signed out successfully.', 'info');
    navigate('/');
    onClose();
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 8,
        background: 'rgba(10,22,40,0.98)', backdropFilter: 'blur(24px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '8px',
        minWidth: 220, zIndex: 200,
        boxShadow: 'var(--shadow-xl)',
      }}
      role="menu"
      aria-label="User menu"
    >
      {/* User info */}
      <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
          {user.name}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: 'var(--color-text-3)', marginTop: 2 }}>
          {user.email}
        </div>
        {user.role && user.role !== 'user' && (
          <div style={{
            marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: user.role === 'admin' ? 'rgba(255,45,120,0.12)' : 'rgba(0,243,255,0.08)',
            color: user.role === 'admin' ? 'var(--color-pink)' : 'var(--color-accent)',
            fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          }}>
            {user.role}
          </div>
        )}
      </div>

      {/* Menu items */}
      {[
        { label: 'Dashboard', icon: '📚', path: '/dashboard' },
        ...(user.role === 'creator' || user.role === 'admin' ? [{ label: 'Creator Studio', icon: '🎨', path: '/creator' }] : []),
        ...(user.role === 'admin' ? [{ label: 'Admin Panel', icon: '⚡', path: '/admin' }] : []),
      ].map(item => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClose}
          role="menuitem"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 'var(--radius-md)',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem',
            color: 'var(--color-text-2)', textDecoration: 'none',
            transition: 'color 0.15s, background 0.15s', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-accent-dim)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-2)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ fontSize: '1rem' }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}

      <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 8, paddingTop: 8 }}>
        <button
          onClick={handleLogout}
          role="menuitem"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '9px 12px', borderRadius: 'var(--radius-md)',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem',
            color: 'var(--color-text-3)', background: 'none', border: 'none',
            cursor: 'pointer', transition: 'color 0.15s, background 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-3)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { setSearchOpen, addToast } = useUI();
  const width = useWindowWidth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setAvatarOpen(false); }, [location.pathname]);

  const isMobile = width < 768;

  return (
    <nav
      className={`navbar${scrolled ? ' scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link to="/" className="nav-logo" aria-label="AniCart — Premium Anime Wallpapers">
        ANI<span>CART</span>
      </Link>

      {/* Desktop nav */}
      {!isMobile && (
        <ul className="nav-links" style={{ flex: 1, justifyContent: 'center', gap: '32px' }}>
          <li>
            <Link to="/marketplace" className="nav-link" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.05rem', letterSpacing: 1 }}>
              Browse
            </Link>
          </li>
          <li>
            <Link to="/" className="nav-link" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.05rem', letterSpacing: 1 }}>
              Home
            </Link>
          </li>
          <li>
            <Link to={user ? (user.role === 'creator' || user.role === 'admin' ? '/creator' : '/creator/apply') : '/auth/signup'} className="nav-link" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.05rem', letterSpacing: 1 }}>
              Creators
            </Link>
          </li>
          {user && user.role === 'admin' && (
            <li>
              <Link to="/admin" className="nav-link" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.05rem', letterSpacing: 1, color: 'var(--color-pink)' }}>
                Admin Panel
              </Link>
            </li>
          )}
        </ul>
      )}

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Search */}
        {!isMobile ? (
          <div
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)', padding: '6px 16px',
              cursor: 'pointer', color: 'var(--color-text-3)',
              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', width: 220,
              transition: 'border-color 0.15s, background 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
          >
            <span>🔍</span>
            <span>Search...</span>
            <span style={{ marginLeft: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-3)' }}>Ctrl K</span>
          </div>
        ) : (
          <button
            className="nav-link"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search (Ctrl+K)"
            style={{ fontSize: '1rem', padding: '8px 10px' }}
          >
            🔍
          </button>
        )}

        {!isMobile && user && (
          <Link
            to="/dashboard/wishlist"
            className="nav-link"
            aria-label="Wishlist"
            style={{ fontSize: '1rem', padding: '8px 10px' }}
          >
            ❤️
          </Link>
        )}

        {/* Cart */}
        <Link
          to="/cart"
          className="nav-link"
          aria-label={`${cartCount} items in cart`}
          style={{ position: 'relative', padding: '8px 10px', fontSize: '1rem' }}
        >
          🛒
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 18, height: 18,
                  background: 'var(--color-accent)',
                  borderRadius: '50%',
                  fontSize: '0.65rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  color: 'var(--color-void)',
                  pointerEvents: 'none',
                }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Auth / Avatar */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setAvatarOpen(p => !p)}
              aria-label="User menu"
              aria-expanded={avatarOpen}
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: 'var(--gradient-brand)',
                border: avatarOpen ? '2px solid var(--color-accent)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '0.75rem',
                color: 'var(--color-void)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                marginLeft: 4,
              }}
            >
              {getInitials(user.name)}
            </button>
            <AnimatePresence>
              {avatarOpen && <AvatarDropdown user={user} onClose={() => setAvatarOpen(false)} />}
            </AnimatePresence>
          </div>
        ) : (
          !isMobile ? (
            <>
              <Link to="/auth/login" className="nav-link nav-btn-outline">Login</Link>
              <Link to="/auth/signup" className="nav-link nav-btn-solid">Sign Up</Link>
            </>
          ) : (
            <button
              className="nav-link"
              onClick={() => setMobileOpen(p => !p)}
              aria-label="Open menu"
              style={{ fontSize: '1.2rem', padding: '8px 10px' }}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          )
        )}

        {isMobile && user && (
          <button
            className="nav-link"
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Open menu"
            style={{ fontSize: '1.2rem', padding: '8px 10px' }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 70, left: 0, right: 0,
              background: 'rgba(5,13,31,0.98)', backdropFilter: 'blur(24px)',
              borderBottom: '1px solid var(--color-border)',
              padding: '20px 24px 28px',
              zIndex: 99,
            }}
          >
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '0.85rem',
                  color: 'var(--color-void)',
                }}>
                  {getInitials(user.name)}
                </div>
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--color-text)' }}>{user.name}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: 'var(--color-text-3)' }}>{user.email}</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link to="/marketplace" className="nav-link" style={{ padding: '12px 8px' }}>Browse</Link>
              <Link to="/" className="nav-link" style={{ padding: '12px 8px' }}>Home</Link>
              <Link to={user ? (user.role === 'creator' || user.role === 'admin' ? '/creator' : '/creator/apply') : '/auth/signup'} className="nav-link" style={{ padding: '12px 8px' }}>Creators</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="nav-link" style={{ padding: '12px 8px' }}>Dashboard</Link>
                  {(user.role === 'creator' || user.role === 'admin') && (
                    <Link to="/creator" className="nav-link" style={{ padding: '12px 8px' }}>Creator Studio</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="nav-link" style={{ padding: '12px 8px' }}>Admin Panel</Link>
                  )}
                  <button
                    onClick={async () => {
                      await logout();
                      addToast('Signed out successfully.', 'info');
                      navigate('/');
                    }}
                    className="nav-link"
                    style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--color-error)', background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="nav-link" style={{ padding: '12px 8px' }}>Login</Link>
                  <Link to="/auth/signup" className="nav-link nav-btn-solid" style={{ padding: '12px 8px', marginTop: 8 }}>Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
