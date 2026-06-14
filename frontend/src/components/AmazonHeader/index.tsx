'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CartItem } from '@/components/SpeedCheckout';
import { searchProducts, Product } from '@/lib/api';
import logo from './logo.png';
import gcalLogo from './gcal-logo.png';

interface Props {
  cart: CartItem[];
  onCartClick: () => void;
  onProductSelect?: (product: Product, qty: number) => void;
}

export function AmazonHeader({ cart, onCartClick, onProductSelect }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchProducts(q, 8);
        setResults(res);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = useCallback((product: Product) => {
    onProductSelect?.(product, 1);
    setQuery('');
    setResults([]);
    setFocused(false);
    inputRef.current?.blur();
  }, [onProductSelect]);

  const showDropdown = focused && query.trim().length >= 2;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>

      {/* ── Row 1: Teal top bar ── */}
      <div style={{
        background: 'white',
        padding: '8px 12px',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Profile icon */}
        <div
          onClick={() => router.push('/orders')}
          style={{
            width: 30, height: 30, borderRadius: '55%',
            background: 'rgba(226, 250, 249, 1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            // flexShrink: 0,
             cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" fill="black" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        {/* Centered logo — matches Amazon Now brand */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <img
            src={logo.src}
            alt="Amazon Now"
            style={{ height: 25 }}/>
        </div>

        {/* Notification icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Google Calendar link button */}
          <button
            onClick={() => {
              const userId = typeof localStorage !== 'undefined'
                ? (JSON.parse(localStorage.getItem('amazon_now_user') || '{}').user_id || 'demo_user')
                : 'demo_user';
              fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/calendar/auth-url?user_id=${userId}`)
                .then(r => r.json())
                .then(data => {
                  if (data.auth_url) {
                    window.open(data.auth_url, '_blank', 'width=500,height=600');
                  } else {
                    alert('Google Calendar: ' + (data.error || 'Not configured') + '\n\n' + (data.setup_hint || ''));
                  }
                })
                .catch(() => alert('Could not connect to backend'));
            }}
            title="Link Google Calendar"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 6,
              padding: '2px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gcalLogo.src} alt="Google Calendar" style={{ width: 200, height: 40, objectFit: 'contain' }} />
          </button>

          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Row 2: Delivery address ── */}
      <div style={{ background: '#E0F2F1', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ background: '#FFD814', borderRadius: 5, padding: '2px 7px', display: 'flex', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#0F1111' }}>⚡8</span>
          <span style={{ fontSize: 10, color: '#0F1111', fontWeight: 600 }}>mins</span>
        </div>
        <svg width="10" height="12" fill="#00695C" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span style={{ fontSize: 10, color: '#004D40', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Deliver to <strong>Flat no-301, Geetanjali Aristocracy, Whitefield, Bengaluru</strong>
        </span>
        <span style={{ fontSize: 10, color: '#00695C', fontWeight: 700 }}>▾</span>
      </div>

      {/* ── Row 3: Real search input with dropdown ── */}
      <div style={{ background: 'white', padding: '8px 12px', borderBottom: '1px solid #E0E0E0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid', borderColor: focused ? '#00695C' : '#CCC', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
          {/* Search icon */}
          <svg style={{ marginLeft: 10, flexShrink: 0 }} width="16" height="16" fill="#888" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder='Search for "Atta", "Milk", "Medicine"…'
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, padding: '9px 0', color: '#0F1111', background: 'transparent',
            }}
          />

          {/* Clear button */}
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', color: '#888', fontSize: 16 }}
            >
              ✕
            </button>
          )}

        {/* Profile */}
        <button
          onClick={() => router.push('/profile')}
          aria-label="Dietary profile"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}
        >
          🍽️
        </button>

          {/* Mic — opens NowSpeak for voice */}
          <button
            onClick={() => router.push('/nowspeak')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px 0 4px', fontSize: 16 }}
            title="Voice search"
          >
            🎤
          </button>
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute', top: '100%', left: 12, right: 12,
              background: 'white', borderRadius: '0 0 8px 8px',
              border: '1.5px solid #00695C', borderTop: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 100, maxHeight: 320, overflowY: 'auto',
            }}
          >
            {searching && (
              <div style={{ padding: '12px 16px', fontSize: 12, color: '#888', textAlign: 'center' }}>
                Searching…
              </div>
            )}
            {!searching && results.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 12, color: '#888', textAlign: 'center' }}>
                No products found for &quot;{query}&quot;
              </div>
            )}
            {!searching && results.map((product, i) => (
              <div
                key={product.id}
                onClick={() => handleAdd(product)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i === results.length - 1 ? 'none' : '1px solid #F5F5F5',
                  background: 'white',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F7FAF7')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_url} alt={product.name}
                  style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: '#FAFAFA', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#0F1111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888' }}>{product.unit} · ⚡{product.eta_min} min</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F1111' }}>₹{product.price}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleAdd(product); }}
                  style={{
                    background: '#FFD814', border: '1px solid #F0C000', borderRadius: 6,
                    padding: '4px 10px', fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
