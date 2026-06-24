import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';
import { useDebounce } from '../../hooks/useDebounce';
import apiClient from '../../api/client';

export default function SearchOverlay() {
  const { setSearchOpen } = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounced = useDebounce(query, 300);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/products', { params: { search: debounced, limit: 6 } });
        setResults(res.data?.data?.products || res.data?.data || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [debounced]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
  };

  const handleResultClick = (product) => {
    setSearchOpen(false);
    navigate(`/products/${product._id || product.id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setSearchOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(2,6,23,0.96)',
          backdropFilter: 'blur(12px)',
          zIndex: 400,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 20px 40px',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 640 }}
        >
          {/* Search input */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-glow)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              boxShadow: 'var(--shadow-neon)',
            }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--color-accent)', flexShrink: 0 }}>🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search wallpapers, series..."
                aria-label="Search"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--color-text)', fontFamily: 'Inter, sans-serif',
                  fontSize: 'var(--text-lg)', caretColor: 'var(--color-accent)',
                }}
              />
              {loading && <div className="loading-spinner light" />}
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search"
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '1rem', padding: 4, flexShrink: 0 }}>
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Results */}
          {query.trim() ? (
            <div style={{
              marginTop: 8,
              background: 'rgba(10,22,40,0.98)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}>
              {results.length > 0 ? (
                <>
                  {results.map(product => (
                    <button
                      key={product._id || product.id}
                      onClick={() => handleResultClick(product)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        width: '100%', padding: '12px 16px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.15s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-dim)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <img
                        src={product.assets?.preview?.url || product.img || ''}
                        alt=""
                        style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: 'var(--color-surface-2)' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 2 }}>
                          {product.series}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', flexShrink: 0 }}>
                        ${(product.price || 0).toFixed(2)}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => handleResultClick({ _id: null }) || navigate(`/marketplace?search=${encodeURIComponent(query)}`) || setSearchOpen(false)}
                    style={{
                      display: 'block', width: '100%', padding: '12px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                      fontSize: 'var(--text-sm)', color: 'var(--color-accent)',
                      textAlign: 'center', transition: 'background 0.15s',
                      letterSpacing: 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-dim)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Press Enter to see all results →
                  </button>
                </>
              ) : !loading && (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }}>
                  No results for "{query}"
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }}>
              Start typing to search
              <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', opacity: 0.6 }}>
                Press Esc to close
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
