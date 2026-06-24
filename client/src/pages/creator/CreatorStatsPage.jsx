import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import apiClient from '../../api/client';

export default function CreatorStatsPage() {
  useTitle('Stats | Creator Studio');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/creators/stats')
      .then(r => setStats(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--color-text-3)' }}>Loading stats...</div>;
  if (!stats) return <div style={{ color: 'var(--color-error)' }}>Failed to load stats.</div>;

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', marginBottom: 32 }}>
        Creator Analytics
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div className="glass-card-flat" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Total Earnings</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.5rem', fontWeight: 600, color: 'var(--color-accent)', textShadow: 'var(--neon-text-glow)' }}>
            ${(stats.totalEarnings || 0).toFixed(2)}
          </div>
        </div>
        <div className="glass-card-flat" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Total Sales</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {stats.totalSales || 0}
          </div>
        </div>
        <div className="glass-card-flat" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Active Products</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {stats.activeProducts || 0}
          </div>
        </div>
      </div>

      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 20 }}>
        Top Performing Artworks
      </h2>
      
      {stats.topProducts?.length > 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-3)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Artwork</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Sales</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map(p => (
                <tr key={p._id || p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={p.assets?.preview?.url || p.img} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} onError={e => e.target.style.display = 'none'} />
                      <div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>{p.name}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{p.series}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                    {p.salesCount || 0}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>
                    ${((p.salesCount || 0) * (p.price || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-3)', fontFamily: 'Inter, sans-serif' }}>
          No sales data available yet.
        </div>
      )}
    </div>
  );
}
