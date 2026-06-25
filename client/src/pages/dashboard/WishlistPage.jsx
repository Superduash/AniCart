import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../../components/ui/Skeleton';

export default function WishlistPage() {
  useTitle('Wishlist');
  const { addToast } = useUI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/users/wishlist')
      .then(r => {
        const data = r.data?.data?.wishlist || r.data?.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    setItems(prev => prev.filter(i => (i._id || i.id) !== productId));
    try {
      await apiClient.delete(`/users/wishlist/${productId}`);
    } catch { addToast('Failed to remove from wishlist.', 'error'); }
  };

  const products = items.map(i => ({ ...i, isWishlisted: true }));

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', marginBottom: 6 }}>
        Wishlist
      </h1>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 32 }}>
        {loading ? '...' : `${products.length} saved`}
      </div>

      {/* M8 Fix: updated to reference the heart button on product cards which already exists */}
      {loading ? (
        <div className="products-grid" role="list">
          {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon="♡" title="Nothing saved yet" body="Click the ♡ heart icon on any wallpaper card or product page to save it here." ctaLabel="Explore Marketplace" ctaTo="/marketplace" />
      ) : (
        <div className="products-grid" role="list">
          {products.map(p => (
            <ProductCard 
              key={p._id || p.id} 
              product={p} 
              onWishlistChange={(id, isWishlisted) => {
                if (!isWishlisted) {
                  setItems(prev => prev.filter(i => (i._id || i.id) !== id));
                }
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
