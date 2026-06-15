"""
Coupon engine — single source of truth for all coupon definitions.

Design:
- Coupon discount logic lives entirely on the backend.
- Frontend receives pre-computed `savings` and `eligible` per coupon.
- Adding/changing a coupon requires no frontend code change.
"""

from typing import Callable, Dict, Any, Optional

from app.models.coupon import CouponResult, CouponsResponse

DELIVERY_FEE: float = 30.0

# ── Internal definition schema ────────────────────────────────────────────────
# Python 3.9-compatible — no PEP 695 type alias syntax

DiscountFn = Callable[[float], float]


def _flat(amount: float) -> DiscountFn:
    return lambda _: amount


def _percent(rate: float, cap: float) -> DiscountFn:
    return lambda sub: min(round(sub * rate, 2), cap)


def _delivery_free() -> DiscountFn:
    return lambda _: DELIVERY_FEE


# ── Coupon catalogue ──────────────────────────────────────────────────────────
# Each entry carries BOTH a server-side discount fn (for pre-computation)
# AND the raw parameters (discount_amount / discount_rate / discount_cap)
# so the frontend can recompute savings locally on every qty change —
# no extra API call needed for real-time price updates.

_COUPONS: list[Dict[str, Any]] = [
    {
        "code": "FLAT100",
        "label": "₹100 Off",
        "description": "₹100 flat off on orders above ₹499",
        "type": "flat",
        "min_subtotal": 499.0,
        "discount": _flat(100.0),
        "discount_amount": 100.0,
        "badge": "🔥 BEST",
    },
    {
        "code": "NEWUSER20",
        "label": "20% Off",
        "description": "20% off up to ₹150 on orders above ₹399",
        "type": "percent",
        "min_subtotal": 399.0,
        "discount": _percent(0.20, 150.0),
        "discount_rate": 0.20,
        "discount_cap": 150.0,
        "badge": None,
    },
    {
        "code": "FIRST10",
        "label": "10% Off",
        "description": "10% off up to ₹100 on orders above ₹199",
        "type": "percent",
        "min_subtotal": 199.0,
        "discount": _percent(0.10, 100.0),
        "discount_rate": 0.10,
        "discount_cap": 100.0,
        "badge": None,
    },
    {
        "code": "SAVE50",
        "label": "₹50 Off",
        "description": "₹50 flat off on orders above ₹299",
        "type": "flat",
        "min_subtotal": 299.0,
        "discount": _flat(50.0),
        "discount_amount": 50.0,
        "badge": None,
    },
    {
        "code": "SUPER15",
        "label": "15% Off",
        "description": "15% off up to ₹75 on orders above ₹249",
        "type": "percent",
        "min_subtotal": 249.0,
        "discount": _percent(0.15, 75.0),
        "discount_rate": 0.15,
        "discount_cap": 75.0,
        "badge": None,
    },
    {
        "code": "FREESHIP",
        "label": "Free Delivery",
        "description": f"Free delivery on any order (saves ₹{int(DELIVERY_FEE)})",
        "type": "delivery",
        "min_subtotal": 0.0,
        "discount": _delivery_free(),
        "discount_amount": DELIVERY_FEE,  # fixed — same as DELIVERY_FEE
        "badge": "🚀",
    },
    {
        "code": "AMAZON50",
        "label": "₹50 Cashback",
        "description": "₹50 Amazon Pay cashback on orders above ₹200",
        "type": "flat",
        "min_subtotal": 200.0,
        "discount": _flat(50.0),
        "discount_amount": 50.0,
        "badge": "💳",
    },
]


# ── Public API ────────────────────────────────────────────────────────────────


def get_coupons_for_cart(
    subtotal: float,
    user_id: Optional[str] = None,  # reserved for personalisation
) -> CouponsResponse:
    """
    Evaluates all coupons against *subtotal* and returns:
    - ``best``  — the eligible coupon with maximum savings (None if none qualify)
    - ``all``   — every coupon annotated with eligibility + pre-computed savings
                  (ineligible coupons have savings=0, shown as "locked" in the UI)

    Raw discount parameters (discount_amount / discount_rate / discount_cap) are
    included so the frontend can recompute savings locally without extra API calls.
    """
    results: list[CouponResult] = []

    for defn in _COUPONS:
        eligible = subtotal >= defn["min_subtotal"]
        savings = round(defn["discount"](subtotal), 2) if eligible else 0.0

        results.append(
            CouponResult(
                code=defn["code"],
                label=defn["label"],
                description=defn["description"],
                type=defn["type"],
                min_subtotal=defn["min_subtotal"],
                savings=savings,
                eligible=eligible,
                badge=defn.get("badge"),
                # Raw params for client-side real-time recomputation
                discount_amount=defn.get("discount_amount"),
                discount_rate=defn.get("discount_rate"),
                discount_cap=defn.get("discount_cap"),
            )
        )

    eligible_results = [r for r in results if r.eligible]
    best = max(eligible_results, key=lambda r: r.savings) if eligible_results else None

    return CouponsResponse(best=best, all=results)
