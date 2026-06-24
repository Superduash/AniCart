import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  // Load cart from API when user logs in, from localStorage for guests
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Guest: load from localStorage
      try {
        const saved = localStorage.getItem('anicart_cart');
        if (saved) setCart(JSON.parse(saved));
      } catch { setCart([]); }
    }
  }, [user]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('anicart_cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  // M7 Fix: wrap in useCallback so consumers don't re-render unnecessarily on every CartProvider render
  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const res = await apiClient.get('/cart');
      const items = res.data?.data?.items || res.data?.data || [];
      setCart(Array.isArray(items) ? items : []);
    } catch {
      // Fallback to empty if API fails
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (product) => {
    // Optimistic update
    setCart(prev => {
      const exists = prev.find(i => (i._id || i.id) === (product._id || product.id));
      if (exists) return prev;
      return [...prev, { ...product, qty: 1 }];
    });

    if (user) {
      try {
        await apiClient.post('/cart/add', { productId: product._id || product.id });
        // Re-sync with server
        fetchCart();
      } catch {
        // Revert optimistic update on failure
        setCart(prev => prev.filter(i => (i._id || i.id) !== (product._id || product.id)));
      }
    }
  }, [user]);

  const removeFromCart = useCallback(async (productId) => {
    setCart(prev => prev.filter(i => (i._id || i.id) !== productId));
    if (user) {
      try {
        await apiClient.delete(`/cart/remove/${productId}`);
      } catch { fetchCart(); }
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    setCart([]);
    if (user) {
      try { await apiClient.delete('/cart/clear'); } catch { /* ignore */ }
    } else {
      localStorage.removeItem('anicart_cart');
    }
  }, [user]);

  // Sync guest cart to server on login
  const syncCart = useCallback(async (localCart) => {
    if (!localCart?.length) return;
    try {
      await apiClient.post('/cart/sync', {
        items: localCart.map(i => ({ productId: i._id || i.id }))
      });
      fetchCart();
    } catch { fetchCart(); }
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + (i.price || 0), 0);
  const cartCount = cart.length;

  return (
    <CartContext.Provider value={{
      cart, cartLoading, cartTotal, cartCount,
      addToCart, removeFromCart, clearCart, syncCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};

export default CartContext;
