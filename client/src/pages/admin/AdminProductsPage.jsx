import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';

export default function AdminProductsPage() {
  useTitle('Product Queue | Admin');
  const { addToast } = useUI();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products/admin/pending');
      const data = res.data?.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await apiClient.put(`/products/${id}/approve`);
        addToast('Product approved and live!', 'success');
      } else {
        await apiClient.put(`/products/${id}/reject`);
        addToast('Product rejected.', 'info');
      }
      setProducts(p => p.filter(x => x._id !== id));
    } catch {
      addToast(`Failed to ${action} product.`, 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-pink)', marginBottom: 6 }}>
        Moderation Queue
      </h1>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 32 }}>
        {products.length} pending review
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,45,120,0.03)', border: '1px dashed rgba(255,45,120,0.2)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>✨</div>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>Queue is empty</h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>All caught up on product reviews.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {products.map(p => (
            <div key={p._id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <img src={p.assets?.preview?.url || p.img} alt="" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', background: 'var(--color-surface-2)' }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>{p.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-pink)' }}>${p.price.toFixed(2)}</div>
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 16 }}>
                  {p.series} · {p.resolution}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: 20, padding: 12, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  By: {p.creator?.name || p.creatorId || 'Unknown'}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => handleAction(p._id, 'reject')} className="btn btn-muted" style={{ flex: 1, color: 'var(--color-error)' }}>Reject</button>
                  <button onClick={() => handleAction(p._id, 'approve')} className="btn btn-primary" style={{ flex: 1, background: 'var(--color-pink)', color: '#fff' }}>Approve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
