import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowWidth } from '../../hooks/useWindowWidth';

export default function Modal({ isOpen, onClose, title, size = 'md', children }) {
  const dialogRef = useRef(null);
  const width = useWindowWidth();
  const isMobile = width < 768;

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [isOpen]);

  const maxWidths = { sm: 440, md: 600, lg: 820 };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 300,
            }}
            aria-hidden="true"
          />
          {/* Modal */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{
              position: 'fixed', inset: 0, zIndex: 301,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: isMobile ? 12 : 20, pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%', maxWidth: maxWidths[size],
              background: 'rgba(10,22,40,0.98)',
              backdropFilter: 'blur(24px)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden',
              pointerEvents: 'all',
              maxHeight: isMobile ? 'calc(100vh - 24px)' : 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }} />

              {/* Header */}
              {title && (
                <div style={{ padding: isMobile ? '20px 16px 0' : '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <h2 id="modal-title" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-xl)', color: 'var(--color-text)', margin: 0 }}>
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.target.style.color = 'var(--color-text)'; e.target.style.borderColor = 'var(--color-border-glow)'; }}
                    onMouseLeave={e => { e.target.style.color = 'var(--color-text-3)'; e.target.style.borderColor = 'var(--color-border)'; }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Content */}
              <div style={{ padding: isMobile ? (title ? '16px 16px 16px' : '16px') : (title ? '20px 28px 28px' : '28px'), overflowY: 'auto', flex: 1 }}>
                {!title && (
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', cursor: 'pointer' }}
                  >✕</button>
                )}
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
