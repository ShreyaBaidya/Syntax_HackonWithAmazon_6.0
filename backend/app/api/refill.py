from typing import Optional, List

from fastapi import APIRouter, Query

from app.services.refill_engine import get_refill_suggestions

router = APIRouter()


@router.get(
    "/refill-suggestions",
    summary="Predictive Home Refill — LLM-optimized with Google Calendar",
    tags=["Recommendations"],
)
async def refill_suggestions(
    user_id: Optional[str] = Query(default=None),
    cart_items: Optional[str] = Query(default=None, description="Comma-separated product names in cart"),
    google_token: Optional[str] = Query(default=None, description="Google OAuth access token for calendar events"),
):
    cart_item_names: list[str] = []
    if cart_items:
        cart_item_names = [name.strip() for name in cart_items.split(",") if name.strip()]

    return get_refill_suggestions(
        user_id=user_id,
        cart_item_names=cart_item_names,
        access_token=google_token,
    )
