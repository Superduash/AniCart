import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { motion } from 'framer-motion';
import apiClient from '../../api/client';

function StarRating({ rating, count }) {
  if (!rating || rating === 0) return null;
  const stars = Math.round(rating);
  return (
    <div
      className="product-rating"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars, ${count} reviews`}
    >
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      <span>{rating.toFixed(1)} ({count || 0})</span>
    </div>
  );
}

function ResolutionBadge({ resolution }) {
  const cls = resolution?.toLowerCase().includes('4k') ? 'res-4k'
    : resolution?.toLowerCase().includes('2k') ? 'res-2k'
    : 'res-1080p';
  return <span className={`res-badge ${cls}`}>{resolution}</span>;
}

export default function ProductCard({ product, inLibrary = false, onDownload }) {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useUI();
  const [wishlisted, setWishlisted] = useState(product.isWishlisted || false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const id = product._id || product.id;
  const inCart = cart.some(i => (i._id || i.id) === id);
  const previewUrl = product.assets?.preview?.url || product.img || product.imageUrl;
  const badge = product.badge || product.label;
  const badgeType = badge?.toLowerCase().includes('hot') ? 'hot'
    : badge?.toLowerCase().includes('new') ? 'new'
    : badge?.toLowerCase() === 'bestseller' ? 'best' : 'new';

  const handleCartAction = async (e) => {
    e.stopPropagation();
    if (!user) {
      addToast('Please sign in to add items to cart.', 'warning');
      navigate('/auth/login?next=/marketplace');
      return;
    }
    if (inCart) {
      navigate('/cart');
    } else {
      try {
        await addToCart(product);
        addToast(`${product.name} added to cart!`, 'success');
      } catch (err) {
        addToast(`Failed to add ${product.name} to cart.`, 'error');
      }
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      addToast('Sign in to save to wishlist.', 'warning');
      return;
    }
    const newState = !wishlisted;
    setWishlisted(newState);
    try {
      if (newState) {
        await apiClient.post(`/users/wishlist/${id}`);
      } else {
        await apiClient.delete(`/users/wishlist/${id}`);
      }
    } catch {
      setWishlisted(!newState); // revert
      addToast('Failed to update wishlist.', 'error');
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (onDownload) { onDownload(product); return; }
    try {
      const res = await apiClient.get(`/products/${id}/download`);
      // H1 Fix: backend returns 'downloadUrl' not 'url'
      const url = res.data?.data?.downloadUrl || res.data?.downloadUrl;
      if (url) window.open(url, '_blank', 'noopener');
    } catch {
      addToast('Download failed. Please try again.', 'error');
    }
  };

  return (
    <motion.article
      className="product-card"
      onClick={() => navigate(`/products/${id}`)}
      role="listitem"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      style={{ cursor: 'pointer' }}
    >
      {/* Image */}
      <div className="product-img-wrap" style={{ position: 'relative' }}>
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 10 }} 
          onContextMenu={e => e.preventDefault()} 
        />
        <img
          src={previewUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%230a1628" width="400" height="250"/%3E%3C/svg%3E'}
          alt={`${product.name} from ${product.series}`}
          loading="lazy"
          draggable="false"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          onError={e => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%230a1628" width="400" height="250"/%3E%3C/svg%3E'; }}
        />

        {/* Badge */}
        {badge && !inLibrary && (
          <div className={`product-badge ${badgeType}`}>{badge}</div>
        )}

        {/* Wishlist btn */}
        {!inLibrary && (
          <button
            className={`product-wishlist-btn${wishlisted ? ' active' : ''}`}
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {wishlisted ? '♥' : '♡'}
          </button>
        )}

        {/* Hover overlay */}
        {!inLibrary && (
          <div className="product-overlay">
            <button
              className="product-quick-add"
              onClick={handleCartAction}
              aria-label={inCart ? 'View cart' : `Add ${product.name} to cart`}
            >
              {inCart ? '✓ In Cart' : '+ Add to Cart'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="product-info">
        <div className="product-meta">
          {product.series && <span>{product.series}</span>}
          {product.series && product.resolution && <span>·</span>}
          {product.resolution && <ResolutionBadge resolution={product.resolution} />}
        </div>
        <div className="product-name">{product.name}</div>
        <StarRating rating={product.rating || product.averageRating} count={product.reviewCount || product.reviews} />

        <div className="product-footer">
          {inLibrary || product.price === 0 ? (
            <button
              className="btn btn-sm"
              onClick={handleDownload}
              aria-label={`Download ${product.name}`}
              style={{ background: 'var(--color-accent)', color: 'var(--color-void)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 1, padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', width: '100%', transition: 'box-shadow 0.15s' }}
            >
              ↓ {inLibrary ? 'Download' : 'Free Download'}
            </button>
          ) : (
            <>
              <div className="product-price">${(product.price || 0).toFixed(2)}</div>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleCartAction}
                aria-label={inCart ? 'View cart' : `Add ${product.name} to cart`}
                style={{ fontSize: 'var(--text-xs)', padding: '0 12px', height: 32 }}
              >
                {inCart ? '✓ In Cart' : '+'}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
