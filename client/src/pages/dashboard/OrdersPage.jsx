import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import { OrderRowSkeleton, EmptyState } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';

function OrderCard({ order, onView }) {
  const thumbnails = (order.items || []).slice(0, 3).map(i => i.product?.assets?.preview?.url || i.img).filter(Boolean);
  const extraCount = (order.items?.length || 0) - 3;
  const statusColor = order.status === 'completed' ? 'var(--color-success)' : order.status === 'pending' ? 'var(--color-warning)' : 'var(--color-text-3)';

  return (
    <div className="glass-card-flat" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Thumbnails */}
      <div style={{ display: 'flex', gap: -6, flexShrink: 0 }}>
        {thumbnails.map((src, i) => (
          <img key={i} src={src} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-void)', marginLeft: i > 0 ? -10 : 0 }} />
        ))}
        {extraCount > 0 && (
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--color-surface-2)', border: '2px solid var(--color-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-3)', marginLeft: -10 }}>
            +{extraCount}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: 4 }}>
          #{(order._id || order.id)?.slice(-8).toUpperCase()}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Total + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-accent)' }}>
          ${(order.totalAmount || order.total || 0).toFixed(2)}
        </div>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: statusColor }}>
          {order.status || 'Completed'}
        </span>
      </div>

      <button onClick={() => onView(order)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
        Details →
      </button>
    </div>
  );
}

function OrderDetailModal({ order, isOpen, onClose }) {
  if (!order) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order #${(order._id || order.id)?.slice(-8).toUpperCase()}`} size="md">
      <div style={{ color: 'var(--color-text-3)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', marginBottom: 20 }}>
        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {(order.items || []).map((item, i) => {
          const prod = item.product || item;
          const preview = prod.assets?.preview?.url || prod.img;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {preview && <img src={preview} alt="" style={{ width: 60, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{prod.name}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{prod.series}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', flexShrink: 0 }}>
                ${(item.price || prod.price || 0).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--color-text)', letterSpacing: 1, textTransform: 'uppercase' }}>Total</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-accent)' }}>
          ${(order.totalAmount || order.total || 0).toFixed(2)}
        </span>
      </div>
      <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
        Downloads available in your{' '}
        <a href="/dashboard/library" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Library</a>
      </div>
    </Modal>
  );
}

export default function OrdersPage() {
  useTitle('My Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    apiClient.get('/orders')
      .then(r => {
        const data = r.data?.data?.orders || r.data?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', marginBottom: 32 }}>
        Order History
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(4).fill(0).map((_, i) => <OrderRowSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" body="Your order history will appear here after your first purchase." ctaLabel="Start Shopping" ctaTo="/marketplace" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => (
            <OrderCard key={o._id || o.id} order={o} onView={setSelectedOrder} />
          ))}
        </div>
      )}

      <OrderDetailModal order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
