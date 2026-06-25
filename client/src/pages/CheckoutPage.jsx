import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTitle } from '../hooks/useTitle';
import { useWindowWidth } from '../hooks/useWindowWidth';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import apiClient from '../api/client';
import Footer from '../components/layout/Footer';

// We fetch the stripe configuration dynamically from the backend

function CheckoutForm({ clientSecret, total }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { clearCart } = useCart();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      // Real payment
      const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required', // We handle success manually
      });

      if (confirmError) {
        setError(confirmError.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Success
        clearCart();
        navigate('/checkout/success');
      } else {
        setError('Payment failed or requires further action.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 32 }}>
      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 24, letterSpacing: 1, textTransform: 'uppercase' }}>
        Payment Details
      </h2>
      
      <PaymentElement options={{ layout: 'tabs' }} />
      
      {error && (
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--color-error)', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)' }}>
          ⚠ {error}
        </div>
      )}

      <button type="submit" disabled={!stripe || loading} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 32 }}>
        {loading ? <><span className="loading-spinner" /> Processing...</> : (total === 0 ? 'Get for Free' : `Pay $${total.toFixed(2)}`)}
      </button>

      <div style={{ marginTop: 16, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ color: 'var(--color-success)' }}>🔒</span> Payments are secure and encrypted.
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  useTitle('Checkout');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal } = useCart();
  
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const width = useWindowWidth();
  const isMobile = width < 900;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    const initCheckout = async () => {
      try {
        const configRes = await apiClient.get('/orders/config');
        setStripePromise(loadStripe(configRes.data.publishableKey || configRes.data.data?.publishableKey));

        const res = await apiClient.post('/orders/create-payment-intent', {
          items: cart.map(i => ({ product: i._id || i.id, price: i.price }))
        });
        setClientSecret(res.data?.data?.clientSecret || res.data?.clientSecret);
      } catch (err) {
        let errMsg = err.response?.data?.message || 'Failed to initialize checkout.';
        if (errMsg.toLowerCase().includes('api key') || errMsg.includes('sk_test_') || errMsg.toLowerCase().includes('stripe')) {
          errMsg = 'Payment not implemented yet.';
        }
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, [cart, navigate]);

  const appearance = {
    theme: 'night',
    variables: {
      fontFamily: 'Inter, sans-serif',
      colorPrimary: '#00f3ff',
      colorBackground: '#0a1628',
      colorText: '#f1f5f9',
      colorDanger: '#ef4444',
      borderRadius: '8px',
      spacingUnit: '4px',
      colorInputText: '#f1f5f9',
      colorInputBackground: '#111827',
      colorInputBorder: 'rgba(255,255,255,0.1)',
    },
    rules: {
      '.Input': { border: '1px solid var(--color-border)', boxShadow: 'none' },
      '.Input:focus': { border: '1px solid var(--color-accent)', boxShadow: '0 0 0 1px var(--color-accent)' },
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>←</button>
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', margin: 0 }}>
            Secure Checkout
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 40, alignItems: 'start', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
          {/* Payment Column */}
          <div style={{ order: isMobile ? 2 : 1 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
                <div className="loading-spinner light" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Initializing secure connection...
                </div>
              </div>
            ) : error ? (
              <div style={{ padding: 40, textAlign: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--color-error)' }}>⚠</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)', marginBottom: 8 }}>Checkout Error</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: 20 }}>{error}</div>
                <button onClick={() => navigate('/cart')} className="btn btn-secondary">Return to Cart</button>
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                <CheckoutForm clientSecret={clientSecret} total={cartTotal} />
              </Elements>
            ) : null}
          </div>

          {/* Order Summary Sidebar */}
          <div style={{ position: 'sticky', top: 100, order: isMobile ? 1 : 2 }}>
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
              <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }} className="custom-scrollbar">
                {cart.map(item => (
                  <div key={item._id || item.id} style={{ display: 'flex', gap: 12 }}>
                    <img src={item.assets?.preview?.url || item.img} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6, background: 'var(--color-surface)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{item.series}</div>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', flexShrink: 0 }}>
                      {(item.price || 0) === 0 ? 'Free' : `$${item.price.toFixed(2)}`}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>Subtotal</span>
                   <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{cartTotal === 0 ? 'Free' : `$${cartTotal.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', letterSpacing: 1, textTransform: 'uppercase' }}>Total</span>
                   <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-accent)' }}>
                    {cartTotal === 0 ? 'Free' : `$${cartTotal.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 24, padding: 20, background: 'rgba(0,243,255,0.03)', border: '1px dashed var(--color-border-glow)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--color-accent)', lineHeight: 1 }}>💎</span>
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)', marginBottom: 4 }}>Instant Access</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', lineHeight: 1.6 }}>Downloads will be available immediately in your library after payment.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
