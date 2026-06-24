import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Styles
import './styles/globals.css';
import './styles/components.css';
import './styles/animations.css';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { UIProvider, useUI } from './contexts/UIContext';

// Shared components (not lazy — needed immediately)
import BackgroundEffects from './components/BackgroundEffects';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/ui/ToastContainer';
import SearchOverlay from './components/search/SearchOverlay';

// Page routes (lazy loaded)
const LandingPage         = lazy(() => import('./pages/LandingPage'));
const MarketplacePage     = lazy(() => import('./pages/MarketplacePage'));
const ProductDetailPage   = lazy(() => import('./pages/ProductDetailPage'));
const CartPage            = lazy(() => import('./pages/CartPage'));
const CheckoutPage        = lazy(() => import('./pages/CheckoutPage'));

const LoginPage           = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage          = lazy(() => import('./pages/auth/SignupPage'));
const VerifyEmailPage     = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage  = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('./pages/auth/ResetPasswordPage'));

const DashboardShell      = lazy(() => import('./components/layout/DashboardShell'));
const LibraryPage         = lazy(() => import('./pages/dashboard/LibraryPage'));
const OrdersPage          = lazy(() => import('./pages/dashboard/OrdersPage'));
const WishlistPage        = lazy(() => import('./pages/dashboard/WishlistPage'));
const SettingsPage        = lazy(() => import('./pages/dashboard/SettingsPage'));

const CreatorShell        = lazy(() => import('./components/layout/CreatorShell'));
const CreatorUploadsPage  = lazy(() => import('./pages/creator/CreatorUploadsPage'));
const CreatorStatsPage    = lazy(() => import('./pages/creator/CreatorStatsPage'));

const AdminShell          = lazy(() => import('./components/layout/AdminShell'));
const AdminProductsPage   = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminCreatorsPage   = lazy(() => import('./pages/admin/AdminCreatorsPage'));

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } },
};

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

// Full-screen loading fallback
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner light" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', letterSpacing: '2px', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>
          Loading...
        </div>
      </div>
    </div>
  );
}

// Protected route components
function ProtectedRoute({ children, role }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!user) {
    return <Navigate to={`/auth/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (role === 'creator' && user.role !== 'creator' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Animated routes
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/marketplace" element={<PageWrapper><MarketplacePage /></PageWrapper>} />
        <Route path="/products/:id" element={<PageWrapper><ProductDetailPage /></PageWrapper>} />
        <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />

        {/* Auth */}
        <Route path="/auth/login"        element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/auth/signup"       element={<PageWrapper><SignupPage /></PageWrapper>} />
        <Route path="/auth/verify-email" element={<PageWrapper><VerifyEmailPage /></PageWrapper>} />
        <Route path="/auth/forgot"       element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/auth/reset"        element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />

        {/* Protected: Checkout */}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <PageWrapper><CheckoutPage /></PageWrapper>
          </ProtectedRoute>
        } />

        {/* Protected: Dashboard */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/library" replace />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        }>
          <Route path="library"  element={<PageWrapper><LibraryPage /></PageWrapper>} />
          <Route path="orders"   element={<PageWrapper><OrdersPage /></PageWrapper>} />
          <Route path="wishlist" element={<PageWrapper><WishlistPage /></PageWrapper>} />
          <Route path="settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route index element={<Navigate to="library" replace />} />
        </Route>

        {/* Protected: Creator */}
        <Route path="/creator" element={<Navigate to="/creator/uploads" replace />} />
        <Route path="/creator/*" element={
          <ProtectedRoute role="creator">
            <CreatorShell />
          </ProtectedRoute>
        }>
          <Route path="uploads" element={<PageWrapper><CreatorUploadsPage /></PageWrapper>} />
          <Route path="stats"   element={<PageWrapper><CreatorStatsPage /></PageWrapper>} />
          <Route index element={<Navigate to="uploads" replace />} />
        </Route>

        {/* Protected: Admin */}
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <AdminShell />
          </ProtectedRoute>
        }>
          <Route path="products" element={<PageWrapper><AdminProductsPage /></PageWrapper>} />
          <Route path="creators" element={<PageWrapper><AdminCreatorsPage /></PageWrapper>} />
          <Route index element={<Navigate to="products" replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

import { useWindowWidth } from './hooks/useWindowWidth';
import BottomNav from './components/layout/BottomNav';

// App shell with navbar
function AppShell() {
  const { toasts, removeToast, searchOpen } = useUI();
  const width = useWindowWidth();
  const isMobile = width < 768;

  return (
    <>
      <BackgroundEffects />
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main" className="page-wrapper" style={{ paddingBottom: isMobile ? 80 : 0 }}>
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>
      </main>
      {isMobile && <BottomNav />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {searchOpen && <SearchOverlay />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
