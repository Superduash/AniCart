import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LayoutGrid, Search, Heart, User, ShoppingCart } from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();
  const { setSearchOpen } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', icon: <Home size={24} />, path: '/' },
    { label: 'Browse', icon: <LayoutGrid size={24} />, path: '/marketplace' },
    { label: 'Cart', icon: <ShoppingCart size={24} />, path: '/cart' },
    { label: 'Wishlist', icon: <Heart size={24} />, action: () => navigate(user ? '/dashboard/wishlist' : '/auth/login'), path: '/dashboard/wishlist' },
    { label: 'Profile', icon: <User size={24} />, path: user ? '/dashboard' : '/auth/login' }
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
        const isActive = item.path && (
          location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path))
        );
        
        const content = (
          <>
            <span style={{ fontSize: '1.5rem', marginBottom: 2, opacity: isActive ? 1 : 0.7 }}>
              {item.icon}
            </span>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
              letterSpacing: 0.5
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
                    position: 'absolute', top: 0, width: '40%', height: 3,
                    background: 'var(--color-accent)',
                    boxShadow: '0 0 12px var(--color-accent), 0 0 4px var(--color-accent)'
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
                background: 'none', border: 'none', padding: '8px 4px',
                position: 'relative', flex: 1,
                minHeight: 56, minWidth: 56
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
              textDecoration: 'none', padding: '8px 4px',
              position: 'relative', flex: 1,
              minHeight: 56, minWidth: 56
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
