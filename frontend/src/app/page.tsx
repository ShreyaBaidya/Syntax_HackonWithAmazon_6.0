'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendations, Recommendations, Product, Order, createSharedCart, getSharedCart, getRefillSuggestions, RefillSuggestions } from '@/lib/api';
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

  // Redirect to auth if not logged in
  useEffect(() => {
    try {
      const user = localStorage.getItem('amazon_now_user');
      if (!user) router.replace('/auth');
    } catch { /* ignore */ }
  }, [router]);

  // Redirect to auth if not logged in
  useEffect(() => {
    try {
      const user = localStorage.getItem('amazon_now_user');
      if (!user) router.replace('/auth');
    } catch { /* ignore */ }
  }, [router]);

  // Load cart from localStorage on mount (client-only).

  useEffect(() => {
    try {
      const saved = localStorage.getItem('amazon_now_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // NOTE: cart is persisted directly inside handleProductSelect / handleOrderComplete
  // to avoid a persist useEffect firing with cart=[] on mount and wiping localStorage.
  const [showCheckout, setShowCheckout] = useState(false);
  const [refill, setRefill] = useState<RefillSuggestions | null>(null);
  const [refillExpanded, setRefillExpanded] = useState(false);
  const [refillTab, setRefillTab] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dismissedRefillIds, setDismissedRefillIds] = useState<Set<string>>(new Set());
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
      // Verify the cart still exists on the backend
      getSharedCart(id)
        .then(c => {
          setActiveSharedCartId(id);
          setSharedCartTotal(c.total);
          setSharedCartItemCount(c.item_count);
        })
        .catch(() => {
          // Cart expired or backend restarted — clean up stale session
          sessionStorage.removeItem(cartKey);
          setActiveSharedCartId(null);
        });
    }
  }, []);

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
    let userId: string | undefined;
    try {
      const stored = localStorage.getItem('amazon_now_user');
      if (stored) userId = JSON.parse(stored).user_id;
    } catch { /* ignore */ }

    getRecommendations()
      .then(data => {
        setRecs(data);
        try { sessionStorage.setItem('recs_cache', JSON.stringify(data)); } catch { /* ignore */ }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    getRefillSuggestions(userId, cart.map(i => i.product.name))
      .then(setRefill)
      .catch(console.error);
  }, []);

  const handleProductSelect = useCallback((product: Product, qty: number) => {
    setCart(prev => {
      const updated =
        qty === 0 ? prev.filter(i => i.product.id !== product.id)
        : prev.find(i => i.product.id === product.id)
          ? prev.map(i => i.product.id === product.id ? { ...i, quantity: qty } : i)
          : [...prev, { product, quantity: qty }];
      // Persist immediately in the handler (not via a useEffect) to avoid the
      // mount-time wipe where useEffect fires with cart=[] before the load effect.
      localStorage.setItem('amazon_now_cart', JSON.stringify(updated));
      // Clear any stale shared cart checkout since user is now using regular cart
      localStorage.removeItem('shared_cart_checkout');
      sessionStorage.removeItem('using_shared_checkout');
      return updated;
    });
  }, []);

  const handleOrderComplete = (_order: Order) => {
    setCart([]);
    localStorage.removeItem('amazon_now_cart');
    setTimeout(() => setShowCheckout(false), 3200);
  };

  const handleAddAllRefill = useCallback(() => {
    if (!refill) return;
    refill.items.forEach(item => {
      handleProductSelect(item as unknown as Product, 1);
    });
  }, [refill, handleProductSelect]);

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Amazon Now white header */}
      <AmazonHeader
        cart={cart}
        onCartClick={() => cartCount > 0 && router.push('/cart')}
        onProductSelect={handleProductSelect}
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

      {/* Shared Cart CTAs — Start & Join (hidden when a cart is active) */}
      {!activeSharedCartId && (
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
      )}

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

      {/* Cashback & offers strip — Amazon Now style */}
      <div style={{
        background: 'white', margin: '8px 0 0', padding: '10px 12px',
        borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0',
        display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto',
      }}>
        <div style={{
          flexShrink: 0, background: '#FFFBEB', border: '1.5px solid #FDE68A',
          borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 90,
        }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: '#92400E' }}>Assured</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#B45309' }}>cashback</p>
          <p style={{ margin: 0, fontSize: 9, color: '#92400E', fontStyle: 'italic' }}>every time</p>
        </div>
        <div style={{
          flexShrink: 0, background: '#FFF7ED', border: '1.5px solid #FED7AA',
          borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 80,
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#EA580C' }}>₹50</p>
          <p style={{ margin: 0, fontSize: 9, color: '#9A3412' }}>above ₹399</p>
        </div>
        <div style={{
          flexShrink: 0, background: '#EFF6FF', border: '1.5px solid #BFDBFE',
          borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 80,
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#2563EB' }}>₹100</p>
          <p style={{ margin: 0, fontSize: 9, color: '#1E40AF' }}>above ₹749</p>
        </div>
        <div style={{
          flexShrink: 0, background: '#F0FDF4', border: '1.5px solid #BBF7D0',
          borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 80,
        }}>
          <p style={{ margin: '0 0 1px', fontSize: 8, fontWeight: 600, color: '#065F46' }}>✓ prime</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#059669' }}>₹200</p>
          <p style={{ margin: 0, fontSize: 9, color: '#065F46' }}>above ₹1399</p>
        </div>
      </div>

      {/* Products */}
      <div style={{ marginTop: 0 }}>

        {refill && refill.item_count > 0 && (
          <div style={{ margin: '8px 10px 0', background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #E8F5E9' }}>
            {/* Header */}
            <div
              onClick={() => setRefillExpanded(!refillExpanded)}
              style={{
                padding: '12px 14px',
                background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 40, height: 40, background: 'white',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20, flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>🏠</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#0F1111' }}>
                  Home Refill Ready
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>
                  {refillExpanded && refill.grouped
                    ? (() => {
                        const tabItems = refill.grouped[refillTab]?.items ?? [];
                        // Count how many tab items are in cart and their total
                        const tabCartTotal = tabItems.reduce((s, i) => {
                          const cartItem = cart.find(c => c.product.id === i.id);
                          return s + (cartItem ? cartItem.product.price * cartItem.quantity : 0);
                        }, 0);
                        const tabCartQty = tabItems.reduce((s, i) => {
                          const cartItem = cart.find(c => c.product.id === i.id);
                          return s + (cartItem ? cartItem.quantity : 0);
                        }, 0);
                        const tabItemsInCart = tabItems.filter(i => cart.find(c => c.product.id === i.id)).length;
                        const tabStaticTotal = tabItems.reduce((s, i) => s + i.price, 0);
                        const tabLabels: Record<string, string> = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' };
                        return (
                          <>
                            {tabLabels[refillTab]} · {tabItems.length} items · <strong>₹{tabStaticTotal.toFixed(0)}</strong>
                            {tabCartQty > 0 && (
                              <span style={{ color: '#067D62', marginLeft: 6 }}>
                                · {tabItemsInCart} product{tabItemsInCart > 1 ? 's' : ''} ({tabCartQty} qty) ₹{tabCartTotal.toFixed(0)}
                              </span>
                            )}
                          </>
                        );
                      })()
                    : <>{refill.item_count} items likely running low · <strong>₹{refill.total.toFixed(0)}</strong></>
                  }
                </p>
                {!refillExpanded && (
                  <p style={{ fontSize: 10, color: '#888', textAlign: 'center' }}>
                    Tap to see items 
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (refillExpanded && refill.grouped) {
                    // Add only the active tab's items
                    const tabItems = refill.grouped[refillTab]?.items ?? [];
                    tabItems.forEach(item => handleProductSelect(item as unknown as Product, 1));
                  } else {
                    handleAddAllRefill();
                  }
                }}
                style={{
                  background: '#FFD814', color: '#0F1111', border: 'none',
                  borderRadius: 6, padding: '7px 14px', fontWeight: 700,
                  fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Add All →
              </button>
            </div>

            {/* Tabs + item list */}
            {refillExpanded && refill.grouped && (
              <div style={{ borderTop: '1px solid #E8F5E9' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E8F5E9', background: '#FAFEF8' }}>
                  {(['weekly', 'biweekly', 'monthly'] as const).map(tab => {
                    const group = refill.grouped[tab];
                    const count = (group?.items ?? []).filter(i => !dismissedRefillIds.has(i.id)).length;
                    const labels: Record<string, string> = {
                      weekly: 'Weekly',
                      biweekly: ' Bi-weekly', monthly: 'Monthly',
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => setRefillTab(tab)}
                        style={{
                          flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
                          background: refillTab === tab ? 'white' : 'transparent',
                          borderBottom: refillTab === tab ? '2px solid #067D62' : '2px solid transparent',
                          fontSize: 10, fontWeight: refillTab === tab ? 700 : 400,
                          color: refillTab === tab ? '#067D62' : '#888',
                        }}
                      >
                        {labels[tab]}
                        {count > 0 && (
                          <span style={{
                            marginLeft: 3, background: refillTab === tab ? '#067D62' : '#DDD',
                            color: refillTab === tab ? 'white' : '#666',
                            borderRadius: 8, padding: '0 4px', fontSize: 9,
                          }}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active tab sublabel */}
                {refill.grouped[refillTab]?.sublabel && (
                  <div style={{ padding: '4px 14px', background: '#F9FFF9' }}>
                    <span style={{ fontSize: 9, color: '#888' }}>{refill.grouped[refillTab].sublabel}</span>
                  </div>
                )}

                {/* Items for active tab */}
                {(refill.grouped[refillTab]?.items ?? []).length === 0 ? (
                  <div style={{ padding: '16px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: '#aaa' }}>No items in this frequency</span>
                  </div>
                ) : (
                  (refill.grouped[refillTab]?.items ?? []).filter(i => !dismissedRefillIds.has(i.id)).map((item, i, arr) => {
                    const cartItem = cart.find(c => c.product.id === item.id);
                    const qty = cartItem?.quantity ?? 0;
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                        borderBottom: i === arr.length - 1 ? 'none' : '1px solid #F5F5F5',
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image_url} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: '#0F1111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 9, color: '#F59E0B' }}>
                            {item.ai_reason || item.refill_info.reason}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {qty > 1 ? (
                            <>₹{(item.price * qty).toFixed(0)} <span style={{ fontSize: 9, color: '#888', textDecoration: 'line-through' }}>₹{item.price.toFixed(0)}</span></>
                          ) : `₹${item.price.toFixed(2)}`}
                        </span>
                        {qty === 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* Dismiss from refill list */}
                            <button
                              onClick={() => setDismissedRefillIds(prev => new Set([...prev, item.id]))}
                              title="Remove from suggestions"
                              style={{ background: 'none', border: '1px solid #DDD', borderRadius: '50%', width: 22, height: 22, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000ff', flexShrink: 0 }}
                            >✕</button>
                            <button onClick={() => handleProductSelect(item as unknown as Product, 1)} style={{ background: '#FFD814', border: '1px solid #F0C000', borderRadius: '50%', width: 26, height: 26, fontSize: 16, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            <button onClick={() => handleProductSelect(item as unknown as Product, 0)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '50%', width: 24, height: 24, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>🗑</button>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#FFD814', borderRadius: 20, border: '1px solid #F0C000', overflow: 'hidden' }}>
                              <button onClick={() => handleProductSelect(item as unknown as Product, qty - 1)} style={{ width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>−</button>
                              <span style={{ minWidth: 16, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{qty}</span>
                              <button onClick={() => handleProductSelect(item as unknown as Product, qty + 1)} style={{ width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}
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
            cart={cart}
            dietTags={profile?.diet_tags ?? []}
            allergenTags={profile?.allergen_tags ?? []}
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
            bottom: 58,
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 41,
            background: '#FFD814',
            color: '#0F1111',
            borderRadius: 24, padding: '8px 18px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'bottom 0.2s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F1111' }}>Shared Cart</span>
          {sharedCartItemCount > 0 ? (
            <span style={{
              background: '#0F1111', color: 'white', borderRadius: 10,
              padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>₹{sharedCartTotal.toFixed(0)} · {sharedCartItemCount} items</span>
          ) : (
            <span style={{
              background: '#0F1111', color: 'white', borderRadius: 10,
              padding: '2px 8px', fontSize: 11, fontWeight: 600,
            }}>View</span>
          )}
          <svg width="14" height="14" fill="#0F1111" viewBox="0 0 24 24">
            <path d="M10 17l5-5-5-5v10z"/>
          </svg>
        </div>
      )}

      {/* Amazon-style bottom nav — sticky cart bar */}
      <nav style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800,
        background: 'white', borderTop: '1px solid #E0E0E0',
        padding: '8px 12px', zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" fill="#0F1111" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative' }}>
              <svg width="22" height="22" fill="#0F1111" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03L23 6H5.21l-.67-4H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#FF9900', color: 'white', borderRadius: '50%',
                  width: 14, height: 14, fontSize: 8, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{cartCount}</span>
              )}
            </div>
            {cartCount > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0F1111' }}>₹{cartTotal.toFixed(0)}</p>
                <p style={{ margin: 0, fontSize: 9, color: '#888' }}>{cartCount} item{cartCount > 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>
        {cartCount > 0 ? (
          <button
            onClick={() => router.push('/cart')}
            style={{
              background: '#ffd814', color: 'black',
              border: 'none', borderRadius: 8, padding: '10px 24px',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            View Cart →
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => router.push('/nowspeak')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <svg width="20" height="20" fill="#888" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <span style={{ fontSize: 9, color: '#888' }}>Search</span>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <svg width="20" height="20" fill="#888" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span style={{ fontSize: 9, color: '#888' }}>Account</span>
            </button>
          </div>
        )}
      </nav>

      {/* Checkout modal */}
      {showCheckout && cart.length > 0 && (
        <SpeedCheckout
          cart={cart}
          onOrderComplete={handleOrderComplete}
          onClose={() => setShowCheckout(false)}
          onUpdateQty={(productId, qty) => {
            if (qty <= 0) {
              setCart(prev => prev.filter(i => i.product.id !== productId));
            } else {
              setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
            }
          }}
        />
      )}
    </div>
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
