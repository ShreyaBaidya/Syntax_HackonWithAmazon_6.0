'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NowSpeak } from '@/components/NowSpeak';
import { SpeedCheckout, CartItem } from '@/components/SpeedCheckout';
import { Product, Order } from '@/lib/api';

export default function NowSpeakPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleOrderComplete = (_order: Order) => {
    setCart([]);
    setTimeout(() => setShowCheckout(false), 3200);
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#EAEDED' }}>
      {/* Header */}
      <header style={{
        background: '#232F3E', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#FF9900', fontWeight: 700, fontSize: 15, fontStyle: 'italic' }}>amazon</span>
            <span style={{
              background: '#067D62', color: 'white',
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
            }}>now</span>
            <span style={{ color: '#FF9900', fontSize: 10 }}>⚡</span>
            <span style={{ color: '#aaa', fontSize: 11 }}>· NowSpeak™</span>
          </div>
          <p style={{ color: '#67B0D1', fontSize: 10, margin: 0 }}>
            Voice + AI · 30-min delivery
          </p>
        </div>

        {cartCount > 0 && (
          <button
            onClick={() => setShowCheckout(true)}
            style={{
              background: '#FF9900', color: 'white', border: 'none',
              borderRadius: 4, padding: '6px 12px', fontWeight: 700,
              fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🛒 {cartCount} · ₹{cartTotal.toFixed(0)}
          </button>
        )}
      </header>

      {/* NowSpeak chat */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <NowSpeak onProductSelect={addToCart} />
      </div>

      {showCheckout && cart.length > 0 && (
        <SpeedCheckout
          cart={cart}
          onOrderComplete={handleOrderComplete}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
