import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';
import { useSocket } from '../../contexts/SocketContext';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { Link } from 'react-router-dom';

function FileUploadBox({ label, accept, onFile, file, subtext }) {
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label className="form-label">{label}</label>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${drag ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center',
          background: drag ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
          transition: 'all 0.2s', cursor: 'pointer', position: 'relative'
        }}
      >
        <input type="file" accept={accept} onChange={e => e.target.files[0] && onFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        {file ? (
          <div>
            <div style={{ color: 'var(--color-accent)', fontSize: '1.5rem', marginBottom: 8 }}>✓</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{file.name}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{(file.size / (1024*1024)).toFixed(2)} MB</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1.5rem', color: 'var(--color-text-3)', marginBottom: 8 }}>+</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>Drag & drop or click to browse</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 4 }}>{subtext}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatorUploadsPage() {
  useTitle('My Uploads | Creator Studio');
  const { addToast } = useUI();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: 5, series: '', resolution: '4K', format: 'WebP' });
  const [sourceFile, setSourceFile] = useState(null);
  const { socket } = useSocket();

  useEffect(() => { loadProducts(); }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleStatusUpdate = (data) => {
      setProducts(prev => prev.map(p => {
        if (p._id === data.productId || p.id === data.productId) {
          return { ...p, status: data.status, assets: data.product?.assets || p.assets };
        }
        return p;
      }));
      
      if (data.status === 'active') {
        addToast(`Your product is now live!`, 'success');
      } else if (data.status === 'flagged') {
        addToast(`Product upload failed: ${data.error || 'Unknown error'}`, 'error');
      }
    };

    socket.on('product_status_updated', handleStatusUpdate);
    return () => socket.off('product_status_updated', handleStatusUpdate);
  }, [socket, addToast]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/creator/products');
      const data = res.data?.data?.products || res.data?.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.name || !form.series || !sourceFile) {
      addToast('Please fill all required fields and upload the high-res file.', 'warning');
      return;
    }

    setUploading(true);
    try {
      // 1. Create product record
      const prodRes = await apiClient.post('/creator/products', form);
      const productId = prodRes.data?.data?.product?._id || prodRes.data?.data?.product?.id;

      if (!productId) throw new Error('Failed to create product record.');

      // 2. Upload file
      const formData = new FormData();
      formData.append('wallpaper', sourceFile);
      formData.append('productId', productId);
      formData.append('rightsConfirmed', 'true');

      await apiClient.post('/upload/wallpaper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      addToast('Product uploaded successfully! Processing in background.', 'success');
      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Upload failed. Please try again.', 'error');
    }
    setUploading(false);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: 5, series: '', resolution: '4K', format: 'WebP' });
    setSourceFile(null);
  };

  const handleDelete = async (id) => {
    try {
      // C5 Fix: correct URL is /creator/products/:id (was /creators/products/:id)
      await apiClient.delete(`/creator/products/${id}`);
      setProducts(p => p.filter(x => x._id !== id));
      addToast('Product deleted.', 'info');
    } catch { addToast('Failed to delete.', 'error'); }
    setDeletingId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', marginBottom: 6 }}>
            My Uploads
          </h1>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)' }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + New Upload
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>📤</div>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 8 }}>No uploads yet</h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 20 }}>Upload your first high-quality wallpaper to start earning.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary">Upload Artwork</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {products.map(p => (
            <div key={p._id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '16/10', position: 'relative', background: 'var(--color-surface-2)' }}>
                {p.assets?.preview?.url && <img src={p.assets.preview.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 'var(--radius-full)', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                  background: p.status === 'active' ? 'var(--color-success)' : p.status === 'pending' ? 'var(--color-warning)' : 'var(--color-error)',
                  color: p.status === 'pending' ? '#000' : '#fff'
                }}>
                  {p.status}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{p.series}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>${p.price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {p.status === 'active' && (
                    <Link to={`/products/${p._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                      View
                    </Link>
                  )}
                  {deletingId === p._id ? (
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                      <button onClick={() => handleDelete(p._id)} className="btn btn-muted btn-sm" style={{ flex: 1, background: 'var(--color-error)', color: '#fff' }}>Sure?</button>
                      <button onClick={() => setDeletingId(null)} className="btn btn-muted btn-sm" style={{ flex: 1 }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(p._id)} className="btn btn-muted btn-sm" style={{ flex: 1, color: 'var(--color-error)' }}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title="Upload New Artwork" size="lg">
        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <FileUploadBox label="Source File (High-Res)" accept="image/png,image/jpeg,image/webp" file={sourceFile} onFile={setSourceFile} subtext="Full resolution, unwatermarked (Max 20MB)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Artwork Name</label>
                <input type="text" className="form-input form-input-no-icon" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={uploading} />
              </div>
              <div className="form-group">
                <label className="form-label">Anime Series</label>
                <input type="text" className="form-input form-input-no-icon" required value={form.series} onChange={e => setForm(p => ({ ...p, series: e.target.value }))} disabled={uploading} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price ($)</label>
                  <input type="number" min="0" step="0.5" className="form-input form-input-no-icon" required value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} disabled={uploading} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Resolution</label>
                  <select className="form-input form-input-no-icon" value={form.resolution} onChange={e => setForm(p => ({ ...p, resolution: e.target.value }))} disabled={uploading}>
                    <option value="4K">4K</option>
                    <option value="2K">2K</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea className="form-input form-input-no-icon" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} disabled={uploading} style={{ resize: 'none' }} />
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" disabled={uploading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Submit for Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
