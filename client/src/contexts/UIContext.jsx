import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [modalStack, setModalStack] = useState([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        if (modalStack.length > 0) {
          setModalStack(prev => prev.slice(0, -1));
        } else if (searchOpen) {
          setSearchOpen(false);
        } else if (cartSidebarOpen) {
          setCartSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, cartSidebarOpen, modalStack]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Global API error listener
  useEffect(() => {
    const handleApiError = (event) => {
      addToast(event.detail || 'An unexpected error occurred.', 'error');
    };
    window.addEventListener('api:error', handleApiError);
    return () => window.removeEventListener('api:error', handleApiError);
  }, [addToast]);

  const openModal = useCallback((modal) => {
    setModalStack(prev => [...prev, modal]);
  }, []);

  const closeModal = useCallback(() => {
    setModalStack(prev => prev.slice(0, -1));
  }, []);

  return (
    <UIContext.Provider value={{
      toasts, addToast, removeToast,
      searchOpen, setSearchOpen,
      cartSidebarOpen, setCartSidebarOpen,
      modalStack, openModal, closeModal,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be inside UIProvider');
  return ctx;
};

export default UIContext;
