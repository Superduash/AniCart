import React from 'react';
import { Link } from 'react-router-dom';

// Skeleton cell
export function SkeletonLine({ width = '100%', height = 12, style = {} }) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: 6, ...style }}
    />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="skeleton-card" aria-busy="true" aria-label="Loading product">
      <div className="skeleton skeleton-img" />
      <div style={{ padding: '14px 16px' }}>
        <SkeletonLine width="60%" height={10} style={{ marginBottom: 6 }} />
        <SkeletonLine width="85%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonLine width="40%" height={10} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonLine width="30%" height={14} />
          <SkeletonLine width="28%" height={32} style={{ borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

// Order row skeleton
export function OrderRowSkeleton() {
  return (
    <div className="skeleton-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <SkeletonLine width={48} height={48} style={{ borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <SkeletonLine width="50%" height={12} style={{ marginBottom: 6 }} />
        <SkeletonLine width="30%" height={10} />
      </div>
      <SkeletonLine width={80} height={28} style={{ borderRadius: 8, flexShrink: 0 }} />
    </div>
  );
}

// Hero skeleton
export function HeroSkeleton() {
  return (
    <section className="hero-section" style={{ position: 'relative', overflow: 'hidden', height: '70vh', minHeight: 500, display: 'flex', alignItems: 'center', padding: 0 }} aria-busy="true" aria-label="Loading hero">
      <div className="skeleton" style={{ position: 'absolute', inset: 0, zIndex: -1 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, maxWidth: 1200, width: '100%', padding: '0 40px', zIndex: 2, alignItems: 'center' }}>
        <div style={{ margin: 0, padding: 0, textAlign: 'left' }}>
          <SkeletonLine width={180} height={24} style={{ borderRadius: 20, marginBottom: 28 }} />
          <SkeletonLine width="90%" height={56} style={{ marginBottom: 12 }} />
          <SkeletonLine width="60%" height={56} style={{ marginBottom: 20 }} />
          <SkeletonLine width="70%" height={20} style={{ marginBottom: 30 }} />
          <SkeletonLine width={200} height={52} style={{ borderRadius: 8 }} />
        </div>
        <div className="skeleton" style={{ borderRadius: 16, aspectRatio: '16/10', width: '100%' }} />
      </div>
    </section>
  );
}

// Page shell skeleton
export function PageShellSkeleton() {
  return (
    <div style={{ padding: '80px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }} aria-busy="true" aria-label="Loading page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ flex: 1 }}>
          <SkeletonLine width={240} height={32} style={{ marginBottom: 12 }} />
          <SkeletonLine width={340} height={16} />
        </div>
      </div>
      <div className="products-grid-4">
        {Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

// Empty state component
export function EmptyState({ icon, title, body, ctaLabel, ctaTo, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20, opacity: 0.4, lineHeight: 1 }} aria-hidden="true">
        {icon}
      </div>
      <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 10 }}>
        {title}
      </h3>
      {body && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 28 }}>
          {body}
        </p>
      )}
      {ctaLabel && (
        ctaTo ? (
          <Link to={ctaTo} className="btn btn-primary">{ctaLabel}</Link>
        ) : (
          <button onClick={onCta} className="btn btn-primary">{ctaLabel}</button>
        )
      )}
    </div>
  );
}

export default { ProductCardSkeleton, OrderRowSkeleton, HeroSkeleton, PageShellSkeleton, EmptyState, SkeletonLine };
