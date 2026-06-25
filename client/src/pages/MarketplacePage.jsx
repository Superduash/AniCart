import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTitle } from '../hooks/useTitle';
import { useDebounce } from '../hooks/useDebounce';
import { useWindowWidth } from '../hooks/useWindowWidth';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../components/ui/Skeleton';
import Footer from '../components/layout/Footer';

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest' },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'top_rated',   label: 'Top Rated' },
];

const RESOLUTIONS = ['4K', '2K', '1080p'];

export default function MarketplacePage() {
  useTitle('Browse Wallpapers');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const width = useWindowWidth();
  const isMobile = width < 768;

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [selectedSeries, setSelectedSeries] = useState(searchParams.getAll('series') || []);
  const [selectedRes, setSelectedRes] = useState(searchParams.getAll('resolution') || []);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAllSeries, setShowAllSeries] = useState(false); // M4 Fix

  // Data
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seriesList, setSeriesList] = useState([]);

  const debouncedSearch = useDebounce(search, 350);
  const PAGE_SIZE = 24;

  // Fetch series list once
  useEffect(() => {
    apiClient.get('/products/series/list')
      .then(r => setSeries(r.data?.data || []))
      .catch(() => {});
  }, []);

  function setSeries(v) { setSeriesList(v); }

  // Sync filters to URL
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (sort !== 'newest') params.sort = sort;
    if (selectedSeries.length) params.series = selectedSeries;
    if (selectedRes.length) params.resolution = selectedRes;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, sort, selectedSeries, selectedRes, minPrice, maxPrice, page]);

  // Fetch products
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          limit: PAGE_SIZE, page,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(sort && { sort }),
          ...(selectedSeries.length && { series: selectedSeries.join(',') }),
          ...(selectedRes.length && { resolution: selectedRes.join(',') }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          status: 'active',
        };
        const res = await apiClient.get('/products', { params });
        const data = res.data?.data;
        if (Array.isArray(data)) {
          setProducts(data);
          setTotal(data.length);
          setTotalPages(1);
        } else {
          setProducts(data?.products || []);
          setTotal(data?.total || 0);
          setTotalPages(data?.totalPages || 1);
        }
      } catch { setProducts([]); }
      finally { setLoading(false); }
    };
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedSearch, sort, selectedSeries, selectedRes, minPrice, maxPrice, page]);

  const resetFilters = () => {
    setSearch(''); setSort('newest'); setSelectedSeries([]); setSelectedRes([]);
    setMinPrice(''); setMaxPrice(''); setPage(1);
  };

  const hasActiveFilters = search || selectedSeries.length || selectedRes.length || minPrice || maxPrice || sort !== 'newest';

  const toggleSeries = (s) => setSelectedSeries(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleRes = (r) => setSelectedRes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  // Filter sidebar content
  const FilterContent = () => (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', letterSpacing: 1, textTransform: 'uppercase' }}>Filters</div>
        {hasActiveFilters && (
          <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
            Reset All ×
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Search</div>
        <div className="form-input-wrapper">
          <span className="form-input-icon">🔍</span>
          <input className="form-input" type="text" placeholder="Wallpapers, series..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Series */}
      {seriesList.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 10 }}>Series</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* M4 Fix: show first 8 by default, with show-more toggle */}
            {(showAllSeries ? seriesList : seriesList.slice(0, 8)).map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedSeries.includes(s)} onChange={() => toggleSeries(s)} style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: selectedSeries.includes(s) ? 'var(--color-text)' : 'var(--color-text-2)' }}>{s}</span>
              </label>
            ))}
            {seriesList.length > 8 && (
              <button
                onClick={() => setShowAllSeries(v => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left', padding: '4px 0', marginTop: 2 }}
              >
                {showAllSeries ? '▲ Show less' : `▼ Show all (${seriesList.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resolution */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 10 }}>Resolution</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RESOLUTIONS.map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedRes.includes(r)} onChange={() => toggleRes(r)} style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xs)', color: selectedRes.includes(r) ? 'var(--color-accent)' : 'var(--color-text-2)' }}>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 10 }}>Price Range</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input form-input-no-icon" type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ padding: '10px 10px' }} min="0" />
          <input className="form-input form-input-no-icon" type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ padding: '10px 10px' }} min="0" />
        </div>
      </div>

    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 70 }}>
      {/* Mobile filter btn */}
      {isMobile && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setFilterOpen(true)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
            ⚙ Filters {hasActiveFilters ? `(${[search ? 1 : 0, selectedSeries.length, selectedRes.length, minPrice || maxPrice ? 1 : 0].reduce((a,b)=>a+b,0)} active)` : ''}
          </button>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0' : '0 40px' }}>
        {/* Desktop sidebar */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--color-border)', minHeight: 'calc(100vh - 70px)', position: 'sticky', top: 70, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>
            {FilterContent()}
          </div>
        )}

        {/* Grid area */}
        <div style={{ flex: 1, padding: isMobile ? '24px 16px' : '32px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
              {loading ? 'Loading...' : `${total} wallpaper${total !== 1 ? 's' : ''}`}
            </div>
            {!isMobile && (
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={{ padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {search && (
                <button onClick={() => setSearch('')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-glow)', borderRadius: 'var(--radius-full)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', cursor: 'pointer' }}>
                  "{search}" ×
                </button>
              )}
              {selectedSeries.map(s => (
                <button key={s} onClick={() => toggleSeries(s)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-glow)', borderRadius: 'var(--radius-full)', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', cursor: 'pointer' }}>
                  {s} ×
                </button>
              ))}
              {selectedRes.map(r => (
                <button key={r} onClick={() => toggleRes(r)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-glow)', borderRadius: 'var(--radius-full)', fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', cursor: 'pointer' }}>
                  {r} ×
                </button>
              ))}
              {(minPrice || maxPrice) && (
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-glow)', borderRadius: 'var(--radius-full)', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', cursor: 'pointer' }}>
                  ${minPrice || '0'} – ${maxPrice || '∞'} ×
                </button>
              )}
            </div>
          )}

          {/* Product grid */}
          {loading ? (
            <div className="products-grid" role="list">
              {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No wallpapers match"
              body="Try adjusting your filters or searching for something else."
              ctaLabel="Reset Filters"
              onCta={resetFilters}
            />
          ) : (
            <div className="products-grid" role="list">
              {products.map(p => <ProductCard key={p._id || p.id} product={p} />)}
            </div>
          )}

          {/* L6 Fix: windowed pagination showing current ±2, first, last, with ellipsis */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 40, flexWrap: 'wrap', alignItems: 'center' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm" style={{ minWidth: 80 }}>← Prev</button>
              {(() => {
                const pages = [];
                const addPage = (p) => { if (!pages.includes(p) && p >= 1 && p <= totalPages) pages.push(p); };
                addPage(1);
                for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) addPage(i);
                addPage(totalPages);
                const sorted = [...new Set(pages)].sort((a, b) => a - b);
                const result = [];
                for (let i = 0; i < sorted.length; i++) {
                  if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
                    result.push(<span key={`ellipsis-${i}`} style={{ color: 'var(--color-text-3)', padding: '0 4px' }}>…</span>);
                  }
                  const p = sorted[i];
                  result.push(
                    <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-muted'}`} style={{ minWidth: 40 }}>{p}</button>
                  );
                }
                return result;
              })()}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm" style={{ minWidth: 80 }}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {isMobile && filterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <div onClick={() => setFilterOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderRadius: '24px 24px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--color-text)' }}>Filters</span>
              <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            {FilterContent()}
            <div style={{ padding: '16px 24px 32px' }}>
              <button onClick={() => setFilterOpen(false)} className="btn btn-primary btn-full">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
