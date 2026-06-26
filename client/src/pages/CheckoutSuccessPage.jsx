import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import Footer from '../components/layout/Footer';

export default function CheckoutSuccessPage() {
  useTitle('Payment Successful');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = searchParams.get('order');
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // GAP 5 FIX: Verify order status before showing success
    const verifyOrder = async () => {
      if (!orderId) {
        // No order ID in URL — could be direct navigation
        setLoading(false);
        setError('No order information found. If you just completed a payment, please check your order history.');
        return;
      }

      try {
        const res = await apiClient.get(`/orders/${orderId}`);
        const orderData = res.data?.data?.order || res.data?.order || res.data?.data;
        
        if (orderData && orderData.status === 'completed') {
          setOrder(orderData);
          setVerified(true);
        } else if (orderData && orderData.status === 'pending') {
          // Payment may still be processing via webhook
          setError('Your payment is being processed. Please check back in a moment or check your order history.');
        } else if (orderData && orderData.status === 'cancelled') {
          setError('This order was cancelled. If you believe this is an error, please contact support.');
        } else {
          setError('Unable to verify order status.');
        }
      } catch (err) {
        // If unauthorized or not found, the order doesn't belong to this user
        setError('Order not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="loading-spinner light" style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-base)', color: 'var(--color-text-2)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Verifying your payment...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: 480, width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 48, textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(251,191,36,0.1)', border: '2px solid var(--color-warning)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '3rem', color: 'var(--color-warning)' }}>
              ⚠
            </div>
            <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--color-text)', marginBottom: 12 }}>
              Payment Status
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 32 }}>
              {error}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/dashboard/orders" className="btn btn-primary btn-lg">
                Check Order History
              </Link>
              <Link to="/marketplace" className="btn btn-secondary btn-lg">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 520, width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 48, textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.1)', border: '2px solid var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '3rem', color: 'var(--color-success)' }}>
            ✓
          </div>
          
          <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-text)', marginBottom: 12 }}>
            Payment Successful!
          </h1>
          
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-base)', color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 16 }}>
            Thank you for your purchase. Your payment has been processed and your wallpapers have been added to your library.
          </p>

          {order && (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: 4 }}>Order ID</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-sm)', color: 'var(--color-accent)', marginBottom: 8 }}>{order.id || order._id}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                  {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'var(--text-base)', color: 'var(--color-text)', fontWeight: 600 }}>
                  ${order.total?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/dashboard/library" className="btn btn-primary btn-lg">
              Go to My Library
            </Link>
            <Link to="/marketplace" className="btn btn-secondary btn-lg">
              Continue Shopping
            </Link>
          </div>
          
          <div style={{ marginTop: 32, fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
            A receipt has been sent to your email address.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}