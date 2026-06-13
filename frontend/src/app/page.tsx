'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendations, Recommendations, Product, Order, createSharedCart, getSharedCart } from '@/lib/api';
import { RecommendationFeed } from '@/components/RecommendationFeed';
import { SpeedCheckout, CartItem } from '@/components/SpeedCheckout';
import { AmazonHeader } from '@/components/AmazonHeader';

export default function HomePage() {
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [startingSharedCart, setStartingSharedCart] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [activeSharedCartId, setActiveSharedCartId] = useState<string | null>(null);
  const [sharedCartTotal, setSharedCartTotal] = useState(0);
  const [sharedCartItemCount, setSharedCartItemCount] = useState(0);

  // Check sessionStorage for an active shared cart on mount and fetch its total
  useEffect(() => {
    const keys = Object.keys(sessionStorage);
    const cartKey = keys.find(k => k.startsWith('cart_name_'));
    if (cartKey) {
      const id = cartKey.replace('cart_name_', '');
      setActiveSharedCartId(id);
      // Fetch latest cart state for the total
      getSharedCart(id)
        .then(c => {
          setSharedCartTotal(c.total);
          setSharedCartItemCount(c.item_count);
        })
        .catch(() => { /* cart may have expired */ });
    }
  }, []);

  const handleStartSharedCart = useCallback(async () => {
    setStartingSharedCart(true);
    try {
      const storedName = sessionStorage.getItem('my_name') || 'You';
      const cart = await createSharedCart(storedName);
      sessionStorage.setItem(`cart_name_${cart.cart_id}`, storedName);
      setActiveSharedCartId(cart.cart_id);
      router.push(`/cart/${cart.cart_id}`);
    } catch {
      alert('Could not create cart. Is the backend running?');
      setStartingSharedCart(false);
    }
  }, [router]);

  const handleJoinCart = useCallback(() => {
    const input = joinLink.trim();
    if (!input) return;
    // Extract cart ID from a full link (e.g. http://localhost:3000/cart/ABC123) or just the code
    let cartId = input;
    const match = input.match(/\/cart\/([A-Za-z0-9]+)/);
    if (match) {
      cartId = match[1];
    }
    // Remove any trailing slashes or query params
    cartId = cartId.replace(/[/?#].*$/, '').toUpperCase();
    if (cartId) {
      setActiveSharedCartId(cartId);
      router.push(`/cart/${cartId}`);
    }
  }, [joinLink, router]);

  useEffect(() => {
    getRecommendations()
      .then(setRecs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

      {/* Shared Cart CTAs — Start & Join */}
      <div style={{ margin: '6px 10px 0', display: 'flex', gap: 8 }}>
        {/* Start a new cart */}
        <div
          onClick={handleStartSharedCart}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
            borderRadius: 10, padding: '12px 12px',
            cursor: startingSharedCart ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: startingSharedCart ? 0.7 : 1,
          }}
        >
          <div style={{
            width: 36, height: 36, background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>🛒</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>
              {startingSharedCart ? 'Creating…' : 'Start Cart'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, margin: '2px 0 0' }}>
              Create & share link
            </p>
          </div>
        </div>

        {/* Join a cart */}
        <div
          onClick={() => setShowJoinInput(true)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
            borderRadius: 10, padding: '12px 12px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <div style={{
            width: 36, height: 36, background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>🔗</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>
              Join Cart
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, margin: '2px 0 0' }}>
              Paste link or code
            </p>
          </div>
        </div>
      </div>

      {/* Join Cart modal/input */}
      {showJoinInput && (
        <div
          onClick={() => setShowJoinInput(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 14, padding: 24,
              maxWidth: 360, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 40, marginBottom: 6 }}>🔗</div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0F1111' }}>
                Join a Shared Cart
              </h3>
              <p style={{ margin: 0, color: '#888', fontSize: 12 }}>
                Paste the cart link or enter the 6-character code
              </p>
            </div>

            <input
              type="text"
              placeholder="e.g. ABC123 or http://…/cart/ABC123"
              value={joinLink}
              onChange={e => setJoinLink(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinCart()}
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 8,
                border: '1.5px solid #DDD', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', marginBottom: 14,
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowJoinInput(false); setJoinLink(''); }}
                style={{
                  flex: 1, padding: '11px', borderRadius: 8,
                  border: '1px solid #DDD', background: 'white',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#555',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinCart}
                disabled={!joinLink.trim()}
                style={{
                  flex: 1, padding: '11px', borderRadius: 8,
                  border: 'none',
                  background: joinLink.trim() ? '#FFD814' : '#EEE',
                  color: joinLink.trim() ? '#0F1111' : '#AAA',
                  fontWeight: 800, fontSize: 14,
                  cursor: joinLink.trim() ? 'pointer' : 'default',
                }}
              >
                Join →
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Floating shared cart pill — shows when user has an active shared cart */}
      {activeSharedCartId && (
        <div
          onClick={() => router.push(`/cart/${activeSharedCartId}`)}
          style={{
            position: 'fixed',
            bottom: cartCount > 0 && !showCheckout ? 108 : 52,
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 41,
            background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
            color: 'white',
            borderRadius: 24, padding: '8px 18px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
            transition: 'bottom 0.2s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Shared Cart</span>
          {sharedCartItemCount > 0 ? (
            <span style={{
              background: 'rgba(255,255,255,0.25)', borderRadius: 10,
              padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>₹{sharedCartTotal.toFixed(0)} · {sharedCartItemCount} items</span>
          ) : (
            <span style={{
              background: 'rgba(255,255,255,0.25)', borderRadius: 10,
              padding: '2px 8px', fontSize: 11, fontWeight: 600,
            }}>View</span>
          )}
          <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
            <path d="M10 17l5-5-5-5v10z"/>
          </svg>
        </div>
      )}

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
        <NavTab icon="👤" label="Account" />
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
