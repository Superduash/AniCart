import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';

export default function AdminHomepagePage() {
  useTitle('Homepage Manager | Admin');
  const { addToast } = useUI();
  
  const [heroProducts, setHeroProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadHomepageProducts = async () => {
    setLoading(true);
    try {
      const [heroRes, featRes] = await Promise.all([
        apiClient.get('/products', { params: { isHero: true, sort: 'heroOrder', limit: 50 } }),
        apiClient.get('/products', { params: { isFeatured: true, sort: 'featuredOrder', limit: 50 } })
      ]);
      setHeroProducts(heroRes.data?.data?.products || []);
      setFeaturedProducts(featRes.data?.data?.products || []);
    } catch {
      addToast('Failed to load homepage layout', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHomepageProducts(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await apiClient.get('/products', { params: { search: searchQuery, limit: 10 } });
      setSearchResults(res.data?.data?.products || []);
    } catch {
      addToast('Search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const updateProductFlag = async (id, payload) => {
    try {
      await apiClient.put(`/products/${id}`, payload);
      addToast('Updated successfully', 'success');
      loadHomepageProducts(); // refresh
    } catch {
      addToast('Update failed', 'error');
    }
  };

  const renderProductRow = (p, type) => {
    const isHero = type === 'hero';
    const currentOrder = isHero ? p.heroOrder : p.featuredOrder;
    const [orderVal, setOrderVal] = useState(currentOrder || 0);

    const handleSaveOrder = () => {
      const payload = isHero ? { heroOrder: Number(orderVal) } : { featuredOrder: Number(orderVal) };
      updateProductFlag(p.id || p._id, payload);
    };

    const handleRemove = () => {
      const payload = isHero ? { isHero: false, heroOrder: 0 } : { isFeatured: false, featuredOrder: 0 };
      updateProductFlag(p.id || p._id, payload);
    };

    return (
      <div key={p.id || p._id} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-2)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 8, border: '1px solid var(--color-border)' }}>
        <img src={p.assets?.preview?.url || p.img} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 16 }} />
        <div style={{ flex: 1, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-2)' }}>Order:</label>
          <input 
            type="number" 
            value={orderVal} 
            onChange={e => setOrderVal(e.target.value)}
            style={{ width: 60, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '4px 8px', borderRadius: 4 }}
          />
          <button onClick={handleSaveOrder} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }}>Save</button>
          <button onClick={handleRemove} className="btn btn-muted" style={{ padding: '4px 12px', fontSize: 12, color: 'var(--color-error)' }}>Remove</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-pink)', marginBottom: 24 }}>
        Homepage Layout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Left Col: Current Assignments */}
        <div>
          <div style={{ background: 'var(--color-surface)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 16 }}>Hero Slider</h2>
            {loading ? <p>Loading...</p> : heroProducts.length === 0 ? <p style={{ color: 'var(--color-text-3)' }}>No hero products.</p> : heroProducts.map(p => renderProductRow(p, 'hero'))}
          </div>

          <div style={{ background: 'var(--color-surface)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 16 }}>Featured Section</h2>
            {loading ? <p>Loading...</p> : featuredProducts.length === 0 ? <p style={{ color: 'var(--color-text-3)' }}>No featured products.</p> : featuredProducts.map(p => renderProductRow(p, 'featured'))}
          </div>
        </div>

        {/* Right Col: Search and Add */}
        <div>
          <div style={{ background: 'var(--color-surface)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 16 }}>Find Wallpapers</h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <input 
                type="text" 
                placeholder="Search by name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)' }}
              />
              <button type="submit" className="btn btn-primary" disabled={searching}>Search</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {searchResults.map(p => (
                <div key={p.id || p._id} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-2)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <img src={p.assets?.preview?.url || p.img} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 16 }} />
                  <div style={{ flex: 1, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => updateProductFlag(p.id || p._id, { isHero: true, heroOrder: heroProducts.length + 1 })}
                      className="btn btn-muted" style={{ padding: '4px 12px', fontSize: 12, border: '1px solid var(--color-pink)', color: 'var(--color-pink)' }}
                      disabled={heroProducts.some(h => (h.id || h._id) === (p.id || p._id))}
                    >
                      + Hero
                    </button>
                    <button 
                      onClick={() => updateProductFlag(p.id || p._id, { isFeatured: true, featuredOrder: featuredProducts.length + 1 })}
                      className="btn btn-muted" style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #4ade80', color: '#4ade80' }}
                      disabled={featuredProducts.some(f => (f.id || f._id) === (p.id || p._id))}
                    >
                      + Featured
                    </button>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && !searching && <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No search results.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
