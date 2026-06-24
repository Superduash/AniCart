import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
  const { user } = useAuth();
  const { setSearchOpen } = useUI();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: '🏠', path: '/' },
    { label: 'Browse', icon: '🛍️', path: '/marketplace' },
    { label: 'Search', icon: '🔍', action: () => setSearchOpen(true) },
    { label: 'Wishlist', icon: '❤️', path: '/dashboard/wishlist', requiresAuth: true },
    { label: 'Profile', icon: '👤', path: user ? '/dashboard' : '/auth/login' }
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(5, 13, 31, 0.95)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '12px 8px calc(12px + env(safe-area-inset-bottom))',
      zIndex: 100
    }}>
      {navItems.map((item, i) => {
        if (item.requiresAuth && !user) return null;

        const isActive = item.path && location.pathname === item.path;
        
        const content = (
          <>
            <span style={{ fontSize: '1.4rem', marginBottom: 4, opacity: isActive ? 1 : 0.7 }}>
              {item.icon}
            </span>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)'
            }}>
              {item.label}
            </span>
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', top: 0, width: '40%', height: 2,
                    background: 'var(--color-accent)',
                    boxShadow: '0 0 8px var(--color-accent)'
                  }}
                />
              )}
            </AnimatePresence>
          </>
        );

        if (item.action) {
          return (
            <button
              key={`nav-${i}`}
              onClick={item.action}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'none', border: 'none', padding: '4px 8px',
                position: 'relative', flex: 1
              }}
              aria-label={item.label}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={`nav-${i}`}
            to={item.path}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textDecoration: 'none', padding: '4px 8px',
              position: 'relative', flex: 1
            }}
            aria-label={item.label}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
