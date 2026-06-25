import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import AdminProductEditor from '../components/admin/AdminProductEditor';

export default function AdminProductsPage() {
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);
  const [reprocessingAll, setReprocessingAll] = useState(false);

  useTitle('Product Queue | Admin');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products/admin/pending', { params: { limit: 12, page } });
      const data = res.data?.data?.products || res.data?.data || [];
      setProducts(Array.isArray(data) ? data : []);
      setTotal(res.data?.data?.total || data.length || 0);
    } catch {
      addToast('Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  const handleReprocess = async (id) => {
    setReprocessingId(id);
    try {
      const res = await apiClient.post(`/admin/products/${id}/reprocess`);
      const updatedProduct = res.data?.data?.product;
      if (updatedProduct) {
        setProducts(prev => prev.map(p => (p._id || p.id) === id ? updatedProduct : p));
        addToast('Product reprocessed with all resolutions!', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reprocess product.';
      addToast(msg, 'error');
    } finally {
      setReprocessingId(null);
    }
  };

  const handleReprocessAll = async () => {
    setReprocessingAll(true);
    try {
      const res = await apiClient.post('/admin/products/reprocess-all');
      const result = res.data?.data;
      addToast(`Reprocessed ${result?.processed || 0} products with mobile variants!`, 'success');
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reprocess all products.';
      addToast(msg, 'error');
    } finally {
      setReprocessingAll(false);
    }
  };

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      if (action === 'approve') {
        await apiClient.put(`/products/${id}/approve`);
        addToast('Product approved and live!', 'success');
      } else {
        const reason = rejectReason[id] || 'Does not meet marketplace guidelines.';
        await apiClient.put(`/products/${id}/reject`, { rejectionReason: reason });
        addToast('Product rejected.', 'info');
      }
      setProducts(p => p.filter(x => (x._id || x.id) !== id));
    } catch {
      addToast(`Failed to ${action} product.`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/admin/products/${id}`);
      setProducts(p => p.filter(x => (x._id || x.id) !== id));
      addToast('Product permanently deleted.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete product.';
      addToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/products/${id}/edit`);
  };

  const renderMainContent = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-pink)', marginBottom: 6 }}>
            Moderation Queue
          </h1>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)' }}>
            {total} pending review
          </div>
        </div>
        <button
          onClick={handleReprocessAll}
          disabled={reprocessingAll}
          className="btn btn-sm"
          style={{ background: 'var(--color-accent)', color: 'var(--color-void)', fontWeight: 600 }}
        >
          {reprocessingAll ? '⏳ Reprocessing All...' : '🔄 Reprocess All (Add Mobile Variants)'}
        </button>
      </div>

      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={zoomedImage} alt="Zoomed" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,45,120,0.03)', border: '1px dashed rgba(255,45,120,0.2)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>✨</div>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>
            Queue is empty
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
            All caught up on product reviews.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {products.map(p => {
            const productId = p._id || p.id;
            return (
              <div key={productId} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div 
                  style={{ cursor: 'zoom-in', width: '100%', aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}
                  onClick={() => setZoomedImage(p.assets?.source?.url || p.assets?.preview?.url || p.imageUrl || p.img)}
                >
                  <img src={p.assets?.preview?.url || p.assets?.source?.url || p.imageUrl || p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'var(--color-surface-2)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
                      <a href={`/admin/products/${productId}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {p.name}
                      </a>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-pink)' }}>
                      {p.price === 0 ? 'Free' : `$${p.price.toFixed(2)}`}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 16 }}>
                    {p.series} · {p.resolution}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: 20, padding: 12, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                    By: {p.creator?.name || p.creatorId || 'Unknown'}
                  </div>
                  
                  <textarea
                    placeholder="Rejection reason (optional)"
                    value={rejectReason[productId] || ''}
                    onChange={(e) => setRejectReason({ ...rejectReason, [productId]: e.target.value })}
                    style={{ width: '100%', minHeight: 60, padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', marginBottom: 12, resize: 'vertical' }}
                    disabled={processingId === productId}
                  />

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <button onClick={() => handleAction(productId, 'reject')} disabled={processingId === productId || deletingId === productId} className="btn btn-muted" style={{ flex: 1, color: 'var(--color-error)' }}>
                      {processingId === productId ? 'Processing...' : 'Reject'}
                    </button>
                    <button onClick={() => handleAction(productId, 'approve')} disabled={processingId === productId || deletingId === productId} className="btn btn-primary" style={{ flex: 1, background: 'var(--color-pink)', color: '#fff' }}>
                      {processingId === productId ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    {deletingId === productId ? (
                      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <button onClick={() => handleDelete(productId)} className="btn btn-sm" style={{ flex: 1, background: 'var(--color-error)', color: '#fff' }}>
                          Confirm Delete
                        </button>
                        <button onClick={() => setDeletingId(null)} className="btn btn-sm btn-muted" style={{ flex: 1 }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(productId)} disabled={processingId === productId} className="btn btn-sm btn-muted" style={{ width: '100%', color: 'var(--color-error)' }}>
                        🗑️ Delete Permanently
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleReprocess(productId)}
                    disabled={reprocessingId === productId || processingId === productId}
                    className="btn btn-sm btn-muted"
                    style={{ width: '100%', color: 'var(--color-accent)' }}
                  >
                    {reprocessingId === productId ? '⏳ Reprocessing...' : '🔄 Reprocess (Add Mobile)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && total > 12 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-muted">
            ← Prev
          </button>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-2)' }}>
            Page {page} of {Math.ceil(total / 12)}
          </div>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)} className="btn btn-muted">
            Next →
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/products/:id/edit" element={<AdminProductEditor />} />
      <Route path="/" element={renderMainContent()} />
    </Routes>
  );
}