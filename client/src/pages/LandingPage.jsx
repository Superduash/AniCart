import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import Footer from '../components/layout/Footer';

function SeriesMarquee({ series }) {
  const items = series.length > 0 ? series : ['Jujutsu Kaisen', 'Demon Slayer', 'Attack on Titan', 'One Piece', 'Naruto', 'Bleach', 'Chainsaw Man', 'Spy × Family', 'My Hero Academia', 'Fullmetal Alchemist'];
  const doubled = [...items, ...items, ...items];

  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '14px 0', background: 'rgba(0,243,255,0.01)' }}>
      <div style={{ display: 'flex', gap: 60, animation: 'marquee 25s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {doubled.map((s, i) => (
          <span key={i} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: i % 3 === 0 ? 'var(--color-accent)' : 'var(--color-text-3)', opacity: 0.75 }}>
            ✦ {s}
          </span>
        ))}
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  { num: '01', icon: '🖼', title: 'BROWSE', desc: 'Filter by series, resolution, and price. Every product thumbnail is the actual artwork.' },
  { num: '02', icon: '💳', title: 'BUY',    desc: 'Instant checkout with Stripe. Your purchase is processed securely in seconds.' },
  { num: '03', icon: '⬇',  title: 'DOWNLOAD', desc: 'Access your library anytime. Download 4K, 2K, or 1080p — whatever you purchased.' },
];

function HeroSlider({ products, loading, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products]);

  if (loading) {
    return (
      <div style={{ height: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }}>
        <div className="loading-spinner light" style={{ width: 32, height: 32, marginBottom: 16 }} />
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)' }}>Loading...</div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="hero-section" style={{ position: 'relative', overflow: 'hidden', height: '70vh', minHeight: 500, display: 'flex', alignItems: 'center', padding: 0 }}>
      {/* Inject preload for the first image */}
      {products.length > 0 && (
        <link rel="preload" as="image" href={products[0].assets?.preview?.url || products[0].img || products[0].imageUrl} />
      )}
      <AnimatePresence>
        {products.map((p, index) => {
          if (index !== currentIndex) return null;
          const previewUrl = p.assets?.preview?.url || p.img || p.imageUrl;
          return (
            <motion.div
              key={p._id || p.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 }} />
                <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(15px)', transform: 'scale(1.1)' }} alt="" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, maxWidth: 1200, width: '100%', padding: '0 40px', zIndex: 2, alignItems: 'center' }}>
                <div className="hero-content" style={{ margin: 0, padding: 0, textAlign: 'left' }}>
                  <div className="hero-badge">
                    <div className="hero-badge-dot" />
                    ✦ FEATURED WALLPAPER
                  </div>
                  <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1, marginBottom: 20 }}>
                    {p.name}
                  </h1>
                  <p className="hero-desc" style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: 500, marginBottom: 30, textAlign: 'left' }}>
                    {p.series} • {(p.price || 0) === 0 ? 'Free' : `$${(p.price || 0).toFixed(2)}`}
                  </p>
                  <div className="hero-cta" style={{ justifyContent: 'flex-start' }}>
                    <Link to={`/products/${p._id || p.id}`} className="btn btn-primary btn-lg">
                      View Artwork →
                    </Link>
                  </div>
                </div>

                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', aspectRatio: '16/10' }}>
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
                  <img src={previewUrl} draggable="false" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }} alt={p.name} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 10 }}>
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{ width: 40, height: 4, borderRadius: 2, background: idx === currentIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  useTitle('Premium Anime Wallpapers');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [heroProducts, setHeroProducts] = useState([]);
  const [series, setSeries] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, seriesRes, heroRes] = await Promise.allSettled([
          apiClient.get('/products', { params: { limit: 8, sort: 'newest', status: 'active' } }),
          apiClient.get('/products/series/list'),
          apiClient.get('/products', { params: { limit: 5, sort: 'rating', status: 'active' } })
        ]);
        if (prodRes.status === 'fulfilled') {
          const data = prodRes.value.data?.data;
          setProducts(Array.isArray(data) ? data : data?.products || []);
        }
        if (seriesRes.status === 'fulfilled') {
          setSeries(seriesRes.value.data?.data || []);
        }
        if (heroRes.status === 'fulfilled') {
          const data = heroRes.value.data?.data;
          setHeroProducts(Array.isArray(data) ? data : data?.products || []);
        }
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── HERO SLIDER ─── */}
      <HeroSlider products={heroProducts} loading={productsLoading} user={user} />

      {/* ─── DISCOVER HERO ─── */}
      <section className="hero-section" style={{ position: 'relative' }}>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            ✦ PREMIUM ANIME WALLPAPERS
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line1">Discover Anime Art</span>
            <span className="hero-title-line2">Worth Collecting</span>
          </h1>

          <p className="hero-desc">
            Browse high-resolution wallpapers from your favorite series. Every piece, real art.
            Set your own price. Instant download delivery.
          </p>

          <div className="hero-cta">
            <Link to="/marketplace" className="btn btn-primary btn-lg">
              Browse Wallpapers →
            </Link>
            {!user && (
              <Link to="/auth/signup" className="btn btn-secondary btn-lg">
                Sell Your Art
              </Link>
            )}
          </div>
        </div>

        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '20%', right: '8%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,243,255,0.05) 0%, transparent 70%)', animation: 'drift 12s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)', animation: 'drift 8s ease-in-out infinite 4s', pointerEvents: 'none' }} />
      </section>

      {/* ─── SERIES MARQUEE ─── */}
      <SeriesMarquee series={series} />

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="section" id="products" style={{ paddingTop: 'calc(var(--navbar-height) + 10px)', paddingBottom: 80 }}>
        <div className="section-header">
          <div className="section-tag">◈ FEATURED COLLECTION</div>
          <h2 className="section-title">New <span>This Week</span></h2>
          <p className="section-desc">Hand-picked 4K artwork from the most iconic anime series.</p>
        </div>

        <div className="products-grid-4" role="list">
          {productsLoading
            ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.length > 0
              ? products.map(p => <ProductCard key={p._id || p.id} product={p} />)
              : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-3)', fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', letterSpacing: '2px' }}>
                  No wallpapers yet — be the first to upload!
                </div>
              )
          }
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/marketplace" className="btn btn-secondary">
            View All Wallpapers →
          </Link>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(180deg, transparent 0%, rgba(0,243,255,0.02) 50%, transparent 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">◈ THE PROCESS</div>
            <h2 className="section-title">Simple. <span>Fast.</span> Real.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                className="glass-card feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--color-text-3)', letterSpacing: 2 }}>{step.num}</div>
                  <div className="feature-icon-wrap neon" style={{ width: 40, height: 40, fontSize: '1.1rem', margin: 0 }}>{step.icon}</div>
                </div>
                <div className="feature-title" style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem', letterSpacing: 2, color: 'var(--color-accent)', marginBottom: 10, textTransform: 'uppercase' }}>{step.title}</div>
                <div className="feature-desc">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CREATOR CTA ─── */}
      <section className="section" style={{ paddingBottom: 80 }}>
        <div className="glass-card" style={{ padding: '64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-purple), transparent)' }} />
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', letterSpacing: 4, textTransform: 'uppercase', color: 'var(--color-purple-light)', marginBottom: 16 }}>Are you an artist?</div>
          <h2 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'var(--color-text)', marginBottom: 16 }}>
            Sell Your Anime Art on AniCart
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-base)', color: 'var(--color-text-2)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Set your own price, get paid per download, track your stats. Upload once, earn forever.
          </p>
          <Link to={user ? '/creator' : '/auth/signup'} className="btn btn-primary btn-lg">
            Apply to Create →
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
