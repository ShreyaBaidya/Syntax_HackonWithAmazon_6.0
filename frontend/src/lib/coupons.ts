// ── Coupon types & data ───────────────────────────────────────────────────────

export type CouponType = 'flat' | 'percent' | 'delivery';

export type Coupon = {
  code: string;
  label: string;
  description: string;
  type: CouponType;
  minOrder: number;
  /** Returns the monetary savings for a given subtotal. */
  discount: (subtotal: number) => number;
  badge?: string;
};

export const DELIVERY_FEE = 30;

export const COUPONS: Coupon[] = [
  {
    code: 'FLAT100',
    label: '₹100 Off',
    description: '₹100 flat off on orders above ₹499',
    type: 'flat',
    minOrder: 499,
    discount: () => 100,
    badge: '🔥 BEST',
  },
  {
    code: 'NEWUSER20',
    label: '20% Off',
    description: '20% off up to ₹150 on orders above ₹399',
    type: 'percent',
    minOrder: 399,
    discount: (sub) => Math.min(Math.round(sub * 0.2), 150),
  },
  {
    code: 'FIRST10',
    label: '10% Off',
    description: '10% off up to ₹100 on orders above ₹199',
    type: 'percent',
    minOrder: 199,
    discount: (sub) => Math.min(Math.round(sub * 0.1), 100),
  },
  {
    code: 'SAVE50',
    label: '₹50 Off',
    description: '₹50 flat off on orders above ₹299',
    type: 'flat',
    minOrder: 299,
    discount: () => 50,
  },
  {
    code: 'SUPER15',
    label: '15% Off',
    description: '15% off up to ₹75 on orders above ₹249',
    type: 'percent',
    minOrder: 249,
    discount: (sub) => Math.min(Math.round(sub * 0.15), 75),
  },
  {
    code: 'FREESHIP',
    label: 'Free Delivery',
    description: 'Free delivery on any order (saves ₹30)',
    type: 'delivery',
    minOrder: 0,
    discount: () => DELIVERY_FEE,
    badge: '🚀',
  },
  {
    code: 'AMAZON50',
    label: '₹50 Cashback',
    description: '₹50 Amazon Pay cashback on orders above ₹200',
    type: 'flat',
    minOrder: 200,
    discount: () => 50,
    badge: '💳',
  },
];

/**
 * Returns the coupon that gives maximum savings for the given subtotal.
 * Returns null if no coupon qualifies (subtotal below all minOrder thresholds).
 */
export function getBestCoupon(subtotal: number): Coupon | null {
  const eligible = COUPONS.filter((c) => subtotal >= c.minOrder);
  if (!eligible.length) return null;
  return eligible.reduce((best, c) =>
    c.discount(subtotal) > best.discount(subtotal) ? c : best,
  );
}
