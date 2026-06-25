import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { motion } from 'framer-motion';
import apiClient from '../../api/client';
import { Heart } from 'lucide-react';
import { getAvailableVariants, getHighestResolution, getResolutionLabel, getResolutionClass } from '../../utils/resolutionUtils';

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

function ResolutionBadge({ resolution, displayResolution, product }) {
  // If product has assets, derive display resolution from actual available variants (excluding original)
  let displayResolutionValue = displayResolution || resolution;
  let resolutionClass = 'res-1080p';
  
  if (product && product.assets) {
    const availableVariants = getAvailableVariants(product);
    // Filter out 'original' for display purposes
    const displayVariants = availableVariants.filter(v => v !== 'original');
    const highestKey = displayVariants.length > 0 
      ? getHighestResolution(displayVariants) 
      : availableVariants.length > 0 
        ? getHighestResolution(availableVariants) 
        : null;
    
    if (highestKey) {
      displayResolutionValue = getResolutionLabel(highestKey);
      resolutionClass = getResolutionClass(highestKey);
    }
  }
  
  // Fallback to legacy resolution prop if no assets available
  if (!displayResolutionValue && resolution) {
    displayResolutionValue = resolution;
    resolutionClass = resolution.toLowerCase().includes('4k') ? 'res-4k'
      : resolution.toLowerCase().includes('2k') ? 'res-2k'
      : 'res-1080p';
  }
  
  if (!displayResolutionValue) return null;
  
  return <span className={`res-badge ${resolutionClass}`}>{displayResolutionValue}</span>;
}

export default function ProductCard({ product, inLibrary = false, onDownload, onWishlistChange }) {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();
  const { user, updateUser } = useAuth();
  const { addToast } = useUI();
  const width = useWindowWidth();
  const isMobile = width < 768;
  
  const id = product._id || product.id;
  const isWishlisted = user?.wishlist?.some(w => (w._id || w) === id) || product.isWishlisted || false;
  
  const [optimisticWishlist, setOptimisticWishlist] = useState(null);
  const wishlisted = optimisticWishlist !== null ? optimisticWishlist : isWishlisted;
  const [animatingHeart, setAnimatingHeart] = useState(false);

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
    setOptimisticWishlist(newState);
    
    if (newState) {
      setAnimatingHeart(true);
      setTimeout(() => setAnimatingHeart(false), 600);
    }
    
    try {
      if (newState) {
        const res = await apiClient.post(`/users/wishlist/${id}`);
        updateUser({ wishlist: res.data?.data?.wishlist || user.wishlist });
        addToast('Saved to wishlist!', 'success');
      } else {
        const res = await apiClient.delete(`/users/wishlist/${id}`);
        updateUser({ wishlist: res.data?.data?.wishlist || user.wishlist });
        addToast('Removed from wishlist.', 'info');
      }
      setOptimisticWishlist(null);
      if (onWishlistChange) onWishlistChange(id, newState);
    } catch {
      setOptimisticWishlist(null);
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
      whileHover={isMobile ? {} : { y: -6 }}
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
          decoding="async"
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
            style={{ minWidth: 44, minHeight: 44, padding: 12 }}
          >
            <Heart 
              size={20} 
              className={`wishlist-heart-icon ${animatingHeart ? 'animating' : ''}`}
              fill={wishlisted ? 'currentColor' : 'none'}
              strokeWidth={wishlisted ? 0 : 2}
            />
          </button>
        )}

        {/* Overlay - always visible on mobile, hover on desktop */}
      </div>

      {/* Info */}
      <div className="product-info">
        <div className="product-meta">
          {product.series && <span>{product.series}</span>}
          {product.series && (product.displayResolution || product.resolution) && <span>·</span>}
          {(product.displayResolution || product.resolution) && <ResolutionBadge resolution={product.resolution} displayResolution={product.displayResolution} product={product} />}
        </div>
        <div className="product-name">{product.name}</div>
        <StarRating rating={product.rating || product.averageRating} count={product.reviewCount || product.reviews} />

        <div className="product-footer">
          {user?.role === 'admin' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/products/${id}`);
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px', marginLeft: 'auto' }}
              aria-label="Edit product"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
