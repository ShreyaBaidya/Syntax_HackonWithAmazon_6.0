'use client';

import { useRouter } from 'next/navigation';
import { CartItem } from '@/components/SpeedCheckout';

interface Props {
  cart: CartItem[];
  onCartClick: () => void;
}

export function AmazonHeader({ cart, onCartClick }: Props) {
  const router = useRouter();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header style={{ background: '#232F3E', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Row 1: Location bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px 0', color: 'white', fontSize: 12,
      }}>
        <svg width="12" height="16" fill="#FF9900" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span style={{ color: '#ccc' }}>Delivering to </span>
        <span style={{ color: '#FF9900', fontWeight: 700, cursor: 'pointer' }}>
          Your location ▾
        </span>
      </div>

      {/* Row 2: Logo + Search + Cart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px' }}>
        {/* amazon now logo */}
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{
              color: '#FF9900', fontWeight: 700, fontSize: 15,
              fontStyle: 'italic', letterSpacing: '-0.5px', lineHeight: 1,
            }}>amazon</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{
                background: '#067D62', color: 'white',
                fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                letterSpacing: '0.5px',
              }}>now</span>
              <span style={{ color: '#FF9900', fontSize: 10 }}>⚡</span>
            </div>
          </div>
        </button>

        {/* Search bar */}
        <button
          onClick={() => router.push('/nowspeak')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '2px solid #FF9900',
            borderRadius: 6, padding: '7px 10px', cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg width="16" height="16" fill="#565959" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span style={{ color: '#aaa', fontSize: 13 }}>Search products on Amazon Now</span>
        </button>

        {/* Cart button */}
        <button
          onClick={onCartClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative', padding: 4,
          }}
        >
          <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03L23 6H5.21l-.67-4H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: 0,
              background: '#FF9900', color: '#232F3E',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 3: Delivery promise strip */}
      <div style={{
        background: '#37475A', padding: '5px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: '#FF9900', fontSize: 14 }}>⚡</span>
        <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
          Delivery in 30 minutes
        </span>
        <span style={{ color: '#aaa', fontSize: 11, marginLeft: 4 }}>
          to your location
        </span>
      </div>
    </header>
  );
}
