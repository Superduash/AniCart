import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import apiClient from '../api/client';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Footer from '../components/layout/Footer';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Rating">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: n <= (hover || value) ? '#f59e0b' : 'var(--color-text-3)', transition: 'color 0.1s', padding: 2 }}
        >★</button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, addToCart } = useCart();
  const { addToast } = useUI();
  useTitle('');
  const [productName, setProductName] = useState('');
  // M3 Fix: use productName state so hook correctly updates when product loads
  useTitle(productName || 'Product');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [inLibrary, setInLibrary] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Review state
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const inCart = cart.some(i => (i._id || i.id) === id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prodRes, reviewsRes] = await Promise.allSettled([
          apiClient.get(`/products/${id}`),
          // C3 Fix: review endpoints are at /reviews/:productId, not /products/:id/reviews
          apiClient.get(`/reviews/${id}`),
        ]);
        if (prodRes.status === 'fulfilled') {
          const prod = prodRes.value.data?.data || prodRes.value.data;
          setProduct(prod);
          setWishlisted(prod.isWishlisted || false);
          // M3 Fix: set productName state so useTitle hook gets the correct value
          setProductName(prod.name);
          // Fetch related
          if (prod.series) {
            apiClient.get('/products', { params: { series: prod.series, limit: 4, status: 'active' } })
              .then(r => setRelated((r.data?.data?.products || r.data?.data || []).filter(p => p._id !== id)))
              .catch(() => {});
          }
        } else { navigate('/marketplace'); }
        let fetchedReviews = [];
        if (reviewsRes.status === 'fulfilled') {
          const reviewData = reviewsRes.value.data?.data || [];
          fetchedReviews = Array.isArray(reviewData) ? reviewData : [];
          setReviews(fetchedReviews);
        }
        // H8 Fix: use dedicated ownership endpoint instead of fetching entire library
        if (user) {
          apiClient.get(`/users/library/${id}`)
            .then(r => {
              const owned = r.data?.data?.owned || false;
              setInLibrary(owned);
              if (owned) {
                const myReview = fetchedReviews.find(r => r.user?._id === user._id || r.userId === user._id);
                setHasReviewed(!!myReview);
              }
            })
            .catch(() => {});
        }
      } finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  const handleCartAction = async () => {
    if (!user) { addToast('Sign in to purchase.', 'warning'); navigate('/auth/login?next=/products/' + id); return; }
    if (inCart) { navigate('/cart'); return; }
    await addToCart(product);
    addToast(`${product.name} added to cart!`, 'success');
  };

  const handleWishlist = async () => {
    if (!user) { addToast('Sign in to save wishlist.', 'warning'); return; }
    const newState = !wishlisted;
    setWishlisted(newState);
    try {
      newState
        ? await apiClient.post(`/users/wishlist/${id}`)
        : await apiClient.delete(`/users/wishlist/${id}`);
    } catch { setWishlisted(!newState); }
  };

  const handleDownload = async () => {
    try {
      const res = await apiClient.get(`/products/${id}/download`);
      // H1 Fix: backend returns 'downloadUrl' not 'url'
      const url = res.data?.data?.downloadUrl || res.data?.downloadUrl;
      if (url) window.open(url, '_blank', 'noopener');
    } catch { addToast('Download failed. Please try again.', 'error'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { addToast('Please select a rating.', 'warning'); return; }
    setReviewLoading(true);
    try {
      // C3 Fix: correct endpoint for posting reviews
      const res = await apiClient.post(`/reviews/${id}`, reviewForm);
      const newReview = res.data?.data;
      if (newReview) setReviews(prev => [newReview, ...prev]);
      setHasReviewed(true);
      setReviewForm({ rating: 0, comment: '' });
      addToast('Review submitted!', 'success');
    } catch (err) { addToast(err.response?.data?.message || 'Failed to submit review.', 'error'); }
    setReviewLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '120px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 48 }}>
          <div className="skeleton" style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-xl)' }} />
          <div>
            <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 28, width: '80%', marginBottom: 16, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 60, marginBottom: 24, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 44, borderRadius: 10 }} />
          </div>
        </div>
      </div>
    );
  }
  if (!product) return null;

  const previewUrl = product.assets?.preview?.url || product.img || product.imageUrl;
  const avgRating = product.averageRating || product.rating || 0;
  const reviewCount = reviews.length;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 80px' }}>
        {/* Breadcrumb */}
        <Breadcrumbs items={[
          { label: 'Home', path: '/' },
          { label: 'Marketplace', path: '/marketplace' },
          { label: product.name }
        ]} />

        {/* Main 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,55%) minmax(0,45%)', gap: 48, alignItems: 'start' }}>
          {/* LEFT: image */}
          <div>
            <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '16/10', boxShadow: 'var(--shadow-xl)' }}>
              <img src={previewUrl} alt={`${product.name} from ${product.series}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {!inLibrary && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 20, background: 'linear-gradient(to top, rgba(2,6,23,0.7) 0%, transparent 60%)' }}>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                    Purchase to unlock full quality
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: info */}
          <div style={{ position: 'sticky', top: 100 }}>
            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {product.series && (
                <span style={{ padding: '3px 10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-glow)', borderRadius: 'var(--radius-full)', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 600 }}>
                  {product.series}
                </span>
              )}
            </div>

            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-3xl)', color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 12 }}>
              {product.name}
            </h1>

            {product.description && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 16 }}>
                {product.description}
              </p>
            )}

            {/* Rating */}
            {avgRating > 0 && reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif', fontSize: '1.1rem' }}>
                  {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                  {avgRating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Resolution */}
            {product.resolution && (
              <div style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 4 }}>Resolution</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>
                  {product.resolution} · WebP
                </div>
              </div>
            )}

            {/* Price */}
            {!inLibrary && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-4xl)', fontWeight: 600, color: 'var(--color-accent)', textShadow: 'var(--neon-text-glow)', marginBottom: 24 }}>
                ${(product.price || 0).toFixed(2)}
              </div>
            )}

            {/* Primary action */}
            {inLibrary ? (
              <button onClick={handleDownload} className="btn btn-success btn-full btn-lg" style={{ marginBottom: 12 }}>
                ↓ Download
              </button>
            ) : (
              <button onClick={handleCartAction} className={`btn btn-full btn-lg ${inCart ? 'btn-secondary' : 'btn-primary'}`} style={{ marginBottom: 12 }}>
                {inCart ? '✓ In Cart — View Cart' : '+ Add to Cart'}
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              className="btn btn-ghost btn-full"
              style={{ marginBottom: 24, color: wishlisted ? 'var(--color-pink)' : 'var(--color-text-3)' }}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              {wishlisted ? '♥ Saved to Wishlist' : '♡ Save to Wishlist'}
            </button>

            {/* Trust row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              {['🔒 Secure checkout via Stripe', '⬇ Instant download after payment', '♾ Personal use license included'].map((item, i) => (
                <div key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--color-text)' }}>
              Reviews {reviewCount > 0 && `(${reviewCount})`}
            </h2>
          </div>

          {/* Write review form */}
          {user && inLibrary && !hasReviewed && (
            <form onSubmit={submitReview} style={{ padding: 24, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 32 }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)', marginBottom: 16 }}>Write a Review</div>
              <div style={{ marginBottom: 14 }}>
                <StarPicker value={reviewForm.rating} onChange={(r) => setReviewForm(prev => ({ ...prev, rating: r }))} />
              </div>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this wallpaper..."
                style={{ width: '100%', padding: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', resize: 'vertical', minHeight: 80, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
              <button type="submit" disabled={reviewLoading || !reviewForm.rating} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Review list */}
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(review => (
                <div key={review._id} style={{ padding: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-void)', flexShrink: 0 }}>
                      {(review.user?.name || review.userName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
                        {review.user?.name || review.userName || 'Anonymous'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.7, margin: 0 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-3)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)' }}>
              {user && inLibrary ? 'Be the first to review this wallpaper.' : 'No reviews yet.'}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--color-text)', marginBottom: 28 }}>
              More from {product.series}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {related.slice(0, 4).map(p => <ProductCard key={p._id || p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
