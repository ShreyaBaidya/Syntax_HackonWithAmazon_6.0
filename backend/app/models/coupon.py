from typing import Optional
from pydantic import BaseModel, ConfigDict


class CouponResult(BaseModel):
    """Single coupon with eligibility and pre-computed savings for a given subtotal."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "NEWUSER20",
                "label": "20% Off",
                "description": "20% off up to ₹150 on orders above ₹399",
                "type": "percent",
                "min_subtotal": 399.0,
                "savings": 128.0,
                "eligible": True,
                "badge": None,
            }
        }
    )

    code: str
    label: str
    description: str
    type: str  # "flat" | "percent" | "delivery"
    min_subtotal: float  # minimum cart value required
    savings: float  # pre-computed monetary saving for the requested subtotal
    eligible: bool  # subtotal >= min_subtotal
    badge: Optional[str] = None
    # ── Raw discount parameters ──────────────────────────────────────────────
    # Sent to the frontend so it can recompute savings locally on every
    # quantity change — no extra API call needed for real-time updates.
    discount_amount: Optional[float] = None  # flat / delivery: fixed saving
    discount_rate: Optional[float] = None  # percent: rate  (e.g. 0.20 = 20 %)
    discount_cap: Optional[float] = None  # percent: max saving cap


class CouponsResponse(BaseModel):
    """Best coupon + full list (including ineligible) for a cart subtotal."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "best": {
                    "code": "NEWUSER20",
                    "label": "20% Off",
                    "description": "20% off up to ₹150 on orders above ₹399",
                    "type": "percent",
                    "min_subtotal": 399.0,
                    "savings": 128.0,
                    "eligible": True,
                    "badge": None,
                },
                "all": [],
            }
        }
    )

    best: Optional[CouponResult] = None
    all: list[CouponResult]
