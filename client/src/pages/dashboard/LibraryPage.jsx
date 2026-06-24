import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import { ProductCardSkeleton, EmptyState } from '../../components/ui/Skeleton';
import { Link } from 'react-router-dom';

const AVAILABLE_RESOLUTIONS = ['4k', '2k', '1080p'];

function LibraryCard({ item, onDownload }) {
  const product = item.product || item;
  const id = product._id || product.id;
  const previewUrl = product.assets?.preview?.url || product.img || product.imageUrl;
  const [resolution, setResolution] = useState('4k');
  const [downloading, setDownloading] = useState(false);

  // Build list of resolutions the product actually has available
  const availableRes = product.assets
    ? AVAILABLE_RESOLUTIONS.filter(r => product.assets[r]?.key)
    : AVAILABLE_RESOLUTIONS; // fallback to all if unknown

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(product, resolution);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      role="listitem"
    >
      {/* Thumbnail */}
      <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: 'var(--color-surface-2)', flexShrink: 0 }}>
        <img
          src={previewUrl || ''}
          alt={product.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 2 }}>
            {product.series}
          </div>
        </div>

        {/* M5 / C9 Fix: resolution picker showing only available resolutions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-3)', flexShrink: 0 }}>
            Resolution:
          </label>
          <select
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            style={{ flex: 1, padding: '5px 8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-accent)', fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
          >
            {(availableRes.length > 0 ? availableRes : AVAILABLE_RESOLUTIONS).map(r => (
              <option key={r} value={r}>{r.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          aria-label={`Download ${product.name} at ${resolution}`}
          style={{ background: 'var(--color-accent)', color: 'var(--color-void)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 1, cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.7 : 1, transition: 'opacity 0.15s', width: '100%' }}
        >
          {downloading ? 'Generating link...' : '↓ Download'}
        </button>
      </div>
    </article>
  );
}

export default function LibraryPage() {
  useTitle('My Library');
  const { user } = useAuth();
  const { addToast } = useUI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/users/library')
      .then(r => {
        const data = r.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // C9 / H1 Fix: pass resolution param and use correct 'downloadUrl' field name
  const handleDownload = async (product, resolution = '4k') => {
    const id = product._id || product.id;
    try {
      const res = await apiClient.get(`/products/${id}/download`, {
        params: { resolution }
      });
      // H1 Fix: backend returns 'downloadUrl' not 'url'
      const url = res.data?.data?.downloadUrl || res.data?.downloadUrl;
      if (url) window.open(url, '_blank', 'noopener');
      else addToast('Download URL not available.', 'error');
    } catch (err) {
      const msg = err.response?.data?.message || 'Download failed. Please try again.';
      addToast(msg, 'error');
    }
  };

  // Normalize library items (they may be wrapped in {product: {...}} or just products)
  const products = items.map(item => item.product || item).filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', marginBottom: 6 }}>
          Your Library
        </h1>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)' }}>
          {loading ? '...' : `${products.length} wallpaper${products.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {loading ? (
        <div className="products-grid" role="list" aria-busy="true" aria-label="Loading library">
          {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="💎"
          title="Your library is empty"
          body="Purchase wallpapers from the marketplace and they'll appear here for instant download."
          ctaLabel="Browse Wallpapers"
          ctaTo="/marketplace"
        />
      ) : (
        <div className="products-grid" role="list">
          {items.map((item, i) => (
            <LibraryCard key={(item.product?._id || item._id || item.id || i)} item={item} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
