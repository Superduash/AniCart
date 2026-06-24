import React, { useState, useEffect } from 'react';
import { useAuth, useCart, useToast, useNavigation } from '../App';
import Checkout from '../components/Checkout';

// ═══ STAT CARD ═══
function StatCard({ icon, label, value, color = 'neon', sub }) {
  const colors = {
    neon: { bg: 'rgba(0,243,255,0.08)', border: 'rgba(0,243,255,0.2)', text: 'var(--neon)' },
    pink: { bg: 'rgba(255,45,120,0.08)', border: 'rgba(255,45,120,0.2)', text: 'var(--pink)' },
    purple: { bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', text: 'var(--purple-light)' },
    gold: { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.2)', text: '#ffd700' },
  };
  const c = colors[color];

  return (
    <div className="glass-card" style={{
      padding: '24px', display: 'flex', gap: 16, alignItems: 'center',
      border: `1px solid ${c.border}`, background: c.bg,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '1.5rem',
        background: `rgba(${color === 'neon' ? '0,243,255' : color === 'pink' ? '255,45,120' : color === 'purple' ? '124,58,237' : '255,215,0'}, 0.15)`,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.6rem',
          fontWeight: 800, color: c.text }}>{value}</div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem',
          fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ═══ DASHBOARD NAV ═══
function DashboardNav({ active, setActive }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'cart',     label: 'My Cart',  icon: '🛒' },
    { id: 'library',  label: 'Library',  icon: '✦' },
    { id: 'profile',  label: 'Profile',  icon: '◉' },
  ];

  return (
    <div style={{
      display: 'flex', gap: 4, marginBottom: 40,
      background: 'rgba(10,22,40,0.6)', padding: 6, borderRadius: 14,
      border: '1px solid var(--glass-border)', flexWrap: 'wrap',
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          style={{
            flex: '1 1 auto', padding: '10px 20px', border: 'none', borderRadius: 10,
            cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: active === tab.id
              ? 'linear-gradient(135deg, var(--neon) 0%, #0099cc 100%)'
              : 'transparent',
            color: active === tab.id ? 'var(--bg-void)' : 'var(--text-muted)',
            boxShadow: active === tab.id ? 'var(--neon-glow)' : 'none',
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

// ═══ OVERVIEW TAB ═══
function OverviewTab() {
  const { user } = useAuth();
  const { cart, cartTotal, cartCount, products, addToCart } = useCart();
  const { addToast } = useToast();
  const { navigate, PAGES } = useNavigation();

  const recentActivity = [
    { action: 'Account created', time: 'Just now', icon: '✦', color: 'var(--neon)' },
    { action: 'Welcome to AniCart Databank', time: 'Just now', icon: '◈', color: 'var(--purple-light)' },
    { action: 'First login bonus unlocked', time: 'Just now', icon: '🎉', color: '#ffd700' },
  ];

  return (
    <div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        <StatCard icon="🛒" label="Cart Items" value={cartCount} color="neon" sub={`$${cartTotal.toFixed(2)} total`} />
        <StatCard icon="✦" label="Wallpapers Owned" value="0" color="purple" sub="Start shopping!" />
        <StatCard icon="⚡" label="Points Earned" value="150" color="gold" sub="Welcome bonus" />
        <StatCard icon="🔥" label="Streak Days" value="1" color="pink" sub="Keep it up!" />
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--neon)' }}>◈</span> Recent Activity
          </div>
          {recentActivity.map((a, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              paddingBottom: i < recentActivity.length - 1 ? 16 : 0,
              marginBottom: i < recentActivity.length - 1 ? 16 : 0,
              borderBottom: i < recentActivity.length - 1 ? '1px solid var(--glass-border)' : 'none',
            }}>
              <div style={{ fontSize: '1rem', marginTop: 1 }}>{a.icon}</div>
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                  fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.action}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--pink)' }}>✦</span> Quick Access
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Browse Store', icon: '🌌', action: () => navigate(PAGES.LANDING) },
              { label: 'View Cart', icon: '🛒', action: () => {} },
              { label: 'Edit Profile', icon: '◉', action: () => addToast('Profile editing coming soon!', 'info') },
              { label: 'Download Manager', icon: '⬇', action: () => addToast('Downloads coming soon!', 'info') },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', border: '1px solid var(--glass-border)',
                  borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', transition: 'all 0.3s', textAlign: 'left',
                  color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,243,255,0.3)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'rgba(0,243,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {item.label}
                <span style={{ marginLeft: 'auto', opacity: 0.4 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem',
          fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><span style={{ color: 'var(--purple-light)' }}>✦</span> Recommended for You</span>
          <button
            onClick={() => navigate(PAGES.LANDING)}
            style={{ background: 'none', border: 'none', color: 'var(--neon)',
              cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
              fontSize: '0.82rem', letterSpacing: '1px' }}>
            VIEW ALL →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {products.slice(0, 4).map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                border: '1px solid var(--glass-border)', transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,243,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <img src={p.img} alt={p.name}
                style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '10px 10px', background: 'rgba(10,22,40,0.8)' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  fontSize: '0.82rem', color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.8rem',
                  color: 'var(--neon)', fontWeight: 700, marginTop: 4 }}>
                  ${p.price.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ CART TAB ═══
function CartTab() {
  const { cart, removeFromCart, updateQty, cartTotal, clearCart } = useCart();
  const { addToast } = useToast();
  const { navigate, PAGES } = useNavigation();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckoutClick = () => {
    if (cart.length === 0) { addToast('Cart is empty!', 'warning'); return; }
    setShowCheckout(true);
  };

  if (cart.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 24 }}>🛒</div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem',
          color: 'var(--text-primary)', marginBottom: 12 }}>Your Cart is Empty</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.95rem' }}>
          Explore the store and add wallpapers to your collection.
        </div>
        <button className="btn-primary" onClick={() => navigate(PAGES.LANDING)}>
          ◈ Browse Store
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16 }}>
              <img src={item.img} alt={item.name}
                style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {item.series} · {item.resolution}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      style={{ width: 30, height: 30, borderRadius: 8,
                        background: 'var(--glass-light)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem',
                      color: 'var(--neon)', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      style={{ width: 30, height: 30, borderRadius: 8,
                        background: 'var(--glass-light)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem',
                      color: 'var(--neon)', fontWeight: 800 }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                    <button onClick={() => removeFromCart(item.id)} style={{
                      background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)',
                      borderRadius: 8, padding: '6px 12px', color: 'var(--pink)',
                      cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                      fontSize: '0.82rem', transition: 'all 0.2s',
                    }}>REMOVE</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 90 }}>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem',
              fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Order Summary
            </div>

            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between',
                marginBottom: 10, fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                  {item.name.split('—')[0].trim()} ×{item.qty}
                </span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'Exo 2' }}>
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 16, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8,
                fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8,
                fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Processing Fee</span>
                <span style={{ color: '#00ff88' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20,
                fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Tax</span>
                <span>${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                borderTop: '1px solid var(--glass-border)', paddingTop: 16, marginBottom: 20 }}>
                <span style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700,
                  color: 'var(--text-primary)', fontSize: '0.9rem' }}>Total</span>
                <span style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800,
                  color: 'var(--neon)', fontSize: '1.3rem', textShadow: 'var(--neon-text-glow)' }}>
                  ${(cartTotal * 1.08).toFixed(2)}
                </span>
              </div>
            </div>

            {showCheckout ? (
              <Checkout />
            ) : (
              <button className="btn-primary btn-full" onClick={handleCheckoutClick}>
                ◈ Proceed to Checkout
              </button>
            )}
            
            <button onClick={clearCart} style={{
              width: '100%', marginTop: 10, background: 'none',
              border: '1px solid rgba(255,45,120,0.2)', borderRadius: 10,
              padding: '10px', color: 'var(--pink)', cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ LIBRARY TAB ═══
function LibraryTab() {
  const { navigate, PAGES } = useNavigation();
  const [library, setLibrary] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { addToast } = useToast();

  React.useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const apiClient = require('../api/client').default;
        const res = await apiClient.get('/users/library');
        setLibrary(res.data.data.library);
      } catch (err) {
        addToast('Failed to load library', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, [addToast]);

  const handleDownload = async (productId) => {
    try {
      const apiClient = require('../api/client').default;
      const res = await apiClient.get(`/products/${productId}/download`);
      window.open(res.data.data.downloadUrl, '_blank');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to get download link', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading databank...</div>;
  }

  if (library.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 24 }}>🌌</div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.1rem',
          color: 'var(--text-primary)', marginBottom: 12 }}>Library Empty</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.95rem' }}>
          Your purchased wallpapers will appear here.
        </div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.88rem' }}>
          Complete a purchase to unlock instant downloads.
        </div>
        <button className="btn-primary" onClick={() => navigate(PAGES.LANDING)}>
          ✦ Start Your Collection
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
      {library.map((item) => {
        const p = item.product || item; // Fallback in case population fails or uses older schema
        return (
          <div key={p.id || p._id} className="glass-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
            <img src={p.img} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                {p.series} · {p.resolution}
              </div>
              <button 
                className="btn-primary btn-full"
                onClick={() => handleDownload(p.id || p._id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}
              >
                <span>⬇</span> Download
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══ PROFILE TAB ═══
function ProfileTab() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { navigate, PAGES } = useNavigation();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');

  const handleSave = () => {
    addToast('Profile updated successfully! ✦', 'success');
    setEditing(false);
  };

  const profileFields = [
    { label: 'Display Name', value: user?.name, icon: '✦' },
    { label: 'Email Address', value: user?.email, icon: '◈' },
    { label: 'Member Since', value: user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Today', icon: '◉' },
    { label: 'Account Type', value: 'Standard', icon: '⚡' },
    { label: 'Points Balance', value: '150 AP', icon: '★' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Avatar & info */}
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg, var(--neon), var(--purple-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: '2.5rem',
          color: 'var(--bg-void)', boxShadow: 'var(--neon-glow)',
          border: '3px solid rgba(0,243,255,0.3)',
        }}>
          {user?.avatar}
        </div>

        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem',
          fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          {user?.name}
        </div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem',
          letterSpacing: '2px', color: 'var(--neon)', marginBottom: 24 }}>
          ◈ STANDARD PILOT
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
          {[['0', 'Purchases'], ['150', 'Points'], ['1', 'Day Streak']].map(([val, lab]) => (
            <div key={lab}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.3rem',
                fontWeight: 800, color: 'var(--neon)' }}>{val}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.75rem',
                color: 'var(--text-muted)', letterSpacing: '1px' }}>{lab}</div>
            </div>
          ))}
        </div>

        <button className="btn-secondary btn-full"
          onClick={() => addToast('Avatar customization coming soon!', 'info')} style={{ marginBottom: 10 }}>
          Change Avatar
        </button>
        <button
          onClick={() => { logout(); navigate(PAGES.LANDING); }}
          style={{
            width: '100%', padding: '12px', background: 'rgba(255,45,120,0.08)',
            border: '1px solid rgba(255,45,120,0.2)', borderRadius: 10, color: 'var(--pink)',
            cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: '0.9rem', letterSpacing: '1px', transition: 'all 0.2s',
          }}
        >
          DISCONNECT / LOGOUT
        </button>
      </div>

      {/* Profile fields */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.95rem',
            fontWeight: 700, color: 'var(--text-primary)' }}>Profile Details</div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              background: 'var(--neon-dim)', border: '1px solid rgba(0,243,255,0.2)',
              borderRadius: 8, padding: '6px 16px', color: 'var(--neon)',
              cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.82rem',
            }}>EDIT</button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">✦</span>
                <input
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email (Cannot be changed)</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">◈</span>
                <input className="form-input" value={user?.email} disabled
                  style={{ opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1, padding: '12px' }}
                onClick={handleSave}>Save Changes</button>
              <button onClick={() => setEditing(false)} style={{
                flex: 1, padding: '12px', background: 'none',
                border: '1px solid var(--glass-border)', borderRadius: 10,
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {profileFields.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderBottom: i < profileFields.length - 1 ? '1px solid var(--glass-border)' : 'none',
              }}>
                <span style={{ color: 'var(--neon)', width: 16, textAlign: 'center' }}>{f.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem',
                    letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
                    {f.label}
                  </div>
                  <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: '0.92rem',
                    color: 'var(--text-primary)', fontWeight: 500 }}>
                    {f.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ MAIN DASHBOARD ═══
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { navigate, PAGES } = useNavigation();
  const { cartCount } = useCart();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    navigate(PAGES.LOGIN);
    return null;
  }

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard-page">
      {/* Navbar strip */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => navigate(PAGES.LANDING)}>
          ANI<span>CART</span>
        </div>
        <ul className="nav-links">
          <li><button className="nav-btn-outline" onClick={() => navigate(PAGES.LANDING)}>← Store</button></li>
          <li>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 8, color: 'var(--text-secondary)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, padding: '8px',
            }} onClick={logout}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--neon), var(--purple-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '0.8rem',
                color: 'var(--bg-void)',
              }}>
                {user.avatar}
              </div>
              {user.name}
            </button>
          </li>
        </ul>
      </nav>

      {/* Dashboard header */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-greeting">{timeOfDay()}, Pilot ◈</div>
          <div className="dashboard-title">Welcome to Your Databank, {user.name}</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem',
            color: 'var(--text-muted)', marginTop: 8 }}>
            {user.email} · Standard Account
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            padding: '10px 20px', background: 'var(--neon-dim)',
            border: '1px solid rgba(0,243,255,0.2)', borderRadius: 10,
            fontFamily: 'Orbitron, monospace', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--neon)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🛒 {cartCount} items
          </div>
          <button className="btn-primary" onClick={() => navigate(PAGES.LANDING)}>
            ◈ Browse Store
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <DashboardNav active={activeTab} setActive={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'cart'     && <CartTab />}
      {activeTab === 'library'  && <LibraryTab />}
      {activeTab === 'profile'  && <ProfileTab />}
    </div>
  );
}
