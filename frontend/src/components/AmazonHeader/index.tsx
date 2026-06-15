'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CartItem } from '@/components/SpeedCheckout';
import { searchProducts, Product } from '@/lib/api';
import logo from './logo.png';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface Props {
  cart: CartItem[];
  onCartClick: () => void;
  onProductSelect?: (product: Product, qty: number) => void;
}

type CalendarEvent = {
  event_id: string;
  title: string;
  description: string;
  time: string;
  location: string;
  type: string;
};

const EVENT_TYPE_ICON: Record<string, string> = {
  party:    '🎉',
  festival: '🪔',
  guest:    '👨‍👩‍👧',
  workout:  '🏃',
  health:   '🏥',
  travel:   '✈️',
  work:     '💼',
  general:  '📅',
};

export function AmazonHeader({ cart, onCartClick, onProductSelect }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Calendar state ─────────────────────────────────────────────────────────
  const [calOpen, setCalOpen] = useState(false);
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calLinked, setCalLinked] = useState(false);
  const [calMode, setCalMode] = useState<'oauth' | 'service_account' | 'mock'>('mock');
  const calPanelRef = useRef<HTMLDivElement>(null);

  // ── Account menu state ───────────────────────────────────────────────────
  const [acctOpen, setAcctOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const acctRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('amazon_now_user');
      if (stored) setUserName(JSON.parse(stored).name || '');
    } catch { /* ignore */ }
  }, []);

  // Close account menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    };
    if (acctOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [acctOpen]);

  const handleSignOut = () => {
    try {
      // Clear the auth session and all per-user cached state so the next
      // sign-in starts clean (otherwise the previous user's cart, dietary
      // profile, and cached recs would leak into the new account).
      localStorage.removeItem('amazon_now_user');
      localStorage.removeItem('my_name');
      localStorage.removeItem('amazon_now_cart');
      localStorage.removeItem('shared_cart_checkout');
      sessionStorage.clear();
    } catch { /* ignore */ }
    router.replace('/auth');
  };

  const getUserId = () => {
    try {
      return JSON.parse(localStorage.getItem('amazon_now_user') || '{}').user_id || 'demo_user';
    } catch { return 'demo_user'; }
  };

  // Check calendar status on mount
  useEffect(() => {
    const uid = getUserId();
    fetch(`${API_BASE}/api/v1/calendar/status?user_id=${uid}`)
      .then(r => r.json())
      .then(d => { setCalLinked(d.linked); setCalMode(d.mode ?? 'mock'); })
      .catch(() => {});
  }, []);

  const fetchEvents = useCallback(async () => {
    setCalLoading(true);
    try {
      const uid = getUserId();
      const res = await fetch(`${API_BASE}/api/v1/calendar/events?user_id=${uid}`);
      const data = await res.json();
      setCalEvents(data.events ?? []);
    } catch {
      setCalEvents([]);
    } finally {
      setCalLoading(false);
    }
  }, []);

  const handleCalendarClick = () => {
    if (calOpen) { setCalOpen(false); return; }
    setCalOpen(true);
    fetchEvents();
  };

  const handleLinkCalendar = () => {
    const uid = getUserId();
    fetch(`${API_BASE}/api/v1/calendar/auth-url?user_id=${uid}`)
      .then(r => r.json())
      .then(data => {
        if (data.auth_url) {
          window.open(data.auth_url, '_blank', 'width=500,height=600');
        } else {
          alert('Google Calendar not configured.\n\n' + (data.setup_hint || data.error || ''));
        }
      })
      .catch(() => alert('Could not reach backend'));
  };

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calPanelRef.current && !calPanelRef.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    };
    if (calOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [calOpen]);

  // ── Search ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try { setResults(await searchProducts(q, 8)); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = useCallback((product: Product) => {
    onProductSelect?.(product, 1);
    setQuery(''); setResults([]); setFocused(false);
    inputRef.current?.blur();
  }, [onProductSelect]);

  const showDropdown = focused && query.trim().length >= 2;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>

      {/* ── Row 1: Top bar ── */}
      <div style={{ background: 'white', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>

        {/* Profile / account menu */}
        <div ref={acctRef} style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => setAcctOpen(o => !o)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#E2FAF9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" fill="#00695C" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>

          {acctOpen && (
            <div style={{
              position: 'absolute', top: '120%', left: 0,
              width: 200, background: 'white', borderRadius: 10,
              border: '1px solid #E0E0E0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {userName && (
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #F0F0F0' }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Signed in as</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#0F1111' }}>{userName}</p>
                </div>
              )}
              <button
                onClick={() => { setAcctOpen(false); router.push('/orders'); }}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '10px 14px', fontSize: 13, color: '#0F1111', cursor: 'pointer',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                📦 Your Orders
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '10px 14px', fontSize: 13, color: '#CC0C39', fontWeight: 600, cursor: 'pointer',
                }}
              >
                ↩ Sign out
              </button>
            </div>
          )}
        </div>

        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.src} alt="Amazon Now" style={{ height: 25 }} />
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }} ref={calPanelRef}>

          {/* Google Calendar button */}
          <button
            onClick={handleCalendarClick}
            title="Google Calendar"
            style={{
              background: calOpen ? '#E8F5E9' : 'transparent',
              border: calOpen ? '1.5px solid #4CAF50' : '1.5px solid #E0E0E0',
              borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            {/* Google Calendar G icon */}
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#0F1111' }}>Calendar</span>
            {calLinked && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', flexShrink: 0 }} />
            )}
          </button>

          {/* Calendar panel */}
          {calOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0,
              width: 300, background: 'white', borderRadius: 12,
              border: '1px solid #E0E0E0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                background: 'linear-gradient(135deg, #1565C0, #1E88E5)',
                padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>Today&apos;s Events</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>
                      {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={calMode === 'service_account' ? undefined : handleLinkCalendar}
                  style={{
                    background: calLinked || calMode === 'service_account' ? 'rgba(255,255,255,0.15)' : '#FFD814',
                    border: 'none', borderRadius: 6, padding: '4px 8px',
                    fontSize: 10, fontWeight: 700,
                    cursor: calMode === 'service_account' ? 'default' : 'pointer',
                    color: calLinked || calMode === 'service_account' ? 'white' : '#0F1111',
                  }}
                >
                  {calLinked ? '✓ Linked' : calMode === 'service_account' ? '🟢 Live' : 'Link →'}
                </button>
              </div>

              {/* Events list */}
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {calLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: 12 }}>
                    Loading events…
                  </div>
                ) : calEvents.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#555' }}>No events today</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#888' }}>
                      {calLinked || calMode === 'service_account' ? 'Your calendar is clear 🎉' : 'Link your Google Calendar to see events'}
                    </p>
                  </div>
                ) : (
                  calEvents.map((ev, i) => (
                    <div key={ev.event_id} style={{
                      padding: '10px 14px',
                      borderBottom: i < calEvents.length - 1 ? '1px solid #F5F5F5' : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>
                        {EVENT_TYPE_ICON[ev.type] ?? '📅'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#0F1111' }}>
                          {ev.title}
                        </p>
                        {ev.time && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#00695C', fontWeight: 600 }}>
                            🕐 {ev.time}
                          </p>
                        )}
                        {ev.description && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#666',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '8px 14px', borderTop: '1px solid #F0F0F0',
                background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 10, color: '#888' }}>
                  {calEvents.length > 0 ? `${calEvents.length} event${calEvents.length > 1 ? 's' : ''}` : 'No events'}
                </span>
                <button
                  onClick={fetchEvents}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 10, color: '#1565C0', fontWeight: 600, padding: 0,
                  }}
                >
                  ↺ Refresh
                </button>
              </div>
            </div>
          )}
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

      {/* ── Row 3: Search bar ── */}
      <div style={{ background: 'white', padding: '8px 12px', borderBottom: '1px solid #E0E0E0', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1.5px solid', borderColor: focused ? '#00695C' : '#CCC',
          borderRadius: 8, overflow: 'hidden', background: 'white',
        }}>
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
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, padding: '9px 0', color: '#0F1111', background: 'transparent' }}
          />

          {query.length > 0 && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', color: '#888', fontSize: 16 }}
            >✕</button>
          )}

          <button
            onClick={() => router.push('/nowspeak')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px 0 4px', fontSize: 16 }}
            title="Voice search"
          >🎤</button>
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div ref={dropdownRef} style={{
            position: 'absolute', top: '100%', left: 12, right: 12,
            background: 'white', borderRadius: '0 0 8px 8px',
            border: '1.5px solid #00695C', borderTop: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 100, maxHeight: 320, overflowY: 'auto',
          }}>
            {searching && (
              <div style={{ padding: '12px 16px', fontSize: 12, color: '#888', textAlign: 'center' }}>Searching…</div>
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
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F1111', flexShrink: 0 }}>₹{product.price}</p>
                <button
                  onClick={e => { e.stopPropagation(); handleAdd(product); }}
                  style={{
                    background: '#FFD814', border: '1px solid #F0C000', borderRadius: 6,
                    padding: '4px 10px', fontWeight: 700, fontSize: 11, cursor: 'pointer', flexShrink: 0,
                  }}
                >+ Add</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
