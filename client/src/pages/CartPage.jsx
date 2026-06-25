import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowWidth } from '../hooks/useWindowWidth';
import { useTitle } from '../hooks/useTitle';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { EmptyState, SkeletonLine } from '../components/ui/Skeleton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ProductCard from '../components/product/ProductCard';
import apiClient from '../api/client';
import Footer from '../components/layout/Footer';

function CartItem({ item, onRemove }) {
  const id = item._id || item.id;
  const preview = item.assets?.preview?.url || item.img || item.imageUrl;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 10 }}>
      <img
        src={preview}
        alt={item.name}
        style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0, background: 'var(--color-surface-2)' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 3 }}>
          {item.series}
          {item.resolution && <span> · <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-accent)' }}>{item.resolution}</span></span>}
        </div>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
        ${(item.price || 0).toFixed(2)}
      </div>
      <button
        onClick={() => onRemove(id)}
        aria-label={`Remove ${item.name} from cart`}
        style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px', transition: 'color 0.15s', flexShrink: 0 }}
        onMouseEnter={e => e.target.style.color = 'var(--color-pink)'}
        onMouseLeave={e => e.target.style.color = 'var(--color-text-3)'}
      >
        ✕
      </button>
    </div>
  );
}

export default function CartPage() {
  useTitle('Cart');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal, cartLoading, removeFromCart, clearCart } = useCart();
  const { addToast } = useUI();
  const [recommended, setRecommended] = React.useState([]);
  const width = useWindowWidth();
  const isMobile = width < 900;

  React.useEffect(() => {
    if (cart.length > 0) {
      const series = cart.map(item => item.series).filter(Boolean);
      // Fetch popular products from the same series
      apiClient.get('/products', { params: { limit: 4, sort: 'popular', status: 'active', series: series.join(',') } })
        .then(res => setRecommended(res.data?.data?.products || res.data?.data || []))
        .catch(() => {});
    }
  }, [cart]);

  const handleCheckout = () => {
    if (!user) { navigate('/auth/login?next=/checkout'); return; }
    navigate('/checkout');
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Your Cart' }]} />
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-text)', marginBottom: 8 }}>
          Your Cart
        </h1>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', letterSpacing: 3, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 40 }}>
          {cart.length} item{cart.length !== 1 ? 's' : ''}
        </div>

        {/* M2 Fix: show loading state while cart is syncing with server */}
        {cartLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 32, alignItems: 'start' }} aria-busy="true" aria-label="Loading cart">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>Items</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div className="skeleton" style={{ width: 80, height: 56, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <SkeletonLine width="60%" height={16} style={{ marginBottom: 6 }} />
                      <SkeletonLine width="40%" height={12} />
                    </div>
                    <SkeletonLine width={60} height={20} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
              <SkeletonLine width="50%" height={20} style={{ marginBottom: 20 }} />
              <SkeletonLine width="100%" height={16} style={{ marginBottom: 10 }} />
              <SkeletonLine width="100%" height={16} style={{ marginBottom: 24 }} />
              <SkeletonLine width="100%" height={40} style={{ marginBottom: 24 }} />
              <SkeletonLine width="100%" height={52} style={{ borderRadius: 8 }} />
            </div>
          </div>
        ) : cart.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            body="Discover wallpapers worth adding to your collection."
            ctaLabel="Browse Wallpapers"
            ctaTo="/marketplace"
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 32, alignItems: 'start' }}>
            {/* Items */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
                  Items
                </div>
                <button onClick={() => { if (window.confirm('Are you sure you want to clear your cart?')) clearCart(); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', letterSpacing: 1, textTransform: 'uppercase', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--color-error)'}
                  onMouseLeave={e => e.target.style.color = 'var(--color-text-3)'}
                >
                  Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AnimatePresence initial={false}>
                  {cart.map(item => (
                    <motion.div
                      key={item._id || item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <CartItem item={item} onRemove={removeFromCart} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div style={{ marginTop: 20 }}>
                <Link to="/marketplace" className="btn btn-secondary">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order summary */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 28, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }} />
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Order Summary
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                      Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>Tax</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>Calculated at checkout</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', letterSpacing: 1, textTransform: 'uppercase' }}>Total</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-accent)', textShadow: 'var(--neon-text-glow)' }}>
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button onClick={handleCheckout} className="btn btn-primary btn-full btn-lg">
                  Proceed to Checkout →
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                  {['🔒 SSL', '⚡ Stripe', '🛡 Secure'].map((t, i) => (
                    <span key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Section */}
        {cart.length > 0 && recommended.length > 0 && (
          <div style={{ marginTop: 80, borderTop: '1px solid var(--color-border)', paddingTop: 60 }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--color-text)', marginBottom: 28 }}>
              Frequently Bought Together
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {recommended.map(p => <ProductCard key={p._id || p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
