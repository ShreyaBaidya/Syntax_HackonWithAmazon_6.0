'use client';

import { useRouter } from 'next/navigation';
import { CartItem } from '@/components/SpeedCheckout';

interface Props {
  cart: CartItem[];
  onCartClick: () => void;
}

export function AmazonHeader({ cart, onCartClick }: Props) {
  const router = useRouter();
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white' }}>

      {/* ── Row 1: ETA + Location strip (yellow) ─────────────────────── */}
      <div style={{
        background: '#FFD814',
        padding: '5px 12px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F1111' }}>⚡ 30 mins</span>
        <span style={{ fontSize: 11, color: '#565959', margin: '0 4px' }}>·</span>
        <svg width="10" height="12" fill="#0F1111" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span style={{ fontSize: 11, color: '#0F1111', fontWeight: 500 }}>
          Deliver to <strong>Your Location</strong>
        </span>
        <span style={{ fontSize: 10, color: '#0F1111' }}>▾</span>
      </div>

      {/* ── Row 2: Logo + Search + Cart ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderBottom: '1px solid #E8E8E8',
      }}>
        {/* Amazon Now logo */}
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'Amazon Ember, Georgia, serif',
                fontSize: 18, fontWeight: 400, color: '#0F1111', letterSpacing: '-0.5px',
              }}>amazon</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: -2 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#067D62', letterSpacing: '0px',
              }}>now</span>
              <div style={{
                width: 14, height: 14, background: '#067D62', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: 8, lineHeight: 1 }}>✓</span>
              </div>
            </div>
          </div>
        </button>

        {/* Search bar */}
        <button
          onClick={() => router.push('/nowspeak')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: '#F3F3F3', border: '1px solid #DDD',
            borderRadius: 6, padding: '8px 12px', cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg width="16" height="16" fill="#999" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span style={{ color: '#999', fontSize: 13 }}>Search for...</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => router.push('/profile')}
          aria-label="Dietary profile"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}
        >
          🍽️
        </button>

        {/* Cart */}
        <button
          onClick={onCartClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, padding: 4,
          }}
        >
          <div style={{ position: 'relative' }}>
            <svg width="26" height="26" fill="#0F1111" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03L23 6H5.21l-.67-4H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#FF9900', color: 'white',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cartCount}
              </span>
            )}
          </div>
          {cartTotal > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F1111' }}>
              ₹{cartTotal.toFixed(0)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
