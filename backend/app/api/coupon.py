from typing import Optional

from fastapi import APIRouter, Query

from app.models.coupon import CouponsResponse
from app.services.coupon_service import get_coupons_for_cart

router = APIRouter()


@router.get(
    "/coupons/best",
    response_model=CouponsResponse,
    summary="Best coupon for a cart subtotal",
    description=(
        "Evaluates all available coupons against the supplied cart subtotal and returns:\n\n"
        "- **`best`** — the coupon that saves the most money (null if subtotal is below every minimum)\n"
        "- **`all`** — every coupon with `eligible`, `savings`, and `min_subtotal` so the UI can "
        "render locked/teaser states without any extra requests\n\n"
        "Savings are computed server-side — the frontend never needs coupon business logic."
    ),
    tags=["Coupons"],
)
async def best_coupon(
    subtotal: float = Query(
        ...,
        gt=0,
        description="Cart subtotal in ₹ (before any discount or delivery fee)",
        examples={"mid-range": {"value": 641.41}, "low-value": {"value": 119.00}},
    ),
    user_id: Optional[str] = Query(
        default=None,
        description="User ID — reserved for future personalised coupons",
    ),
) -> CouponsResponse:
    return get_coupons_for_cart(subtotal=subtotal, user_id=user_id)
