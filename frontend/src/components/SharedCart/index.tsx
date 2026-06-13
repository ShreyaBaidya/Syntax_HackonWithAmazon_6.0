'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CartState, CartItem, CartSSEEvent, Product,
  openCartStream, addToSharedCart, updateCartItemQty, removeFromSharedCart,
  joinSharedCart, placeOrder, searchProducts,
} from '@/lib/api';

interface Props {
  cartId: string;
  initialCart: CartState;
  participantName: string;
}

// Pastel colours cycled per participant
const PARTICIPANT_COLORS = [
  '#FFD814', '#FF9900', '#067D62', '#0066C0',
  '#CC0C39', '#9333EA', '#EA580C', '#16A34A',
];

function colorForParticipant(name: string, all: string[]) {
  const idx = all.indexOf(name) % PARTICIPANT_COLORS.length;
  return PARTICIPANT_COLORS[Math.max(0, idx)];
}

export function SharedCart({ cartId, initialCart, participantName }: Props) {
  const [cart, setCart] = useState<CartState>(initialCart);
  const [activity, setActivity] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // ── Product search state ─────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SSE: connect once and keep in sync ─────────────────────────────────────
  useEffect(() => {
    const es = openCartStream(cartId);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const evt: CartSSEEvent = JSON.parse(e.data);
        if (evt.cart) setCart(evt.cart);
        if (evt.message && evt.type !== 'cart_update') {
          setActivity(prev => [evt.message!, ...prev].slice(0, 8));
        }
      } catch { /* ignore malformed chunks */ }
    };

    es.onerror = () => {
      // Auto-reconnect is handled by the browser EventSource spec
    };

    return () => { es.close(); };
  }, [cartId]);

  // ── Debounced product search ─────────────────────────────────────────────────
  useEffect(() => {
    if (!showSearch) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchProducts(q, 8);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, showSearch]);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // ── Copy share link ─────────────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Add product to shared cart ──────────────────────────────────────────────
  const handleAddProduct = useCallback(async (product: Product) => {
    setAddingIds(prev => new Set(prev).add(product.id));
    try {
      await addToSharedCart(cartId, product.id, participantName, 1);
    } catch {
      // SSE stream will reflect the latest state regardless
    } finally {
      setAddingIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
    }
  }, [cartId, participantName]);

  // ── Quantity change ─────────────────────────────────────────────────────────
  const handleQty = useCallback(async (productId: string, delta: number, current: number) => {
    const next = current + delta;
    if (next <= 0) {
      await removeFromSharedCart(cartId, productId);
    } else {
      await updateCartItemQty(cartId, productId, next);
    }
  }, [cartId]);

  // ── Checkout ────────────────────────────────────────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (cart.item_count === 0) return;
    setCheckingOut(true);
    try {
      const items = Object.values(cart.items).map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
      }));
      const order = await placeOrder({
        user_id: participantName,
        items,
        delivery_address: 'Shared Cart Delivery',
      });
      setOrderDone(order.order_id);
    } catch {
      alert('Checkout failed — try again');
    } finally {
      setCheckingOut(false);
    }
  }, [cart, participantName]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const itemList = Object.values(cart.items);

  // ── Order confirmed screen ──────────────────────────────────────────────────
  if (orderDone) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Order Placed!</h2>
          <p style={{ color: '#555', fontSize: 13, margin: '0 0 4px' }}>{orderDone}</p>
          <p style={{ color: '#067D62', fontWeight: 700, fontSize: 15, margin: '0 0 24px' }}>⚡ Arriving in 28 minutes</p>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Total: ₹{cart.total.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', paddingBottom: 120 }}>

      {/* ── Header ── */}
      <div style={{ background: '#0F1111', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#FFD814', fontWeight: 800, fontSize: 15 }}>🛒 Shared Cart</span>
            <span style={{ color: '#aaa', fontSize: 12, marginLeft: 8 }}>· {cartId}</span>
          </div>
          <button
            onClick={copyLink}
            style={{
              background: copied ? '#067D62' : '#FFD814',
              border: 'none', borderRadius: 6, padding: '6px 14px',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
              color: '#0F1111', transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : '🔗 Share Link'}
          </button>
        </div>
      </div>

      {/* ── Participants ── */}
      <div style={{ background: 'white', padding: '10px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>ONLINE:</span>
          {cart.participants.map(p => (
            <div key={p} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#F7F7F7', borderRadius: 20, padding: '3px 10px',
              border: `1.5px solid ${colorForParticipant(p, cart.participants)}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colorForParticipant(p, cart.participants),
              }} />
              <span style={{ fontSize: 12, fontWeight: p === participantName ? 700 : 400 }}>
                {p}{p === participantName ? ' (you)' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity feed (last 5 events) ── */}
      {activity.length > 0 && (
        <div style={{ background: '#FFFBEB', padding: '6px 16px', borderBottom: '1px solid #FEF3C7' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#92400E' }}>
            📢 {activity[0]}
          </p>
        </div>
      )}

      {/* ── Add Products panel ── */}
      <div style={{ background: 'white', padding: '8px 12px', borderBottom: '1px solid #F0F0F0' }}>
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F0FAF6', border: '1.5px dashed #067D62',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              color: '#067D62', fontWeight: 700, fontSize: 13, width: '100%',
              justifyContent: 'center',
            }}
          >
            ➕ Add Products
          </button>
        ) : (
          <div>
            {/* Search input row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#aaa' }}>🔍</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 32px',
                    borderRadius: 8, border: '1.5px solid #067D62',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={closeSearch}
                style={{
                  background: '#F5F5F5', border: 'none', borderRadius: 8,
                  width: 36, height: 36, cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Search status */}
            {searching && (
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888', textAlign: 'center' }}>Searching…</p>
            )}
            {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#aaa', textAlign: 'center' }}>No products found</p>
            )}
            {!searching && searchQuery.trim().length < 2 && (
              <p style={{ margin: '0 0 6px', fontSize: 11, color: '#aaa', textAlign: 'center' }}>Type at least 2 characters to search</p>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                {searchResults.map((product, i) => {
                  const alreadyInCart = !!cart.items[product.id];
                  const isAdding = addingIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid #F5F5F5',
                        background: 'white',
                      }}
                    >
                      {/* Image */}
                      <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image_url} alt={product.name} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                      </div>

                      {/* Name + unit */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#0F1111', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888' }}>{product.unit}</p>
                      </div>

                      {/* Price */}
                      <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>₹{product.price}</span>

                      {/* Add button */}
                      <button
                        onClick={() => handleAddProduct(product)}
                        disabled={isAdding}
                        style={{
                          background: alreadyInCart ? '#E0F4EC' : '#FFD814',
                          color: alreadyInCart ? '#067D62' : '#0F1111',
                          border: 'none', borderRadius: 6,
                          padding: '6px 12px', fontWeight: 700, fontSize: 12,
                          cursor: isAdding ? 'not-allowed' : 'pointer',
                          flexShrink: 0, opacity: isAdding ? 0.6 : 1,
                          minWidth: 52,
                        }}
                      >
                        {isAdding ? '…' : alreadyInCart ? '✓ Add' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cart items ── */}
      <div style={{ marginTop: 8 }}>
        {itemList.length === 0 ? (
          <div style={{ background: 'white', margin: 8, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Cart is empty</p>
            <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Search for products above to get started</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 8, margin: '0 8px', overflow: 'hidden' }}>
            {itemList.map((item, i) => (
              <CartRow
                key={item.product_id}
                item={item}
                isLast={i === itemList.length - 1}
                participantColor={colorForParticipant(item.added_by, cart.participants)}
                onQty={(delta) => handleQty(item.product_id, delta, item.quantity)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Share URL box ── */}
      <div style={{ margin: '12px 8px 0', background: 'white', borderRadius: 8, padding: '12px 14px' }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#555' }}>SHARE THIS CART</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            flex: 1, background: '#F7F7F7', borderRadius: 6, padding: '8px 10px',
            fontSize: 11, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {shareUrl}
          </div>
          <button
            onClick={copyLink}
            style={{
              background: '#FFD814', border: 'none', borderRadius: 6,
              padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* ── Sticky checkout bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #F0F0F0',
        padding: '12px 16px',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 13, color: '#555' }}>{cart.item_count} items · </span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>₹{cart.total.toFixed(2)}</span>
          </div>
          <span style={{ fontSize: 11, color: '#067D62', fontWeight: 600 }}>⚡ 28 min delivery</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={cart.item_count === 0 || checkingOut}
          style={{
            width: '100%', background: cart.item_count === 0 ? '#E0E0E0' : '#FFD814',
            color: '#0F1111', border: 'none', borderRadius: 8,
            padding: '14px 20px', fontWeight: 800, fontSize: 15,
            cursor: cart.item_count === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {checkingOut ? 'Placing Order…' : `⚡ Checkout · ₹${cart.total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

// ── Single cart row ────────────────────────────────────────────────────────────
function CartRow({
  item, isLast, participantColor, onQty,
}: {
  item: CartItem;
  isLast: boolean;
  participantColor: string;
  onQty: (delta: number) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
    }}>
      {/* Product image */}
      <div style={{
        width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
        flexShrink: 0, background: '#FAFAFA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={item.name}
          style={{ width: 52, height: 52, objectFit: 'contain' }} />
      </div>

      {/* Name + added-by */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#0F1111', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#888' }}>{item.unit}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: participantColor }} />
          <span style={{ fontSize: 10, color: '#888' }}>by {item.added_by}</span>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right', marginRight: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(0)}</p>
        {item.quantity > 1 && (
          <p style={{ margin: '1px 0 0', fontSize: 9, color: '#888' }}>₹{item.price} each</p>
        )}
      </div>

      {/* Qty stepper */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#FFD814', borderRadius: 20,
        border: '1px solid #F0C000', overflow: 'hidden',
      }}>
        <button onClick={() => onQty(-1)}
          style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
          −
        </button>
        <span style={{ minWidth: 18, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
          {item.quantity}
        </span>
        <button onClick={() => onQty(1)}
          style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
          +
        </button>
      </div>
    </div>
  );
}
