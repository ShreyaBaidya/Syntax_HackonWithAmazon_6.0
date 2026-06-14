'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendations, Recommendations, Product, Order, createSharedCart } from '@/lib/api';
import { RecommendationFeed } from '@/components/RecommendationFeed';
import { SpeedCheckout, CartItem } from '@/components/SpeedCheckout';
import { AmazonHeader } from '@/components/AmazonHeader';
import { useProfile } from '@/hooks/useProfile';
import { ProfileBanner } from '@/components/ProfileBanner';

export default function HomePage() {
  const router = useRouter();
  const { userId, profile, exclusionSet, loading: profileLoading } = useProfile();
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [startingSharedCart, setStartingSharedCart] = useState(false);

  // ── Intent state (React-managed, synced from sessionStorage) ────────────
  const [chatIntent, setChatIntent] = useState<string | null>(null);

  // Read initial intent from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('last_chat_intent');
      if (stored) {
        console.log('[HomePage] Initial intent from sessionStorage:', stored);
        setChatIntent(stored);
      }
    } catch { /* sessionStorage unavailable */ }
  }, []);

  // Re-sync intent when page becomes visible (user navigates back from NowSpeak)
  useEffect(() => {
    const syncIntent = () => {
      try {
        const stored = sessionStorage.getItem('last_chat_intent') || null;
        setChatIntent(prev => {
          if (prev !== stored) {
            console.log('[HomePage] Intent changed on focus/visibility:', prev, '→', stored);
            return stored;
          }
          return prev;
        });
      } catch { /* sessionStorage unavailable */ }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncIntent();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncIntent);
    // Also listen for custom event dispatched by useNowSpeak
    window.addEventListener('chat-intent-changed', syncIntent);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncIntent);
      window.removeEventListener('chat-intent-changed', syncIntent);
    };
  }, []);

  // ── Fetch recommendations whenever userId or chatIntent changes ─────────
  useEffect(() => {
    console.log('[Recommendations] React state — userId:', userId, 'chatIntent:', chatIntent);

    getRecommendations(userId ?? undefined, chatIntent ?? undefined)
      .then(data => {
        console.log('[Recommendations] Response — now_suggestions:', data.now_suggestions.length, ', trending:', data.trending.length);
        setRecs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, chatIntent]);

  const handleStartSharedCart = useCallback(async () => {
    setStartingSharedCart(true);
    try {
      const storedName = sessionStorage.getItem('my_name') || 'You';
      const cart = await createSharedCart(storedName);
      sessionStorage.setItem(`cart_name_${cart.cart_id}`, storedName);
      router.push(`/cart/${cart.cart_id}`);
    } catch {
      alert('Could not create cart. Is the backend running?');
      setStartingSharedCart(false);
    }
  }, [router]);

  const handleProductSelect = useCallback((product: Product, qty: number) => {
    setCart(prev => {
      if (qty === 0) return prev.filter(i => i.product.id !== product.id);
      const exists = prev.find(i => i.product.id === product.id);
      if (exists) return prev.map(i => i.product.id === product.id ? { ...i, quantity: qty } : i);
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const handleOrderComplete = (_order: Order) => {
    setCart([]);
    setTimeout(() => setShowCheckout(false), 3200);
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh', paddingBottom: cartCount > 0 ? 72 : 0 }}>
      {/* Amazon Now white header */}
      <AmazonHeader
        cart={cart}
        onCartClick={() => cartCount > 0 && setShowCheckout(true)}
      />

      {/* Dietary Profile Banner */}
      <ProfileBanner
        dietTags={profile?.diet_tags ?? []}
        allergenTags={profile?.allergen_tags ?? []}
        hasProfile={!!profile}
      />

      {/* NowSpeak CTA banner */}
      <div
        onClick={() => router.push('/nowspeak')}
        style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
          margin: '8px 10px 0', borderRadius: 10, padding: '12px 14px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width: 40, height: 40, background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>🎙️</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>
            NowSpeak™ — Just say what you need
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: '2px 0 0' }}>
            "I have a fever" → AI finds it in seconds
          </p>
        </div>
        <svg width="16" height="16" fill="rgba(255,255,255,0.8)" viewBox="0 0 24 24">
          <path d="M10 17l5-5-5-5v10z"/>
        </svg>
      </div>

      {/* Shared Cart CTA */}
      <div
        onClick={handleStartSharedCart}
        style={{
          background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
          margin: '6px 10px 0', borderRadius: 10, padding: '12px 14px',
          cursor: startingSharedCart ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          opacity: startingSharedCart ? 0.7 : 1,
        }}
      >
        <div style={{
          width: 40, height: 40, background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>🛒</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>
            {startingSharedCart ? 'Creating cart…' : 'Start a Shared Cart'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: '2px 0 0' }}>
            Shop together — share a link, add items in real-time
          </p>
        </div>
        <svg width="16" height="16" fill="rgba(255,255,255,0.8)" viewBox="0 0 24 24">
          <path d="M10 17l5-5-5-5v10z"/>
        </svg>
      </div>

      {/* Assured cashback strip */}
      <div style={{
        background: 'white', margin: '8px 0 0', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0',
        overflowX: 'auto',
      }}>
        {[
          { icon: '🏅', label: 'Assured\ncashback' },
          { icon: '🔄', label: '0% Extra\nFees' },
          { icon: '⚡', label: '30 min\nDelivery' },
          { icon: '🛡️', label: '100%\nSafe' },
          { icon: '↩️', label: 'Easy\nReturns' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, flexShrink: 0, minWidth: 52,
          }}>
            <div style={{
              width: 36, height: 36, background: '#FFF8E1',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18,
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 9, color: '#565959', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Products */}
      <div style={{ marginTop: 0 }}>
        {loading ? (
          <LoadingSkeleton />
        ) : recs ? (
          <RecommendationFeed
            nowSuggestions={recs.now_suggestions}
            reorderNudges={recs.reorder_nudges}
            trending={recs.trending}
            timeContext={recs.time_context}
            onProductSelect={handleProductSelect}
            exclusionSet={exclusionSet}
            alternatives={recs.alternatives}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', margin: '8px 0' }}>
            <p style={{ color: '#888', fontSize: 13 }}>Backend not running</p>
            <code style={{ background: '#F3F3F3', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}>
              cd backend && uvicorn app.main:app --reload
            </code>
          </div>
        )}
      </div>

      {/* Amazon-style bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #E0E0E0',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 0 8px', zIndex: 40,
      }}>
        <NavTab icon="🏠" label="Home" active />
        <NavTab icon="🔍" label="Search" onClick={() => router.push('/nowspeak')} />
        <NavTab icon="🛒" label="Cart" badge={cartCount} onClick={() => cartCount > 0 && setShowCheckout(true)} />
        <NavTab icon="👤" label="Account" onClick={() => router.push('/profile')} />
      </nav>

      {/* Bottom cart proceed bar (when items in cart) */}
      {cartCount > 0 && !showCheckout && (
        <div style={{
          position: 'fixed', bottom: 56, left: 0, right: 0, zIndex: 39,
          background: 'white', borderTop: '1px solid #E0E0E0',
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative' }}>
              <svg width="24" height="24" fill="#0F1111" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03L23 6H5.21l-.67-4H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              <span style={{
                position: 'absolute', top: -3, right: -3,
                background: '#FF9900', color: 'white', borderRadius: '50%',
                width: 14, height: 14, fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#0F1111', margin: 0, fontWeight: 500 }}>
                ₹{cartTotal.toFixed(0)} · {cartCount} item{cartCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            style={{
              background: '#FFD814', color: '#0F1111',
              border: 'none', borderRadius: 8, padding: '8px 20px',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            Proceed →
          </button>
        </div>
      )}

      {/* Checkout modal */}
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

function NavTab({ icon, label, active, badge, onClick }: {
  icon: string; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, background: 'none', border: 'none',
        cursor: 'pointer', position: 'relative', padding: '2px 16px',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: 0, right: 8,
          background: '#CC0C39', color: 'white', borderRadius: '50%',
          width: 14, height: 14, fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{badge}</span>
      )}
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? '#0F1111' : '#888' }}>
        {label}
      </span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ background: 'white', padding: 10, marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
            <div style={{ paddingTop: '90%', background: '#F0F0F0' }} />
            <div style={{ padding: 6 }}>
              <div style={{ height: 10, background: '#F0F0F0', borderRadius: 2, marginBottom: 4 }} />
              <div style={{ height: 10, background: '#F0F0F0', borderRadius: 2, width: '70%' }} />
              <div style={{ height: 22, background: '#F0F0F0', borderRadius: 4, marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
