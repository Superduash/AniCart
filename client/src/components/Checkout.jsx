import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import apiClient from '../api/client';
import { useCart, useToast, useNavigation } from '../App';

let stripePromise = null;

function CheckoutForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Avoid full page reload for SPA
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message);
      } else {
        setMessage('An unexpected error occurred.');
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ theme: 'night' }} />
      {message && <div style={{ color: '#ff2d78', marginTop: '10px' }}>{message}</div>}
      <button 
        disabled={isLoading || !stripe || !elements}
        className="btn-primary btn-full"
        style={{ marginTop: '20px' }}
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState('');
  const { cart, clearCart } = useCart();
  const { addToast } = useToast();
  const { navigate, PAGES } = useNavigation();

  useEffect(() => {
    // 1. Fetch config
    const fetchConfigAndIntent = async () => {
      try {
        if (!stripePromise) {
          const configRes = await apiClient.get('/orders/config');
          stripePromise = loadStripe(configRes.data.data.publishableKey);
        }

        // 2. Create PaymentIntent
        const intentRes = await apiClient.post('/orders/create-payment-intent', {
          items: cart.map(item => ({ productId: item.id })),
        });
        
        setClientSecret(intentRes.data.data.clientSecret);
      } catch (err) {
        addToast('Failed to initialize checkout', 'error');
      }
    };
    
    if (cart.length > 0) {
      fetchConfigAndIntent();
    }
  }, [cart, addToast]);

  const handleSuccess = (paymentIntent) => {
    addToast('Payment successful! Your wallpapers are now in your library.', 'success');
    clearCart();
    navigate(PAGES.DASHBOARD);
  };

  if (!clientSecret) {
    return <div>Loading secure checkout...</div>;
  }

  return (
    <div className="glass-card" style={{ padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
      <Elements options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#00f3ff' } } }} stripe={stripePromise}>
        <CheckoutForm clientSecret={clientSecret} onSuccess={handleSuccess} />
      </Elements>
    </div>
  );
}
