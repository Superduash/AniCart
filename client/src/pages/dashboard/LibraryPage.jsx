import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../../components/ui/Skeleton';

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

  const handleDownload = async (product) => {
    const id = product._id || product.id;
    try {
      const res = await apiClient.get(`/products/${id}/download`);
      const url = res.data?.data?.url || res.data?.url;
      if (url) window.open(url, '_blank', 'noopener');
      else addToast('Download URL not available.', 'error');
    } catch { addToast('Download failed. Please try again.', 'error'); }
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
          {products.map(p => (
            <ProductCard key={p._id || p.id} product={p} inLibrary onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
