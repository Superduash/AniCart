import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import apiClient from './api/client';
import './App.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';

// ══════════════════════════════════════════
// CONTEXTS
// ══════════════════════════════════════════

export const AuthContext = createContext(null);
export const CartContext = createContext(null);
export const ToastContext = createContext(null);
export const NavigationContext = createContext(null);

// ══════════════════════════════════════════
// TOAST SYSTEM
// ══════════════════════════════════════════

const TOAST_ICONS = {
  success: '✦',
  error: '✕',
  warning: '⚠',
  info: '◈',
};

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{TOAST_ICONS[t.type] || '◈'}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// STARFIELD & EFFECTS
// ══════════════════════════════════════════

function BackgroundEffects() {
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <>
      <div className="scanline" />
      <div
        className="cursor-glow"
        style={{ left: mousePos.x, top: mousePos.y }}
      />
      <div className="starfield" />
      <div className="nebula">
        <div className="nebula-blob" />
        <div className="nebula-blob" />
        <div className="nebula-blob" />
      </div>
    </>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════

const PAGES = {
  LANDING: 'landing',
  LOGIN: 'login',
  SIGNUP: 'signup',
  DASHBOARD: 'dashboard',
};

// Products will be fetched from API

export default function App() {
  const [currentPage, setCurrentPage] = useState(PAGES.LANDING);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/products');
        setProducts(res.data.data);
      } catch (error) {
        console.error('Failed to load products', error);
      }
    };
    fetchProducts();
  }, []);

  // Load persisted state
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('anicart_user');
      const savedCart = localStorage.getItem('anicart_cart');
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {}
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('anicart_cart', JSON.stringify(cart));
  }, [cart]);

  // ── Toast helpers ──
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Auth helpers ──
  const login = useCallback((userData) => {
    const enriched = { ...userData, joinedAt: new Date().toISOString() };
    setUser(enriched);
    localStorage.setItem('anicart_user', JSON.stringify(enriched));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('anicart_user');
    localStorage.removeItem('anicart_cart');
    setCurrentPage(PAGES.LANDING);
    addToast('Disconnected from AniCart. See you in the databank!', 'info');
  }, [addToast]);

  // ── Cart helpers ──
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        addToast(`${product.name} quantity updated!`, 'success');
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      addToast(`${product.name} added to cart! 🛒`, 'success');
      return [...prev, { ...product, qty: 1 }];
    });
  }, [addToast]);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    addToast('Item removed from cart.', 'info');
  }, [addToast]);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
        .filter((i) => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    addToast('Cart cleared.', 'info');
  }, [addToast]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // ── Navigation ──
  const navigate = useCallback((page) => {
    if (page === PAGES.DASHBOARD && !user) {
      setCurrentPage(PAGES.LOGIN);
      addToast('Please log in to access your Dashboard.', 'warning');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, addToast]);

  const navValue = { navigate, PAGES, currentPage };
  const authValue = { user, login, logout };
  const cartValue = { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount, products };
  const toastValue = { addToast };

  const renderPage = () => {
    switch (currentPage) {
      case PAGES.LOGIN:    return <LoginPage />;
      case PAGES.SIGNUP:   return <SignupPage />;
      case PAGES.DASHBOARD: return <Dashboard />;
      default:             return <LandingPage />;
    }
  };

  return (
    <NavigationContext.Provider value={navValue}>
      <AuthContext.Provider value={authValue}>
        <CartContext.Provider value={cartValue}>
          <ToastContext.Provider value={toastValue}>
            <BackgroundEffects />
            <div className="page-wrapper">
              {renderPage()}
            </div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </ToastContext.Provider>
        </CartContext.Provider>
      </AuthContext.Provider>
    </NavigationContext.Provider>
  );
}

// ── Custom Hooks ──
export const useAuth = () => useContext(AuthContext);
export const useCart = () => useContext(CartContext);
export const useToast = () => useContext(ToastContext);
export const useNavigation = () => useContext(NavigationContext);
