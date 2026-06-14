'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CartState, CartItem, CartSSEEvent, Product,
  openCartStream, addToSharedCart, updateCartItemQty, removeFromSharedCart,
  joinSharedCart, placeOrder, searchProducts, getProductsByCategory, getRecommendations,
  leaveSharedCart, deleteSharedCart,
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

  // The first participant in the list is the owner (cart creator)
  const ownerName = cart.participants[0] ?? '';
  const isOwner = participantName === ownerName;

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
          {cart.participants.map((p, idx) => (
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
              {idx === 0 && (
                <span style={{
                  background: '#FF9900', color: 'white', fontSize: 9, fontWeight: 700,
                  padding: '1px 5px', borderRadius: 4, marginLeft: 2,
                }}>Owner</span>
              )}
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

      {/* ── Add Products button ── */}
      <div style={{ background: 'white', padding: '8px 12px', borderBottom: '1px solid #F0F0F0' }}>
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
      </div>

      {/* ── Full-screen catalog overlay ── */}
      {showSearch && (
        <CatalogOverlay
          cart={cart}
          participantName={participantName}
          onAddProduct={handleAddProduct}
          addingIds={addingIds}
          onClose={closeSearch}
        />
      )}

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
                participantColor={colorForParticipant(item.added_by[0] ?? '', cart.participants)}
                canEdit={item.added_by.includes(participantName) || isOwner}
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

      {/* ── Quit / Delete Cart ── */}
      <div style={{ margin: '12px 8px 0', display: 'flex', gap: 8 }}>
        {/* Quit Cart — available to everyone */}
        <button
          onClick={async () => {
            if (!confirm('Are you sure you want to leave this cart?')) return;
            try {
              await leaveSharedCart(cartId, participantName);
              sessionStorage.removeItem(`cart_name_${cartId}`);
              window.location.href = '/';
            } catch { alert('Could not leave cart'); }
          }}
          style={{
            flex: 1, padding: '10px', borderRadius: 8,
            border: '1px solid #DDD', background: 'white',
            fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#555',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          🚪 Quit Cart
        </button>

        {/* Delete Cart — owner only */}
        {isOwner && (
          <button
            onClick={async () => {
              if (!confirm('Delete this cart for everyone? This cannot be undone.')) return;
              try {
                await deleteSharedCart(cartId);
                sessionStorage.removeItem(`cart_name_${cartId}`);
                window.location.href = '/';
              } catch { alert('Could not delete cart'); }
            }}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: '1px solid #FCA5A5', background: '#FEF2F2',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            🗑️ Delete Cart
          </button>
        )}
      </div>

      {/* ── Sticky checkout bar ── */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800,
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
        {isOwner ? (
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
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '100%', background: '#F0F0F0',
              color: '#888', border: 'none', borderRadius: 8,
              padding: '14px 20px', fontWeight: 600, fontSize: 14,
            }}>
              🔒 Only the cart owner can checkout
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#aaa' }}>
              Waiting for <strong>{ownerName}</strong> to place the order
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single cart row ────────────────────────────────────────────────────────────
function CartRow({
  item, isLast, participantColor, canEdit, onQty,
}: {
  item: CartItem;
  isLast: boolean;
  participantColor: string;
  canEdit: boolean;
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
          <span style={{ fontSize: 10, color: '#888' }}>by {item.added_by.join(' & ')}</span>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right', marginRight: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(0)}</p>
        {item.quantity > 1 && (
          <p style={{ margin: '1px 0 0', fontSize: 9, color: '#888' }}>₹{item.price} each</p>
        )}
      </div>

      {/* Qty stepper — only if canEdit */}
      {canEdit ? (
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
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#F5F5F5', borderRadius: 20,
          border: '1px solid #E0E0E0', padding: '4px 10px',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
            ×{item.quantity}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Category data for the catalog overlay ─────────────────────────────────────
const CATEGORIES = [
  { id: '',             icon: '🏠', label: 'Top Picks',   color: '#FFF3E0' },
  { id: 'beverages',    icon: '🥤', label: 'Beverages',   color: '#E3F2FD' },
  { id: 'snacks',       icon: '🍿', label: 'Snacks',      color: '#FFF8E1' },
  { id: 'dairy',        icon: '🥛', label: 'Dairy & Eggs', color: '#F1F8E9' },
  { id: 'fresh',        icon: '🥦', label: 'Fresh',       color: '#E8F5E9' },
  { id: 'medicine',     icon: '💊', label: 'Health',      color: '#FCE4EC' },
  { id: 'personal_care',icon: '🧴', label: 'Personal Care', color: '#EDE7F6' },
  { id: 'cleaning',     icon: '🧹', label: 'Cleaners',    color: '#E0F7FA' },
  { id: 'baby',         icon: '👶', label: 'Baby',        color: '#FFF3E0' },
  { id: 'electronics',  icon: '🔋', label: 'Electronics', color: '#ECEFF1' },
  { id: 'fashion',      icon: '👕', label: 'Fashion',     color: '#FCE4EC' },
];

// ── Full-screen catalog overlay ───────────────────────────────────────────────
function CatalogOverlay({
  cart, participantName, onAddProduct, addingIds, onClose,
}: {
  cart: CartState;
  participantName: string;
  onAddProduct: (product: Product) => void;
  addingIds: Set<string>;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch products on category change
  useEffect(() => {
    setLoading(true);
    if (activeCategory) {
      getProductsByCategory(activeCategory, 20)
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      // Top picks = recommendations trending + now
      getRecommendations()
        .then(recs => {
          setProducts([...recs.now_suggestions, ...recs.trending]);
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }
  }, [activeCategory]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchProducts(q, 12);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const displayProducts = searchQuery.trim().length >= 2 ? searchResults : products;
  const isSearching = searchQuery.trim().length >= 2;

  return (
    <>
      {/* Blurred backdrop */}
      <div style={{
        position: 'fixed',
        top: 0, bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 800,
        zIndex: 59,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }} onClick={onClose} />

      {/* Catalog panel */}
      <div style={{
        position: 'fixed',
        top: 0, bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 800,
        zIndex: 60,
        background: '#F7F7F7', display: 'flex', flexDirection: 'column',
      }}>
      {/* Header */}
      <div style={{
        background: '#0F1111', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="blur-overlay" style={{ flex: 1 , backfaceVisibility: 'hidden'}}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>
            Add to Shared Cart
          </p>
          <p style={{ color: '#aaa', fontSize: 10, margin: 0 }}>
            {cart.item_count} items · ₹{cart.total.toFixed(0)} in cart
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ background: 'white', padding: '8px 12px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#aaa' }}>🔍</span>
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 32px',
              borderRadius: 8, border: '1.5px solid #DDD',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
              background: '#F7F7F7',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888',
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Category strip (hidden when searching) */}
      {!isSearching && (
        <div style={{ background: 'white', borderBottom: '1px solid #F0F0F0', padding: '10px 0 6px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingLeft: 8, paddingRight: 8 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, flexShrink: 0, background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 8px', minWidth: 56,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, background: isActive ? cat.color : '#F7F7F7',
                    borderRadius: 8,
                    border: isActive ? '2px solid #067D62' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>{cat.icon}</div>
                  <span style={{
                    fontSize: 9, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#0F1111' : '#565959',
                    textAlign: 'center', maxWidth: 56, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 80px' }}>
        {(loading || searching) && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>
          </div>
        )}

        {!loading && !searching && displayProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#888', fontSize: 13 }}>
              {isSearching ? 'No products found' : 'No products in this category'}
            </p>
          </div>
        )}

        {!loading && !searching && displayProducts.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          }}>
            {displayProducts.map(product => {
              const cartItem = cart.items[product.id];
              const alreadyInCart = !!cartItem;
              const isAdding = addingIds.has(product.id);
              return (
                <div key={product.id} style={{
                  background: 'white', borderRadius: 8, overflow: 'hidden',
                  border: alreadyInCart ? '2px solid #067D62' : '1px solid #F0F0F0',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  {/* Image */}
                  <div style={{ background: '#FAFAFA', position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image_url} alt={product.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
                    />
                    {alreadyInCart && (
                      <div style={{
                        position: 'absolute', top: 4, left: 4,
                        background: '#067D62', color: 'white',
                        fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                      }}>
                        In cart ×{cartItem.quantity}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '6px 6px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{
                      fontSize: 11, color: '#0F1111', margin: 0, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: 9, color: '#888', margin: '2px 0 4px' }}>{product.unit}</p>

                    {/* Added by (if in cart) */}
                    {alreadyInCart && (
                      <p style={{ fontSize: 9, color: '#067D62', margin: '0 0 4px', fontWeight: 500 }}>
                        by {cartItem.added_by.join(' & ')}
                      </p>
                    )}

                    {/* Price + Add */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>₹{product.price}</span>
                      <button
                        onClick={() => onAddProduct(product)}
                        disabled={isAdding}
                        style={{
                          background: alreadyInCart ? '#E0F4EC' : '#FFD814',
                          color: alreadyInCart ? '#067D62' : '#0F1111',
                          border: 'none', borderRadius: 6,
                          padding: '4px 10px', fontWeight: 700, fontSize: 11,
                          cursor: isAdding ? 'not-allowed' : 'pointer',
                          opacity: isAdding ? 0.6 : 1,
                        }}
                      >
                        {isAdding ? '…' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar showing cart total */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #F0F0F0',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      }}>
        <div>
          <span style={{ fontSize: 12, color: '#555' }}>{cart.item_count} items · </span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>₹{cart.total.toFixed(0)}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#FFD814', color: '#0F1111',
            border: 'none', borderRadius: 8, padding: '10px 20px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          ← Back to Cart
        </button>
      </div>
    </div>
    </>
  );
}
