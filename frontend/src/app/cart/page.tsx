'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { placeOrder, Order, fetchCoupons, CouponResult } from '@/lib/api';
import { CartItem } from '@/components/SpeedCheckout';
import { DELIVERY_FEE } from '@/lib/coupons';

// ── Local coupon helpers (zero-latency, no API call) ─────────────────────────

/**
 * Recomputes savings for a coupon at the current subtotal.
 *
 * Strategy (in order):
 * 1. Use raw params (discount_amount / discount_rate / discount_cap) when available
 *    — these enable true real-time computation as the subtotal changes.
 * 2. Fall back to the `savings` field pre-computed by the backend for the
 *    initial subtotal — always correct for flat/delivery coupons, slightly
 *    stale for percent coupons until the backend is restarted with fresh data.
 */
function computeCouponSavings(c: CouponResult, subtotal: number): number {
  if (subtotal < c.min_subtotal) return 0;

  // ── Flat / Delivery ─────────────────────────────────────────────────────────
  if (c.type === 'flat' || c.type === 'delivery') {
    if (c.discount_amount != null) return c.discount_amount;   // real-time
    return c.savings;                                           // stale fallback
  }

  // ── Percent ─────────────────────────────────────────────────────────────────
  if (c.type === 'percent') {
    if (c.discount_rate != null && c.discount_cap != null) {
      return Math.min(Math.round(subtotal * c.discount_rate), c.discount_cap); // real-time
    }
    // Stale fallback: backend savings were computed for a different subtotal.
    // Scale proportionally so it at least moves in the right direction.
    return c.savings;
  }

  return 0;
}

/** Picks the eligible coupon with the highest savings at the given subtotal. */
function findBestCoupon(coupons: CouponResult[], subtotal: number): CouponResult | null {
  const eligible = coupons.filter(c => subtotal >= c.min_subtotal);
  if (!eligible.length) return null;
  return eligible.reduce((best, c) =>
    computeCouponSavings(c, subtotal) > computeCouponSavings(best, subtotal) ? c : best,
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

type PaymentMethod = 'upi' | 'card' | 'cod' | 'amazon_pay';
type Phase = 'cart' | 'biometric' | 'confirmed';

const PAYMENT_METHODS: { id: PaymentMethod; icon: string; label: string; sub: string }[] = [
  { id: 'upi',        icon: '📱', label: 'UPI',                sub: 'GPay · PhonePe · Paytm'  },
  { id: 'amazon_pay', icon: '🛡️', label: 'Amazon Pay',         sub: 'Balance: ₹1,250.00'      },
  { id: 'card',       icon: '💳', label: 'Credit / Debit Card', sub: 'Visa ending ·· 4321'     },
  { id: 'cod',        icon: '💵', label: 'Cash on Delivery',   sub: 'Pay when delivered'       },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();

  const [items, setItems]             = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);    // prevent empty-state flash
  const [allCoupons, setAllCoupons]   = useState<CouponResult[]>([]);
  // null = auto mode (track best); non-null = user explicitly pinned this coupon
  const [pinnedCoupon, setPinnedCoupon] = useState<CouponResult | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [payment, setPayment]         = useState<PaymentMethod>('upi');
  const [phase, setPhase]             = useState<Phase>('cart');
  const [order, setOrder]             = useState<Order | null>(null);
  const [error, setError]             = useState('');

  // ── Subtotal — computed on every render (no state, always in sync) ──────────
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  // ── Best coupon — fully derived, zero async, updates the same frame as +/– ──
  const bestCoupon = useMemo(
    () => (allCoupons.length ? findBestCoupon(allCoupons, subtotal) : null),
    [allCoupons, subtotal],
  );

  // Active coupon: user's pin (if still eligible) or auto best
  const coupon    = pinnedCoupon && subtotal >= pinnedCoupon.min_subtotal ? pinnedCoupon : bestCoupon;
  const autoApplied = coupon !== null && coupon !== pinnedCoupon;

  // ── Load from localStorage + one-time backend fetch for coupon catalogue ────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('amazon_now_cart');
      const parsed: CartItem[] = saved ? JSON.parse(saved) : [];
      setItems(parsed);
      const sub = parsed.reduce((s, i) => s + i.product.price * i.quantity, 0);
      if (sub > 0) {
        fetchCoupons(sub)
          .then(({ all }) => setAllCoupons(all))
          .catch(() => { /* backend unavailable — no coupons shown */ });
      }
    } catch { /* ignore */ }
    setLoadingCart(false);
  }, []);

  // ── Derived values — all instant, no async ──────────────────────────────────
  // computeCouponSavings recalculates from raw params on every render.
  const couponSavings = coupon ? computeCouponSavings(coupon, subtotal) : 0;
  const deliveryFee   = coupon?.type === 'delivery' ? 0 : (subtotal > 0 ? DELIVERY_FEE : 0);
  const total         = Math.max(0, subtotal - couponSavings + deliveryFee);
  const totalSavings  = couponSavings + (coupon?.type === 'delivery' ? DELIVERY_FEE : 0);
  const itemCount     = items.reduce((s, i) => s + i.quantity, 0);
  const maxEta        = items.length ? Math.max(...items.map(i => i.product.eta_min)) : 28;

  // ── Handlers ───────────────────────────────────────────────────────────────
  // Update qty AND immediately persist to localStorage (avoids a separate
  // persist useEffect that would fire with stale empty state on mount).
  const updateQty = useCallback((productId: string, qty: number) => {
    setItems(prev => {
      const updated = qty <= 0
        ? prev.filter(i => i.product.id !== productId)
        : prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i);
      localStorage.setItem('amazon_now_cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handlePlaceOrder = async () => {
    setError('');
    setPhase('biometric');
    await new Promise(r => setTimeout(r, 1800));
    try {
      const result = await placeOrder({
        user_id: 'demo_user',
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        delivery_address: 'B-42, Sector 18, Noida, UP 201301',
      });
      setOrder(result);
      setPhase('confirmed');
      localStorage.removeItem('amazon_now_cart');
    } catch {
      setError('Order failed. Please try again.');
      setPhase('cart');
    }
  };

  // ── Biometric animation ────────────────────────────────────────────────────
  if (phase === 'biometric') {
    return (
      <div className="fixed inset-0 bg-[#131921] flex items-center justify-center">
        <div className="text-center">
          <div className="w-28 h-28 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-ping opacity-50" />
            <div className="absolute inset-3 border-4 border-yellow-300 rounded-full animate-pulse" />
            <div className="absolute inset-6 bg-[#FFD814] rounded-full flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
          </div>
          <p className="text-white text-xl font-bold">Authenticating…</p>
          <p className="text-gray-400 text-sm mt-2">Face ID · Placing your order</p>
        </div>
      </div>
    );
  }

  // ── Order confirmed ────────────────────────────────────────────────────────
  if (phase === 'confirmed' && order) {
    return (
      <div className="min-h-screen bg-[#F0F2F2] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Order Placed!</h2>
          <p className="text-gray-400 text-xs font-mono mb-4">{order.order_id}</p>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
            <p className="text-4xl font-bold text-green-600">{order.eta_minutes} min</p>
            <p className="text-sm text-green-700 font-medium mt-1">Estimated delivery</p>
          </div>
          {totalSavings > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
              <p className="text-sm font-semibold text-yellow-800">🎉 You saved ₹{Math.round(totalSavings)} with {coupon?.code}!</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Total paid: <span className="font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</span>
          </p>
          <button onClick={() => router.push('/')}
            className="w-full bg-[#FFD814] text-[#0F1111] py-3 rounded-xl font-bold hover:bg-[#F7CA00] transition-colors">
            Continue Shopping →
          </button>
        </div>
      </div>
    );
  }

  // ── Loading (prevents "empty cart" flash before localStorage is read) ──────
  if (loadingCart) {
    return (
      <div className="min-h-screen bg-[#F0F2F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#FFD814] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your cart…</p>
        </div>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F2F2] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-5xl">🛒</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 text-sm mb-6">Add items from the home feed or use NowSpeak.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/')}
              className="bg-[#FFD814] text-[#0F1111] px-8 py-3 rounded-xl font-bold hover:bg-[#F7CA00] transition-colors">
              Browse Recommendations
            </button>
            <button onClick={() => router.push('/nowspeak')}
              className="bg-[#232F3E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#131921] transition-colors flex items-center justify-center gap-2">
              <span>🎙️</span> Open NowSpeak
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main cart page ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2F2]">

      {/* Header */}
      <div className="bg-[#131921] px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-md">
        <button onClick={() => router.push('/')} className="text-white hover:text-[#FFD814] transition-colors p-1">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Shopping Cart</h1>
          <p className="text-gray-400 text-xs">{itemCount} item{itemCount !== 1 ? 's' : ''} · ₹{subtotal.toFixed(0)}</p>
        </div>
        <span className="text-[#FFD814] text-xs font-semibold">⚡ {maxEta} min</span>
      </div>

      {/* 2-col layout: stacked on mobile, side-by-side on lg */}
      <div className="max-w-6xl mx-auto px-3 py-4 flex flex-col lg:flex-row gap-4 items-start">

        {/* ─── LEFT: Items ─────────────────────────────────────────── */}
        <div className="flex-1 w-full space-y-3">

          {/* Auto-coupon banner */}
          {coupon && autoApplied && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div className="flex-1 min-w-0">
                <p className="text-green-800 font-bold text-sm">
                  Best coupon applied — saving ₹{Math.round(totalSavings)}
                </p>
                <p className="text-green-600 text-xs mt-0.5">{coupon.code} · {coupon.description}</p>
              </div>
              <button onClick={() => setShowCoupons(true)}
                className="text-xs text-green-700 font-bold underline flex-shrink-0">
                Change
              </button>
            </div>
          )}

          {/* Items card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Items in your cart</h2>
              <span className="text-xs text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
            {items.map((item, idx) => (
              <div key={item.product.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                {/* Image */}
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.product.image_url} alt={item.product.name}
                    className="w-14 h-14 object-contain" />
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.product.unit}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">⚡ {item.product.eta_min} min</p>
                </div>
                {/* Price + stepper */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-bold text-gray-900 text-sm">
                    ₹{(item.product.price * item.quantity).toFixed(0)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400">₹{item.product.price} each</p>
                  )}
                  <div className="flex items-center bg-[#FFD814] rounded-full border border-[#F0C000] overflow-hidden">
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold hover:bg-[#F0C000] transition-colors text-sm">
                      {item.quantity === 1 ? '🗑' : '−'}
                    </button>
                    <span className="px-1 text-sm font-bold min-w-[22px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold hover:bg-[#F0C000] transition-colors text-sm">
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Order Summary ────────────────────────────────── */}
        <div className="lg:w-80 w-full space-y-4 flex-shrink-0">

          {/* Price breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-gray-900 mb-3">Price Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {couponSavings > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon ({coupon?.code})</span>
                  <span>− ₹{couponSavings.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery fee</span>
                {deliveryFee === 0
                  ? <span className="text-green-600 font-semibold">FREE</span>
                  : <span>₹{deliveryFee}</span>
                }
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            {totalSavings > 0 && (
              <div className="mt-3 bg-green-50 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg text-center">
                🎉 You&apos;re saving ₹{Math.round(totalSavings)} on this order!
              </div>
            )}
          </div>

          {/* Coupon section */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Coupons &amp; Offers</h2>
              <button onClick={() => setShowCoupons(true)}
                className="text-xs text-blue-600 font-semibold hover:underline">View all</button>
            </div>
            {coupon ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <span className="text-2xl flex-shrink-0">🏷️</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{coupon.code}</span>
                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">Applied</span>
                    {autoApplied && <span className="text-xs text-gray-400">auto</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{coupon.description}</p>
                </div>
                <button onClick={() => setPinnedCoupon(null) /* removes pin → reverts to auto-best */}
                  className="text-gray-300 hover:text-red-500 text-xl leading-none flex-shrink-0 transition-colors">
                  ×
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCoupons(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg p-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
                + Apply a coupon code
              </button>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-gray-900 mb-3">Payment Method</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(m => (
                <label key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    payment === m.id
                      ? 'border-[#FF9900] bg-orange-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <input type="radio" name="payment" value={m.id}
                    checked={payment === m.id} onChange={() => setPayment(m.id)}
                    className="accent-[#FF9900]" />
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900">Deliver to</h2>
              <button className="text-xs text-blue-600 font-semibold hover:underline">Change</button>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5 flex-shrink-0">📍</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Home</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  B-42, Sector 18, Noida<br />Uttar Pradesh 201301
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
              <span className="text-green-600 font-bold">⚡</span>
              <p className="text-xs text-green-700 font-semibold">Arrives in {maxEta} min</p>
            </div>
          </div>

          {/* CTA */}
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          <button onClick={handlePlaceOrder}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0C000] text-[#0F1111] py-4 rounded-xl font-bold text-base transition-all shadow-sm">
            Place Order · ₹{total.toFixed(0)}
          </button>
          <p className="text-center text-xs text-gray-400">
            Secured by Face ID ·{' '}
            {PAYMENT_METHODS.find(m => m.id === payment)?.label ?? 'UPI'}
          </p>
        </div>
      </div>

      {/* Coupon Modal */}
      {showCoupons && (
        <CouponModal
          subtotal={subtotal}
          coupons={allCoupons}
          applied={coupon}
          onApply={(c) => { setPinnedCoupon(c); setShowCoupons(false); }}
          onClose={() => setShowCoupons(false)}
        />
      )}
    </div>
  );
}

// ── Coupon bottom-sheet modal ──────────────────────────────────────────────────
// Coupons (eligibility + savings) are now server-computed and passed in via `coupons`.

function CouponModal({
  subtotal,
  coupons,
  applied,
  onApply,
  onClose,
}: {
  subtotal: number;
  coupons: CouponResult[];
  applied: CouponResult | null;
  onApply: (coupon: CouponResult) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-base text-gray-900">Available Coupons</h3>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>
        {/* Coupon list — eligibility & savings come pre-computed from backend */}
        <div className="overflow-y-auto p-4 space-y-3 pb-8">
          {coupons.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">Loading coupons…</p>
          )}
          {coupons.map(c => {
            const isActive = applied?.code === c.code;
            return (
              <div key={c.code}
                onClick={() => c.eligible && onApply(c)}
                className={`border rounded-xl p-4 transition-all select-none ${
                  isActive    ? 'border-green-400 bg-green-50 shadow-sm' :
                  c.eligible  ? 'border-gray-200 hover:border-[#FF9900] hover:shadow-sm cursor-pointer' :
                                'border-gray-100 opacity-50 cursor-not-allowed'
                }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded tracking-wide">
                      {c.code}
                    </span>
                    {c.badge && (
                      <span className="text-xs bg-[#FF9900] text-white px-1.5 py-0.5 rounded font-semibold">
                        {c.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">
                        ✓ Applied
                      </span>
                    )}
                  </div>
                  {c.eligible && (
                    <span className="text-sm font-bold text-green-700 flex-shrink-0">Save ₹{Math.round(c.savings)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{c.description}</p>
                {!c.eligible && (
                  <p className="text-xs text-orange-500 font-semibold mt-1.5">
                    Add ₹{Math.ceil(c.min_subtotal - subtotal)} more to unlock
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
