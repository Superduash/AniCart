import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../contexts/AuthContext';
import { useWindowWidth } from '../hooks/useWindowWidth';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, HeroSkeleton } from '../components/ui/Skeleton';
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
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({});
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isSmallMobile = width < 480;

  // Preload all images for instant transitions
  useEffect(() => {
    if (!products || products.length === 0) return;
    products.forEach((p, idx) => {
      const url = p.assets?.preview?.url || p.img || p.imageUrl;
      if (url) {
        const img = new Image();
        img.src = url;
        img.onload = () => setImageLoaded(prev => ({ ...prev, [idx]: true }));
      }
    });
  }, [products]);

  // Auto-advance with pause on hover
  useEffect(() => {
    if (!products || products.length === 0 || isHovered) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products, isHovered]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!products || products.length === 0) return;
      if (e.key === 'ArrowLeft') {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
      } else if (e.key === 'ArrowRight') {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  if (loading) {
    return <HeroSkeleton />;
  }

  if (!products || products.length === 0) {
    return null;
  }

  // Animation variants - fast and smooth
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 60 : -60,
      opacity: 0,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  const arrowButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
    width: isMobile ? 44 : 56,
    height: isMobile ? 44 : 56,
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: 'white',
    fontSize: isMobile ? '1.2rem' : '1.4rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    outline: 'none'
  };

  const arrowButtonHoverStyle = {
    background: 'rgba(0, 243, 255, 0.2)',
    borderColor: 'rgba(0, 243, 255, 0.5)',
    boxShadow: '0 8px 32px rgba(0, 243, 255, 0.2)',
    transform: 'translateY(-50%) scale(1.08)'
  };

  return (
    <section 
      className="hero-section" 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        height: isMobile ? (isSmallMobile ? '60vh' : '65vh') : '70vh', 
        minHeight: isMobile ? 400 : 500, 
        display: 'flex', 
        alignItems: 'center', 
        padding: 0 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Prefetch all images for instant transitions */}
      {products.map((p, idx) => {
        const url = p.assets?.preview?.url || p.img || p.imageUrl;
        return <link key={`preload-${idx}`} rel="preload" as="image" href={url} fetchpriority={idx < 3 ? "high" : "auto"} />;
      })}

      {/* Previous Arrow */}
      <motion.button
        onClick={goToPrev}
        style={{ ...arrowButtonStyle, left: isMobile ? 12 : 24 }}
        whileHover={!isMobile ? arrowButtonHoverStyle : {}}
        whileTap={{ scale: 0.95 }}
        aria-label="Previous slide"
      >
        <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </motion.button>

      {/* Next Arrow */}
      <motion.button
        onClick={goToNext}
        style={{ ...arrowButtonStyle, right: isMobile ? 12 : 24 }}
        whileHover={!isMobile ? arrowButtonHoverStyle : {}}
        whileTap={{ scale: 0.95 }}
        aria-label="Next slide"
      >
        <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.button>

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 }} />
            <motion.img 
              src={products[currentIndex].assets?.preview?.url || products[currentIndex].img || products[currentIndex].imageUrl} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(15px)', transform: 'scale(1.1)' }} 
              loading="eager" 
              fetchpriority="high" 
              alt=""
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: isMobile ? 16 : 40, 
            maxWidth: 1200, 
            width: '100%', 
            padding: isMobile ? '0 16px' : '0 40px', 
            zIndex: 2, 
            alignItems: 'center' 
          }}>
            <motion.div 
              className="hero-content" 
              style={{ margin: 0, padding: 0, textAlign: isMobile ? 'center' : 'left', order: isMobile ? 2 : 1 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.div 
                className="hero-badge"
                style={{ justifyContent: 'center' }}
                initial={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? -10 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <div className="hero-badge-dot" />
                ✦ FEATURED
              </motion.div>
              <motion.h1 
                className="hero-title" 
                style={{ 
                  fontSize: isMobile ? (isSmallMobile ? '1.5rem' : '1.8rem') : 'clamp(2rem, 4vw, 3.5rem)', 
                  lineHeight: 1.1, 
                  marginBottom: isMobile ? 12 : 20 
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {products[currentIndex].name}
              </motion.h1>
              <motion.p 
                className="hero-desc" 
                style={{ 
                  fontSize: isMobile ? '0.9rem' : '1.1rem', 
                  opacity: 0.8, 
                  maxWidth: 500, 
                  marginBottom: isMobile ? 16 : 30, 
                  textAlign: isMobile ? 'center' : 'left',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {products[currentIndex].series} • {(products[currentIndex].price || 0) === 0 ? 'Free' : `$${(products[currentIndex].price || 0).toFixed(2)}`}
              </motion.p>
              <motion.div 
                className="hero-cta" 
                style={{ justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Link to={`/products/${products[currentIndex]._id || products[currentIndex].id}`} className="btn btn-primary btn-lg" style={{ width: isMobile ? '100%' : 'auto', maxWidth: 280 }}>
                  View Artwork →
                </Link>
              </motion.div>
            </motion.div>

            {!isMobile && (
              <motion.div 
                style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', aspectRatio: '16/10', order: 2 }}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
                <img 
                  src={products[currentIndex].assets?.preview?.url || products[currentIndex].img || products[currentIndex].imageUrl} 
                  draggable="false" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }} 
                  loading="eager" 
                  fetchpriority="high" 
                  alt={products[currentIndex].name} 
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom indicators with slide counter */}
      <div style={{ 
        position: 'absolute', 
        bottom: isMobile ? 20 : 30, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        display: 'flex', 
        gap: isMobile ? 6 : 10, 
        zIndex: 10, 
        alignItems: 'center' 
      }}>
        {products.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            style={{ 
              width: idx === currentIndex ? (isMobile ? 32 : 48) : (isMobile ? 20 : 32), 
              height: isMobile ? 3 : 4, 
              borderRadius: 2, 
              background: idx === currentIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)', 
              border: 'none', 
              cursor: 'pointer',
              outline: 'none'
            }}
            whileHover={!isMobile ? { background: idx === currentIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)' } : {}}
            animate={{ 
              width: idx === currentIndex ? (isMobile ? 32 : 48) : (isMobile ? 20 : 32),
              background: idx === currentIndex ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)'
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Slide counter - hidden on small mobile */}
      {!isSmallMobile && (
        <div style={{ 
          position: 'absolute', 
          bottom: isMobile ? 20 : 30, 
          right: isMobile ? 16 : 40, 
          zIndex: 10, 
          fontFamily: 'JetBrains Mono, monospace', 
          fontSize: isMobile ? '0.75rem' : '0.85rem', 
          color: 'rgba(255,255,255,0.6)', 
          letterSpacing: 2 
        }}>
          <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{String(currentIndex + 1).padStart(2, '0')}</span>
          <span style={{ margin: '0 6px' }}>/</span>
          <span>{String(products.length).padStart(2, '0')}</span>
        </div>
      )}
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
  const [heroLoading, setHeroLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/products', { params: { isHero: true, sort: 'heroOrder', limit: 10, status: 'active' } })
      .then(res => {
        const data = res.data?.data;
        setHeroProducts(Array.isArray(data) ? data : data?.products || []);
      })
      .catch(() => setHeroProducts([]))
      .finally(() => setHeroLoading(false));

    apiClient.get('/products/series/list')
      .then(res => setSeries(res.data?.data || []))
      .catch(() => setSeries([]))
      .finally(() => setSeriesLoading(false));

    apiClient.get('/products', { params: { isFeatured: true, sort: 'featuredOrder', limit: 12, status: 'active' } })
      .then(res => {
        const data = res.data?.data;
        setProducts(Array.isArray(data) ? data : data?.products || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── HERO SLIDER ─── */}
      <HeroSlider products={heroProducts} loading={heroLoading} user={user} />

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
      <section className="section" id="products" style={{ paddingTop: 40, paddingBottom: 80, scrollMarginTop: 80 }}>
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
